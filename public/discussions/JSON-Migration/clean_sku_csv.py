import csv

input_file = 'CristianaMasi_all_SKUs.csv'
output_file = 'CristianaMasi_all_SKUs_cleaned.csv'

original_count = 0
cleaned_count = 0

with open(input_file, 'r', newline='', encoding='utf-8') as infile:
    reader = csv.DictReader(infile)
    fieldnames = reader.fieldnames

    with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()

        for row in reader:
            original_count += 1
            # Check if both S.No. and Item No. have valid (non-empty) values
            sno = row.get('S.No.', '').strip()
            item_no = row.get('Item No.', '').strip()

            if sno and item_no:
                writer.writerow(row)
                cleaned_count += 1

print(f"Original rows: {original_count}")
print(f"Cleaned rows: {cleaned_count}")
print(f"Removed rows: {original_count - cleaned_count}")
print(f"\nCleaned CSV saved to: {output_file}")
