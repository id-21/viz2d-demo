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
INPUT_CSV = SCRIPT_DIR / "scale_details_csv" / "CristianaMasi_with_scale.csv"
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


def find_image_in_texture_folder(collection_name: str, item_no: str) -> Path:
    """
    Look for an image file in the texture folder.
    Returns the path if found, None otherwise.
    """
    # Try exact collection name match
    collection_path = TEXTURE_BASE_PATH / collection_name
    if collection_path.exists():
        for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
            image_path = collection_path / f"{item_no}{ext}"
            if image_path.exists():
                return image_path

    # Try case-insensitive collection name match
    for folder in TEXTURE_BASE_PATH.iterdir():
        if folder.is_dir() and folder.name.lower() == collection_name.lower():
            for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
                image_path = folder / f"{item_no}{ext}"
                if image_path.exists():
                    return image_path

    return None


def main():
    print(f"Loading JSON from: {INPUT_JSON}")
    print(f"Loading CSV from: {INPUT_CSV}")
    print(f"Texture folder: {TEXTURE_BASE_PATH}")
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
    from_json_count = 0
    from_folder_count = 0
    skipped_count = 0

    for row in csv_rows:
        item_no = row['Item No.']
        collection_name = row['Collection_Name']

        # Skip duplicates (CSV has some duplicate rows)
        if item_no in seen_names:
            continue
        seen_names.add(item_no)

        # Try to get base entry from JSON first
        if item_no in json_by_name:
            base_entry = json_by_name[item_no]
            new_entry = {
                'id': None,  # Will be reassigned
                'name': base_entry['name'],
                'filename': base_entry['filename'],
                'localPath': base_entry['localPath'],
                'cloudUrl': base_entry['cloudUrl'],
                'placeholder': base_entry['placeholder'],
            }
            from_json_count += 1
        else:
            # Check if image exists in texture folder
            image_path = find_image_in_texture_folder(collection_name, item_no)
            if image_path:
                # Create new entry from texture folder
                filename = image_path.name
                # Use the actual folder name from the found path for consistency
                actual_collection = image_path.parent.name
                local_path = f"/local-textures/{actual_collection}/{filename}"

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

        # Add scale if present in CSV
        scale_str = row.get('scale', '').strip()
        if scale_str:
            try:
                new_entry['scale'] = float(scale_str)
            except ValueError:
                pass  # Skip invalid scale values
        else:
            # Try to calculate scale if we have image path and WIDTH m
            width_m_str = row.get('WIDTH m', '').strip()
            if width_m_str and 'localPath' in new_entry:
                try:
                    width_m = float(width_m_str)
                    # Get actual image path
                    if item_no in json_by_name:
                        # For JSON entries, construct path from localPath
                        local_path = new_entry['localPath']
                        if local_path.startswith('/local-textures/'):
                            rel_path = local_path.replace('/local-textures/', '')
                            actual_path = TEXTURE_BASE_PATH / rel_path
                    else:
                        actual_path = find_image_in_texture_folder(collection_name, item_no)

                    if actual_path and actual_path.exists():
                        width_px, height_px = get_image_dimensions(actual_path)
                        if width_px and height_px:
                            scale = calculate_scale(width_px, height_px, width_m)
                            if scale:
                                new_entry['scale'] = scale
                except (ValueError, TypeError):
                    pass

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
    print(f"  - From existing JSON: {from_json_count}")
    print(f"  - From texture folder: {from_folder_count}")
    print(f"  - Skipped (not found): {skipped_count}")

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
