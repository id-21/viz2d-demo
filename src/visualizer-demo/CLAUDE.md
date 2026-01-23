<system_context>
This directory contains the main texture visualization and editing interface. It handles viz2d file loading (upload or sample selection), segment-based texture application, and real-time parameter adjustments via canvas rendering.
</system_context>

<file_map>
## FILE MAP
- `index.tsx` - File upload/sample selection entry point; conditionally renders Visualizer
- `visualizer.tsx` - Core canvas-based texture editor with segment interaction and texture controls
</file_map>

<patterns>
## PATTERNS

**File Loading Pattern**
Three ways to load viz2d files:
1. Direct upload: `<input type="file" accept=".viz2d" />`
2. From URL: `fetch(url) → blob → File` (see `loadFromUrl` in `index.tsx:25`)
3. From GalleryPage: Receives File via `location.state.file` (see `index.tsx:16-23`)

**Canvas Interaction Pattern**
1. Mouse move → calculate pixel index → find segment → set hover state
2. Click → apply/remove texture on hovered segment
Example: `visualizer.tsx:269`, search:`handleMove`

**Virtual Scrolling for Textures**
Uses @tanstack/react-virtual for efficient 2-column grid rendering
- Estimated item height: 180px
- Overscan: 10 items
Example: `visualizer.tsx:189`, search:`useVirtualizer`
</patterns>

<critical_notes>
## CRITICAL NOTES

- **TextureRenderer Integration** - Singleton instance via `useRef` (`visualizer.tsx:156`), provides:
  - `load(bytes)` - Load viz2d bundle
  - `apply_texture(mask, imageBytes, params)` - Returns textureId
  - `update_texture(id, params)` - Modify rotation/scale/offset
  - `remove_texture(id)` - Delete texture
  - `get_output()` - Returns {width, height, pixels} for canvas

- **Segment-Texture Mapping** - Track which texture is on which segment via `segmentTextureMap: Record<segmentId, textureId>` to enable toggle behavior (click to apply, click again to remove)

- **State Management** - Three loading states:
  - `isBundleLoading` - Initial viz2d file load
  - `isTextureLoading` - Applying/updating textures
  - `fileState.loading` - Sample file fetch (index.tsx)

- **Gallery Integration** - VisualizerDemo checks `location.state.file` on mount to receive files from GalleryPage. Clears state after loading to prevent re-load on refresh.

- **Texture Assets** - Loaded from `@/lib/textureAssets.json` with structure:
  ```
  { id, name, filename, localPath, cloudUrl, placeholder }
  ```
  Dev uses `localPath`, production uses `cloudUrl` (`visualizer.tsx:292`)

- **Canvas Hover Effect** - Highlights hovered segment by darkening R/B channels and boosting G channel (`visualizer.tsx:224-229`)

- **Texture Parameters** - All textures support: rotation (-180 to 180°), scale (0.2 to 5), offset_x/y (-2 to 2)
</critical_notes>

<paved_path>
## PAVED PATH

**Adding New Texture Interaction Features**
1. Add state in `Visualizer` component
2. Update `handleClick` or `handleMove` for interaction logic
3. Call appropriate `renderer.*` method
4. Call `refreshTextures()` to sync state
5. Call `setImageVersion(v => v + 1)` to trigger redraw

**Adding New Texture Controls**
1. Add field to `TextureInfo` type
2. Add slider to `TextureCard` component
3. Update `updateTextureField` to handle new field
4. Renderer will handle the actual transformation

**Modifying File Loading**
- Edit `index.tsx` for UI/upload flow
- Edit `visualizer.tsx:242` (`loadFile`) for viz2d parsing logic
</paved_path>
