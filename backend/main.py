import sqlite3
import random
import threading
import os
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "dinex.db"
APP_TIMEZONE = os.getenv("APP_TIMEZONE", "Asia/Kolkata")
IST_FALLBACK_TZ = timezone(timedelta(hours=5, minutes=30))


class PersonCreate(BaseModel):
    photo: str = Field(min_length=1)
    employee_name: str = Field(min_length=1)
    designation: str = Field(min_length=1)


class PersonResponse(BaseModel):
    id: int
    serial_no: int
    photo: str
    employee_name: str
    designation: str


class BatchInchargeCreate(BaseModel):
    line_leader_name: str = Field(min_length=1)
    team_leader_name: str = Field(min_length=1)
    supervisor_name: str = Field(min_length=1)


class BatchInchargeResponse(BaseModel):
    id: int
    serial_no: int
    line_leader_name: str
    team_leader_name: str
    supervisor_name: str


class ModelCreate(BaseModel):
    model_id: str = Field(min_length=1)
    cycle_time_duration: float = Field(gt=0)
    cycle_time_unit: str = Field(min_length=1)
    explanation: str = Field(min_length=1)


class ModelResponse(BaseModel):
    id: int
    model_id: str
    cycle_time_duration: float
    cycle_time_unit: str
    cycle_time_hours: float
    cycle_time_minutes: float
    cycle_time_seconds: float
    explanation: str


class ManPowerCreate(BaseModel):
    count: int = Field(gt=0)


class ManPowerResponse(BaseModel):
    id: int
    count: int


class DowntimeCreate(BaseModel):
    downtime_type: str = Field(min_length=1)
    details: str = Field(min_length=1)
    time_type: str = Field(min_length=1)
    fixed_minutes: int | None = None


class DowntimeResponse(BaseModel):
    id: int
    downtime_type: str
    details: str
    time_type: str
    fixed_minutes: int | None


class ShiftTimingUpsert(BaseModel):
    shift_key: str = Field(min_length=1)
    shift_label: str = Field(min_length=1)
    start_time: str = Field(min_length=1)
    end_time: str = Field(min_length=1)
    time_split: int = Field(gt=0)
    shifts_per_day: int = Field(gt=0)
    hours_per_shift: int = Field(gt=0)


class ShiftTimingResponse(BaseModel):
    id: int
    shift_key: str
    shift_label: str
    start_time: str
    end_time: str
    time_split: int
    shifts_per_day: int
    hours_per_shift: int


class ShiftBreakCreate(BaseModel):
    shift_key: str = Field(min_length=1)
    split_start_time: str = Field(min_length=1)
    split_end_time: str = Field(min_length=1)
    break_type: str = Field(min_length=1)
    duration_minutes: int = Field(gt=0)
    break_start_time: str = Field(min_length=1)
    break_end_time: str = Field(min_length=1)


class ShiftBreakResponse(BaseModel):
    id: int
    shift_key: str
    split_start_time: str
    split_end_time: str
    break_type: str
    duration_minutes: int
    break_start_time: str
    break_end_time: str


class BatchSplitPlanItem(BaseModel):
    splitNo: int = Field(gt=0)
    from_time: str = Field(min_length=1, alias="from")
    to: str = Field(min_length=1)
    modelId: str = Field(min_length=1)
    target: int = Field(ge=0)
    cycleTimeDuration: float = Field(gt=0)
    cycleTimeUnit: str = Field(min_length=1)
    cycleTimeSeconds: float = Field(gt=0)

    class Config:
        populate_by_name = True


class BatchShift(BaseModel):
    start: float
    end: float
    split: float = Field(gt=0)


class BatchStartRequest(BaseModel):
    teamLeader: str = Field(min_length=1)
    lineLeader: str = Field(min_length=1)
    supervisor: str = Field(min_length=1)
    manpower: str = Field(min_length=1)
    shiftTime: str = Field(min_length=1)
    shift: BatchShift
    splitPlan: list[BatchSplitPlanItem]


class BatchSplitResponse(BaseModel):
    splitNo: int
    from_time: str = Field(alias="from")
    to: str
    modelId: str
    target: int
    cycleTimeDuration: float
    cycleTimeUnit: str
    cycleTimeSeconds: float

    class Config:
        populate_by_name = True


class BatchResponse(BaseModel):
    id: int
    teamLeader: str
    lineLeader: str
    supervisor: str
    manpower: str
    shiftTime: str
    shift_start: float
    shift_end: float
    shift_split: float
    started_at: str
    ended_at: str | None
    status: str
    splitPlan: list[BatchSplitResponse]


class MachineCycleResponse(BaseModel):
    batch_id: int
    split_no: int
    model_id: str
    result: str
    produced_at: str


class BatchSplitLiveResponse(BaseModel):
    splitNo: int
    from_time: str = Field(alias="from")
    to: str
    modelId: str
    target: int
    actual: int
    ok: int
    rework: int
    reject: int

    class Config:
        populate_by_name = True


