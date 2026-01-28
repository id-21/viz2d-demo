#!/usr/bin/env python3
"""
Process all new collections: add image paths, calculate scales, and combine.
"""

import csv
import json
import os
import subprocess
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
NEW_COLLECTIONS_DIR = SCRIPT_DIR / "new_collections"
TEXTURE_BASE_PATH = Path("/Users/ishan-aiworkspace/Documents/Daga PDF All Design Assets/TexturesForViz2D/Texture File")
TEXTURE_JSON_PATH = SCRIPT_DIR.parent.parent.parent / "src" / "lib" / "textureAssets.json"
OUTPUT_CSV = SCRIPT_DIR / "new_collections" / "ALL_new_collections_with_scale.csv"

# Collections to process
COLLECTIONS = [
    "CasaMood",
    "CVLTO",
    "Flora",
    "Friends & Coffee 2",
    "MondoBaby",
    "Thema",
]


def load_texture_assets():
    """Load textureAssets.json and create lookup dict."""
    with open(TEXTURE_JSON_PATH, 'r', encoding='utf-8') as f:
        assets = json.load(f)

    path_lookup = {}
    for asset in assets:
        name = asset.get('name', '')
        local_path = asset.get('localPath', '')
        if name and local_path:
            path_lookup[name] = local_path

    print(f"Loaded {len(path_lookup)} texture assets from JSON")
    return path_lookup


def get_image_dimensions(image_path: str):
    """Get image dimensions using macOS sips command."""
    try:
        result = subprocess.run(
            ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(image_path)],
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode != 0:
            return None

        output = result.stdout
        width = height = None

        for line in output.split('\n'):
            if 'pixelWidth' in line:
                width = int(line.split(':')[1].strip())
            elif 'pixelHeight' in line:
                height = int(line.split(':')[1].strip())

        if width and height:
            return (width, height)
        return None

    except Exception:
        return None


def local_path_to_fs_path(local_path: str) -> Path:
    """Convert /local-textures/... path to filesystem path."""
    if not local_path or not local_path.startswith('/local-textures/'):
        return None
    relative_path = local_path.replace('/local-textures/', '')
    return TEXTURE_BASE_PATH / relative_path


def calculate_scale(width_pixels: int, height_pixels: int, width_meters: float) -> float:
    """Calculate scale (height in meters) from pixel dimensions."""
    if width_meters <= 0:
        return 0.0
    pixel_ratio = width_pixels / width_meters
    scale = height_pixels / pixel_ratio
    return round(scale, 2)


def find_texture_file(collection_name: str, item_no: str):
    """Find texture file in the collection folder."""
    collection_folder = TEXTURE_BASE_PATH / collection_name

    if not collection_folder.exists():
        return None

    # Try different filename patterns
    patterns = [
        f"{item_no}.jpg",
        f"{item_no}.JPG",
        f"{item_no}.png",
        f"{item_no}.PNG",
    ]

    for pattern in patterns:
        file_path = collection_folder / pattern
        if file_path.exists():
            return file_path

    return None


def process_collection(collection_name: str, path_lookup: dict):
    """Process a single collection: add image paths and calculate scales."""
    input_csv = NEW_COLLECTIONS_DIR / f"{collection_name}_standardized.csv"

    print(f"\n{'='*60}")
    print(f"Processing: {collection_name}")
    print(f"{'='*60}")

    if not input_csv.exists():
        print(f"  ERROR: {input_csv} not found")
        return []

    processed_rows = []
    stats = {
        'total': 0,
        'matched': 0,
        'dimensions': 0,
        'scale_calculated': 0,
        'scales': []
    }

    with open(input_csv, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            stats['total'] += 1

            # Initialize new fields
            row['imagePath'] = ''
            row['pixelWidth'] = ''
            row['pixelHeight'] = ''
            row['scale'] = ''

            # Get Item No.
            item_no = row.get('Item No.', '').strip()
            if not item_no:
                processed_rows.append(row)
                continue

            # Try to normalize item number
            try:
                item_no = str(int(float(item_no)))
            except (ValueError, TypeError):
                pass

            # Find texture file in collection folder
            fs_path = find_texture_file(collection_name, item_no)

            if fs_path:
                # Create localPath
                relative_path = fs_path.relative_to(TEXTURE_BASE_PATH)
                local_path = f"/local-textures/{relative_path}"
                row['imagePath'] = local_path
                stats['matched'] += 1

                # Get dimensions
                dimensions = get_image_dimensions(fs_path)

                if dimensions:
                    width_px, height_px = dimensions
                    row['pixelWidth'] = str(width_px)
                    row['pixelHeight'] = str(height_px)
                    stats['dimensions'] += 1

                    # Calculate scale
                    width_m_str = row.get('WIDTH m', '').strip()
                    try:
                        width_m = float(width_m_str)
                        scale = calculate_scale(width_px, height_px, width_m)
                        row['scale'] = str(scale)
                        stats['scale_calculated'] += 1
                        stats['scales'].append(scale)
                    except (ValueError, TypeError):
                        pass

            processed_rows.append(row)

    # Print stats
    print(f"  Total rows: {stats['total']}")
    print(f"  Matched files: {stats['matched']}")
    print(f"  Dimensions found: {stats['dimensions']}")
    print(f"  Scale calculated: {stats['scale_calculated']}")

    if stats['scales']:
        print(f"  Scale range: {min(stats['scales']):.2f} - {max(stats['scales']):.2f}")

    return processed_rows


def main():
    print("="*60)
    print("PROCESSING NEW COLLECTIONS")
    print("="*60)

    # Load texture assets lookup
    path_lookup = load_texture_assets()

    # Process each collection
    all_rows = []
    for collection in COLLECTIONS:
        rows = process_collection(collection, path_lookup)
        all_rows.extend(rows)

    # Write combined output
    if all_rows:
        fieldnames = all_rows[0].keys()
        with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_rows)

        print(f"\n{'='*60}")
        print("SUMMARY")
        print(f"{'='*60}")
        print(f"Total rows processed: {len(all_rows)}")
        print(f"Output: {OUTPUT_CSV}")
    else:
        print("\nNo rows to write!")


if __name__ == "__main__":
    main()
