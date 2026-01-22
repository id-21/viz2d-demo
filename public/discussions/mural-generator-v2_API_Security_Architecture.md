# API Security Architecture Report: mural-generator-v2

This document describes how the `mural-generator-v2` Next.js application is designed to ensure no API calls are made directly from the frontend and no API keys are leaked to the client.

---

## Overview

The project follows a **strict server-side API pattern** using a three-layer delegation chain that completely isolates external API calls from the frontend.

**Tech Stack:** Next.js 16 App Router, Google Gemini AI, Prisma ORM

---

## Key Security Patterns

### 1. Three-Layer Delegation Chain

```
Route (app/api/) → Handler (features/*/api/*.handler.ts) → Service (features/*/services/*.service.ts) → External APIs
```

All external API calls (Gemini AI, database) happen **only on the server-side** through this chain:

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **API Routes** | `app/api/` | Thin HTTP wrappers (< 20 lines), no business logic |
| **Handlers** | `features/*/api/*.handler.ts` | Delegate to services |
| **Services** | `features/*/services/*.service.ts` | Business logic + external API calls |

### 2. Thin Route Pattern

All routes follow an identical structure with no business logic:

```typescript
// app/api/analyze/route.ts
import { handlerFunction } from '@/features/feature-name/api/handler';

export async function POST(request: NextRequest) {
  try {
    const result = await handlerFunction();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Message', details: error.message },
      { status: 500 }
    );
  }
}
```

### 3. Server-Side Only Services

Services that call external APIs are explicitly marked as **server-side only**:

> `batch.service.ts` uses Node.js modules (fs, path) and CANNOT be imported in client components. Import in API routes only.

Attempting to import these services in client components will throw errors due to Node.js module usage.

### 4. Environment Variables for API Keys

API keys are stored in environment variables and accessed **only in server-side code**:

```typescript
// Only accessible in server-side code
const ai = getGeminiClient(); // Auto-initialized with GEMINI_API_KEY
```

**Required Environment Variables (Server-Side Only):**
- `GEMINI_API_KEY` - Google Gemini API key (required)
- `GEMINI_MODEL` - Model for image generation (default: gemini-2.5-flash-image)
- `GEMINI_CHAT_MODEL` - Model for chat refinement (default: gemini-2.5-flash)
- `REFERENCE_MURALS_PATH` - Filesystem path for reference images
- `GENERATED_MURALS_OUTPUT_PATH` - Output path for generated murals

### 5. Client Components Use Hooks, Not Services

Frontend uses **React hooks** that make `fetch()` calls to internal API routes - never directly to external APIs:

```typescript
// ✅ CORRECT - Client component uses hook
import { useArtReport } from '@/features/art-analysis';

function MuralDetailPage({ muralId }) {
  const { report, loading, error, generateReport } = useArtReport(muralId);
  // Hook internally calls: POST /api/analyze
}
```

```typescript
// ❌ WRONG - Never import services in client components
import { artAnalysisService } from '@/features/art-analysis/services';
// This would expose API keys and fail due to Node.js modules
```

### 6. Barrel Exports Exclude Services

The barrel exports (`index.ts`) deliberately **do not export services** to prevent accidental client-side imports:

```typescript
// features/batch-reports/index.ts
export { BatchStatusCard, ConflictModal } from './components';
export { useBatchReports } from './hooks';
export type { BatchJobStats, ConflictCheckResult } from './domain/types';
// NOTE: services NOT exported - server-side only
```

---

## Data Flow Example

**Art Analysis Feature (Gemini API Call):**

```
User clicks "Generate Art Report"
  → useArtReport.generateReport()           [CLIENT - Hook]
    → POST /api/analyze { muralId }         [CLIENT → SERVER]
      → analyze.handler.analyzeArt()        [SERVER - Handler]
        → artAnalysisService.generateReport(muralId)  [SERVER - Service]
          → referenceMuralService.findById() + getImageData()
          → analyzeReferenceMural(base64, mimeType)   [SERVER - Gemini API]
          → db.referenceMural.update({ artReport })
        ← Return Markdown report
      ← Response.json({ report })
    ← setReport(data.report)
  → Display in component
```

The Gemini API call happens deep in the server-side service layer, completely isolated from the frontend.

---

## Feature-Based Architecture

Each feature encapsulates its own security boundary:

```
feature-name/
├── domain/types.ts          # TypeScript interfaces (safe for client)
├── services/                # Business logic - SERVER ONLY
│   └── *.service.ts
├── hooks/                   # React hooks - SAFE FOR CLIENT
│   └── use*.ts
├── components/              # UI components - SAFE FOR CLIENT
│   └── *.tsx
├── api/                     # Thin handlers - SERVER ONLY
│   └── *.handler.ts
├── index.ts                 # Exports hooks/components (NOT services)
└── CLAUDE.md
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/references` | GET | List reference murals |
| `/api/image` | GET | Serve image files |
| `/api/import` | POST/GET | Import murals / stats |
| `/api/analyze` | POST | Generate art report (Phase 1) |
| `/api/conversations` | POST | Create conversation |
| `/api/conversations/[id]` | GET | Get conversation details |
| `/api/conversations/[id]/messages` | POST | Send message (Phase 2) |
| `/api/generate` | POST | Generate mural image (Phase 3) |
| `/api/generations` | GET | List generations |
| `/api/batch-reports/*` | Various | Batch processing endpoints |

---

## Best Practices Demonstrated

1. **Never expose API keys in frontend code** - All keys in server-side env vars only
2. **Use internal API routes as proxy** - Frontend calls your API, not external APIs
3. **Separate concerns by layer** - Routes → Handlers → Services → External APIs
4. **Explicit server-side markers** - Use Node.js modules to prevent client imports
5. **Careful barrel exports** - Don't export server-only code from feature index files
6. **Hook pattern for data fetching** - Encapsulate API calls in reusable hooks

---

## Comparison with Direct API Calls

| Aspect | Direct Frontend Calls (Bad) | Server-Side Proxy (Good) |
|--------|---------------------------|-------------------------|
| API Key Security | Exposed in browser | Hidden on server |
| Rate Limiting | Per-user abuse possible | Server-controlled |
| Error Handling | Inconsistent | Centralized |
| Caching | Complex | Server-side cache |
| Logging | Limited | Full server logs |
| CORS Issues | Common | None (same origin) |

---

**Source:** Analysis of `mural-generator-v2` CLAUDE.md documentation files
**Date:** January 2026
