import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, model_validator

from backend_store import (
    DuplicateUnitError,
    UnitNotFoundError,
    create_unit,
    get_unit,
    initialize_database,
    list_units,
    update_unit,
)


FuelStatus = Literal["Arranged", "Need to arrange", "Need to check"]
TollStatus = Literal["Arranged", "Clear", "Need review"]
ComplianceStatus = Literal["", "Cooperative", "Partially cooperative", "Not following instructions"]


class UnitCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    unit_number: str = Field(min_length=1, max_length=40)
    driver: str = Field(default="", max_length=200)
    notes: str = Field(default="", max_length=4000)
    ownership: str = Field(default="", max_length=100)
    status: ComplianceStatus = ""
    fuel_status: FuelStatus = "Need to check"
    tolls: str = Field(default="", max_length=100)
    toll_status: TollStatus = "Need review"
    check_in_time: str = Field(default="", max_length=100)


class UnitPatch(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    driver: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=4000)
    ownership: str | None = Field(default=None, max_length=100)
    status: ComplianceStatus | None = None
    fuel_status: FuelStatus | None = None
    tolls: str | None = Field(default=None, max_length=100)
    toll_status: TollStatus | None = None
    check_in_time: str | None = Field(default=None, max_length=100)

    @model_validator(mode="after")
    def require_at_least_one_change(self):
        if not self.model_dump(exclude_none=True):
            raise ValueError("At least one field is required")
        return self


def validate_configuration():
    api_key = os.getenv("FUEL_API_KEY", "").strip()
    if len(api_key) < 32:
        raise RuntimeError("FUEL_API_KEY must be configured with at least 32 characters")
    return {
        "api_key": api_key,
        "db_path": Path(os.getenv("FUEL_DB_PATH", "/app/data/fuelhelper.db")),
        "seed_path": Path(os.getenv("FUEL_SEED_PATH", Path(__file__).with_name("seed_units.json"))),
    }


def require_api_key(authorization: Annotated[str | None, Header()] = None):
    expected_key = os.getenv("FUEL_API_KEY", "").strip()
    if len(expected_key) < 32:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="API authentication is not configured")
    scheme, separator, token = (authorization or "").partition(" ")
    if not separator or scheme.lower() != "bearer" or not secrets.compare_digest(token, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Bearer"},
        )


def _db_path():
    return validate_configuration()["db_path"]


@asynccontextmanager
async def lifespan(_app):
    config = validate_configuration()
    initialize_database(config["db_path"], config["seed_path"])
    yield


app = FastAPI(title="FuelHelper API", version="1.0.0", lifespan=lifespan)
protected = [Depends(require_api_key)]


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/units", dependencies=protected)
def read_units():
    return list_units(_db_path())


@app.get("/api/units/{unit_number}", dependencies=protected)
def read_unit(unit_number: str):
    unit = get_unit(_db_path(), unit_number)
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unit {unit_number} was not found")
    return unit


@app.post("/api/units", dependencies=protected, status_code=status.HTTP_201_CREATED)
def add_unit(payload: UnitCreate):
    try:
        return create_unit(_db_path(), payload.model_dump())
    except DuplicateUnitError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@app.patch("/api/units/{unit_number}", dependencies=protected)
def patch_unit(unit_number: str, payload: UnitPatch):
    try:
        return update_unit(_db_path(), unit_number, payload.model_dump(exclude_none=True))
    except UnitNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
