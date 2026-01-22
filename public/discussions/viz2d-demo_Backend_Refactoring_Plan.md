# Viz2D-Demo Backend Refactoring Plan

## Overview

Refactor viz2d-demo from a pure client-side React app to a full-stack application with:
- Express backend for API proxying (hides Viz2D credentials)
- Google Cloud Storage for image and viz2d file storage
- SQLite database (via Prisma) for tracking images, jobs, and files
- Secure workflow where frontend never directly calls external APIs

---

## Architecture Decision

**Express backend alongside Vite** (not Next.js migration)

**Rationale:**
- Existing WASM integration (`@viz2d/core`) with `vite-plugin-wasm` works well
- Custom texture middleware already configured in Vite
- Lower risk than full Next.js migration
- Empty `server/` directory already scaffolded
- Clear separation: React SPA (frontend) + Express API (backend)

---

## Database Schema (Prisma)

```prisma
// server/prisma/schema.prisma

model Image {
  id            String      @id @default(cuid())
  filename      String
  originalName  String
  mimeType      String
  size          Int
  gcsPath       String      // gs://bucket/images/{id}/{filename}
  gcsUrl        String      // Signed URL for access
  thumbnailPath String?
  thumbnailUrl  String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  jobs          Job[]
  viz2dFiles    Viz2dFile[]
}

model Job {
  id            String      @id @default(cuid())
  status        JobStatus   @default(PENDING)
  imageId       String
  image         Image       @relation(fields: [imageId], references: [id])
  inputGcsUrl   String
  viz2dJobId    String?     @unique
  outputUrl     String?
  failReason    String?
  viz2dFileId   String?     @unique
  viz2dFile     Viz2dFile?  @relation(fields: [viz2dFileId], references: [id])
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  completedAt   DateTime?

  @@index([status])
  @@index([viz2dJobId])
}

model Viz2dFile {
  id            String      @id @default(cuid())
  filename      String
  gcsPath       String
  gcsUrl        String
  fileSize      Int
  imageId       String
  image         Image       @relation(fields: [imageId], references: [id])
  job           Job?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([imageId])
}

enum JobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/images/upload-url` | Get signed GCS URL for upload |
| POST | `/api/v1/images` | Confirm upload, create Image record |
| GET | `/api/v1/images` | List all images with thumbnails |
| GET | `/api/v1/images/:id` | Get single image details |
| POST | `/api/v1/jobs` | Create Viz2D processing job |
| GET | `/api/v1/jobs/:id` | Get job status |
| GET | `/api/v1/jobs/:id/stream` | SSE for real-time job updates |
| GET | `/api/v1/viz2d/:id` | Get viz2d file info |
| GET | `/api/v1/viz2d/:id/download-url` | Get signed download URL |

---

## Directory Structure

```
viz2d-demo/
├── src/                              # Frontend (existing + modifications)
│   ├── lib/api/
│   │   ├── images-api.ts             # NEW: Image upload client
│   │   └── viz2d-api.ts              # MODIFY: Call /api/v1/jobs
│   ├── hooks/                        # NEW
│   │   ├── useImageUpload.ts
│   │   ├── useJob.ts
│   │   └── useImages.ts
│   ├── pages/
│   │   └── GalleryPage.tsx           # NEW: Browse uploaded images
│   └── visualizer-demo/
│       └── index.tsx                 # MODIFY: Add image upload flow
│
├── server/                           # Backend (new)
│   ├── src/
│   │   ├── index.ts                  # Entry point
│   │   ├── app.ts                    # Express configuration
│   │   ├── api/
│   │   │   ├── images/
│   │   │   │   ├── router.ts
│   │   │   │   └── handlers.ts
│   │   │   ├── jobs/
│   │   │   │   ├── router.ts
│   │   │   │   └── handlers.ts
│   │   │   └── viz2d/
│   │   │       ├── router.ts
│   │   │       └── handlers.ts
│   │   ├── services/
│   │   │   ├── image.service.ts
│   │   │   ├── job.service.ts
│   │   │   ├── viz2d-file.service.ts
│   │   │   └── gcs.service.ts
│   │   ├── workers/
│   │   │   └── job-poller.ts         # Background polling
│   │   ├── lib/
│   │   │   ├── prisma.ts
│   │   │   ├── gcs.ts
│   │   │   └── viz2d-client.ts       # Server-side Viz2D API
│   │   └── middleware/
│   │       └── error-handler.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
│
├── vite.config.ts                    # MODIFY: Add /api proxy
└── package.json
```

---

## Implementation Phases

### Phase 1: Server Foundation
1. `server/package.json` - Express, Prisma, @google-cloud/storage, cors, dotenv
2. `server/tsconfig.json` - Node.js TypeScript config
3. `server/prisma/schema.prisma` - Database schema
4. `server/src/lib/prisma.ts` - Prisma client singleton
5. `server/src/app.ts` - Express app with middleware
6. `server/src/index.ts` - Server entry point
7. Run `npx prisma migrate dev` to create database

