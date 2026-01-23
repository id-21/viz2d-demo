<system_context>
Route-level page components. Each file represents a distinct page/view in the application accessed via React Router.
</system_context>

<file_map>
## FILE MAP
- `GalleryPage.tsx` - Image gallery with upload, processing, and visualizer navigation
- `ApiTestPage.tsx` - Debug UI for testing Viz2D API calls directly
</file_map>

<critical_notes>
## CRITICAL NOTES

### GalleryPage
Full-featured image management UI:
- **Upload**: File input → useImageUpload → GCS direct upload
- **Process**: Click "Process" → useJob → SSE status updates
- **View**: Click "Open" → downloads viz2d → navigates to visualizer with file
- **Delete**: Confirmation → removes from DB (GCS cleanup not automatic)

### Navigation to Visualizer
Uses react-router state to pass downloaded File:
```ts
navigate('/', { state: { file } })
```
Visualizer receives via `useLocation().state.file`

### Status Display
Images show status badges: Pending, Processing, Ready, Failed
- `canProcess()` - true if no job or last job failed
- `hasViz2d()` - true if viz2dFiles array has items

### Hooks Used
- `useImages()` - list/refresh/delete images
- `useImageUpload()` - upload with progress
- `useJob()` - process images with real-time updates
</critical_notes>
