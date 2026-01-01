#!/usr/bin/env node

// Load environment variables FIRST
import 'dotenv/config';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import services
import { checkRateLimit } from './services/rateLimiter.js';
import { geminiManager } from './services/geminiManager.js';

// Import tools
import {
  getParcelDetails,
  GetParcelDetailsSchema,
  assessFloodRisk,
  AssessFloodRiskSchema,
  searchParcels,
  SearchParcelsSchema
} from './tools/geoTools.js';

import {
  analyzeSatelliteVision,
  AnalyzeSatelliteVisionSchema
} from './tools/visionTools.js';

import {
  searchWeb,
  WebSearchSchema,
  researchTopic,
  ResearchTopicSchema
} from './tools/searchTools.js';

import {
  scheduleSiteVisit,
  ScheduleSiteVisitSchema
} from './tools/scheduleTool.js';

import {
  sendGeneralEmail,
  SendEmailSchema
} from './tools/emailTools.js';

// =====================================================
// MCP SERVER SETUP
// =====================================================

const isDev = process.env.NODE_ENV !== 'production';

const server = new Server(
  {
    name: 'terratruce-geo-intelligence',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// =====================================================
// TOOL REGISTRATION
// =====================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = [
    {
      name: 'get_parcel_details',
      description: 'Retrieve detailed information about a real estate parcel including location, area, value, and geometry',
      inputSchema: {
        type: 'object',
        properties: {
          parcel_id: {
            type: 'string',
            description: 'Unique parcel identifier (e.g., MUM-2024-001)'
          }
        },
        required: ['parcel_id']
      }
    },
    {
      name: 'assess_flood_risk',
      description: 'Calculate flood risk for a parcel using PostGIS spatial intersection with flood zone data',
      inputSchema: {
        type: 'object',
        properties: {
          parcel_id: {
            type: 'string',
            description: 'Parcel ID to assess'
          }
        },
        required: ['parcel_id']
      }
    },
    {
      name: 'search_parcels',
      description: 'Search for parcels by city, state, or other criteria',
      inputSchema: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'City name to search'
          },
          state: {
            type: 'string',
            description: 'State name to search'
          },
          limit: {
            type: 'number',
            description: 'Maximum results (default: 10)',
            default: 10
          }
        }
      }
    },
    {
      name: 'analyze_satellite_vision',
      description: 'Analyze satellite imagery using Gemini Vision AI to assess infrastructure, vegetation, development, or general characteristics',
      inputSchema: {
        type: 'object',
        properties: {
          latitude: {
            type: 'number',
            description: 'Latitude coordinate'
          },
          longitude: {
            type: 'number',
            description: 'Longitude coordinate'
          },
          zoom: {
            type: 'number',
            description: 'Zoom level (1-20, default: 18)',
            default: 18
          },
          analysis_type: {
            type: 'string',
            enum: ['infrastructure', 'vegetation', 'development', 'general'],
            description: 'Type of analysis to perform',
            default: 'general'
          }
        },
        required: ['latitude', 'longitude']
      }
    },
    {
      name: 'search_web',
      description: 'Search the web using Google Custom Search for real-time information',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          },
          num_results: {
            type: 'number',
            description: 'Number of results (default: 5)',
            default: 5
          }
        },
        required: ['query']
      }
    },
    {
      name: 'research_topic',
      description: 'Deep research on a topic: searches web, scrapes content, and provides AI synthesis',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Topic to research'
          },
          depth: {
            type: 'string',
            enum: ['quick', 'detailed'],
            description: 'Research depth (quick=top 1 outcome, detailed=top 3)',
            default: 'quick'
          }
        },
        required: ['topic']
      }
    },
    {
      name: 'schedule_site_visit',
      description: 'Schedule a physical site visit for a property. Using Google Calendar to invite the user and Resend to send a confirmation email.',
      inputSchema: {
        type: 'object',
        properties: {
          property_address: {
            type: 'string',
            description: 'Address of the property to visit'
          },
          user_email: {
            type: 'string',
            description: 'User email for calendar invite and confirmation'
          },
          date_time: {
            type: 'string',
            description: 'ISO 8601 date time (e.g., 2024-05-20T14:30:00Z)'
          },
          notes: {
            type: 'string',
            description: 'Optional notes for the visit'
          }
        },
        required: ['property_address', 'user_email', 'date_time']
      }
    },
    {
      name: 'send_email',
      description: 'Send a general email using Resend (supports HTML, CC, BCC, etc.)',
      inputSchema: {
        type: 'object',
        properties: {
          to: {
            anyOf: [
              { type: 'string', format: 'email' },
              { type: 'array', items: { type: 'string', format: 'email' } }
            ],
            description: 'Recipient email address(es)'
          },
          subject: {
            type: 'string',
            description: 'Email subject'
          },
          html: {
            type: 'string',
            description: 'HTML content'
          },
          text: {
            type: 'string',
            description: 'Plain text content'
          },
          cc: {
             anyOf: [
              { type: 'string', format: 'email' },
              { type: 'array', items: { type: 'string', format: 'email' } }
            ],
          },
           bcc: {
             anyOf: [
              { type: 'string', format: 'email' },
              { type: 'array', items: { type: 'string', format: 'email' } }
            ],
          }
        },
        required: ['to', 'subject', 'html']
      }
    }
  ];

  // Add dev-only tool for monitoring
  if (isDev) {
    tools.push({
      name: 'get_api_usage_stats',
      description: '[DEV ONLY] Get current API usage statistics and token limits for all Gemini keys',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    } as any);
  }

  return { tools };
});