class BatchLiveSummaryResponse(BaseModel):
    batch_id: int
    produced: int
    ok: int
    rework: int
    reject: int
    splitRows: list[BatchSplitLiveResponse]


class BatchSplitDowntimeCreate(BaseModel):
    split_no: int = Field(gt=0)
    downtime_type: str = Field(min_length=1)
    duration_minutes: int = Field(gt=0)
    notes: str = ""


class BatchSplitDowntimeResponse(BaseModel):
    id: int
    batch_id: int
    split_no: int
    downtime_type: str
    duration_minutes: int
    notes: str
    created_at: str

app = FastAPI(title="Dinex API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_next_serial_no(conn: sqlite3.Connection, table_name: str) -> int:
    row = conn.execute(
        f"SELECT COALESCE(MAX(serial_no), 0) + 1 AS next_serial FROM {table_name}"
    ).fetchone()
    return int(row["next_serial"])


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS people (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                serial_no INTEGER,
                photo TEXT NOT NULL,
                employee_name TEXT NOT NULL,
                designation TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS batch_incharges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                serial_no INTEGER,
                line_leader_name TEXT NOT NULL,
                team_leader_name TEXT NOT NULL,
                supervisor_name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(line_leader_name, team_leader_name, supervisor_name)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS models (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_id TEXT NOT NULL,
                cycle_time_duration REAL NOT NULL,
                cycle_time_unit TEXT NOT NULL,
                cycle_time_hours REAL NOT NULL,
                cycle_time_minutes REAL NOT NULL,
                cycle_time_seconds REAL NOT NULL,
                explanation TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS manpower (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                count INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS downtimes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                downtime_type TEXT NOT NULL,
                details TEXT NOT NULL,
                time_type TEXT NOT NULL,
                fixed_minutes INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS shift_timings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shift_key TEXT NOT NULL UNIQUE,
                shift_label TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                time_split INTEGER NOT NULL,
                shifts_per_day INTEGER NOT NULL,
                hours_per_shift INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS shift_breaks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shift_key TEXT NOT NULL,
                split_start_time TEXT NOT NULL,
                split_end_time TEXT NOT NULL,
                break_type TEXT NOT NULL,
                duration_minutes INTEGER NOT NULL,
                break_start_time TEXT NOT NULL,
                break_end_time TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS batches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                team_leader TEXT NOT NULL,
                line_leader TEXT NOT NULL,
                supervisor TEXT NOT NULL,
                manpower TEXT NOT NULL,
                shift_time TEXT NOT NULL,
                shift_start REAL NOT NULL,
                shift_end REAL NOT NULL,
                shift_split REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS batch_splits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id INTEGER NOT NULL,
                split_no INTEGER NOT NULL,
                from_time TEXT NOT NULL,
                to_time TEXT NOT NULL,
                model_id TEXT NOT NULL,
                target INTEGER NOT NULL,
                cycle_time_duration REAL NOT NULL,
                cycle_time_unit TEXT NOT NULL,
                cycle_time_seconds REAL NOT NULL,
                FOREIGN KEY(batch_id) REFERENCES batches(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS batch_parts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id INTEGER NOT NULL,
                split_no INTEGER NOT NULL,
                model_id TEXT NOT NULL,
                result TEXT NOT NULL CHECK (result IN ('ok', 'rework', 'reject')),
                produced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(batch_id) REFERENCES batches(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS batch_split_downtimes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id INTEGER NOT NULL,
                split_no INTEGER NOT NULL,
                downtime_type TEXT NOT NULL,
                duration_minutes INTEGER NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(batch_id) REFERENCES batches(id)
            )
            """
        )
        shift_break_columns = conn.execute("PRAGMA table_info(shift_breaks)").fetchall()
        shift_break_column_names = {column["name"] for column in shift_break_columns}
        if "break_start_time" not in shift_break_column_names:
            conn.execute("ALTER TABLE shift_breaks ADD COLUMN break_start_time TEXT NOT NULL DEFAULT ''")
        if "break_end_time" not in shift_break_column_names:
            conn.execute("ALTER TABLE shift_breaks ADD COLUMN break_end_time TEXT NOT NULL DEFAULT ''")
        shift_count = conn.execute(
            "SELECT COUNT(*) AS count FROM shift_timings"
        ).fetchone()["count"]
        if shift_count == 0:
            conn.executemany(
                """
                INSERT INTO shift_timings (
                    shift_key,
                    shift_label,
                    start_time,
                    end_time,
                    time_split,
                    shifts_per_day,
                    hours_per_shift
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    ("shiftA", "Shift A", "06:00", "14:00", 8, 3, 8),
                    ("shiftB", "Shift B", "14:00", "22:00", 8, 3, 8),
                    ("shiftC", "Shift C", "22:00", "06:00", 8, 3, 8),
                ],
            )
        columns = conn.execute("PRAGMA table_info(batch_incharges)").fetchall()
        column_names = {column["name"] for column in columns}
        if "serial_no" not in column_names:
            conn.execute("ALTER TABLE batch_incharges ADD COLUMN serial_no INTEGER")

        people_columns = conn.execute("PRAGMA table_info(people)").fetchall()
        people_column_names = {column["name"] for column in people_columns}
        if "serial_no" not in people_column_names:
            conn.execute("ALTER TABLE people ADD COLUMN serial_no INTEGER")

        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_people_serial_no ON people(serial_no)"
        )
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_batch_incharges_serial_no ON batch_incharges(serial_no)"
        )

        people_without_serial = conn.execute(
            "SELECT id FROM people WHERE serial_no IS NULL OR serial_no <= 0 ORDER BY id ASC"
        ).fetchall()
        next_people_serial = conn.execute(
            "SELECT COALESCE(MAX(serial_no), 0) AS max_serial FROM people"
        ).fetchone()["max_serial"]
        for row in people_without_serial:
            next_people_serial += 1
            conn.execute(
                "UPDATE people SET serial_no = ? WHERE id = ?",
                (next_people_serial, row["id"]),
            )

        batch_without_serial = conn.execute(
            "SELECT id FROM batch_incharges WHERE serial_no IS NULL OR serial_no <= 0 ORDER BY id ASC"
        ).fetchall()
        next_batch_serial = conn.execute(
            "SELECT COALESCE(MAX(serial_no), 0) AS max_serial FROM batch_incharges"
        ).fetchone()["max_serial"]
        for row in batch_without_serial:
            next_batch_serial += 1
            conn.execute(
                "UPDATE batch_incharges SET serial_no = ? WHERE id = ?",
                (next_batch_serial, row["id"]),
            )
        model_columns = conn.execute("PRAGMA table_info(models)").fetchall()
        model_column_names = {column["name"] for column in model_columns}
        expected_model_columns = {
            "id",
            "model_id",
            "cycle_time_duration",
            "cycle_time_unit",
            "cycle_time_hours",
            "cycle_time_minutes",
            "cycle_time_seconds",
            "explanation",
            "created_at",
        }
        if model_column_names != expected_model_columns:
            conn.execute("DROP TABLE IF EXISTS models")
            conn.execute(
                """
                CREATE TABLE models (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    model_id TEXT NOT NULL,
                    cycle_time_duration REAL NOT NULL,
                    cycle_time_unit TEXT NOT NULL,
                    cycle_time_hours REAL NOT NULL,
                    cycle_time_minutes REAL NOT NULL,
                    cycle_time_seconds REAL NOT NULL,
                    explanation TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        conn.commit()


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    global _auto_cycle_thread
    if _auto_cycle_thread is None or not _auto_cycle_thread.is_alive():
        _auto_cycle_stop_event.clear()
        _auto_cycle_thread = threading.Thread(target=_auto_cycle_worker, daemon=True)
        _auto_cycle_thread.start()


@app.on_event("shutdown")
def on_shutdown() -> None:
    _auto_cycle_stop_event.set()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/people", response_model=list[PersonResponse])
def list_people() -> list[PersonResponse]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, serial_no, photo, employee_name, designation
            FROM people
            ORDER BY id DESC
            """
        ).fetchall()

    return [PersonResponse(**dict(row)) for row in rows]


@app.post("/people", response_model=PersonResponse, status_code=201)
def create_person(payload: PersonCreate) -> PersonResponse:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO people (serial_no, photo, employee_name, designation)
            VALUES (?, ?, ?, ?)
            """,
            (
                get_next_serial_no(conn, "people"),
                payload.photo,
                payload.employee_name.strip(),
                payload.designation.strip(),
            ),
        )
        conn.commit()

        row = conn.execute(
            """
            SELECT id, serial_no, photo, employee_name, designation
            FROM people
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

    return PersonResponse(**dict(row))


@app.delete("/people/{person_id}", status_code=204)
def delete_person(person_id: int) -> None:
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM people WHERE id = ?", (person_id,))
        conn.commit()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Person not found")


@app.get("/batch-incharges", response_model=list[BatchInchargeResponse])
def list_batch_incharges() -> list[BatchInchargeResponse]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                bi.id,
                bi.serial_no,
                bi.line_leader_name,
                bi.team_leader_name,
                bi.supervisor_name
            FROM batch_incharges bi
            ORDER BY bi.id DESC
            """
        ).fetchall()

    return [BatchInchargeResponse(**dict(row)) for row in rows]


@app.post("/batch-incharges", response_model=BatchInchargeResponse, status_code=201)
def create_batch_incharge(payload: BatchInchargeCreate) -> BatchInchargeResponse:
    with get_connection() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO batch_incharges (serial_no, line_leader_name, team_leader_name, supervisor_name)
                VALUES (?, ?, ?, ?)
                """,
                (
                    get_next_serial_no(conn, "batch_incharges"),
                    payload.line_leader_name.strip(),
                    payload.team_leader_name.strip(),
                    payload.supervisor_name.strip(),
                ),
            )
            conn.commit()
        except sqlite3.IntegrityError as exc:
            raise HTTPException(
                status_code=409, detail="This incharge combination already exists"
            ) from exc

        row = conn.execute(
            """
            SELECT
                bi.id,
                bi.serial_no,
                bi.line_leader_name,
                bi.team_leader_name,
                bi.supervisor_name
            FROM batch_incharges bi
            WHERE bi.id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

    return BatchInchargeResponse(**dict(row))


@app.delete("/batch-incharges/{batch_incharge_id}", status_code=204)
def delete_batch_incharge(batch_incharge_id: int) -> None:
    with get_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM batch_incharges WHERE id = ?",
            (batch_incharge_id,),
        )
        conn.commit()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Batch incharge not found")


@app.get("/models", response_model=list[ModelResponse])
def list_models() -> list[ModelResponse]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                id,
                model_id,
                cycle_time_duration,
                cycle_time_unit,
                cycle_time_hours,
                cycle_time_minutes,
                cycle_time_seconds,
                explanation
            FROM models
            ORDER BY id DESC
            """
        ).fetchall()

    return [ModelResponse(**dict(row)) for row in rows]


@app.post("/models", response_model=ModelResponse, status_code=201)
def create_model(payload: ModelCreate) -> ModelResponse:
    unit = payload.cycle_time_unit.strip().lower()
    if unit not in {"hrs", "min", "sec"}:
        raise HTTPException(status_code=400, detail="Cycle time unit must be hrs, min, or sec")

    if unit == "hrs":
        cycle_time_hours = payload.cycle_time_duration
        cycle_time_minutes = payload.cycle_time_duration * 60
        cycle_time_seconds = payload.cycle_time_duration * 3600
    elif unit == "min":
        cycle_time_hours = payload.cycle_time_duration / 60
        cycle_time_minutes = payload.cycle_time_duration
        cycle_time_seconds = payload.cycle_time_duration * 60
    else:
        cycle_time_hours = payload.cycle_time_duration / 3600
        cycle_time_minutes = payload.cycle_time_duration / 60
        cycle_time_seconds = payload.cycle_time_duration

    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO models (
                model_id,
                cycle_time_duration,
                cycle_time_unit,
                cycle_time_hours,
                cycle_time_minutes,
                cycle_time_seconds,
                explanation
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.model_id.strip(),
                payload.cycle_time_duration,
                unit,
                cycle_time_hours,
                cycle_time_minutes,
                cycle_time_seconds,
                payload.explanation.strip(),
            ),
        )
        conn.commit()

        row = conn.execute(
            """
            SELECT
                id,
                model_id,
                cycle_time_duration,
                cycle_time_unit,
                cycle_time_hours,
                cycle_time_minutes,
                cycle_time_seconds,
                explanation
            FROM models
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

    return ModelResponse(**dict(row))


@app.delete("/models/{model_id}", status_code=204)
def delete_model(model_id: int) -> None:
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM models WHERE id = ?", (model_id,))
        conn.commit()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Model not found")


@app.get("/manpower", response_model=list[ManPowerResponse])
def list_manpower() -> list[ManPowerResponse]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, count
            FROM manpower
            ORDER BY id DESC
            """
        ).fetchall()
    return [ManPowerResponse(**dict(row)) for row in rows]


