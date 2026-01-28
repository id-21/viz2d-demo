#!/usr/bin/env python3
"""
Calculate total size of all images referenced in textureAssets.json.
Provides collection-wise summaries.
"""

import json
import os
from pathlib import Path
from collections import defaultdict

# Base path for texture files
TEXTURE_BASE_PATH = "/Users/ishan-aiworkspace/Documents/Daga PDF All Design Assets/TexturesForViz2D/Texture File"

# Input file
TEXTURE_ASSETS_JSON = "/Users/ishan-aiworkspace/Documents/apps/viz2d-demo/src/lib/textureAssets.json"


def local_path_to_fs_path(local_path: str) -> str:
    """Convert /local-textures/... path to filesystem path."""
    if not local_path or not local_path.startswith('/local-textures/'):
        return ""
    relative_path = local_path.replace('/local-textures/', '')
    return os.path.join(TEXTURE_BASE_PATH, relative_path)


def format_size(size_bytes: int) -> str:
    """Format bytes to human-readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"


def main():
    print("=" * 70)
    print("TEXTURE ASSETS SIZE CALCULATOR")
    print("=" * 70)
    print(f"\nReading from: {TEXTURE_ASSETS_JSON}")
    print(f"Texture base path: {TEXTURE_BASE_PATH}")
    print("-" * 70)

    # Load JSON
    with open(TEXTURE_ASSETS_JSON, 'r', encoding='utf-8') as f:
        textures = json.load(f)

    # Stats
    total_textures = len(textures)
    total_size = 0
    files_found = 0
    files_not_found = 0
    files_without_path = 0

    # Collection stats: {collection: {'size': int, 'count': int, 'files': []}}
    collection_stats = defaultdict(lambda: {'size': 0, 'count': 0, 'files': []})

    # Brands stats
    brand_stats = defaultdict(lambda: {'size': 0, 'count': 0})

    print("\nProcessing textures...")

    for texture in textures:
        local_path = texture.get('localPath', '').strip()
        collection = texture.get('collection', 'Unknown')
        brand = texture.get('brand', 'Unknown')

        if not local_path:
            files_without_path += 1
            continue

        # Convert to filesystem path
        fs_path = local_path_to_fs_path(local_path)

        if not fs_path or not os.path.exists(fs_path):
            files_not_found += 1
            print(f"  ✗ File not found: {local_path}")
            continue

        try:
            # Get file size
            file_size = os.path.getsize(fs_path)
            total_size += file_size
            files_found += 1

            # Update collection stats
            collection_stats[collection]['size'] += file_size
            collection_stats[collection]['count'] += 1
            collection_stats[collection]['files'].append({
                'name': texture.get('name', 'Unknown'),
                'size': file_size
            })

            # Update brand stats
            brand_stats[brand]['size'] += file_size
            brand_stats[brand]['count'] += 1

        except Exception as e:
            print(f"  ✗ Error reading {local_path}: {e}")
            files_not_found += 1

    # Print summary
    print("\n" + "=" * 70)
    print("OVERALL SUMMARY")
    print("=" * 70)
    print(f"Total textures in JSON: {total_textures}")
    print(f"Files with localPath: {total_textures - files_without_path}")
    print(f"Files without localPath: {files_without_path}")
    print(f"Files found: {files_found}")
    print(f"Files not found: {files_not_found}")
    print(f"\nTOTAL SIZE: {format_size(total_size)} ({total_size:,} bytes)")

    # Print collection stats
    print("\n" + "=" * 70)
    print("BY COLLECTION")
    print("=" * 70)

    # Sort by size (descending)
    sorted_collections = sorted(
        collection_stats.items(),
        key=lambda x: x[1]['size'],
        reverse=True
    )

    for collection, stats in sorted_collections:
        size_str = format_size(stats['size'])
        percentage = (stats['size'] / total_size * 100) if total_size > 0 else 0
        print(f"\n{collection}:")
        print(f"  Files: {stats['count']}")
        print(f"  Size: {size_str} ({stats['size']:,} bytes)")
        print(f"  Percentage: {percentage:.2f}%")

        # Show largest files in collection
        if stats['files']:
            largest_files = sorted(stats['files'], key=lambda x: x['size'], reverse=True)[:3]
            print(f"  Largest files:")
            for file_info in largest_files:
                print(f"    - {file_info['name']}: {format_size(file_info['size'])}")

    # Print brand stats
    print("\n" + "=" * 70)
    print("BY BRAND")
    print("=" * 70)

    # Sort by size (descending)
    sorted_brands = sorted(
        brand_stats.items(),
        key=lambda x: x[1]['size'],
        reverse=True
    )

    for brand, stats in sorted_brands:
        size_str = format_size(stats['size'])
        percentage = (stats['size'] / total_size * 100) if total_size > 0 else 0
        print(f"\n{brand}:")
        print(f"  Files: {stats['count']}")
        print(f"  Size: {size_str} ({stats['size']:,} bytes)")
        print(f"  Percentage: {percentage:.2f}%")

    print("\n" + "=" * 70)
    print("CALCULATION COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