### Phase 2: GCS Integration
8. `server/src/lib/gcs.ts` - GCS client initialization
9. `server/src/services/gcs.service.ts` - Signed URL generation
10. `server/src/services/image.service.ts` - Image CRUD operations
11. `server/src/api/images/handlers.ts` - Request handlers
12. `server/src/api/images/router.ts` - Route definitions

### Phase 3: Viz2D API Proxy
13. `server/src/lib/viz2d-client.ts` - Server-side Viz2D calls (hides visualizerId)
14. `server/src/services/job.service.ts` - Job creation and management
15. `server/src/api/jobs/handlers.ts` - Job handlers with SSE
16. `server/src/api/jobs/router.ts` - Job routes

### Phase 4: Background Worker
17. `server/src/workers/job-poller.ts` - Poll Viz2D, upload results to GCS
18. `server/src/services/viz2d-file.service.ts` - Viz2D file management
19. `server/src/api/viz2d/handlers.ts` - Viz2D file handlers
20. `server/src/api/viz2d/router.ts` - Viz2D routes

### Phase 5: Frontend Integration
21. `vite.config.ts` - Add proxy: `/api` → `http://localhost:3001`
22. `src/lib/api/images-api.ts` - Image upload API client
23. `src/lib/api/viz2d-api.ts` - Refactor to call internal `/api/v1/jobs`
24. `src/hooks/useImageUpload.ts` - Upload hook with progress
25. `src/hooks/useJob.ts` - Job status with SSE
26. `src/hooks/useImages.ts` - List images
27. `src/pages/GalleryPage.tsx` - Browse uploaded images
28. `src/visualizer-demo/index.tsx` - Add image upload workflow
29. `src/App.tsx` - Add GalleryPage route

### Phase 6: Polish
30. `server/src/middleware/error-handler.ts` - Consistent errors
31. Environment variable documentation
32. Remove `VITE_VIZ2D_*` from frontend config

---

## Environment Variables

```bash
# server/.env
DATABASE_URL="file:./dev.db"

# GCS
GCP_PROJECT_ID="your-project"
GCS_BUCKET_NAME="viz2d-demo"
GCP_KEY_FILE="./gcp-credentials.json"

# Viz2D API (SERVER-SIDE ONLY)
VIZ2D_API_URL="https://api.viz2d.com"
VIZ2D_VISUALIZER_ID="viz_xxxxx"

# Server
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```

---

## Workflow Diagram

```
1. User selects image file
   → POST /api/v1/images/upload-url
   → Server generates signed GCS URL + creates Image record

2. Frontend uploads directly to GCS
   → PUT to signed URL (bypasses server)

3. Frontend confirms upload
   → POST /api/v1/images { imageId }
   → Server verifies GCS object exists

4. User clicks "Process"
   → POST /api/v1/jobs { imageId }
   → Server: get token (visualizerId hidden), create Viz2D job

5. Frontend subscribes to SSE
   → GET /api/v1/jobs/:id/stream

6. Background worker polls Viz2D API
   → On COMPLETED: download .viz2d, upload to GCS, update DB
   → Emit SSE event

7. User enters visualizer
   → GET /api/v1/viz2d/:id/download-url
   → Fetch .viz2d from GCS
   → Pass to TextureRenderer
```

---

## Security

1. **API Keys**: `VIZ2D_VISUALIZER_ID` only in server env, never in frontend
2. **GCS**: Signed URLs expire in 15 minutes, bucket not public
3. **Validation**: File type/size validated server-side before generating upload URLs
4. **CORS**: Strict origin whitelist in production

---

## Confirmed Decisions

- **Upload method**: Signed URLs - frontend uploads directly to GCS (faster, no server bottleneck)
- **GCS setup**: Already configured by user - credentials file ready

---

## Verification

1. Start server: `cd server && npm run dev`
2. Start frontend: `npm run dev`
3. Test upload flow:
   - Select image → uploads to GCS
   - Click Process → job created, status updates via SSE
   - On completion → viz2d file downloadable
4. Test visualizer:
   - Click on processed image → downloads viz2d from GCS
   - TextureRenderer loads and displays correctly
5. Verify no `VIZ2D_VISUALIZER_ID` in browser network tab or source

---

## Files to Modify (Existing)

- `vite.config.ts` - Add /api proxy, remove VITE_VIZ2D_VISUALIZER_ID
- `src/lib/api/viz2d-api.ts` - Refactor to call internal API
- `src/visualizer-demo/index.tsx` - Add image upload option
- `src/App.tsx` - Add GalleryPage route

## Files to Create (New)

- All files in `server/` directory (entire backend)
- `src/lib/api/images-api.ts`
- `src/hooks/useImageUpload.ts`
- `src/hooks/useJob.ts`
- `src/hooks/useImages.ts`
- `src/pages/GalleryPage.tsx`