// =====================================================
// TOOL EXECUTION HANDLER
// =====================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // DEV-ONLY: Usage stats endpoint
  if (name === 'get_api_usage_stats') {
    if (!isDev) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'This tool is only available in development mode'
            })
          }
        ],
        isError: true
      };
    }

    const stats = geminiManager.getUsageStats();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stats, null, 2)
        }
      ]
    };
  }

  // Rate limiting (use IP from context if available)
  const clientIp = '127.0.0.1'; // In production, extract from request context
  const allowed = await checkRateLimit(clientIp, name);
  
  if (!allowed) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.'
          })
        }
      ]
    };
  }

  try {
    let result;

    switch (name) {
      case 'get_parcel_details': {
        const validated = GetParcelDetailsSchema.parse(args);
        result = await getParcelDetails(validated);
        break;
      }

      case 'assess_flood_risk': {
        const validated = AssessFloodRiskSchema.parse(args);
        result = await assessFloodRisk(validated);
        break;
      }

      case 'search_parcels': {
        const validated = SearchParcelsSchema.parse(args);
        result = await searchParcels(validated);
        break;
      }

      case 'analyze_satellite_vision': {
        const validated = AnalyzeSatelliteVisionSchema.parse(args);
        result = await analyzeSatelliteVision(validated);
        break;
      }

      case 'search_web': {
        const validated = WebSearchSchema.parse(args);
        result = await searchWeb(validated);
        break;
      }

      case 'research_topic': {
        const validated = ResearchTopicSchema.parse(args);
        result = await researchTopic(validated);
        break;
      }

      case 'schedule_site_visit': {
        const validated = ScheduleSiteVisitSchema.parse(args);
        result = await scheduleSiteVisit(validated);
        break;
      }

      case 'send_email': {
        const validated = SendEmailSchema.parse(args);
        result = await sendGeneralEmail(validated);
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };

  } catch (error: any) {
    console.error(`[MCP] Tool execution error (${name}):`, error);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message || 'Tool execution failed',
            tool: name
          })
        }
      ],
      isError: true
    };
  }
});

// =====================================================
// SERVER LIFECYCLE WITH AUTO-CONFIGURATION
// =====================================================

import { autoConfig } from './config/autoConfig.js';

async function main() {
  // Print banner
  autoConfig.printBanner('full'); // Will update based on validation

  console.log('[MCP] Starting Terra Truce Geo Intelligence Server...\n');

  // Step 1: Validate environment
  const { valid, warnings, errors } = autoConfig.validateEnv();

  if (!valid) {
    console.error('\n❌ [MCP] Cannot start - missing required configuration\n');
    autoConfig.provideSetupInstructions(errors);
    process.exit(1);
  }

  // Step 2: Test services
  const serviceStatuses = await autoConfig.testServices();
  const startupMode = autoConfig.getStartupMode(serviceStatuses);

  // Update banner with actual mode
  console.log(''); // Spacing
  autoConfig.printBanner(startupMode);

  // Step 3: Start MCP server
  console.log(`[MCP] Environment: ${isDev ? '🔧 DEVELOPMENT' : '🚀 PRODUCTION'}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log('[MCP] ✅ Server running on stdio');
  console.log(`[MCP] 🛠️  Tools registered: ${isDev ? '8 (including dev tools)' : '7'}`);

  if (isDev) {
    console.log('[MCP] 📊 Token monitoring enabled - use get_api_usage_stats tool');
  }

  // Print service summary
  console.log('\n📋 [MCP] Service Status:');
  serviceStatuses.forEach((status) => {
    const emoji = status.status === 'operational' ? '✅' : status.status === 'degraded' ? '⚠️' : '❌';
    console.log(`   ${emoji} ${status.name}: ${status.message}`);
  });

  console.log('\n🚀 [MCP] Ready to accept requests!\n');
  console.log('='.repeat(60) + '\n');
}

main().catch((error) => {
  console.error('\n❌ [MCP] Fatal error during startup:', error);
  console.error('\n💡 Troubleshooting:');
  console.error('   1. Check your .env file exists and has correct values');
  console.error('   2. Verify all API keys are valid');
  console.error('   3. Ensure Supabase project is accessible');
  console.error('   4. See .env.example for configuration template\n');
  process.exit(1);
});
