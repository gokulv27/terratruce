import { z } from 'zod';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { geminiManager } from '../services/geminiManager.js';
import { getCached, setCached } from '../config/redis.js';

// =====================================================
// HELPER: Search Google (JSON API)
// =====================================================

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

async function performGoogleSearch(query: string, num: number = 5): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!apiKey || !cx) {
    throw new Error('GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX must be set in .env');
  }

  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=${num}`;
  
  try {
    const response = await axios.get(url);
    const items = response.data.items || [];
    
    return items.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet
    }));
  } catch (error: any) {
    throw new Error(`Google Search failed: ${error.message}`);
  }
}

// =====================================================
// TOOL 1: Web Search
// =====================================================

export const WebSearchSchema = z.object({
  query: z.string().describe('Search query (e.g., "flood risk trends in Mumbai")'),
  num_results: z.number().default(5).describe('Number of results to return (max 10)')
});

export async function searchWeb(args: z.infer<typeof WebSearchSchema>) {
  const cacheKey = `search:${args.query}:${args.num_results}`;
  
  // Check cache (Search results cached for 24h)
  const cached = await getCached(cacheKey);
  if (cached) {
    console.log(`[SearchTools] Cache hit for "${args.query}"`);
    return cached;
  }

  const results = await performGoogleSearch(args.query, args.num_results);
  
  // Cache for 24 hours
  await setCached(cacheKey, results, 24 * 60 * 60);
  
  return {
    query: args.query,
    count: results.length,
    results
  };
}

// =====================================================
// TOOL 2: Research Topic (Search + Scrape + Summarize)
// =====================================================

export const ResearchTopicSchema = z.object({
  topic: z.string().describe('Topic to research in depth'),
  depth: z.enum(['quick', 'detailed']).default('quick').describe('Research depth')
});

export async function researchTopic(args: z.infer<typeof ResearchTopicSchema>) {
  const cacheKey = `research:${args.topic}:${args.depth}`;
  
  const cached = await getCached(cacheKey);
  if (cached) {
    console.log(`[SearchTools] Research cache hit for "${args.topic}"`);
    return cached;
  }

  // 1. Search
  console.log(`[Research] Searching for: ${args.topic}`);
  const searchResults = await performGoogleSearch(
    args.topic, 
    args.depth === 'detailed' ? 7 : 3
  );

  // 2. Scrape Content (Limit to top 3 for detailed, 1 for quick)
  const scrapeLimit = args.depth === 'detailed' ? 3 : 1;
  const scrapedData: string[] = [];

  for (let i = 0; i < Math.min(searchResults.length, scrapeLimit); i++) {
    const result = searchResults[i];
    try {
      console.log(`[Research] Scraping: ${result.link}`);
      const response = await axios.get(result.link, {
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0 (TeraTruceResearchBot/1.0)' }
      });
      
      const $ = cheerio.load(response.data);
      // Remove scripts, styles, etc.
      $('script, style, nav, footer, header').remove();
      
      const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000); // Limit text per page
      scrapedData.push(`Source: ${result.title} (${result.link})\nContent: ${text}`);
      
    } catch (error) {
      console.warn(`[Research] Failed to scrape ${result.link}: ${error}`);
      // Fallback to snippet
      scrapedData.push(`Source: ${result.title} (${result.link})\nSnippet: ${result.snippet}`);
    }
  }

  // 3. Synthesize with Gemini
  console.log('[Research] Synthesizing with Gemini...');
  const prompt = `
    Conduct research on the topic: "${args.topic}".
    
    Here is the gathered information from web sources:
    ${scrapedData.join('\n\n---\n\n')}
    
    Data Source Count: ${scrapedData.length}
    
    Please provide a ${args.depth === 'detailed' ? 'comprehensive' : 'concise'} summary.
    Includes:
    1. Key Findings
    2. Relevant metrics or data points
    3. Consensus vs Conflict (if any)
    4. Sources used
  `;

  // Use primary key for text generation (since it's text-based)
  // or backup if primary is exhausted/reserved. 
  // Let's use standard text generation which auto-rotates.
  const summary = await geminiManager.generateText(prompt);

  const result = {
    topic: args.topic,
    depth: args.depth,
    summary,
    sources: searchResults.slice(0, scrapeLimit).map(r => ({ title: r.title, link: r.link })),
    timestamp: new Date().toISOString()
  };

  // Cache research for 3 days
  await setCached(cacheKey, result, 3 * 24 * 60 * 60);

  return result;
}
