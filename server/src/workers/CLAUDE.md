<system_context>
Background worker processes that run alongside the Express server. Currently contains the job poller that monitors Viz2D API for job completion and uploads results to GCS.
</system_context>

<file_map>
## FILE MAP
- `job-poller.ts` - Polls Viz2D API, downloads completed outputs, uploads to GCS
</file_map>

<critical_notes>
## CRITICAL NOTES

### Job Poller
- **Poll interval**: 5 seconds
- **Error handling**: Max 3 consecutive errors before 30-second backoff
- **Processing flow**:
  1. Query DB for PENDING/PROCESSING jobs
  2. Check each job status via Viz2D API
  3. On COMPLETED: download .viz2d → upload to GCS → update DB
  4. On FAILED: update DB with error reason

### Starting the Poller
Called from `index.ts` on server startup:
```ts
import { startJobPoller } from './workers/job-poller.js'
startJobPoller()
```

### Key Functions
- `startJobPoller()` - Begins background polling loop
- `stopJobPoller()` - Gracefully stops the poller
- `processJob()` - Handles individual job status check
- `handleJobCompleted()` - Downloads output, uploads to GCS
</critical_notes>
