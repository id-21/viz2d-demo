<system_context>
React + Vite application for viz2d texture visualization and editing. Single-page app that loads viz2d bundles and applies textures to image segments via canvas rendering.
</system_context>

<file_map>
## FILE MAP
- `main.tsx` - React root initialization with BrowserRouter wrapper
- `App.tsx` - Root component that renders VisualizerDemo
- `index.css` - Global Tailwind imports and shadcn/ui CSS variable definitions
- `vite-env.d.ts` - Vite TypeScript type definitions
- `visualizer-demo/` - **Main texture editor UI** (see `visualizer-demo/CLAUDE.md`)
- `lib/` - **Shared utilities and asset data** (see `lib/CLAUDE.md`)
- `components/ui/` - shadcn/ui components (currently just Button)

**Key Child Documentation:**
- For texture editing workflow → `visualizer-demo/CLAUDE.md`
- For texture assets and utilities → `lib/CLAUDE.md`
</file_map>

<critical_notes>
## CRITICAL NOTES

- **Single Entry Point** - No routing used despite BrowserRouter setup; App directly renders VisualizerDemo component (`App.tsx:5`)

- **Application Flow**:
  1. `main.tsx` → Bootstraps React with StrictMode + BrowserRouter
  2. `App.tsx` → Renders VisualizerDemo (file upload/selection)
  3. VisualizerDemo → Conditionally renders Visualizer (canvas editor)

- **Styling Architecture** - Uses Tailwind CSS with shadcn/ui component library; CSS variables defined in `index.css` for theming

- **Path Aliases** - `@/` maps to `src/` directory (configured in tsconfig/vite)

- **External Dependencies**:
  - `@viz2d/core` - TextureRenderer for segment manipulation
  - `@tanstack/react-virtual` - Virtual scrolling for texture list
  - `lucide-react` - Icon library
  - `@radix-ui` - Primitive components for shadcn/ui

- **No Routing** - Despite BrowserRouter wrapper, app has no routes; single view only
</critical_notes>

<paved_path>
## PAVED PATH

**Understanding the App**
1. Start with `App.tsx` - See the top-level structure
2. Read `visualizer-demo/CLAUDE.md` - Understand texture editing workflow
3. Read `lib/CLAUDE.md` - Understand data sources and utilities

**Adding New Features**
- New UI components → Add to `components/ui/` (follow shadcn/ui pattern)
- Texture editing features → Work in `visualizer-demo/` directory
- New data sources → Add to `lib/` directory
- Global styles → Modify `index.css`

**Component Library Usage**
shadcn/ui components are in `components/ui/`. Import and use with variants:
```ts
<Button variant="default|destructive|outline|secondary|ghost|link" size="default|sm|lg|icon" />
```
</paved_path>
