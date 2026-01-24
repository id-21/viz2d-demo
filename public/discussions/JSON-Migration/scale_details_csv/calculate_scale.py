#!/usr/bin/env python3
"""
Calculate scale values for texture assets based on image dimensions.

Formula:
  pixel_ratio = image_width_pixels / WIDTH_m
  scale = image_height_pixels / pixel_ratio

This gives us the height of the texture in meters.
"""

import csv
import subprocess
import os
from pathlib import Path

# Base path for texture files
TEXTURE_BASE_PATH = "/Users/ishan-aiworkspace/Documents/Daga PDF All Design Assets/TexturesForViz2D/Texture File"

# Input/output files
INPUT_CSV = "CristianaMasi_with_paths.csv"
OUTPUT_CSV = "CristianaMasi_with_scale.csv"


def get_image_dimensions(image_path: str) -> tuple[int, int] | None:
    """Get image dimensions using macOS sips command."""
    try:
        result = subprocess.run(
            ["sips", "-g", "pixelWidth", "-g", "pixelHeight", image_path],
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

    except Exception as e:
        print(f"  Error getting dimensions for {image_path}: {e}")
        return None


def local_path_to_fs_path(local_path: str) -> str:
    """Convert /local-textures/... path to filesystem path."""
    if not local_path or not local_path.startswith('/local-textures/'):
        return ""
    relative_path = local_path.replace('/local-textures/', '')
    return os.path.join(TEXTURE_BASE_PATH, relative_path)


def calculate_scale(width_pixels: int, height_pixels: int, width_meters: float) -> float:
    """Calculate scale (height in meters) from pixel dimensions and width in meters."""
    if width_meters <= 0:
        return 0.0
    pixel_ratio = width_pixels / width_meters
    scale = height_pixels / pixel_ratio
    return round(scale, 2)


def main():
    script_dir = Path(__file__).parent
    input_path = script_dir / INPUT_CSV
    output_path = script_dir / OUTPUT_CSV

    print(f"Reading from: {input_path}")
    print(f"Writing to: {output_path}")
    print("-" * 60)

    # Stats
    total_rows = 0
    rows_with_path = 0
    rows_with_dimensions = 0
    rows_missing_width_m = 0

    # Collection stats
    collection_stats = {}

    rows_to_write = []

    with open(input_path, 'r', newline='', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames + ['pixelWidth', 'pixelHeight', 'scale']

        for row in reader:
            total_rows += 1
            collection = row.get('Collection_Name', 'Unknown')

            if collection not in collection_stats:
                collection_stats[collection] = {'total': 0, 'calculated': 0, 'scales': []}
            collection_stats[collection]['total'] += 1

            # Initialize new fields
            row['pixelWidth'] = ''
            row['pixelHeight'] = ''
            row['scale'] = ''

            image_path = row.get('imagePath', '').strip()
            width_m_str = row.get('WIDTH m', '').strip()

            if not image_path:
                rows_to_write.append(row)
                continue

            rows_with_path += 1

            # Convert to filesystem path
            fs_path = local_path_to_fs_path(image_path)

            if not fs_path or not os.path.exists(fs_path):
                print(f"  File not found: {fs_path}")
                rows_to_write.append(row)
                continue

            # Get dimensions
            dimensions = get_image_dimensions(fs_path)

            if not dimensions:
                rows_to_write.append(row)
                continue

            rows_with_dimensions += 1
            width_px, height_px = dimensions
            row['pixelWidth'] = str(width_px)
            row['pixelHeight'] = str(height_px)

            # Parse WIDTH m
            try:
                width_m = float(width_m_str)
            except (ValueError, TypeError):
                rows_missing_width_m += 1
                rows_to_write.append(row)
                continue

            # Calculate scale
            scale = calculate_scale(width_px, height_px, width_m)
            row['scale'] = str(scale)

            collection_stats[collection]['calculated'] += 1
            collection_stats[collection]['scales'].append(scale)

            rows_to_write.append(row)

    # Write output
    with open(output_path, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows_to_write)

    # Print summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total rows: {total_rows}")
    print(f"Rows with image path: {rows_with_path}")
    print(f"Rows with dimensions calculated: {rows_with_dimensions}")
    print(f"Rows missing WIDTH m: {rows_missing_width_m}")

    print("\n" + "-" * 60)
    print("BY COLLECTION:")
    print("-" * 60)

    for collection, stats in sorted(collection_stats.items()):
        scales = stats['scales']
        if scales:
            min_s = min(scales)
            max_s = max(scales)
            avg_s = sum(scales) / len(scales)
            print(f"{collection}:")
            print(f"  Total: {stats['total']}, Calculated: {stats['calculated']}")
            print(f"  Scale range: {min_s:.2f} - {max_s:.2f}, Avg: {avg_s:.2f}")
        else:
            print(f"{collection}:")
            print(f"  Total: {stats['total']}, No scales calculated")

    print("\n" + "=" * 60)
    print(f"Output written to: {output_path}")


if __name__ == "__main__":
    main()
