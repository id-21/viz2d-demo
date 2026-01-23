<system_context>
Express backend API that proxies Viz2D API (hiding credentials), manages GCS file storage, and tracks images/jobs via SQLite. Runs alongside the Vite frontend dev server.
</system_context>

<file_map>
## FILE MAP
- `src/index.ts` - Entry point, starts server + job poller
- `src/app.ts` - Express config, middleware, route mounting
- `src/api/` - REST endpoints (see `src/api/CLAUDE.md`)
- `src/services/` - Business logic (see `src/services/CLAUDE.md`)
- `src/lib/` - Prisma, GCS, Viz2D clients (see `src/lib/CLAUDE.md`)
- `src/workers/` - Background job poller (see `src/workers/CLAUDE.md`)
- `src/middleware/` - Error handling (see `src/middleware/CLAUDE.md`)
- `prisma/schema.prisma` - Database schema (Image, Job, Viz2dFile)
</file_map>

<critical_notes>
## CRITICAL NOTES

### Database Models
- **Image**: Uploaded images stored in GCS
- **Job**: Viz2D processing jobs (PENDING → PROCESSING → COMPLETED/FAILED)
- **Viz2dFile**: Completed .viz2d outputs stored in GCS

### Security
- `VIZ2D_VISUALIZER_ID` stays server-side only
- GCS bucket is private; all access via signed URLs (15min expiry)
- CORS configured for frontend origin only

### Environment Variables
```bash
DATABASE_URL="file:./dev.db"
GCP_PROJECT_ID, GCS_BUCKET_NAME, GCP_KEY_FILE
VIZ2D_API_URL, VIZ2D_VISUALIZER_ID
PORT=3001, CORS_ORIGIN="http://localhost:5173"
```

### Route Mounting
All routes under `/api/v1/`:
- `/api/v1/images` - Image management
- `/api/v1/jobs` - Job processing
- `/api/v1/viz2d` - Viz2D file retrieval
- `/api/health` - Health check
</critical_notes>

<paved_path>
## PAVED PATH

**Setup**
```bash
cd server
cp .env.example .env  # Configure credentials
pnpm install
npx prisma migrate dev
```

**Development**
```bash
pnpm dev  # Runs on port 3001
```

**Database Changes**
```bash
# Edit prisma/schema.prisma, then:
npx prisma migrate dev --name migration_name
```

**Adding New Endpoints**
1. Add handler in `src/api/{resource}/handlers.ts`
2. Add route in `src/api/{resource}/router.ts`
3. If needed, add service in `src/services/`
</paved_path>