@app.post("/manpower", response_model=ManPowerResponse, status_code=201)
def create_manpower(payload: ManPowerCreate) -> ManPowerResponse:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO manpower (count)
            VALUES (?)
            """,
            (payload.count,),
        )
        conn.commit()
        row = conn.execute(
            """
            SELECT id, count
            FROM manpower
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()
    return ManPowerResponse(**dict(row))


@app.delete("/manpower/{manpower_id}", status_code=204)
def delete_manpower(manpower_id: int) -> None:
    with get_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM manpower WHERE id = ?",
            (manpower_id,),
        )
        conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Man power record not found")


@app.get("/downtimes", response_model=list[DowntimeResponse])
def list_downtimes() -> list[DowntimeResponse]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, downtime_type, details, time_type, fixed_minutes
            FROM downtimes
            ORDER BY id DESC
            """
        ).fetchall()
    return [DowntimeResponse(**dict(row)) for row in rows]


@app.post("/downtimes", response_model=DowntimeResponse, status_code=201)
def create_downtime(payload: DowntimeCreate) -> DowntimeResponse:
    time_type = payload.time_type.strip().lower()
    if time_type not in {"fixed", "variable"}:
        raise HTTPException(status_code=400, detail="time_type must be fixed or variable")

    fixed_minutes = payload.fixed_minutes
    if time_type == "fixed":
        if fixed_minutes is None or fixed_minutes <= 0:
            raise HTTPException(status_code=400, detail="fixed_minutes required for fixed")
    else:
        fixed_minutes = None

    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO downtimes (downtime_type, details, time_type, fixed_minutes)
            VALUES (?, ?, ?, ?)
            """,
            (
                payload.downtime_type.strip(),
                payload.details.strip(),
                time_type,
                fixed_minutes,
            ),
        )
        conn.commit()
        row = conn.execute(
            """
            SELECT id, downtime_type, details, time_type, fixed_minutes
            FROM downtimes
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()
    return DowntimeResponse(**dict(row))


@app.delete("/downtimes/{downtime_id}", status_code=204)
def delete_downtime(downtime_id: int) -> None:
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM downtimes WHERE id = ?", (downtime_id,))
        conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Downtime not found")


@app.get("/shift-timings", response_model=list[ShiftTimingResponse])
def list_shift_timings() -> list[ShiftTimingResponse]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                id,
                shift_key,
                shift_label,
                start_time,
                end_time,
                time_split,
                shifts_per_day,
                hours_per_shift
            FROM shift_timings
            ORDER BY id ASC
            """
        ).fetchall()
    return [ShiftTimingResponse(**dict(row)) for row in rows]


