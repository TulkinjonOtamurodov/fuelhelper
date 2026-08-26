import json
import tempfile
import unittest
from pathlib import Path

from backend_store import (
    DuplicateUnitError,
    UnitNotFoundError,
    create_unit,
    get_unit,
    initialize_database,
    list_units,
    update_unit,
)


class BackendStoreTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        root = Path(self.temp_dir.name)
        self.db_path = root / "fuelhelper.db"
        self.seed_path = root / "seed.json"
        self.seed_path.write_text(json.dumps([
            {
                "unit_number": "152",
                "driver": "Fernando Vallejos Rivas",
                "fuel_status": "Arranged",
            }
        ]), encoding="utf-8")

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_initialize_seeds_a_genuinely_empty_database(self):
        initialize_database(self.db_path, self.seed_path)

        units = list_units(self.db_path)

        self.assertEqual(len(units), 1)
        self.assertEqual(units[0]["unit_number"], "152")
        self.assertEqual(units[0]["fuel_status"], "Arranged")

    def test_initialize_never_replaces_existing_rows(self):
        initialize_database(self.db_path, self.seed_path)
        update_unit(self.db_path, "152", {"fuel_status": "Need to arrange"})
        self.seed_path.write_text(json.dumps([
            {"unit_number": "999", "driver": "Replacement", "fuel_status": "Arranged"}
        ]), encoding="utf-8")

        initialize_database(self.db_path, self.seed_path)

        self.assertEqual([unit["unit_number"] for unit in list_units(self.db_path)], ["152"])
        self.assertEqual(get_unit(self.db_path, "152")["fuel_status"], "Need to arrange")

    def test_create_rejects_a_duplicate_unit_number(self):
        initialize_database(self.db_path, self.seed_path)

        with self.assertRaises(DuplicateUnitError):
            create_unit(self.db_path, {"unit_number": "152", "driver": "Duplicate"})

    def test_partial_update_changes_only_requested_fields(self):
        initialize_database(self.db_path, self.seed_path)

        updated = update_unit(self.db_path, "152", {"notes": "Fuel card confirmed"})

        self.assertEqual(updated["notes"], "Fuel card confirmed")
        self.assertEqual(updated["driver"], "Fernando Vallejos Rivas")
        self.assertEqual(updated["fuel_status"], "Arranged")

    def test_update_rejects_an_unknown_unit(self):
        initialize_database(self.db_path, self.seed_path)

        with self.assertRaises(UnitNotFoundError):
            update_unit(self.db_path, "404", {"fuel_status": "Arranged"})


if __name__ == "__main__":
    unittest.main()
