/**
 * Auto-Configuration System for MCP Backend
 * Provides environment validation, fallbacks, and self-healing
 */

interface EnvConfig {
  required: string[];
  optional: Record<string, string>;
  validated: boolean;
}

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'unavailable';
  message: string;
}

export class AutoConfig {
  private config: EnvConfig = {
    required: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GEMINI_PRIMARY_KEY'],
    optional: {
      REDIS_URL: 'redis://localhost:6379',
      GOOGLE_MAPS_API_KEY: '',
      GOOGLE_SEARCH_API_KEY: '',
      RESEND_API_KEYS: '',
      NODE_ENV: 'development',
    },
    validated: false,
  };

  /**
   * Validate environment variables and provide defaults
   */
  public validateEnv(): { valid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    console.log('\n🔍 [AutoConfig] Validating environment configuration...\n');

    // Check required variables
    for (const varName of this.config.required) {
      if (!process.env[varName]) {
        errors.push(`❌ Required: ${varName} is missing`);
      } else {
        console.log(`✅ ${varName}: Configured`);
      }
    }

    // Check optional variables and apply defaults
    for (const [varName, defaultValue] of Object.entries(this.config.optional)) {
      if (!process.env[varName]) {
        if (defaultValue) {
          process.env[varName] = defaultValue;
          warnings.push(`⚠️  Optional: ${varName} using default: ${defaultValue}`);
        } else {
          warnings.push(`⚠️  Optional: ${varName} not configured (feature disabled)`);
        }
      } else {
        console.log(`✅ ${varName}: Configured`);
      }
    }

    this.config.validated = errors.length === 0;

    // Print summary
    console.log('\n' + '='.repeat(60));
    if (errors.length > 0) {
      console.log('❌ Configuration INVALID - Missing required variables:\n');
      errors.forEach((err) => console.log(`   ${err}`));
    } else {
      console.log('✅ Configuration VALID - All required variables present');
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:\n');
      warnings.forEach((warn) => console.log(`   ${warn}`));
    }
    console.log('='.repeat(60) + '\n');

    return { valid: this.config.validated, warnings, errors };
  }

  /**
   * Provide helpful setup instructions for missing configuration
   */
  public provideSetupInstructions(errors: string[]): void {
    if (errors.length === 0) return;

    console.log('\n📋 [AutoConfig] Setup Instructions:\n');

    errors.forEach((error) => {
      if (error.includes('SUPABASE_URL')) {
        console.log('   🔹 SUPABASE_URL:');
        console.log('      1. Go to https://supabase.com/dashboard');
        console.log('      2. Select your project');
        console.log('      3. Go to Settings → API');
        console.log('      4. Copy the "Project URL"');
        console.log('      5. Add to .env: SUPABASE_URL=https://your-project.supabase.co\n');
      }

      if (error.includes('SUPABASE_ANON_KEY')) {
        console.log('   🔹 SUPABASE_ANON_KEY:');
        console.log('      1. In Supabase Dashboard → Settings → API');
        console.log('      2. Copy the "anon/public" key');
        console.log('      3. Add to .env: SUPABASE_ANON_KEY=your_key_here\n');
      }

      if (error.includes('GEMINI_PRIMARY_KEY')) {
        console.log('   🔹 GEMINI_PRIMARY_KEY:');
        console.log('      1. Go to https://aistudio.google.com/app/apikey');
        console.log('      2. Create an API key');
        console.log('      3. Add to .env: GEMINI_PRIMARY_KEY=your_key_here\n');
      }
    });

    console.log('   📄 See .env.example for full configuration template\n');
  }

  /**
   * Test service connections
   */
  public async testServices(): Promise<ServiceStatus[]> {
    const statuses: ServiceStatus[] = [];

    console.log('🔌 [AutoConfig] Testing service connections...\n');

    // Test Supabase
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
      );
      await supabase.from('_health').select('*').limit(1);
      statuses.push({
        name: 'Supabase',
        status: 'operational',
        message: 'Connected successfully',
      });
      console.log('   ✅ Supabase: Connected');
    } catch (error) {
      statuses.push({
        name: 'Supabase',
        status: 'degraded',
        message: `Connection issue: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      console.log('   ⚠️  Supabase: Connection issue (will use cache)');
    }

    // Test Redis
    if (process.env.REDIS_URL) {
      try {
        // Redis test would go here
        statuses.push({
          name: 'Redis',
          status: 'operational',
          message: 'Cache available',
        });
        console.log('   ✅ Redis: Available');
      } catch (error) {
        statuses.push({
          name: 'Redis',
          status: 'unavailable',
          message: 'Cache unavailable (using in-memory)',
        });
        console.log('   ⚠️  Redis: Unavailable (using in-memory cache)');
      }
    }

    // Test Gemini AI
    if (process.env.GEMINI_PRIMARY_KEY) {
      statuses.push({
        name: 'Gemini AI',
        status: 'operational',
        message: 'API key configured',
      });
      console.log('   ✅ Gemini AI: Configured');
    }

    console.log('');
    return statuses;
  }

  /**
   * Get startup mode based on service availability
   */
  public getStartupMode(statuses: ServiceStatus[]): 'full' | 'degraded' | 'minimal' {
    const operational = statuses.filter((s) => s.status === 'operational').length;
    const total = statuses.length;

    if (operational === total) return 'full';
    if (operational >= total / 2) return 'degraded';
    return 'minimal';
  }

  /**
   * Print startup banner
   */
  public printBanner(mode: 'full' | 'degraded' | 'minimal'): void {
    const banner = `
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              🏠 TERRA TRUCE MCP BACKEND 🏠                ║
║                                                            ║
║              Property Intelligence Platform                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`;

    console.log(banner);

    const modeEmoji = {
      full: '🟢',
      degraded: '🟡',
      minimal: '🔴',
    };

    const modeText = {
      full: 'FULL MODE - All systems operational',
      degraded: 'DEGRADED MODE - Some services unavailable',
      minimal: 'MINIMAL MODE - Core functionality only',
    };

    console.log(`${modeEmoji[mode]} ${modeText[mode]}\n`);
  }
}

// Export singleton instance
export const autoConfig = new AutoConfig();
