"""
Migration: Add missing security columns to scan_results table.
Run once with: python migrate_db.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'docshield_dev.db')

if not os.path.exists(DB_PATH):
    alt = os.path.join(os.path.dirname(__file__), 'docshield_dev.db')
    if os.path.exists(alt):
        DB_PATH = alt
    else:
        print(f"ERROR: Cannot find database at {DB_PATH} or {alt}")
        print("Looking for .db files...")
        for root, dirs, files in os.walk(os.path.dirname(__file__)):
            for f in files:
                if f.endswith('.db'):
                    print("  Found:", os.path.join(root, f))
        exit(1)

print(f"Migrating database: {DB_PATH}")
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Get current columns
cur.execute("PRAGMA table_info(scan_results)")
existing_cols = {row[1] for row in cur.fetchall()}
print("Existing columns:", sorted(existing_cols))

added = []
migrations = [
    ("owner_session_id", "TEXT"),
    ("thumbnail_base64", "TEXT"),
    ("layer_results", "TEXT"),
    ("analysis_time_ms", "REAL DEFAULT 0.0"),
]

for col_name, col_type in migrations:
    if col_name not in existing_cols:
        sql = f"ALTER TABLE scan_results ADD COLUMN {col_name} {col_type}"
        print(f"Adding column: {sql}")
        cur.execute(sql)
        added.append(col_name)

if added:
    conn.commit()
    print(f"\n✅ Migration complete. Added {len(added)} column(s): {added}")
else:
    print("\n✅ No migration needed — all columns already exist.")

# Verify
cur.execute("PRAGMA table_info(scan_results)")
final_cols = {row[1] for row in cur.fetchall()}
print("Final columns:", sorted(final_cols))

conn.close()
