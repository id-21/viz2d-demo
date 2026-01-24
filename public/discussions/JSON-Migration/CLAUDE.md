<system_context>
Data processing pipeline for migrating Cristiana Masi wallpaper SKU data into textureAssets.json. Contains raw CSVs, cleaning scripts, and subdirectories for specific transformations.
</system_context>

<file_map>
## FILE MAP
- `CristianaMasi_all_SKUs.csv` - Raw export with all 507 SKUs and 29 columns
- `CristianaMasi_all_SKUs_cleaned.csv` - Cleaned: 432 rows with valid S.No. and Item No.
- `CristianaMasi_all_SKUs_only_needed_fields.csv` - Subset with 11 essential columns
- `clean_sku_csv.py` - Removes rows missing S.No. or Item No.
- `scale_details_csv/` - Adds imagePath and Brand columns (see its CLAUDE.md)
</file_map>

<critical_notes>
## CRITICAL NOTES
- **Data flow**: Raw CSV → cleaned → only_needed_fields → scale_details_csv/with_paths
- **Matching key**: CSV `Item No.` matches JSON `name` field in textureAssets.json
- **End goal**: Update `src/lib/textureAssets.json` with brand, collection, sku, and scale data
</critical_notes>

<paved_path>
## PAVED PATH
1. Run `python3 clean_sku_csv.py` to clean raw CSV
2. Process through `scale_details_csv/add_image_paths.py` to add paths
3. Use output to update textureAssets.json (future script)
</paved_path>
