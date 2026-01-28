#!/usr/bin/env python3
"""
Generate textureAssets_v2.json with enriched data from CSV.

Includes entries that have matching data in:
- src/lib/textureAssets.json (for base fields: id, name, filename, localPath, cloudUrl, placeholder)
- OR the texture folder (for images not yet in JSON)
- AND CristianaMasi_with_scale.csv (for enriched fields: brand, collection, sku, manufacturer_sku, scale)
"""

import json
import csv
import base64
import subprocess
from pathlib import Path
from io import BytesIO

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent
INPUT_JSON = PROJECT_ROOT / "src" / "lib" / "textureAssets.json"
INPUT_CSV_ORIGINAL = SCRIPT_DIR / "scale_details_csv" / "CristianaMasi_with_scale.csv"
INPUT_CSV_NEW = SCRIPT_DIR / "new_collections" / "ALL_new_collections_with_scale.csv"
OUTPUT_JSON = PROJECT_ROOT / "src" / "lib" / "textureAssets_v2.json"

# Texture folder path (where all collection images are stored)
TEXTURE_BASE_PATH = Path("/Users/ishan-aiworkspace/Documents/Daga PDF All Design Assets/TexturesForViz2D/Texture File")


def generate_placeholder(image_path: Path, size: int = 200) -> str:
    """
    Generate a base64 placeholder thumbnail for an image.
    Uses PIL if available, otherwise returns empty string.
    """
    try:
        from PIL import Image

        with Image.open(image_path) as img:
            # Calculate thumbnail size maintaining aspect ratio
            img.thumbnail((size, size), Image.Resampling.LANCZOS)

            # Convert to RGB if necessary (for PNG with transparency)
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')

            # Save to bytes
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=60)
            buffer.seek(0)

            # Encode to base64
            b64_data = base64.b64encode(buffer.read()).decode('utf-8')
            return f"data:image/jpeg;base64,{b64_data}"
    except ImportError:
        print("  Warning: PIL not available, skipping placeholder generation")
        return ""
    except Exception as e:
        print(f"  Warning: Could not generate placeholder for {image_path}: {e}")
        return ""


