<system_context>
REST API route handlers organized by resource. Each subdirectory contains a router (route definitions) and handlers (request processing). All routes are mounted under `/api/v1/`.
</system_context>

<file_map>
## FILE MAP
- `images/` - Image upload and management endpoints
- `jobs/` - Viz2D processing job endpoints + SSE streaming
- `viz2d/` - Viz2D output file retrieval endpoints
</file_map>

<critical_notes>
## CRITICAL NOTES

### API Endpoints Reference

**Images** (`/api/v1/images`)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/upload-url` | Get signed GCS URL for direct upload |
| POST | `/` | Confirm upload after client uploads to GCS |
| GET | `/` | List all images (paginated) |
| GET | `/:id` | Get single image with jobs/files |
| DELETE | `/:id` | Delete image and associated data |

**Jobs** (`/api/v1/jobs`)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/` | Create new Viz2D processing job |
| GET | `/:id` | Get job status |
| POST | `/:id/sync` | Manually sync status with Viz2D API |
| GET | `/:id/stream` | SSE stream for real-time updates |
| GET | `/image/:imageId` | List jobs for an image |

**Viz2D Files** (`/api/v1/viz2d`)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/:id` | Get viz2d file info |
| GET | `/:id/download-url` | Get signed download URL |
| GET | `/image/:imageId` | List viz2d files for image |
| GET | `/image/:imageId/latest` | Get latest viz2d file |

### SSE Streaming
Job updates use Server-Sent Events (`jobs/:id/stream`):
- Polls DB every 2 seconds
- Auto-closes on COMPLETED/FAILED
- Handles client disconnect cleanup
Example: `jobs/handlers.ts:56-102`
</critical_notes>

<patterns>
## PATTERNS

**Handler Structure**
All handlers follow: `async (req, res, next) => try/catch → next(error)`
Example: `images/handlers.ts:8-22`

**Router Organization**
Each resource has `router.ts` + `handlers.ts`. Router imports and mounts handlers.
Example: `images/router.ts`
</patterns>
