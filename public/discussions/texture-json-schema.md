# Texture Assets JSON Schema

Schema for entries in `src/lib/textureAssets.json`.

## Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Unique identifier |
| `name` | string | Yes | Display name |
| `filename` | string | Yes | File name (e.g., `30185.jpg`) |
| `localPath` | string | Yes | Dev mode path (e.g., `/local-textures/Energie/30185.jpg`) |
| `cloudUrl` | string \| null | Yes | Production CDN URL (null for local-only) |
| `placeholder` | string \| null | Yes | Base64 data URI for 200x200 preview |
| `scale` | number | No | Default scale when applied (defaults to 0.52) |
| `manufacturer_sku` | string | No | Manufacturer's SKU/product code |
| `sku` | string | No | Internal SKU |
| `brand` | string | No | Brand name |
| `collection` | string | No | Collection name |

## Example Entry

```json
{
  "id": 2,
  "name": "30185",
  "filename": "30185.jpg",
  "localPath": "/local-textures/Energie/30185.jpg",
  "cloudUrl": null,
  "placeholder": "data:image/jpeg;base64,...",
  "scale": 0.75,
  "manufacturer_sku": "ENR-30185",
  "sku": "TEX-001",
  "brand": "Energie",
  "collection": "Modern Collection"
}
```

## TypeScript Type

```typescript
type TextureAsset = {
  id: number;
  name: string;
  filename: string;
  localPath: string;
  cloudUrl: string | null;
  placeholder: string;
  scale?: number;
  manufacturer_sku?: string;
  sku?: string;
  brand?: string;
  collection?: string;
};
```

## Notes

- All optional fields can be omitted from entries
- `scale` defaults to 0.52 when not specified
- In dev mode, textures are served via `localPath`
- In production, textures use `cloudUrl` (falls back to `localPath` if null)
