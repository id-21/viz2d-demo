<system_context>
Express middleware for error handling and request processing. Provides consistent API error responses across all endpoints.
</system_context>

<file_map>
## FILE MAP
- `error-handler.ts` - Global error handler, error factory, 404 handler
</file_map>

<critical_notes>
## CRITICAL NOTES

### Error Response Format
All errors return JSON with consistent structure:
```json
{ "error": "message", "code": "ERROR_CODE", "stack": "..." }
```
Stack trace only included in development mode.

### Creating Errors in Handlers
Use `createError()` to throw HTTP errors with proper status codes:
```ts
import { createError } from '@/middleware/error-handler'
throw createError('Image not found', 404, 'IMAGE_NOT_FOUND')
```

### Middleware Registration Order
In `app.ts`, register error handlers LAST:
1. Routes
2. `notFoundHandler` (catches unmatched routes)
3. `errorHandler` (catches all errors)
</critical_notes>
