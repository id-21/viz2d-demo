<system_context>
viz2d-demo is a full-stack application for visualizing and editing textures on segmented images. Users upload images via GCS, process them through the Viz2D API, and apply textures from a 979-item library with real-time parameter adjustments. Features React frontend with WASM renderer and Express backend for API proxying and storage.
</system_context>

<file_map>
## FILE MAP

### Frontend (`src/`)
- `src/` - **React application** (see `src/CLAUDE.md`)
  - `visualizer-demo/` - Texture editor UI
  - `pages/` - GalleryPage, ApiTestPage
  - `hooks/` - API integration hooks
  - `lib/` - Utilities, assets, API clients

### Backend (`server/`)
- `server/` - **Express API** (see `server/CLAUDE.md`)
  - `src/api/` - REST endpoints (images, jobs, viz2d)
  - `src/services/` - Business logic
  - `src/lib/` - Prisma, GCS, Viz2D clients
  - `prisma/schema.prisma` - Database schema

### Configuration
- `vite.config.ts` - Vite bundler + texture middleware + **API proxy**
- `package.json` - Frontend dependencies
- `server/package.json` - Backend dependencies

### Assets
- `public/assets/samples/` - Demo viz2d files
- External: `/Users/ishan-aiworkspace/Documents/Daga PDF All Design Assets/TexturesForViz2D/` - Texture library
</file_map>

<critical_notes>
## CRITICAL NOTES

### Architecture
- **Frontend**: React + Vite + WASM (port 5173)
- **Backend**: Express + Prisma + GCS (port 3001)
- **API Proxy**: Vite proxies `/api/*` → `localhost:3001`
- **Security**: Viz2D credentials stay server-side only

### API Endpoints (Backend)
| Path | Purpose |
|------|---------|
| `/api/v1/images/*` | Image upload (GCS signed URLs) |
| `/api/v1/jobs/*` | Viz2D processing jobs + SSE |
| `/api/v1/viz2d/*` | Output file retrieval |

### Database Models (Prisma/SQLite)
- **Image**: Uploaded images in GCS
- **Job**: Processing jobs (PENDING → COMPLETED/FAILED)
- **Viz2dFile**: Completed .viz2d outputs in GCS

### Custom Texture Serving
- Dev: `/local-textures/*` → external filesystem via Vite middleware
- Prod: Uses `cloudUrl` from `textureAssets.json`

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, @viz2d/core (WASM)
- **Backend**: Express, Prisma, @google-cloud/storage
- **Styling**: Tailwind CSS + shadcn/ui

### Package Management
- Uses **pnpm** for both frontend and backend
- Frontend: `pnpm dev` (port 5173)
- Backend: `cd server && pnpm dev` (port 3001)
</critical_notes>

<paved_path>
## PAVED PATH

### Getting Started (Full Stack)
```bash
# Terminal 1 - Backend
cd server
cp .env.example .env  # Configure GCS + Viz2D credentials
pnpm install
npx prisma migrate dev
pnpm dev

# Terminal 2 - Frontend
pnpm install
pnpm dev
```

### User Workflows
1. **Gallery flow**: Upload image → Process → Open in visualizer
2. **Direct flow**: Load viz2d file directly in visualizer

### Understanding the Codebase
1. This file (overview)
2. `server/CLAUDE.md` (backend)
3. `src/CLAUDE.md` (frontend)
4. `src/visualizer-demo/CLAUDE.md` (texture editor)

### Key Files to Modify
- **Backend endpoints**: `server/src/api/*/handlers.ts`
- **Frontend API calls**: `src/lib/api/*.ts`
- **Texture editor**: `src/visualizer-demo/visualizer.tsx`
- **Add textures**: `src/lib/textureAssets.json`
</paved_path>
