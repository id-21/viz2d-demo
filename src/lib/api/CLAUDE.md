<system_context>
Frontend API client functions for communicating with the backend Express server. Provides typed wrappers around fetch calls with error handling and progress tracking.
</system_context>

<file_map>
## FILE MAP
- `images-api.ts` - Image upload/listing, GCS direct upload, type definitions
- `jobs-api.ts` - Job creation, SSE subscription, viz2d file download
- `viz2d-api.ts` - Direct Viz2D API client (for ApiTestPage debug UI)
</file_map>

<critical_notes>
## CRITICAL NOTES

### Type Definitions
All API types (Image, Job, Viz2dFile, ApiError) defined in `images-api.ts` and re-exported from `jobs-api.ts`.

### Image Upload Flow (3 steps)
1. `getImageUploadUrl()` - Get signed GCS URL from server
2. `uploadToGcs()` - PUT file directly to GCS with progress callback
3. `confirmImageUpload()` - Tell server upload is done

Convenience wrapper: `uploadImage(file, onProgress)` does all 3 steps.

### SSE Job Updates
`subscribeToJobUpdates(jobId, onUpdate, onError)` returns cleanup function:
```ts
const unsubscribe = subscribeToJobUpdates(jobId, (job) => {
  console.log(job.status)
})
// Later: unsubscribe()
```
Auto-closes on COMPLETED/FAILED.

### Viz2D File Download
- `getViz2dDownloadUrl()` - Get signed URL
- `downloadViz2dFile()` - Returns Blob
- `downloadViz2dAsFile()` - Returns File object for visualizer
</critical_notes>

<patterns>
## PATTERNS

**Error Handling**
All functions use `handleResponse()` helper that throws `ApiError` with status/code.
Example: `images-api.ts:56-70`

**Progress Tracking**
XHR used for uploads to support progress events:
```ts
await uploadToGcs(url, file, (progress) => setProgress(progress))
```
Example: `images-api.ts:90-121`
</patterns>
