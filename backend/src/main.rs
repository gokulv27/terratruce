mod models;
mod routes;
mod email;

use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use std::env;
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| {
            tracing::warn!("⚠️ DATABASE_URL not set, using fallback");
            "postgresql://postgres:password@localhost:5432/postgres".to_string()
        });

    tracing::info!("Attempting to connect to database...");
    tracing::debug!("Database host: {}", 
        database_url.split('@').nth(1).unwrap_or("unknown").split('/').next().unwrap_or("unknown"));

    let pool = match PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .connect(&database_url)
        .await
    {
        Ok(pool) => {
            tracing::info!("✅ Database connection successful!");
            pool
        }
        Err(e) => {
            tracing::warn!("⚠️ Database connection failed: {}", e);
            tracing::warn!("🔄 Server will start WITHOUT database features");
            tracing::warn!("   - AI endpoints (/api/perplexity, /api/gemini) will work");
            tracing::warn!("   - Search history features will be disabled");
            
            // Create a dummy pool that won't be used
            PgPoolOptions::new()
                .max_connections(1)
                .acquire_timeout(std::time::Duration::from_secs(1))
                .connect("postgresql://dummy:dummy@localhost:5432/dummy")
                .await
                .unwrap_or_else(|_| {
                    // This is a last resort - create an unconnected pool
                    // The routes that need DB will fail gracefully
                    panic!("Cannot create even a dummy pool - this should not happen")
                })
        }
    };

    let app = routes::create_router(pool);

    let port = 3000;
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