@app.put("/shift-timings/{shift_key}", response_model=ShiftTimingResponse)
def upsert_shift_timing(shift_key: str, payload: ShiftTimingUpsert) -> ShiftTimingResponse:
    if shift_key.strip() != payload.shift_key.strip():
        raise HTTPException(status_code=400, detail="Path shift key mismatch")

    with get_connection() as conn:
        existing = conn.execute(
            """
            SELECT id, start_time, end_time, time_split
            FROM shift_timings
            WHERE shift_key = ?
            """,
            (payload.shift_key.strip(),),
        ).fetchone()

        if existing:
            timing_changed = (
                existing["start_time"] != payload.start_time.strip()
                or existing["end_time"] != payload.end_time.strip()
                or int(existing["time_split"]) != int(payload.time_split)
            )

            conn.execute(
                """
                UPDATE shift_timings
                SET
                    shift_label = ?,
                    start_time = ?,
                    end_time = ?,
                    time_split = ?,
                    shifts_per_day = ?,
                    hours_per_shift = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE shift_key = ?
                """,
                (
                    payload.shift_label.strip(),
                    payload.start_time.strip(),
                    payload.end_time.strip(),
                    payload.time_split,
                    payload.shifts_per_day,
                    payload.hours_per_shift,
                    payload.shift_key.strip(),
                ),
            )

            # Existing breaks are split-bound; clear them if shift timing/split changes.
            if timing_changed:
                conn.execute(
                    "DELETE FROM shift_breaks WHERE shift_key = ?",
                    (payload.shift_key.strip(),),
                )
        else:
            conn.execute(
                """
                INSERT INTO shift_timings (
                    shift_key,
                    shift_label,
                    start_time,
                    end_time,
                    time_split,
                    shifts_per_day,
                    hours_per_shift
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payload.shift_key.strip(),
                    payload.shift_label.strip(),
                    payload.start_time.strip(),
                    payload.end_time.strip(),
                    payload.time_split,
                    payload.shifts_per_day,
                    payload.hours_per_shift,
                ),
            )
        conn.commit()

        row = conn.execute(
            """
            SELECT
                id,
                shift_key,
                shift_label,
                start_time,
                end_time,
                time_split,
                shifts_per_day,
                hours_per_shift
            FROM shift_timings
            WHERE shift_key = ?
            """,
            (payload.shift_key.strip(),),
        ).fetchone()

    return ShiftTimingResponse(**dict(row))


@app.get("/shift-breaks", response_model=list[ShiftBreakResponse])
def list_shift_breaks() -> list[ShiftBreakResponse]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                id,
                shift_key,
                split_start_time,
                split_end_time,
                break_type,
                duration_minutes,
                break_start_time,
                break_end_time
            FROM shift_breaks
            ORDER BY id DESC
            """
        ).fetchall()
    return [ShiftBreakResponse(**dict(row)) for row in rows]


