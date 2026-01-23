<system_context>
Custom React hooks for API integration. Manage loading states, errors, and real-time updates for images and processing jobs.
</system_context>

<file_map>
## FILE MAP
- `useImageUpload.ts` - Upload images to GCS with progress tracking
- `useImages.ts` - List, paginate, and delete images
- `useJob.ts` - Create jobs and subscribe to SSE updates
</file_map>

<critical_notes>
## CRITICAL NOTES

### useImageUpload
Returns: `{ upload, uploading, progress, error, reset }`
- `progress` is 0-100 during upload
- Wraps `uploadImage()` from api client

### useImages
Returns: `{ images, total, loading, error, refresh, loadMore, remove, hasMore }`
- Auto-fetches on mount
- `loadMore()` for infinite scroll (PAGE_SIZE = 20)
- `remove()` deletes and updates local state

### useJob
Returns: `{ job, loading, error, startJob, refreshJob, reset }`
- Auto-subscribes to SSE on `startJob()` or when `initialJobId` provided
- Cleans up SSE subscription on unmount
- Updates `job` state in real-time via SSE
</critical_notes>

<patterns>
## PATTERNS

**Hook Return Pattern**
All hooks return objects with: data, loading, error, action functions
Example: `useImageUpload.ts:4-10`

**SSE Subscription Cleanup**
useJob stores unsubscribe function in ref, cleans up on unmount:
```ts
useEffect(() => {
  return () => { unsubscribeRef.current?.() }
}, [])
```
Example: `useJob.ts:25-31`
</patterns>
