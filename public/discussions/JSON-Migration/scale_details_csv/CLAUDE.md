<system_context>
Enriches cleaned CSV with image paths from textureAssets.json and adds Brand column. Prepares data for JSON migration by matching SKUs to existing texture entries.
</system_context>

<file_map>
## FILE MAP
- `add_image_paths.py` - Matches CSV Item No. → JSON name, adds imagePath + Brand columns
- `CristianaMasi_with_paths.csv` - Output: 432 rows with Brand, imagePath columns added
</file_map>

<patterns>
## PATTERNS
Matching logic in `add_image_paths.py`:
- CSV `Item No.` (e.g., "42201") → JSON `name` field
- Adds `localPath` from JSON as `imagePath` column
- Hardcodes `Brand` = "Cristiana Masi" for all rows
</patterns>

<critical_notes>
## CRITICAL NOTES
- **Match rate**: 248/432 rows have matching images in textureAssets.json
- **Missing matches**: 184 rows (e.g., Friends & Coffee collection) not in JSON yet
- **Column mapping to JSON schema**:
  - Brand → `brand`
  - Collection_Name → `collection`
  - S.No. → `sku`
  - Item No. → `name` (already exists)
  - Repeat fields → `scale` (formula TBD)
</critical_notes>