@app.post("/shift-breaks", response_model=ShiftBreakResponse, status_code=201)
def create_shift_break(payload: ShiftBreakCreate) -> ShiftBreakResponse:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO shift_breaks (
                shift_key,
                split_start_time,
                split_end_time,
                break_type,
                duration_minutes,
                break_start_time,
                break_end_time
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.shift_key.strip(),
                payload.split_start_time.strip(),
                payload.split_end_time.strip(),
                payload.break_type.strip(),
                payload.duration_minutes,
                payload.break_start_time.strip(),
                payload.break_end_time.strip(),
            ),
        )
        conn.commit()
        row = conn.execute(
            """
            SELECT
                id,
                shift_key,
                split_start_time,
                split_end_time,
                break_type,
                duration_minutes,
                break_start_time,
                break_end_time
            FROM shift_breaks
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()
    return ShiftBreakResponse(**dict(row))


@app.delete("/shift-breaks/{break_id}", status_code=204)
def delete_shift_break(break_id: int) -> None:
    with get_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM shift_breaks WHERE id = ?",
            (break_id,),
        )
        conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Shift break not found")


def _build_batch_response(conn: sqlite3.Connection, batch_row: sqlite3.Row) -> BatchResponse:
    split_rows = conn.execute(
        """
        SELECT
            split_no,
            from_time,
            to_time,
            model_id,
            target,
            cycle_time_duration,
            cycle_time_unit,
            cycle_time_seconds
        FROM batch_splits
        WHERE batch_id = ?
        ORDER BY split_no ASC
        """,
        (batch_row["id"],),
    ).fetchall()

    split_plan = [
        BatchSplitResponse(
            splitNo=row["split_no"],
            **{
                "from": row["from_time"],
                "to": row["to_time"],
                "modelId": row["model_id"],
                "target": row["target"],
                "cycleTimeDuration": row["cycle_time_duration"],
                "cycleTimeUnit": row["cycle_time_unit"],
                "cycleTimeSeconds": row["cycle_time_seconds"],
            },
        )
        for row in split_rows
    ]

    return BatchResponse(
        id=batch_row["id"],
        teamLeader=batch_row["team_leader"],
        lineLeader=batch_row["line_leader"],
        supervisor=batch_row["supervisor"],
        manpower=batch_row["manpower"],
        shiftTime=batch_row["shift_time"],
        shift_start=batch_row["shift_start"],
        shift_end=batch_row["shift_end"],
        shift_split=batch_row["shift_split"],
        started_at=batch_row["started_at"],
        ended_at=batch_row["ended_at"],
        status=batch_row["status"],
        splitPlan=split_plan,
    )


def _to_minutes(time_value: str) -> int:
    hours, minutes = [int(v) for v in time_value.split(":")]
    return hours * 60 + minutes


def _is_within_split(now_minutes: int, split_start: int, split_end: int) -> bool:
    if split_start < split_end:
        return split_start <= now_minutes < split_end
    if split_start > split_end:
        return now_minutes >= split_start or now_minutes < split_end
    return True


def _get_current_clock_minutes() -> int:
    try:
        current = datetime.now(ZoneInfo(APP_TIMEZONE))
    except Exception:
        # Never fall back to VM local timezone; keep split mapping stable.
        current = datetime.now(IST_FALLBACK_TZ)
    return current.hour * 60 + current.minute


def _pick_part_result() -> str:
    roll = random.random()
    if roll < 0.7:
        return "ok"
    if roll < 0.9:
        return "rework"
    return "reject"


def _get_active_split_for_now(conn: sqlite3.Connection, batch_id: int) -> sqlite3.Row | None:
    split_rows = conn.execute(
        """
        SELECT split_no, from_time, to_time, model_id, cycle_time_seconds
        FROM batch_splits
        WHERE batch_id = ?
        ORDER BY split_no ASC
        """,
        (batch_id,),
    ).fetchall()
    if not split_rows:
        return None

    now_minutes = _get_current_clock_minutes()

    for split in split_rows:
        start_minutes = _to_minutes(split["from_time"])
        end_minutes = _to_minutes(split["to_time"])
        if _is_within_split(now_minutes, start_minutes, end_minutes):
            return split

    return split_rows[0]


def _insert_batch_parts(conn: sqlite3.Connection, batch_id: int, split_no: int, model_id: str, count: int) -> None:
    if count <= 0:
        return
    conn.executemany(
        """
        INSERT INTO batch_parts (batch_id, split_no, model_id, result)
        VALUES (?, ?, ?, ?)
        """,
        [(batch_id, split_no, model_id, _pick_part_result()) for _ in range(count)],
    )


def _run_auto_cycle_tick() -> None:
    with get_connection() as conn:
        batch_row = conn.execute(
            "SELECT id, started_at FROM batches WHERE status = 'active' ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if not batch_row:
            return

        batch_id = int(batch_row["id"])
        active_split = _get_active_split_for_now(conn, batch_id)
        if not active_split:
            return

        cycle_seconds = max(1.0, float(active_split["cycle_time_seconds"] or 1.0))

        last_part_row = conn.execute(
            """
            SELECT CAST(strftime('%s', MAX(produced_at)) AS INTEGER) AS last_epoch
            FROM batch_parts
            WHERE batch_id = ? AND split_no = ?
            """,
            (batch_id, int(active_split["split_no"])),
        ).fetchone()
        base_epoch_row = conn.execute(
            "SELECT CAST(strftime('%s', ?) AS INTEGER) AS started_epoch",
            (batch_row["started_at"],),
        ).fetchone()
        now_epoch_row = conn.execute(
            "SELECT CAST(strftime('%s', 'now') AS INTEGER) AS now_epoch"
        ).fetchone()

        started_epoch = int(base_epoch_row["started_epoch"] or 0)
        last_epoch = int(last_part_row["last_epoch"] or started_epoch)
        now_epoch = int(now_epoch_row["now_epoch"] or 0)

        elapsed_seconds = max(0, now_epoch - last_epoch)
        due_parts = int(elapsed_seconds // cycle_seconds)
        if due_parts <= 0:
            return

        due_parts = min(due_parts, 200)
        _insert_batch_parts(
            conn,
            batch_id=batch_id,
            split_no=int(active_split["split_no"]),
            model_id=active_split["model_id"],
            count=due_parts,
        )
        conn.commit()


_auto_cycle_stop_event = threading.Event()
_auto_cycle_thread: threading.Thread | None = None


def _auto_cycle_worker() -> None:
    while not _auto_cycle_stop_event.is_set():
        try:
            _run_auto_cycle_tick()
        except Exception:
            pass
        _auto_cycle_stop_event.wait(2.0)


def _build_live_summary(conn: sqlite3.Connection, batch_id: int) -> BatchLiveSummaryResponse:
    split_rows = conn.execute(
        """
        SELECT
            split_no,
            from_time,
            to_time,
            model_id,
            target
        FROM batch_splits
        WHERE batch_id = ?
        ORDER BY split_no ASC
        """,
        (batch_id,),
    ).fetchall()

    result_rows = conn.execute(
        """
        SELECT
            split_no,
            result,
            COUNT(*) AS count
        FROM batch_parts
        WHERE batch_id = ?
        GROUP BY split_no, result
        """,
        (batch_id,),
    ).fetchall()

    split_counts: dict[int, dict[str, int]] = {}
    for row in result_rows:
        split_no = int(row["split_no"])
        if split_no not in split_counts:
            split_counts[split_no] = {"ok": 0, "rework": 0, "reject": 0}
        split_counts[split_no][row["result"]] = int(row["count"])

    live_rows: list[BatchSplitLiveResponse] = []
    for split in split_rows:
        split_no = int(split["split_no"])
        counts = split_counts.get(split_no, {"ok": 0, "rework": 0, "reject": 0})
        actual = counts["ok"] + counts["rework"] + counts["reject"]
        live_rows.append(
            BatchSplitLiveResponse(
                splitNo=split_no,
                **{
                    "from": split["from_time"],
                    "to": split["to_time"],
                    "modelId": split["model_id"],
                    "target": int(split["target"]),
                    "actual": actual,
                    "ok": counts["ok"],
                    "rework": counts["rework"],
                    "reject": counts["reject"],
                },
            )
        )

    produced = sum(row.actual for row in live_rows)
    ok = sum(row.ok for row in live_rows)
    rework = sum(row.rework for row in live_rows)
    reject = sum(row.reject for row in live_rows)

    return BatchLiveSummaryResponse(
        batch_id=batch_id,
        produced=produced,
        ok=ok,
        rework=rework,
        reject=reject,
        splitRows=live_rows,
    )


@app.post("/batches/start", response_model=BatchResponse, status_code=201)
def start_batch(payload: BatchStartRequest) -> BatchResponse:
    with get_connection() as conn:
        active_row = conn.execute(
            "SELECT id FROM batches WHERE status = 'active' ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if active_row:
            raise HTTPException(status_code=409, detail="An active batch already exists")

        cursor = conn.execute(
            """
            INSERT INTO batches (
                team_leader,
                line_leader,
                supervisor,
                manpower,
                shift_time,
                shift_start,
                shift_end,
                shift_split,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
            """,
            (
                payload.teamLeader.strip(),
                payload.lineLeader.strip(),
                payload.supervisor.strip(),
                payload.manpower.strip(),
                payload.shiftTime.strip(),
                payload.shift.start,
                payload.shift.end,
                payload.shift.split,
            ),
        )
        batch_id = cursor.lastrowid

        conn.executemany(
            """
            INSERT INTO batch_splits (
                batch_id,
                split_no,
                from_time,
                to_time,
                model_id,
                target,
                cycle_time_duration,
                cycle_time_unit,
                cycle_time_seconds
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    batch_id,
                    item.splitNo,
                    item.from_time.strip(),
                    item.to.strip(),
                    item.modelId.strip(),
                    item.target,
                    item.cycleTimeDuration,
                    item.cycleTimeUnit.strip(),
                    item.cycleTimeSeconds,
                )
                for item in payload.splitPlan
            ],
        )
        conn.commit()

        batch_row = conn.execute(
            "SELECT * FROM batches WHERE id = ?",
            (batch_id,),
        ).fetchone()
        return _build_batch_response(conn, batch_row)


