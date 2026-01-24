import csv
import json
import os

# Paths relative to this script's location
script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, '..', '..', '..', '..', 'src', 'lib', 'textureAssets.json')
input_csv = os.path.join(script_dir, '..', 'CristianaMasi_all_SKUs_only_needed_fields.csv')
output_csv = os.path.join(script_dir, 'CristianaMasi_with_paths.csv')

# Load JSON and build lookup dict by name
with open(json_path, 'r', encoding='utf-8') as f:
    texture_assets = json.load(f)

# Create lookup dict: name -> localPath
path_lookup = {}
for asset in texture_assets:
    name = asset.get('name', '')
    local_path = asset.get('localPath', '')
    if name and local_path:
        path_lookup[name] = local_path

print(f"Loaded {len(path_lookup)} texture assets with paths")

# Process CSV
matches_found = 0
total_rows = 0

with open(input_csv, 'r', newline='', encoding='utf-8') as infile:
    reader = csv.DictReader(infile)
    fieldnames = ['Brand'] + list(reader.fieldnames) + ['imagePath']

    with open(output_csv, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()

        for row in reader:
            total_rows += 1
            item_no = row.get('Item No.', '').strip()

            # Convert "42201.0" to "42201" for matching
            item_key = item_no
            if item_no:
                try:
                    item_key = str(int(float(item_no)))
                except ValueError:
                    pass

            # Look up in JSON
            image_path = path_lookup.get(item_key, '')
            if image_path:
                matches_found += 1

            row['Brand'] = 'Cristiana Masi'
            row['imagePath'] = image_path
            writer.writerow(row)

print(f"\nProcessed {total_rows} rows")
print(f"Matches found: {matches_found}")
print(f"No match: {total_rows - matches_found}")
print(f"\nOutput saved to: {output_csv}")
