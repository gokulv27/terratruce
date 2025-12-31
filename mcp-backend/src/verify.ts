#!/usr/bin/env node

/**
 * Service Verification Script
 * Tests all MCP backend services and connections
 */

import 'dotenv/config';
import { supabase, isDatabaseAvailable } from './config/database.js';
import { redis } from './config/redis.js';
import { geminiManager } from './services/geminiManager.js';

console.log('🔍 MCP Backend Service Verification\n');
console.log('=' .repeat(50));

const results = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Helper functions
function pass(service: string, message: string) {
  console.log(`✅ ${service}: ${message}`);
  results.passed++;
}

function fail(service: string, message: string) {
  console.log(`❌ ${service}: ${message}`);
  results.failed++;
}

function warn(service: string, message: string) {
  console.log(`⚠️  ${service}: ${message}`);
  results.warnings++;
}

// 1. Environment Variables
console.log('\n📋 Environment Variables');
console.log('-'.repeat(50));

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'GEMINI_PRIMARY_KEY',
];

const optionalEnvVars = [
  'GEMINI_BACKUP_KEYS',
  'RESEND_API_KEYS',
  'GOOGLE_MAPS_API_KEY',
  'GOOGLE_SEARCH_API_KEY',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'REDIS_URL'
];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    pass('ENV', `${varName} is set`);
  } else {
    fail('ENV', `${varName} is missing`);
  }
});

optionalEnvVars.forEach(varName => {
  if (process.env[varName]) {
    pass('ENV', `${varName} is set (optional)`);
  } else {
    warn('ENV', `${varName} not set (optional)`);
  }
});

// 2. Database Connection (Supabase)
console.log('\n🗄️  Database Connection');
console.log('-'.repeat(50));

try {
  const { data, error } = await supabase!
    .from('geo_core.parcels')
    .select('count')
    .limit(1);
  
  if (error) {
    if (error.code === '42P01') {
      warn('DATABASE', 'Table geo_core.parcels not found. Run setup_database.sql');
    } else {
      fail('DATABASE', `Query failed: ${error.message}`);
    }
  } else {
    pass('DATABASE', 'Connected to Supabase successfully');
  }
} catch (error: any) {
  fail('DATABASE', `Connection failed: ${error.message}`);
}

// 3. Redis Connection
console.log('\n💾 Redis Cache');
console.log('-'.repeat(50));

try {
  await redis.ping();
  pass('REDIS', 'Connected successfully');
  
  // Test set/get
  await redis.set('test_key', 'test_value', 'EX', 10);
  const value = await redis.get('test_key');
  
  if (value === 'test_value') {
    pass('REDIS', 'Read/Write operations working');
  } else {
    fail('REDIS', 'Read/Write test failed');
  }
  
  await redis.del('test_key');
} catch (error: any) {
  warn('REDIS', `Not available: ${error.message}. Caching will be disabled.`);
}

// 4. Gemini AI
console.log('\n🤖 Gemini AI');
console.log('-'.repeat(50));

try {
  const testPrompt = 'Say "OK" if you can read this.';
  const response = await geminiManager.generateText(testPrompt);
  
  if (response && response.length > 0) {
    pass('GEMINI', `Text generation working (Response: ${response.slice(0, 50)}...)`);
  } else {
    fail('GEMINI', 'Empty response from API');
  }
} catch (error: any) {
  fail('GEMINI', `API call failed: ${error.message}`);
}

// 5. Resend Email
console.log('\n📧 Email Service (Resend)');
console.log('-'.repeat(50));

const resendKeys = (process.env.RESEND_API_KEYS || process.env.RESEND_API_KEY || '').split(',').filter(k => k.trim());

if (resendKeys.length > 0) {
  pass('RESEND', `${resendKeys.length} API key(s) configured`);
  if (resendKeys.length > 1) {
    pass('RESEND', 'Round-robin rotation enabled');
  }
} else {
  warn('RESEND', 'No API keys configured. Email features disabled.');
}

// 6. Google Calendar
console.log('\n📅 Calendar Service (Google)');
console.log('-'.repeat(50));

if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
  pass('CALENDAR', 'Service Account credentials configured');
} else {
  warn('CALENDAR', 'Service Account not configured. Scheduling features disabled.');
}

// 7. Google Maps
console.log('\n🗺️  Google Maps API');
console.log('-'.repeat(50));

if (process.env.GOOGLE_MAPS_API_KEY) {
  pass('MAPS', 'API key configured');
} else {
  warn('MAPS', 'API key missing. Vision analysis will fail.');
}

// 8. Google Search
console.log('\n🔍 Google Search API');
console.log('-'.repeat(50));

if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) {
  pass('SEARCH', 'Custom Search configured');
} else {
  warn('SEARCH', 'Not configured. Web search features disabled.');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);

if (results.failed === 0) {
  console.log('\n🎉 All critical services are operational!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some services failed. Please check the errors above.');
  process.exit(1);
}