@app.get("/batches/active", response_model=BatchResponse | None)
def get_active_batch() -> BatchResponse | None:
    with get_connection() as conn:
        batch_row = conn.execute(
            "SELECT * FROM batches WHERE status = 'active' ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if not batch_row:
            return None
        return _build_batch_response(conn, batch_row)


@app.post("/batches/{batch_id}/end", response_model=BatchResponse)
def end_batch(batch_id: int) -> BatchResponse:
    with get_connection() as conn:
        batch_row = conn.execute(
            "SELECT * FROM batches WHERE id = ?",
            (batch_id,),
        ).fetchone()
        if not batch_row:
            raise HTTPException(status_code=404, detail="Batch not found")

        conn.execute(
            """
            UPDATE batches
            SET status = 'ended', ended_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (batch_id,),
        )
        conn.commit()
        ended_row = conn.execute(
            "SELECT * FROM batches WHERE id = ?",
            (batch_id,),
        ).fetchone()
        return _build_batch_response(conn, ended_row)


@app.get("/batches", response_model=list[BatchResponse])
def list_batches() -> list[BatchResponse]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM batches ORDER BY id DESC"
        ).fetchall()
        return [_build_batch_response(conn, row) for row in rows]


@app.post("/batches/{batch_id}/machine-cycle", response_model=MachineCycleResponse, status_code=201)
def machine_cycle(batch_id: int) -> MachineCycleResponse:
    with get_connection() as conn:
        batch_row = conn.execute(
            "SELECT * FROM batches WHERE id = ?",
            (batch_id,),
        ).fetchone()
        if not batch_row:
            raise HTTPException(status_code=404, detail="Batch not found")
        if batch_row["status"] != "active":
            raise HTTPException(status_code=409, detail="Batch is not active")

        active_split = _get_active_split_for_now(conn, batch_id)
        if not active_split:
            raise HTTPException(status_code=400, detail="No split rows found for batch")

        result = _pick_part_result()

        cursor = conn.execute(
            """
            INSERT INTO batch_parts (batch_id, split_no, model_id, result)
            VALUES (?, ?, ?, ?)
            """,
            (
                batch_id,
                int(active_split["split_no"]),
                active_split["model_id"],
                result,
            ),
        )
        conn.commit()

        part_row = conn.execute(
            """
            SELECT batch_id, split_no, model_id, result, produced_at
            FROM batch_parts
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

    return MachineCycleResponse(**dict(part_row))


@app.get("/batches/{batch_id}/live-summary", response_model=BatchLiveSummaryResponse)
def get_batch_live_summary(batch_id: int) -> BatchLiveSummaryResponse:
    with get_connection() as conn:
        batch_row = conn.execute(
            "SELECT id FROM batches WHERE id = ?",
            (batch_id,),
        ).fetchone()
        if not batch_row:
            raise HTTPException(status_code=404, detail="Batch not found")
        return _build_live_summary(conn, batch_id)


@app.get(
    "/batches/{batch_id}/split-downtimes",
    response_model=list[BatchSplitDowntimeResponse],
)
def list_batch_split_downtimes(batch_id: int) -> list[BatchSplitDowntimeResponse]:
    with get_connection() as conn:
        batch_row = conn.execute(
            "SELECT id FROM batches WHERE id = ?",
            (batch_id,),
        ).fetchone()
        if not batch_row:
            raise HTTPException(status_code=404, detail="Batch not found")

        rows = conn.execute(
            """
            SELECT
                id,
                batch_id,
                split_no,
                downtime_type,
                duration_minutes,
                notes,
                created_at
            FROM batch_split_downtimes
            WHERE batch_id = ?
            ORDER BY split_no ASC, id ASC
            """,
            (batch_id,),
        ).fetchall()
        return [BatchSplitDowntimeResponse(**dict(row)) for row in rows]


@app.post(
    "/batches/{batch_id}/split-downtimes",
    response_model=BatchSplitDowntimeResponse,
    status_code=201,
)
def create_batch_split_downtime(
    batch_id: int, payload: BatchSplitDowntimeCreate
) -> BatchSplitDowntimeResponse:
    downtime_type = payload.downtime_type.strip()
    notes = payload.notes.strip()

    if not downtime_type:
        raise HTTPException(status_code=400, detail="Downtime type is required")

    with get_connection() as conn:
        batch_row = conn.execute(
            "SELECT id FROM batches WHERE id = ?",
            (batch_id,),
        ).fetchone()
        if not batch_row:
            raise HTTPException(status_code=404, detail="Batch not found")

        split_row = conn.execute(
            "SELECT split_no FROM batch_splits WHERE batch_id = ? AND split_no = ?",
            (batch_id, payload.split_no),
        ).fetchone()
        if not split_row:
            raise HTTPException(status_code=404, detail="Split row not found")

        cursor = conn.execute(
            """
            INSERT INTO batch_split_downtimes (
                batch_id,
                split_no,
                downtime_type,
                duration_minutes,
                notes
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                batch_id,
                payload.split_no,
                downtime_type,
                payload.duration_minutes,
                notes,
            ),
        )
        conn.commit()
        row = conn.execute(
            """
            SELECT
                id,
                batch_id,
                split_no,
                downtime_type,
                duration_minutes,
                notes,
                created_at
            FROM batch_split_downtimes
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()
        return BatchSplitDowntimeResponse(**dict(row))
