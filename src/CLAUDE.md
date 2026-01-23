<system_context>
React + Vite frontend for viz2d texture visualization. Multi-page app with image gallery, processing workflow, and canvas-based texture editor. Communicates with Express backend for GCS storage and Viz2D API proxying.
</system_context>

<file_map>
## FILE MAP
- `main.tsx` - React root initialization with BrowserRouter wrapper
- `App.tsx` - Route definitions (/, /gallery, /api-test)
- `index.css` - Global Tailwind imports and shadcn/ui CSS variable definitions
- `vite-env.d.ts` - Vite TypeScript type definitions
- `visualizer-demo/` - **Texture editor UI** (see `visualizer-demo/CLAUDE.md`)
- `lib/` - **Utilities, assets, API clients** (see `lib/CLAUDE.md`)
- `hooks/` - **Custom React hooks** (see `hooks/CLAUDE.md`)
- `pages/` - **Route-level pages** (see `pages/CLAUDE.md`)
- `components/ui/` - shadcn/ui components
</file_map>

<critical_notes>
## CRITICAL NOTES

### Routes
| Path | Component | Purpose |
|------|-----------|---------|
| `/` | VisualizerDemo | Texture editor (load viz2d, apply textures) |
| `/gallery` | GalleryPage | Upload images, process via Viz2D, open results |
| `/api-test` | ApiTestPage | Debug UI for direct Viz2D API testing |

### Application Flow
1. **Gallery workflow**: Upload image → Process → Open in visualizer
2. **Direct workflow**: Load viz2d file directly in visualizer
3. Gallery passes viz2d File to visualizer via router state

### Styling Architecture
- Tailwind CSS + shadcn/ui (new-york style, zinc theme)
- CSS variables in `index.css` for theming
- Path alias: `@/` → `src/`

### External Dependencies
- `@viz2d/core` - WASM TextureRenderer
- `@tanstack/react-virtual` - Virtual scrolling
- `lucide-react` - Icons
- `@radix-ui` - Primitives for shadcn/ui
</critical_notes>

<paved_path>
## PAVED PATH

**Understanding the App**
1. `App.tsx` - See routes
2. `pages/CLAUDE.md` - Page components
3. `hooks/CLAUDE.md` - API integration hooks
4. `visualizer-demo/CLAUDE.md` - Texture editor

**Adding New Features**
- New pages → Add to `pages/`, add route in `App.tsx`
- New API calls → Add to `lib/api/`
- New hooks → Add to `hooks/`
- UI components → Use shadcn/ui CLI or add to `components/ui/`
</paved_path>
