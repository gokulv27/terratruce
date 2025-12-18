/**
 * OpenCage Geocoding API Service
 * Provides location enrichment and coordinate conversion
 */

const OPENCAGE_API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY;
const OPENCAGE_BASE_URL = 'https://api.opencagedata.com/geocode/v1/json';

/**
 * Geocode an address to get coordinates and location details
 * @param {string} address - The address to geocode
 * @returns {Promise<Object>} Location data including coordinates and metadata
 */
export const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `${OPENCAGE_BASE_URL}?q=${encodeURIComponent(address)}&key=${OPENCAGE_API_KEY}&limit=1&no_annotations=0`
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error('No results found for this location');
    }

    const result = data.results[0];
    const components = result.components;
    const annotations = result.annotations;

    return {
      formatted_address: result.formatted,
      coordinates: {
        lat: result.geometry.lat,
        lng: result.geometry.lng
      },
      location_details: {
        country: components.country || 'Unknown',
        country_code: components.country_code?.toUpperCase() || '',
        state: components.state || components.state_code || '',
        county: components.county || '',
        city: components.city || components.town || components.village || '',
        postcode: components.postcode || '',
        road: components.road || '',
        suburb: components.suburb || components.neighbourhood || ''
      },
      metadata: {
        timezone: annotations?.timezone?.name || 'UTC',
        currency: annotations?.currency?.name || '',
        flag: annotations?.flag || '',
        continent: components.continent || '',
        confidence: result.confidence || 0
      },
      bounds: result.bounds || null
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

/**
 * Get location suggestions for autocomplete
 * @param {string} query - The search text
 * @returns {Promise<Array>} List of suggestions
 */
export const getSuggestions = async (query) => {
  if (!query || query.length < 3) return [];

  try {
    // Add fuzzy=1 to allow for typos
    const response = await fetch(
      `${OPENCAGE_BASE_URL}?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&limit=5&no_annotations=1`
    );

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.results) return [];

    return data.results.map(r => ({
      label: r.formatted,
      components: r.components,
      geometry: r.geometry,
      bounds: r.bounds
    }));
  } catch (error) {
    console.error('Suggestion error:', error);
    return [];
  }
};

/**
 * Reverse geocode coordinates to get address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Location data
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `${OPENCAGE_BASE_URL}?q=${lat}+${lng}&key=${OPENCAGE_API_KEY}&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error('No results found for these coordinates');
    }

    const result = data.results[0];
    return {
      formatted_address: result.formatted,
      components: result.components
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

/**
 * Get enriched location context for AI analysis
 * @param {string} address - The address to enrich
 * @returns {Promise<string>} Formatted context string for AI
 */
export const getLocationContext = async (address) => {
  const locationData = await geocodeAddress(address);

  if (!locationData) {
    return `Location: ${address}`;
  }

  const { location_details, metadata } = locationData;

  return `
Location: ${locationData.formatted_address}
Country: ${location_details.country} (${location_details.country_code})
${location_details.state ? `State/Region: ${location_details.state}` : ''}
${location_details.city ? `City: ${location_details.city}` : ''}
${location_details.county ? `County: ${location_details.county}` : ''}
Timezone: ${metadata.timezone}
Coordinates: ${locationData.coordinates.lat}, ${locationData.coordinates.lng}
  `.trim();
};
