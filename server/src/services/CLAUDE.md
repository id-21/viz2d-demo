<system_context>
Business logic layer containing all database operations and external service integrations. Services are called by API handlers and the job poller worker.
</system_context>

<file_map>
## FILE MAP
- `gcs.service.ts` - GCS signed URL generation, file upload/verification
- `image.service.ts` - Image CRUD, upload URL flow, signed URL helpers
- `job.service.ts` - Viz2D job creation, status sync, polling queries
- `viz2d-file.service.ts` - Viz2D output file storage and retrieval
</file_map>

<critical_notes>
## CRITICAL NOTES

### GCS Service
- Signed URLs expire in 15 minutes (configurable)
- `generateImageUploadUrl()` - For client direct-upload to GCS
- `generateDownloadUrl()` - For client to fetch private files
- `uploadBuffer()` - For server to upload job outputs

### Image Service
- **Two-phase upload**: `createImageUploadUrl()` → client uploads → `confirmImageUpload()`
- `addSignedUrl()` helper refreshes gcsUrl with signed URL on every read
- Validates mime types: jpeg, png, webp, gif only

### Job Service
- Prevents duplicate jobs: checks for PENDING/PROCESSING before creating
- `syncJobStatus()` polls Viz2D API and updates local DB
- `getPendingJobs()` used by worker to find jobs to poll
- `completeJobWithFile()` links job to downloaded viz2d file

### Viz2D File Service
- Stores completed .viz2d outputs in GCS
- `getViz2dDownloadUrl()` generates fresh signed URL for frontend
</critical_notes>

<patterns>
## PATTERNS

**Service Function Signature**
All services follow: `async function name(input): Promise<Result>`
Errors thrown via `createError()` from middleware.
Example: `image.service.ts:34`

**Prisma Include Pattern**
Services include related records on reads:
```ts
include: { jobs: true, viz2dFiles: true }
```
Example: `image.service.ts:120-129`
</patterns>
