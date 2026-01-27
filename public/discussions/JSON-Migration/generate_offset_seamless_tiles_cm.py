#!/usr/bin/env python3
"""
Generate seamless tiles for OFFSET (half-drop) wallpaper patterns.

For offset/half-drop patterns, the seamless tile is created by:
1. Placing the original image on the left
2. Placing a vertically-shifted copy on the right (shifted by half the height)

The result is a tile that is 2x the original width and same height.
Output files are saved with _seamless suffix in the same folder as originals.
"""

import csv
import os
from pathlib import Path
from PIL import Image

# Paths
SCRIPT_DIR = Path(__file__).parent
CSV_PATH = SCRIPT_DIR / "scale_details_csv" / "CristianaMasi_with_scale.csv"
TEXTURE_BASE_PATH = Path("/Users/ishan-aiworkspace/Documents/Daga PDF All Design Assets/TexturesForViz2D/Texture File")


def get_offset_patterns():
    """Get all patterns with offset repeat type from the CSV."""
    offset_patterns = []

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        seen = set()  # Track duplicates

        for row in reader:
            item_no = row.get('Item No.', '').strip()

            # Skip duplicates
            if item_no in seen:
                continue
            seen.add(item_no)

            repeat_type = row.get('Repeat_1_Type', '').strip()
            repeat_2_type = row.get('Repeat_2_Type', '').strip()

            # Check if this is an offset pattern
            if repeat_type.lower() == 'offset' or repeat_2_type.lower() == 'offset':
                collection = row.get('Collection_Name', '').strip()
                offset_patterns.append({
                    'item_no': item_no,
                    'collection': collection,
                    'article': row.get('Article', '').strip(),
                    'width_m': row.get('WIDTH m', '').strip(),
                    'scale': row.get('scale', '').strip(),
                })

    return offset_patterns


def find_image(collection: str, item_no: str) -> Path:
    """Find the original image file in the texture folder."""
    # Try exact collection name match
    collection_path = TEXTURE_BASE_PATH / collection
    if collection_path.exists():
        for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
            image_path = collection_path / f"{item_no}{ext}"
            if image_path.exists():
                return image_path

    # Try case-insensitive collection name match
    for folder in TEXTURE_BASE_PATH.iterdir():
        if folder.is_dir() and folder.name.lower() == collection.lower():
            for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
                image_path = folder / f"{item_no}{ext}"
                if image_path.exists():
                    return image_path

    return None


def create_offset_seamless_tile(image_path: Path, output_path: Path):
    """
    Create a seamless tile for an offset/half-drop pattern.

    The tile is 2x width, same height:
    - Left half: original image
    - Right half: image shifted vertically by half its height
    """
    with Image.open(image_path) as img:
        width, height = img.size
        offset = height // 2  # Half-drop offset

        # Create new canvas (2x width, same height)
        tile = Image.new(img.mode, (width * 2, height))

        # Place original on the left
        tile.paste(img, (0, 0))

        # Create shifted version for the right side
        # Bottom half of original goes to top-right
        bottom_half = img.crop((0, offset, width, height))
        tile.paste(bottom_half, (width, 0))

        # Top half of original goes to bottom-right
        top_half = img.crop((0, 0, width, offset))
        tile.paste(top_half, (width, offset))

        # Save the tile (same format as original)
        if output_path.suffix.lower() in ['.jpg', '.jpeg']:
            tile.save(output_path, quality=95)
        else:
            tile.save(output_path)

        return width * 2, height


def main():
    print("=" * 70)
    print("Creating Seamless Tiles for Offset Patterns (Cristiana Masi)")
    print("=" * 70)

    print(f"\nCSV: {CSV_PATH}")
    print(f"Texture folder: {TEXTURE_BASE_PATH}")

    # Get offset patterns
    print("\n[1] Reading offset patterns from CSV...")
    offset_patterns = get_offset_patterns()
    print(f"    Found {len(offset_patterns)} offset patterns")

    # Process each pattern
    print("\n[2] Creating seamless tiles...")

    success_count = 0
    skipped_count = 0
    error_count = 0
    errors = []

    for i, pattern in enumerate(offset_patterns, 1):
        item_no = pattern['item_no']
        collection = pattern['collection']

        # Find original image
        image_path = find_image(collection, item_no)

        if not image_path:
            skipped_count += 1
            if i <= 5:
                print(f"    [{i}/{len(offset_patterns)}] {item_no}: SKIPPED - image not found")
            continue

        # Output path (same folder, _seamless suffix)
        output_filename = f"{item_no}_seamless{image_path.suffix}"
        output_path = image_path.parent / output_filename

        # Skip if already exists
        if output_path.exists():
            success_count += 1
            if i <= 3:
                print(f"    [{i}/{len(offset_patterns)}] {item_no}: EXISTS - {output_filename}")
            continue

        try:
            new_width, new_height = create_offset_seamless_tile(image_path, output_path)
            success_count += 1

            if i <= 5 or i % 20 == 0:
                orig_size = image_path.stat().st_size / 1024
                new_size = output_path.stat().st_size / 1024
                print(f"    [{i}/{len(offset_patterns)}] {item_no}: {image_path.stem} -> {output_filename} ({new_width}x{new_height}, {new_size:.0f}KB)")

        except Exception as e:
            error_count += 1
            errors.append((item_no, str(e)))
            print(f"    [{i}/{len(offset_patterns)}] {item_no}: ERROR - {e}")

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"  Total offset patterns: {len(offset_patterns)}")
    print(f"  Successfully created:  {success_count}")
    print(f"  Skipped (no image):    {skipped_count}")
    print(f"  Errors:                {error_count}")

    if errors:
        print(f"\n  Errors:")
        for item_no, err in errors[:10]:
            print(f"    - {item_no}: {err}")
        if len(errors) > 10:
            print(f"    ... and {len(errors) - 10} more")

    # List collections with offset patterns
    collections = {}
    for p in offset_patterns:
        coll = p['collection']
        collections[coll] = collections.get(coll, 0) + 1

    print(f"\n  Offset patterns by collection:")
    for coll, count in sorted(collections.items()):
        print(f"    - {coll}: {count}")


if __name__ == "__main__":
    main()
