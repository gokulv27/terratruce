/**
 * MCP Client Service for Frontend
 * Connects React frontend to MCP backend API
 */

const MCP_API_URL = import.meta.env.VITE_MCP_API_URL || 'http://localhost:3001';

/**
 * Check if MCP backend is available
 */
export const checkMCPHealth = async () => {
  try {
    const response = await fetch(`${MCP_API_URL}/api/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.warn('[MCP] Backend unavailable:', error);
    return false;
  }
};

/**
 * Analyze property using MCP backend
 */
export const mcpAnalyzeProperty = async (location) => {
  const response = await fetch(`${MCP_API_URL}/api/analyze-property`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location }),
  });

  if (!response.ok) {
    throw new Error(`MCP API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
};

/**
 * Send chat message to MCP backend
 */
export const mcpChatMessage = async (messages, context = {}) => {
  const response = await fetch(`${MCP_API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });

  if (!response.ok) {
    throw new Error(`MCP API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
};

/**
 * Analyze satellite imagery
 */
export const mcpSatelliteAnalysis = async (latitude, longitude, zoom = 18, analysisType = 'general') => {
  const response = await fetch(`${MCP_API_URL}/api/satellite-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      latitude,
      longitude,
      zoom,
      analysis_type: analysisType,
    }),
  });

  if (!response.ok) {
    throw new Error(`MCP API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
};

/**
 * Schedule site visit with calendar integration
 */
export const mcpScheduleVisit = async (propertyAddress, userEmail, dateTime, notes = '') => {
  const response = await fetch(`${MCP_API_URL}/api/schedule-visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      property_address: propertyAddress,
      user_email: userEmail,
      date_time: dateTime,
      notes,
    }),
  });

  if (!response.ok) {
    throw new Error(`MCP API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
};

/**
 * Search web using Google Custom Search
 */
export const mcpSearchWeb = async (query, numResults = 5) => {
  const response = await fetch(`${MCP_API_URL}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, num_results: numResults }),
  });

  if (!response.ok) {
    throw new Error(`MCP API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
};

/**
 * Research topic with AI synthesis
 */
export const mcpResearchTopic = async (topic, depth = 'quick') => {
  const response = await fetch(`${MCP_API_URL}/api/research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, depth }),
  });

  if (!response.ok) {
    throw new Error(`MCP API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
};
