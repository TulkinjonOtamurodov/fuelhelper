import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend_main import app, validate_configuration


class BackendApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        root = Path(self.temp_dir.name)
        self.db_path = root / "fuelhelper.db"
        self.seed_path = root / "seed.json"
        self.seed_path.write_text(json.dumps([
            {"unit_number": "152", "driver": "Fernando", "fuel_status": "Arranged"}
        ]), encoding="utf-8")
        self.api_key = "a" * 64
        self.environment = patch.dict(os.environ, {
            "FUEL_API_KEY": self.api_key,
            "FUEL_DB_PATH": str(self.db_path),
            "FUEL_SEED_PATH": str(self.seed_path),
        })
        self.environment.start()

    def tearDown(self):
        self.environment.stop()
        self.temp_dir.cleanup()

    def auth(self, token=None):
        return {"Authorization": f"Bearer {token or self.api_key}"}

    def test_configuration_rejects_a_missing_or_short_api_key(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(RuntimeError):
                validate_configuration()
        with patch.dict(os.environ, {"FUEL_API_KEY": "short"}, clear=True):
            with self.assertRaises(RuntimeError):
                validate_configuration()

    def test_health_is_public_but_units_require_the_bearer_key(self):
        with TestClient(app) as client:
            self.assertEqual(client.get("/api/health").json(), {"status": "ok"})
            self.assertEqual(client.get("/api/units").status_code, 401)
            self.assertEqual(client.get("/api/units", headers=self.auth("wrong")).status_code, 401)
            response = client.get("/api/units", headers=self.auth())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["unit_number"], "152")

    def test_create_rejects_invalid_status_and_duplicate_units(self):
        with TestClient(app) as client:
            invalid = client.post("/api/units", headers=self.auth(), json={
                "unit_number": "200",
                "driver": "Driver",
                "fuel_status": "Maybe",
            })
            duplicate = client.post("/api/units", headers=self.auth(), json={
                "unit_number": "152",
                "driver": "Duplicate",
                "fuel_status": "Arranged",
            })

        self.assertEqual(invalid.status_code, 422)
        self.assertEqual(duplicate.status_code, 409)

    def test_patch_validates_input_and_updates_a_known_unit(self):
        with TestClient(app) as client:
            empty = client.patch("/api/units/152", headers=self.auth(), json={})
            null_only = client.patch("/api/units/152", headers=self.auth(), json={"notes": None})
            missing = client.patch("/api/units/404", headers=self.auth(), json={"fuel_status": "Arranged"})
            updated = client.patch("/api/units/152", headers=self.auth(), json={
                "fuel_status": "Need to arrange",
                "notes": "Makima follow-up",
            })

        self.assertEqual(empty.status_code, 422)
        self.assertEqual(null_only.status_code, 422)
        self.assertEqual(missing.status_code, 404)
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["fuel_status"], "Need to arrange")
        self.assertEqual(updated.json()["notes"], "Makima follow-up")


if __name__ == "__main__":
    unittest.main()
