<system_context>
Shared library modules for backend infrastructure: database client, cloud storage, and external API client. These are singleton/factory patterns used across services.
</system_context>

<file_map>
## FILE MAP
- `prisma.ts` - Prisma client singleton with hot-reload protection
- `gcs.ts` - Google Cloud Storage client factory + bucket helpers
- `viz2d-client.ts` - Server-side Viz2D API client (hides visualizerId)
</file_map>

<critical_notes>
## CRITICAL NOTES

### Prisma Client
- Singleton pattern prevents multiple instances during dev hot-reload
- Uses `globalThis` to persist across module reloads
- Import: `import { prisma } from '@/lib/prisma'`

### GCS Client
- Supports two credential modes:
  - `GCP_KEY_FILE` - File path (local dev)
  - `GCP_CREDENTIALS` - Inline JSON (serverless deployment)
- `getBucket()` returns configured bucket instance
- Path helpers: `GCS_PATHS.images()`, `GCS_PATHS.thumbnails()`, `GCS_PATHS.viz2d()`

### Viz2D Client (Security Critical)
- **Keeps `VIZ2D_VISUALIZER_ID` server-side only** - never exposed to frontend
- Flow: `getJobToken()` → `createViz2dJob(token, inputUrl)` → `getViz2dJobById()`
- `downloadViz2dOutput()` fetches completed .viz2d files as Buffer
</critical_notes>

<patterns>
## PATTERNS

**Environment Variable Validation**
All clients validate required env vars on first use and throw descriptive errors.
Example: `gcs.ts:14-16`

**Lazy Singleton Initialization**
Clients are created on first call, not at import time.
Example: `gcs.ts:5-8`
</patterns>
