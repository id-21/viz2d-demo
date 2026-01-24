<system_context>
Data processing pipeline for migrating Cristiana Masi wallpaper SKU data into textureAssets.json. Contains raw CSVs, cleaning scripts, and subdirectories for specific transformations.
</system_context>

<file_map>
## FILE MAP
- `CristianaMasi_all_SKUs.csv` - Raw export with all 507 SKUs and 29 columns
- `CristianaMasi_all_SKUs_cleaned.csv` - Cleaned: 432 rows with valid S.No. and Item No.
- `CristianaMasi_all_SKUs_only_needed_fields.csv` - Subset with 11 essential columns
- `clean_sku_csv.py` - Removes rows missing S.No. or Item No.
- `generate_texture_json_v2.py` - Merges CSV data with existing JSON to create enriched textureAssets_v2.json
- `scale_details_csv/` - Adds imagePath, Brand, and calculated scale (see its CLAUDE.md)
</file_map>

<critical_notes>
## CRITICAL NOTES
- **Data flow**: Raw CSV → cleaned → only_needed_fields → with_paths → **with_scale** (final)
- **Matching key**: CSV `Item No.` matches JSON `name` field in textureAssets.json
- **Scale calculation**: `scale = height_pixels / (width_pixels / WIDTH_m)` - gives height in meters
- **End goal**: Update `src/lib/textureAssets.json` with brand, collection, sku, and scale data
</critical_notes>

<paved_path>
## PAVED PATH
1. Run `python3 clean_sku_csv.py` to clean raw CSV
2. Run `python3 scale_details_csv/add_image_paths.py` to add paths
3. Run `python3 scale_details_csv/calculate_scale.py` to calculate scale values
4. Run `python3 generate_texture_json_v2.py` to merge CSV with JSON → outputs `src/lib/textureAssets_v2.json`
</paved_path>
