<system_context>
Enriches cleaned CSV with image paths, Brand column, and calculated scale values. Final output ready for updating textureAssets.json.
</system_context>

<file_map>
## FILE MAP
- `add_image_paths.py` - Matches CSV Item No. → JSON name, adds imagePath + Brand columns
- `CristianaMasi_with_paths.csv` - Intermediate: 432 rows with Brand, imagePath columns
- `calculate_scale.py` - Calculates scale from image dimensions and WIDTH m
- `CristianaMasi_with_scale.csv` - **Final output**: 432 rows with pixelWidth, pixelHeight, scale columns added
</file_map>

<patterns>
## PATTERNS
**Scale calculation formula** (in `calculate_scale.py`):
```
pixel_ratio = image_width_pixels / WIDTH_m
scale = image_height_pixels / pixel_ratio
```
- Uses macOS `sips` command to get image dimensions
- Converts `/local-textures/...` paths to filesystem paths via TEXTURE_BASE_PATH
</patterns>

<critical_notes>
## CRITICAL NOTES
- **Match rate**: 248/432 rows have matching images in textureAssets.json
- **Missing collections**: Friends & Coffee, Blooming Garden, Amazzonia (no images in texture folder)
- **Scale values calculated**: 196 rows at 0.53, 48 rows at 0.64, 4 rows at 0.60
- **Column mapping to JSON schema**:
  - Brand → `brand`
  - Collection_Name → `collection`
  - S.No. → `sku`
  - Item No. → `name` (already exists)
  - scale → `scale` (calculated from image dimensions)
</critical_notes>
