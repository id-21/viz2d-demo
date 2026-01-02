<system_context>
This directory contains shared utilities, configuration data, and asset catalogs. It provides static data (viz2d samples, texture library) and helper functions used across the application.
</system_context>

<file_map>
## FILE MAP
- `utils.ts` - Tailwind CSS class merging utility (`cn` function)
- `viz2dSamples.ts` - Array of sample viz2d files with preview images (3 samples)
- `textureAssets.ts` - Legacy texture asset array (6 items, replaced by JSON)
- `textureAssets.json` - Complete texture catalog (979 textures with base64 placeholders)
</file_map>

<patterns>
## PATTERNS

**Texture Asset Structure**
Each texture object contains:
```json
{
  "id": number,
  "name": string,
  "filename": string,
  "localPath": string,          // Used in dev mode
  "cloudUrl": string | null,     // Used in production
  "placeholder": string          // Base64 data URI (200x200 preview)
}
```
Example: `textureAssets.json:1-11`

**Viz2d Sample Structure**
Each sample contains:
```js
{
  image: '/assets/samples/N.jpg',      // Preview image
  viz2dFile: '/assets/samples/N.viz2d' // Actual viz2d bundle
}
```
Example: `viz2dSamples.ts:1-14`

**Class Name Merging**
Use `cn()` for conditional Tailwind classes:
```ts
cn('base-class', condition && 'conditional-class', className)
```
Example: `utils.ts:4`
</patterns>

<critical_notes>
## CRITICAL NOTES

- **Texture Assets JSON** - Large file (979 textures, ~7833 lines) with embedded base64 placeholders for instant preview rendering without network requests

- **Dev vs Production Paths** - Textures use `localPath` in development (served via Vite), `cloudUrl` in production. Check with `import.meta.env.DEV`

- **textureAssets.ts vs .json** - The `.ts` file is legacy (6 textures), replaced by `.json` (979 textures). Production code uses `.json` import

- **cn() Utility** - Standard shadcn/ui pattern combining `clsx` and `tailwind-merge` to handle conditional classes and resolve Tailwind conflicts

- **Static Asset Paths** - All paths in JSON/TS files assume public assets folder structure:
  - Samples: `/assets/samples/`
  - Textures (dev): `/local-textures/`
  - Textures (prod): Use `cloudUrl` field
</critical_notes>

<paved_path>
## PAVED PATH

**Adding New Texture Assets**
1. Add texture files to `/local-textures/` directory
2. Generate 200x200 base64 placeholder
3. Add entry to `textureAssets.json` with structure above
4. Set `cloudUrl` for production CDN path (or null for local-only)

**Adding New Viz2d Samples**
1. Add `.viz2d` file and preview image to `/public/assets/samples/`
2. Add entry to `viz2dSamples.ts` array
3. Export updated array

**Using cn() for Styling**
Import and use for dynamic class names:
```ts
import { cn } from '@/lib/utils'
className={cn('base', isActive && 'active', props.className)}
```
</paved_path>
