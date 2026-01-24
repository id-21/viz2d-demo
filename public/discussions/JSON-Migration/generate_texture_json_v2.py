#!/usr/bin/env python3
"""
Generate textureAssets_v2.json with enriched data from CSV.

Only includes entries that have matching data in both:
- src/lib/textureAssets.json (for base fields: id, name, filename, localPath, cloudUrl, placeholder)
- CristianaMasi_with_scale.csv (for enriched fields: brand, collection, sku, manufacturer_sku, scale)
"""

import json
import csv
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent
INPUT_JSON = PROJECT_ROOT / "src" / "lib" / "textureAssets.json"
INPUT_CSV = SCRIPT_DIR / "scale_details_csv" / "CristianaMasi_with_scale.csv"
OUTPUT_JSON = PROJECT_ROOT / "src" / "lib" / "textureAssets_v2.json"


def main():
    print(f"Loading JSON from: {INPUT_JSON}")
    print(f"Loading CSV from: {INPUT_CSV}")
    print(f"Output will be: {OUTPUT_JSON}")
    print("-" * 60)

    # Load existing JSON
    with open(INPUT_JSON, 'r', encoding='utf-8') as f:
        json_data = json.load(f)

    # Create lookup by name
    json_by_name = {entry['name']: entry for entry in json_data}
    print(f"Loaded {len(json_data)} JSON entries")

    # Load CSV
    csv_rows = []
    with open(INPUT_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        csv_rows = list(reader)
    print(f"Loaded {len(csv_rows)} CSV rows")

    # Process and merge
    output_entries = []
    seen_names = set()  # Track duplicates

    for row in csv_rows:
        item_no = row['Item No.']

        # Skip if not in JSON
        if item_no not in json_by_name:
            continue

        # Skip duplicates (CSV has some duplicate rows)
        if item_no in seen_names:
            continue
        seen_names.add(item_no)

        # Get base entry from JSON
        base_entry = json_by_name[item_no]

        # Build new entry with all fields
        new_entry = {
            'id': None,  # Will be reassigned
            'name': base_entry['name'],
            'filename': base_entry['filename'],
            'localPath': base_entry['localPath'],
            'cloudUrl': base_entry['cloudUrl'],
            'placeholder': base_entry['placeholder'],
        }

        # Add enriched fields from CSV
        new_entry['brand'] = row['Brand']
        new_entry['collection'] = row['Collection_Name']
        new_entry['sku'] = row['S.No.']
        new_entry['manufacturer_sku'] = row['Article']

        # Add scale if present
        scale_str = row.get('scale', '').strip()
        if scale_str:
            try:
                new_entry['scale'] = float(scale_str)
            except ValueError:
                pass  # Skip invalid scale values

        output_entries.append(new_entry)

    # Reassign sequential IDs
    for i, entry in enumerate(output_entries, start=1):
        entry['id'] = i

    # Write output
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(output_entries, f, indent=2, ensure_ascii=False)

    # Print summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total entries in output: {len(output_entries)}")

    # Count fields
    with_scale = sum(1 for e in output_entries if 'scale' in e)
    with_brand = sum(1 for e in output_entries if e.get('brand'))
    with_collection = sum(1 for e in output_entries if e.get('collection'))
    with_sku = sum(1 for e in output_entries if e.get('sku'))
    with_manufacturer_sku = sum(1 for e in output_entries if e.get('manufacturer_sku'))

    print(f"Entries with scale: {with_scale}")
    print(f"Entries with brand: {with_brand}")
    print(f"Entries with collection: {with_collection}")
    print(f"Entries with sku: {with_sku}")
    print(f"Entries with manufacturer_sku: {with_manufacturer_sku}")

    # Show sample entry
    if output_entries:
        print("\n" + "-" * 60)
        print("SAMPLE ENTRY (first):")
        print("-" * 60)
        sample = output_entries[0].copy()
        # Truncate placeholder for display
        if sample.get('placeholder') and len(sample['placeholder']) > 50:
            sample['placeholder'] = sample['placeholder'][:50] + '...'
        print(json.dumps(sample, indent=2))

    print("\n" + "=" * 60)
    print(f"Output written to: {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
