import sqlite3
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "dinex.db"


class PersonCreate(BaseModel):
    photo: str = Field(min_length=1)
    employee_name: str = Field(min_length=1)
    designation: str = Field(min_length=1)


class PersonResponse(BaseModel):
    id: int
    photo: str
    employee_name: str
    designation: str


class BatchInchargeCreate(BaseModel):
    line_leader_name: str = Field(min_length=1)
    team_leader_name: str = Field(min_length=1)
    supervisor_name: str = Field(min_length=1)


class BatchInchargeResponse(BaseModel):
    id: int
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


class ShiftBreakResponse(BaseModel):
    id: int
    shift_key: str
    split_start_time: str
    split_end_time: str
    break_type: str
    duration_minutes: int

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


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS people (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
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
        expected_columns = {
            "id",
            "line_leader_name",
            "team_leader_name",
            "supervisor_name",
            "created_at",
        }
        if column_names != expected_columns:
            conn.execute("DROP TABLE IF EXISTS batch_incharges")
            conn.execute(
                """
                CREATE TABLE batch_incharges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    line_leader_name TEXT NOT NULL,
                    team_leader_name TEXT NOT NULL,
                    supervisor_name TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(line_leader_name, team_leader_name, supervisor_name)
                )
                """
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


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/people", response_model=list[PersonResponse])
def list_people() -> list[PersonResponse]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, photo, employee_name, designation
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
            INSERT INTO people (photo, employee_name, designation)
            VALUES (?, ?, ?)
            """,
            (payload.photo, payload.employee_name.strip(), payload.designation.strip()),
        )
        conn.commit()

        row = conn.execute(
            """
            SELECT id, photo, employee_name, designation
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
                INSERT INTO batch_incharges (line_leader_name, team_leader_name, supervisor_name)
                VALUES (?, ?, ?)
                """,
                (
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
            "SELECT id FROM shift_timings WHERE shift_key = ?",
            (payload.shift_key.strip(),),
        ).fetchone()

        if existing:
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
                duration_minutes
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
                duration_minutes
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                payload.shift_key.strip(),
                payload.split_start_time.strip(),
                payload.split_end_time.strip(),
                payload.break_type.strip(),
                payload.duration_minutes,
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
                duration_minutes
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
