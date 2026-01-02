<system_context>
viz2d-demo is a React + Vite web application for visualizing and editing textures on segmented images. Users upload viz2d bundle files, select textures from a 979-item library, and apply them to image segments with real-time parameter adjustments (rotation, scale, offset). Built with @viz2d/core WASM renderer for high-performance canvas-based rendering.
</system_context>

<file_map>
## FILE MAP

### Application Code
- `src/` - **Main application source** (see `src/CLAUDE.md`)
  - `visualizer-demo/` - Texture editor UI (see `src/visualizer-demo/CLAUDE.md`)
  - `lib/` - Utilities and asset catalogs (see `src/lib/CLAUDE.md`)
  - `components/ui/` - shadcn/ui components

### Configuration Files
- `vite.config.ts` - Vite bundler + **custom texture middleware** (critical!)
- `package.json` - Dependencies and scripts
- `tailwind.config.cjs` - Tailwind CSS configuration
- `components.json` - shadcn/ui CLI configuration
- `tsconfig.json` - TypeScript base config
- `postcss.config.js` - PostCSS for Tailwind

### Deployment
- `vercel.json` - Vercel SPA deployment config
- `nginx.conf` - Alternative nginx deployment config

### Assets
- `public/assets/samples/` - Demo viz2d files (3 samples with previews)
- External: `/Users/ishan-aiworkspace/Documents/Daga PDF All Design Assets/TexturesForViz2D/` - Texture library (979 textures)

### Documentation
- `README.md` - Setup and usage instructions
</file_map>

<critical_notes>
## CRITICAL NOTES

### Custom Texture Serving (IMPORTANT!)
- **Custom Vite Middleware**: `vite.config.ts:8-29` serves textures from **external filesystem**
- Maps `/local-textures/*` → `/Users/ishan-aiworkspace/Documents/Daga PDF All Design Assets/TexturesForViz2D/Texture File/`
- Dev environment ONLY - production uses `cloudUrl` from `textureAssets.json`
- Filesystem access whitelist includes Downloads folder and texture directory (`vite.config.ts:40-44`)

### WASM Integration
- `@viz2d/core` is a WASM package requiring `vite-plugin-wasm` (`vite.config.ts:5,36`)
- Top-level-await enabled for WASM initialization (`vite.config.ts:48-50`)
- TextureRenderer is the core API for segment manipulation (see `src/visualizer-demo/CLAUDE.md`)

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui (new-york style, zinc theme)
- **Rendering**: @viz2d/core (WASM-based texture renderer)
- **UI Libraries**:
  - `@tanstack/react-virtual` - Virtual scrolling for 979 textures
  - `lucide-react` - Icons
  - `@radix-ui` - Primitives for shadcn/ui

### Deployment
- **Vercel**: SPA rewrites configured (`vercel.json`)
- **Nginx**: Alternative config provided (`nginx.conf`)
- **Production**: Must serve textures from CDN (set `cloudUrl` in `textureAssets.json`)

### Unused Configuration (Tech Debt)
- Environment variables defined but unused (`vite.config.ts:53-58`):
  - Google Maps API, OAuth Client ID, Giphy API, Minio URLs
  - Likely copied from project template - safe to remove

### Package Management
- Uses **pnpm** (not npm/yarn)
- Lock file: `pnpm-lock.yaml`
- Scripts: `pnpm dev`, `pnpm build`, `pnpm preview`
</critical_notes>

<patterns>
## PATTERNS

### Development Workflow
1. Textures stored externally (outside project)
2. Dev server serves via custom middleware
3. `textureAssets.json` contains base64 placeholders for instant preview
4. Full textures loaded on-demand when applied to segments

### Asset Path Resolution
Dev mode:
```
/local-textures/Energie/30185.jpg → Custom middleware → Filesystem
```

Production:
```
cloudUrl from textureAssets.json → CDN/hosting
```

### shadcn/ui Component Addition
```bash
npx shadcn-ui@latest add [component-name]
```
Components install to `src/components/ui/` with zinc theme (`components.json:9`)
</patterns>

<paved_path>
## PAVED PATH

### Getting Started
1. **Install dependencies**: `pnpm install`
2. **Start dev server**: `pnpm dev` (runs on network with `--host`)
3. **Navigate**: Open localhost:5173
4. **Load viz2d**: Upload file or select from 3 samples
5. **Apply textures**: Select texture → click segments

### Adding New Textures
1. Add texture images to external directory: `/Users/ishan-aiworkspace/Documents/Daga PDF All Design Assets/TexturesForViz2D/Texture File/`
2. Generate 200x200 base64 placeholder
3. Add entry to `src/lib/textureAssets.json`
4. Set `cloudUrl` for production deployment

### Understanding the Codebase
Start here in order:
1. Read this file (project overview)
2. Read `src/CLAUDE.md` (app structure)
3. Read `src/visualizer-demo/CLAUDE.md` (texture editor details)
4. Read `src/lib/CLAUDE.md` (utilities and data)

### Deployment
**Vercel (Recommended)**:
```bash
pnpm build
# Deploy dist/ to Vercel (configured via vercel.json)
```

**Self-hosted (Nginx)**:
```bash
pnpm build
# Serve dist/ with nginx.conf
```

**Important**: Update `textureAssets.json` with production `cloudUrl` values before deploying.

### Key Files to Modify
- **Add features**: `src/visualizer-demo/visualizer.tsx`
- **Add textures**: `src/lib/textureAssets.json`
- **Add samples**: `src/lib/viz2dSamples.ts` + `public/assets/samples/`
- **Add UI components**: Use shadcn/ui CLI or add to `src/components/ui/`
- **Modify texture serving**: `vite.config.ts` (custom middleware)
</paved_path>
