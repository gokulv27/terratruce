use redis::aio::ConnectionManager;
use sqlx::{PgPool, Row};
use serde_json::Value;
use sha2::{Sha256, Digest};
use std::time::Duration;

use crate::models::CacheEntry;

pub struct CacheManager {
    pub redis: ConnectionManager,
    pub postgres: PgPool,
}

impl CacheManager {
    pub fn new(redis: ConnectionManager, postgres: PgPool) -> Self {
        Self { redis, postgres }
    }

    /// Generate canonical cache key from location and params
    pub fn generate_key(&self, location: &str, params: &Value) -> String {
        let mut hasher = Sha256::new();
        hasher.update(location.to_lowercase().trim().as_bytes());
        hasher.update(params.to_string().as_bytes());
        hex::encode(hasher.finalize())
    }

    /// Check Redis cache (short TTL)
    pub async fn get_redis(&mut self, key: &str) -> Result<Option<Value>, Box<dyn std::error::Error>> {
        use redis::AsyncCommands;
        
        let result: Option<String> = self.redis.get(key).await?;
        
        if let Some(data) = result {
            tracing::debug!("✅ Redis cache HIT for key: {}", key);
            let value: Value = serde_json::from_str(&data)?;
            Ok(Some(value))
        } else {
            tracing::debug!("❌ Redis cache MISS for key: {}", key);
            Ok(None)
        }
    }

    /// Store in Redis with TTL
    pub async fn set_redis(&mut self, key: &str, value: &Value, ttl_seconds: u64) -> Result<(), Box<dyn std::error::Error>> {
        use redis::AsyncCommands;
        
        let data = serde_json::to_string(value)?;
        self.redis.set_ex::<_, _, ()>(key, data, ttl_seconds).await?;
        
        tracing::debug!("💾 Stored in Redis: {} (TTL: {}s)", key, ttl_seconds);
        Ok(())
    }

    /// Check PostgreSQL cache (long TTL)
    pub async fn get_postgres(&self, key: &str) -> Result<Option<Value>, Box<dyn std::error::Error>> {
        let result = sqlx::query(
            "SELECT data FROM cache_entries WHERE key = $1 AND expires_at > NOW()"
        )
        .bind(key)
        .fetch_optional(&self.postgres)
        .await?;

        if let Some(row) = result {
            let data: Value = row.try_get("data")?;
            tracing::debug!("✅ PostgreSQL cache HIT for key: {}", key);
            
            // Increment hit count
            sqlx::query("UPDATE cache_entries SET hit_count = hit_count + 1 WHERE key = $1")
                .bind(key)
                .execute(&self.postgres)
                .await?;
            
            Ok(Some(data))
        } else {
            tracing::debug!("❌ PostgreSQL cache MISS for key: {}", key);
            Ok(None)
        }
    }

    /// Store in PostgreSQL with TTL
    pub async fn set_postgres(&self, key: &str, value: &Value, ttl_seconds: i64) -> Result<(), Box<dyn std::error::Error>> {
        let expires_at = chrono::Utc::now() + chrono::Duration::seconds(ttl_seconds);
        
        sqlx::query(
            r#"
            INSERT INTO cache_entries (key, type, data, expires_at, hit_count)
            VALUES ($1, 'mcp_analysis', $2, $3, 0)
            ON CONFLICT (key) DO UPDATE
            SET data = $2, expires_at = $3, hit_count = 0
            "#
        )
        .bind(key)
        .bind(value)
        .bind(expires_at)
        .execute(&self.postgres)
        .await?;

        tracing::debug!("💾 Stored in PostgreSQL: {} (expires: {})", key, expires_at);
        Ok(())
    }

    /// Two-tier cache check: Redis first, then PostgreSQL
    pub async fn get(&mut self, key: &str) -> Result<Option<Value>, Box<dyn std::error::Error>> {
        // Try Redis first (fast)
        if let Some(value) = self.get_redis(key).await? {
            return Ok(Some(value));
        }

        // Try PostgreSQL (slower but longer TTL)
        if let Some(value) = self.get_postgres(key).await? {
            // Warm Redis cache
            self.set_redis(key, &value, 3600).await?;
            return Ok(Some(value));
        }

        Ok(None)
    }

    /// Store in both caches
    pub async fn set(&mut self, key: &str, value: &Value, ttl_short: u64, ttl_long: i64) -> Result<(), Box<dyn std::error::Error>> {
        // Store in both layers
        self.set_redis(key, value, ttl_short).await?;
        self.set_postgres(key, value, ttl_long).await?;
        Ok(())
    }

    /// Get cache statistics
    pub async fn get_stats(&self) -> Result<Value, Box<dyn std::error::Error>> {
        let row = sqlx::query(
            r#"
            SELECT 
                COUNT(*) as total_entries,
                SUM(hit_count) as total_hits,
                AVG(hit_count) as avg_hits_per_entry
            FROM cache_entries
            WHERE expires_at > NOW()
            "#
        )
        .fetch_one(&self.postgres)
        .await?;

        Ok(serde_json::json!({
            "total_entries": row.try_get::<i64, _>("total_entries")?,
            "total_hits": row.try_get::<i64, _>("total_hits")?,
            "avg_hits_per_entry": row.try_get::<f64, _>("avg_hits_per_entry")?,
        }))
    }
}
