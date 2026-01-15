# Enhanced API Error Messages

## Summary

Improved error handling for all backend API proxy endpoints with descriptive messages and error codes.

## Error Response Format

All errors now return a consistent JSON structure:

```json
{
  "error": "Short error description",
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "status": 400 // HTTP status code (when applicable)
}
```

## Error Codes by Endpoint

### Google Maps (`/api/maps/config`)

- `MAPS_KEY_MISSING` - API key not in environment
- `MAPS_KEY_EMPTY` - API key is empty string

### Geocoding (`/api/geocode`)

- `INVALID_QUERY` - Empty location query
- `GEOCODE_KEY_MISSING` - API key not in environment
- `GEOCODE_KEY_EMPTY` - API key is empty string
- `GEOCODE_UNAUTHORIZED` - Invalid/expired API key (401)
- `GEOCODE_QUOTA_EXCEEDED` - API quota exceeded (402)
- `GEOCODE_FORBIDDEN` - Access forbidden (403)
- `GEOCODE_RATE_LIMIT` - Too many requests (429)
- `GEOCODE_TIMEOUT` - Request timed out
- `GEOCODE_CONNECTION_ERROR` - Cannot connect to service
- `GEOCODE_PARSE_ERROR` - Invalid response format
- `GEOCODE_ERROR` - General error

### Gemini AI (`/api/gemini`)

- `GEMINI_EMPTY_CONTENTS` - Empty contents array
- `GEMINI_KEY_MISSING` - API key not in environment
- `GEMINI_KEY_EMPTY` - API key is empty string
- `GEMINI_BAD_REQUEST` - Invalid request (400)
- `GEMINI_UNAUTHORIZED` - Invalid/expired API key (401)
- `GEMINI_FORBIDDEN` - Access forbidden (403)
- `GEMINI_RATE_LIMIT` - Too many requests (429)
- `GEMINI_SERVER_ERROR` - Service internal error (500)
- `GEMINI_UNAVAILABLE` - Service unavailable (503)
- `GEMINI_TIMEOUT` - Request timed out
- `GEMINI_CONNECTION_ERROR` - Cannot connect to service
- `GEMINI_PARSE_ERROR` - Invalid response format
- `GEMINI_ERROR` - General error

### AI Details (`/api/details`)

- `AI_EMPTY_MESSAGES` - Empty messages array
- `AI_KEY_MISSING` - API key not in environment
- `AI_KEY_EMPTY` - API key is empty string
- `AI_BAD_REQUEST` - Invalid request (400)
- `AI_UNAUTHORIZED` - Invalid/expired API key (401)
- `AI_FORBIDDEN` - Access forbidden (403)
- `AI_RATE_LIMIT` - Too many requests (429)
- `AI_SERVER_ERROR` - Service internal error (500)
- `AI_UNAVAILABLE` - Service unavailable (503)
- `AI_TIMEOUT` - Request timed out
- `AI_CONNECTION_ERROR` - Cannot connect to service
- `AI_PARSE_ERROR` - Invalid response format
- `AI_SERVICE_ERROR` - General error

## Files Modified

- [src/routes/api_proxy.rs](file:///Users/gokul/Desktop/hackthon/terratruce/backend/src/routes/api_proxy.rs)
- [src/routes/ai_chat.rs](file:///Users/gokul/Desktop/hackthon/terratruce/backend/src/routes/ai_chat.rs)
