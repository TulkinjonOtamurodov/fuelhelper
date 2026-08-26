import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path


class DuplicateUnitError(ValueError):
    pass


class UnitNotFoundError(LookupError):
    pass


UNIT_FIELDS = (
    "unit_number",
    "driver",
    "notes",
    "ownership",
    "status",
    "fuel_status",
    "tolls",
    "toll_status",
    "check_in_time",
    "created_at",
    "updated_at",
)

EDITABLE_FIELDS = set(UNIT_FIELDS) - {"unit_number", "created_at", "updated_at"}

COLUMN_DEFINITIONS = {
    "driver": "TEXT NOT NULL DEFAULT ''",
    "notes": "TEXT NOT NULL DEFAULT ''",
    "ownership": "TEXT NOT NULL DEFAULT ''",
    "status": "TEXT NOT NULL DEFAULT ''",
    "fuel_status": "TEXT NOT NULL DEFAULT 'Need to check'",
    "tolls": "TEXT NOT NULL DEFAULT ''",
    "toll_status": "TEXT NOT NULL DEFAULT 'Need review'",
    "check_in_time": "TEXT NOT NULL DEFAULT ''",
    "created_at": "TEXT NOT NULL DEFAULT ''",
    "updated_at": "TEXT NOT NULL DEFAULT ''",
}


def _utc_now():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@contextmanager
def _connect(db_path):
    connection = sqlite3.connect(str(db_path))
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def _row_to_dict(row):
    return {field: row[field] for field in UNIT_FIELDS}


def initialize_database(db_path, seed_path=None):
    db_path = Path(db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with _connect(db_path) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS units (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unit_number TEXT NOT NULL,
                driver TEXT NOT NULL DEFAULT '',
                notes TEXT NOT NULL DEFAULT '',
                ownership TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT '',
                fuel_status TEXT NOT NULL DEFAULT 'Need to check',
                tolls TEXT NOT NULL DEFAULT '',
                toll_status TEXT NOT NULL DEFAULT 'Need review',
                check_in_time TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL DEFAULT ''
            )
            """
        )
        existing_columns = {row["name"] for row in connection.execute("PRAGMA table_info(units)")}
        if "unit_number" not in existing_columns:
            raise RuntimeError("Existing units table has no unit_number column")
        for name, definition in COLUMN_DEFINITIONS.items():
            if name not in existing_columns:
                connection.execute(f"ALTER TABLE units ADD COLUMN {name} {definition}")
        connection.execute("CREATE UNIQUE INDEX IF NOT EXISTS units_unit_number_unique ON units(unit_number)")

        count = connection.execute("SELECT COUNT(*) FROM units").fetchone()[0]
        if count == 0 and seed_path and Path(seed_path).is_file():
            seed_units = json.loads(Path(seed_path).read_text(encoding="utf-8"))
            for unit in seed_units:
                _insert_unit(connection, unit)


def _insert_unit(connection, unit):
    unit_number = str(unit.get("unit_number", "")).strip()
    if not unit_number:
        raise ValueError("unit_number is required")
    now = _utc_now()
    values = {
        "unit_number": unit_number,
        "driver": unit.get("driver", ""),
        "notes": unit.get("notes", ""),
        "ownership": unit.get("ownership", ""),
        "status": unit.get("status", ""),
        "fuel_status": unit.get("fuel_status", "Need to check"),
        "tolls": unit.get("tolls", ""),
        "toll_status": unit.get("toll_status", "Need review"),
        "check_in_time": unit.get("check_in_time", ""),
        "created_at": unit.get("created_at") or now,
        "updated_at": unit.get("updated_at") or now,
    }
    placeholders = ", ".join("?" for _ in UNIT_FIELDS)
    columns = ", ".join(UNIT_FIELDS)
    connection.execute(
        f"INSERT INTO units ({columns}) VALUES ({placeholders})",
        [values[field] for field in UNIT_FIELDS],
    )


def list_units(db_path):
    with _connect(db_path) as connection:
        rows = connection.execute(
            f"SELECT {', '.join(UNIT_FIELDS)} FROM units ORDER BY unit_number COLLATE NOCASE"
        ).fetchall()
    return [_row_to_dict(row) for row in rows]


def get_unit(db_path, unit_number):
    with _connect(db_path) as connection:
        row = connection.execute(
            f"SELECT {', '.join(UNIT_FIELDS)} FROM units WHERE unit_number = ?",
            (str(unit_number),),
        ).fetchone()
    return _row_to_dict(row) if row else None


def create_unit(db_path, unit):
    try:
        with _connect(db_path) as connection:
            _insert_unit(connection, unit)
    except sqlite3.IntegrityError as error:
        raise DuplicateUnitError(f"Unit {unit.get('unit_number', '')} already exists") from error
    return get_unit(db_path, unit["unit_number"])


def update_unit(db_path, unit_number, changes):
    invalid_fields = set(changes) - EDITABLE_FIELDS
    if invalid_fields:
        raise ValueError(f"Unsupported unit fields: {', '.join(sorted(invalid_fields))}")
    if not changes:
        raise ValueError("At least one field is required")

    values = {**changes, "updated_at": _utc_now()}
    assignments = ", ".join(f"{field} = ?" for field in values)
    with _connect(db_path) as connection:
        cursor = connection.execute(
            f"UPDATE units SET {assignments} WHERE unit_number = ?",
            [*values.values(), str(unit_number)],
        )
        if cursor.rowcount == 0:
            raise UnitNotFoundError(f"Unit {unit_number} was not found")
    return get_unit(db_path, unit_number)
