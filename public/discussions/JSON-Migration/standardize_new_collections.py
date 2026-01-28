#!/usr/bin/env python3
"""
Standardize new collection CSVs to match the pipeline format.
Input: Raw CSV files from Technical Excels directory
Output: Standardized CSVs with required columns
"""

import csv
import os
import re

TECHNICAL_SHEETS_DIR = "/Users/ishan-aiworkspace/Documents/technical-sheets/Technical Excels"
OUTPUT_DIR = "/Users/ishan-aiworkspace/Documents/apps/viz2d-demo/public/discussions/JSON-Migration/new_collections"

# Collection mappings: (filename, collection_name)
COLLECTIONS = [
    ("1_CasaMood_Technical.csv", "CasaMood"),
    ("1_CVLTO_Tecnical.csv", "CVLTO"),
    ("1_Flora_Technical.csv", "Flora"),
    ("Friends & Coffee 2_Technical.csv", "Friends & Coffee 2"),
    ("1_MondoBaby_Technical.csv", "MondoBaby"),
    ("1_Thema_Technical.csv", "Thema"),
]

BRAND = "Cristiana Masi"

# Required output columns
OUTPUT_COLUMNS = [
    "Brand", "Collection_Name", "S.No.", "Item No.", "Article",
    "DESIGN REPEAT cm", "WIDTH m", "LENGHT m",
    "Repeat_1_Value", "Repeat_1_Type", "Repeat_2_Value", "Repeat_2_Type"
]


def parse_design_repeat(design_repeat_str):
    """
    Parse 'DESIGN REPEAT cm' field like '53 offset' or '64 straight'
    Returns: (value, type) e.g., ('53', 'Offset')
    """
    if not design_repeat_str or design_repeat_str.strip() == '':
        return '', ''

    # Clean and split
    parts = design_repeat_str.strip().lower().split()
    if len(parts) >= 2:
        value = parts[0]
        repeat_type = parts[1].capitalize()  # 'offset' -> 'Offset'
        return value, repeat_type
    elif len(parts) == 1:
        # Just a number
        return parts[0], ''
    return '', ''


def standardize_csv(filename, collection_name):
    """Standardize a single CSV file"""
    input_path = os.path.join(TECHNICAL_SHEETS_DIR, filename)
    output_path = os.path.join(OUTPUT_DIR, f"{collection_name}_standardized.csv")

    print(f"\nProcessing: {filename}")
    print(f"Collection: {collection_name}")

    with open(input_path, 'r', encoding='utf-8-sig') as infile:
        reader = csv.DictReader(infile)
        rows = list(reader)

        print(f"  Input columns: {reader.fieldnames}")
        print(f"  Input rows: {len(rows)}")

        standardized_rows = []

        for row in rows:
            # Create standardized row
            std_row = {col: '' for col in OUTPUT_COLUMNS}

            # Always add Brand and Collection
            std_row['Brand'] = BRAND
            std_row['Collection_Name'] = collection_name

            # Handle different CSV formats
            # S.No. (with variations)
            s_no = row.get('S.No.') or row.get('S. No.') or row.get('S. NO.') or row.get('﻿S.No.') or ''
            std_row['S.No.'] = s_no.strip()

            # Item No. (with variations)
            item_no = row.get('Item No.') or row.get('Item No. ') or row.get('ART.') or row.get('﻿ART.') or s_no
            std_row['Item No.'] = item_no.strip()

            # Article (use Item No. as fallback)
            article = row.get('ART.') or row.get('﻿ART.') or std_row['Item No.']
            std_row['Article'] = article.strip()

            # Dimensions
            std_row['WIDTH m'] = row.get('WIDTH m', '').strip()
            std_row['LENGHT m'] = row.get('LENGHT m', '').strip()

            # Handle DESIGN REPEAT cm (if exists)
            design_repeat = row.get('DESIGN REPEAT cm', '').strip()
            if design_repeat:
                value, repeat_type = parse_design_repeat(design_repeat)
                std_row['DESIGN REPEAT cm'] = design_repeat
                std_row['Repeat_1_Value'] = value
                std_row['Repeat_1_Type'] = repeat_type
                # For offset patterns, also populate Repeat_2
                if repeat_type.lower() == 'offset':
                    std_row['Repeat_2_Value'] = value
                    std_row['Repeat_2_Type'] = repeat_type

            # Handle pre-parsed repeat values (CVLTO, Thema format)
            repeat_2_val = row.get('Repeat_2_Value', '').strip()
            repeat_2_type = row.get('Repeat_2_Type', '').strip()
            if repeat_2_val:
                std_row['Repeat_2_Value'] = repeat_2_val
                std_row['Repeat_2_Type'] = repeat_2_type
                # Also populate Repeat_1 if not already set
                if not std_row['Repeat_1_Value']:
                    std_row['Repeat_1_Value'] = repeat_2_val
                    std_row['Repeat_1_Type'] = repeat_2_type
                # Reconstruct DESIGN REPEAT cm if missing
                if not std_row['DESIGN REPEAT cm'] and repeat_2_val and repeat_2_type:
                    std_row['DESIGN REPEAT cm'] = f"{repeat_2_val} {repeat_2_type.lower()}"

            standardized_rows.append(std_row)

        # Write output
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        with open(output_path, 'w', newline='', encoding='utf-8') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=OUTPUT_COLUMNS)
            writer.writeheader()
            writer.writerows(standardized_rows)

        print(f"  Output: {output_path}")
        print(f"  Output rows: {len(standardized_rows)}")


def main():
    print("=" * 60)
    print("STANDARDIZING NEW COLLECTION CSVs")
    print("=" * 60)

    for filename, collection_name in COLLECTIONS:
        try:
            standardize_csv(filename, collection_name)
        except Exception as e:
            print(f"  ERROR: {e}")

    print("\n" + "=" * 60)
    print("DONE!")
    print("=" * 60)
    print(f"\nStandardized CSVs saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