def get_image_dimensions(image_path: Path) -> tuple:
    """
    Get image dimensions using sips (macOS) or PIL.
    Returns (width, height) or (None, None) on failure.
    """
    try:
        # Try sips first (faster on macOS)
        result = subprocess.run(
            ['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(image_path)],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            width = None
            height = None
            for line in lines:
                if 'pixelWidth' in line:
                    width = int(line.split(':')[1].strip())
                elif 'pixelHeight' in line:
                    height = int(line.split(':')[1].strip())
            if width and height:
                return (width, height)
    except Exception:
        pass

    # Fallback to PIL
    try:
        from PIL import Image
        with Image.open(image_path) as img:
            return img.size
    except Exception:
        pass

    return (None, None)


def calculate_scale(width_pixels: int, height_pixels: int, width_m: float) -> float:
    """
    Calculate scale from image dimensions and physical width.
    scale = height_pixels / (width_pixels / width_m)
    """
    if not width_pixels or not height_pixels or not width_m:
        return None
    pixel_ratio = width_pixels / width_m
    return round(height_pixels / pixel_ratio, 2)


def find_image_in_texture_folder(collection_name: str, item_no: str, prefer_seamless: bool = False) -> Path:
    """
    Look for an image file in the texture folder.
    Returns the path if found, None otherwise.

    If prefer_seamless is True, look for {item_no}_seamless.ext first (for offset patterns).
    """
    # Build list of filenames to try
    if prefer_seamless:
        # For offset patterns, try seamless version first
        base_names = [f"{item_no}_seamless", item_no]
    else:
        base_names = [item_no]

    # Try exact collection name match
    collection_path = TEXTURE_BASE_PATH / collection_name
    if collection_path.exists():
        for base_name in base_names:
            for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
                image_path = collection_path / f"{base_name}{ext}"
                if image_path.exists():
                    return image_path

    # Try case-insensitive collection name match
    for folder in TEXTURE_BASE_PATH.iterdir():
        if folder.is_dir() and folder.name.lower() == collection_name.lower():
            for base_name in base_names:
                for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
                    image_path = folder / f"{base_name}{ext}"
                    if image_path.exists():
                        return image_path

    return None


def main():
    print(f"Loading JSON from: {INPUT_JSON}")
    print(f"Loading CSV 1 (original): {INPUT_CSV_ORIGINAL}")
    print(f"Loading CSV 2 (new collections): {INPUT_CSV_NEW}")
    print(f"Texture folder: {TEXTURE_BASE_PATH}")
    print(f"Output will be: {OUTPUT_JSON}")
    print("-" * 60)

    # Load existing JSON
    with open(INPUT_JSON, 'r', encoding='utf-8') as f:
        json_data = json.load(f)

    # Create lookup by name
    json_by_name = {entry['name']: entry for entry in json_data}
    print(f"Loaded {len(json_data)} JSON entries")

    # Load original CSV (7 collections)
    csv_rows = []
    with open(INPUT_CSV_ORIGINAL, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        csv_rows = list(reader)
    print(f"Loaded {len(csv_rows)} rows from original CSV")

    # Load new collections CSV (6 collections)
    with open(INPUT_CSV_NEW, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        new_rows = list(reader)
    print(f"Loaded {len(new_rows)} rows from new collections CSV")

    # Combine both CSVs
    csv_rows.extend(new_rows)
    print(f"Total CSV rows: {len(csv_rows)}")

    # Process and merge
    output_entries = []
    seen_names = set()  # Track duplicates
    from_json_count = 0
    from_folder_count = 0
    skipped_count = 0
    offset_count = 0
    seamless_used_count = 0

    for row in csv_rows:
        item_no = row['Item No.']
        collection_name = row['Collection_Name']

        # Skip duplicates (CSV has some duplicate rows)
        if item_no in seen_names:
            continue

        # Determine repeat type (offset or straight)
        repeat_type_raw = row.get('Repeat_1_Type', '').strip().lower()
        repeat_2_type_raw = row.get('Repeat_2_Type', '').strip().lower()
        is_offset = repeat_type_raw == 'offset' or repeat_2_type_raw == 'offset'

        if is_offset:
            offset_count += 1

        # Try to get base entry from JSON first
        if item_no in json_by_name:
            base_entry = json_by_name[item_no]

            # For offset patterns, check if seamless version exists
            if is_offset:
                seamless_path = find_image_in_texture_folder(collection_name, item_no, prefer_seamless=True)
                if seamless_path and '_seamless' in seamless_path.name:
                    # Use seamless version
                    filename = seamless_path.name
                    actual_collection = seamless_path.parent.name
                    local_path = f"/local-textures/{actual_collection}/{filename}"
                    placeholder = generate_placeholder(seamless_path)
                    seamless_used_count += 1
                    print(f"  Using seamless for offset: {item_no} -> {filename}")

                    new_entry = {
                        'id': None,
                        'name': base_entry['name'],
                        'filename': filename,
                        'localPath': local_path,
                        'cloudUrl': base_entry['cloudUrl'],
                        'placeholder': placeholder,
                    }
                else:
                    # No seamless version, use original
                    new_entry = {
                        'id': None,
                        'name': base_entry['name'],
                        'filename': base_entry['filename'],
                        'localPath': base_entry['localPath'],
                        'cloudUrl': base_entry['cloudUrl'],
                        'placeholder': base_entry['placeholder'],
                    }
            else:
                # Straight pattern, use original
                new_entry = {
                    'id': None,
                    'name': base_entry['name'],
                    'filename': base_entry['filename'],
                    'localPath': base_entry['localPath'],
                    'cloudUrl': base_entry['cloudUrl'],
                    'placeholder': base_entry['placeholder'],
                }
            from_json_count += 1
        else:
            # Check if image exists in texture folder (prefer seamless for offset)
            image_path = find_image_in_texture_folder(collection_name, item_no, prefer_seamless=is_offset)
            if image_path:
                # Create new entry from texture folder
                filename = image_path.name
                # Use the actual folder name from the found path for consistency
                actual_collection = image_path.parent.name
                local_path = f"/local-textures/{actual_collection}/{filename}"

                if is_offset and '_seamless' in filename:
                    seamless_used_count += 1
                    print(f"  Found seamless in folder: {item_no} -> {filename}")
                else:
                    print(f"  Found in folder: {item_no} ({actual_collection})")

                # Generate placeholder
                placeholder = generate_placeholder(image_path)

                new_entry = {
                    'id': None,  # Will be reassigned
                    'name': item_no,
                    'filename': filename,
                    'localPath': local_path,
                    'cloudUrl': None,
                    'placeholder': placeholder,
                }
                from_folder_count += 1
            else:
                # Image not found anywhere, skip
                skipped_count += 1
                continue

        # Add enriched fields from CSV
        new_entry['brand'] = row.get('Brand', 'Cristiana Masi')
        new_entry['collection'] = collection_name
        new_entry['sku'] = row['S.No.']
        new_entry['manufacturer_sku'] = row['Article']

        # Add repeatType field
        new_entry['repeatType'] = 'offset' if is_offset else 'straight'

        # Add scale if present in CSV (use pre-calculated value - DO NOT recalculate from doubled image)
        scale_str = row.get('scale', '').strip()
        if scale_str:
            try:
                new_entry['scale'] = float(scale_str)
            except ValueError:
                pass  # Skip invalid scale values
        else:
            # Try to calculate scale from ORIGINAL image dimensions if we have WIDTH m
            # IMPORTANT: For offset patterns, we must use the original image dimensions,
            # not the doubled seamless image dimensions
            width_m_str = row.get('WIDTH m', '').strip()
            if width_m_str and 'localPath' in new_entry:
                try:
                    width_m = float(width_m_str)
                    # Get ORIGINAL image path (not seamless)
                    original_path = find_image_in_texture_folder(collection_name, item_no, prefer_seamless=False)

                    if original_path and original_path.exists():
                        width_px, height_px = get_image_dimensions(original_path)
                        if width_px and height_px:
                            scale = calculate_scale(width_px, height_px, width_m)
                            if scale:
                                new_entry['scale'] = scale
                except (ValueError, TypeError):
                    pass

        output_entries.append(new_entry)
        # Mark as seen only after successfully adding
        seen_names.add(item_no)

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
    print(f"  - From existing JSON: {from_json_count}")
    print(f"  - From texture folder: {from_folder_count}")
    print(f"  - Skipped (not found): {skipped_count}")

    # Count repeat types
    straight_count = sum(1 for e in output_entries if e.get('repeatType') == 'straight')
    offset_in_output = sum(1 for e in output_entries if e.get('repeatType') == 'offset')

    print(f"\nRepeat types:")
    print(f"  - Straight patterns: {straight_count}")
    print(f"  - Offset patterns: {offset_in_output}")
    print(f"  - Offset with seamless image: {seamless_used_count}")

    # Count fields
    with_scale = sum(1 for e in output_entries if 'scale' in e)
    with_brand = sum(1 for e in output_entries if e.get('brand'))
    with_collection = sum(1 for e in output_entries if e.get('collection'))
    with_sku = sum(1 for e in output_entries if e.get('sku'))
    with_manufacturer_sku = sum(1 for e in output_entries if e.get('manufacturer_sku'))
    with_placeholder = sum(1 for e in output_entries if e.get('placeholder'))

    print(f"\nEntries with scale: {with_scale}")
    print(f"Entries with brand: {with_brand}")
    print(f"Entries with collection: {with_collection}")
    print(f"Entries with sku: {with_sku}")
    print(f"Entries with manufacturer_sku: {with_manufacturer_sku}")
    print(f"Entries with placeholder: {with_placeholder}")

    # Show collections breakdown
    collections = {}
    for e in output_entries:
        coll = e.get('collection', 'Unknown')
        collections[coll] = collections.get(coll, 0) + 1

    print("\n" + "-" * 60)
    print("ENTRIES BY COLLECTION:")
    print("-" * 60)
    for coll, count in sorted(collections.items()):
        print(f"  {coll}: {count}")

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
