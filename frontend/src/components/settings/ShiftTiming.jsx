import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pencil } from "lucide-react";

const SHIFT_ROWS = [
  { key: "shiftA", label: "Shift A" },
  { key: "shiftB", label: "Shift B" },
  { key: "shiftC", label: "Shift C" },
];

const TIME_OPTIONS = Array.from(
  { length: 24 },
  (_, hour) =>
    `${String(hour).padStart(2, "0")}:00`
);

const toHour = (timeValue) =>
  Number(timeValue.split(":")[0]);

const getDurationHours = (
  start,
  end
) => (toHour(end) - toHour(start) + 24) % 24;

const toIntervals = (
  start,
  end
) => {
  const startHour = toHour(start);
  const endHour = toHour(end);

  if (startHour < endHour) {
    return [[startHour, endHour]];
  }

  if (startHour > endHour) {
    return [
      [startHour, 24],
      [0, endHour],
    ];
  }

  return [[0, 24]];
};

const hasShiftOverlap = (allShiftRows) => {
  const intervalsByShift =
    SHIFT_ROWS.map((shift) => ({
      key: shift.key,
      label: shift.label,
      intervals: toIntervals(
        allShiftRows[shift.key].start,
        allShiftRows[shift.key].end
      ),
    }));

  for (
    let i = 0;
    i < intervalsByShift.length;
    i += 1
  ) {
    for (
      let j = i + 1;
      j < intervalsByShift.length;
      j += 1
    ) {
      const first =
        intervalsByShift[i];
      const second =
        intervalsByShift[j];

      for (const [aStart, aEnd] of first.intervals) {
        for (const [bStart, bEnd] of second.intervals) {
          if (
            Math.max(
              aStart,
              bStart
            ) <
            Math.min(
              aEnd,
              bEnd
            )
          ) {
            return `${first.label} overlaps with ${second.label}`;
          }
        }
      }
    }
  }

  return "";
};

export default function ShiftTiming() {
  const [editMode, setEditMode] =
    useState(false);
  const [shiftConfig, setShiftConfig] =
    useState({
      shiftsPerDay: 3,
      hoursPerShift: 8,
    });

  const [data, setData] = useState({
    shiftA: {
      start: "06:00",
      end: "14:00",
      split: "8",
      saved: false,
    },
    shiftB: {
      start: "14:00",
      end: "22:00",
      split: "8",
      saved: false,
    },
    shiftC: {
      start: "22:00",
      end: "06:00",
      split: "8",
      saved: false,
    },
  });
  const apiBaseUrl =
    import.meta.env
      .VITE_API_BASE_URL;

  useEffect(() => {
    const fetchShiftTimings =
      async () => {
        try {
          const response =
            await fetch(
              `${apiBaseUrl}/shift-timings`
            );
          if (!response.ok) {
            throw new Error();
          }
          const rows =
            await response.json();
          if (
            !Array.isArray(rows) ||
            rows.length === 0
          ) {
            return;
          }

          const nextData = {
            ...data,
          };
          for (const row of rows) {
            if (nextData[row.shift_key]) {
              nextData[
                row.shift_key
              ] = {
                start: row.start_time,
                end: row.end_time,
                split: String(
                  row.time_split
                ),
                saved: true,
              };
            }
          }
          setData(nextData);

          const first = rows[0];
          if (first) {
            setShiftConfig({
              shiftsPerDay:
                first.shifts_per_day || 3,
              hoursPerShift:
                first.hours_per_shift || 8,
            });
          }
        } catch (error) {
          toast.error(
            "Failed to load shift timings"
          );
        }
      };

    fetchShiftTimings();
  }, []);

  const handleChange = (
    shiftKey,
    field,
    value
  ) => {
    setData((prev) => ({
      ...prev,
      [shiftKey]: {
        ...prev[shiftKey],
        [field]: value,
        saved: false,
      },
    }));
  };

  const handleSave = async (
    shiftLabel,
    shiftKey
  ) => {
    const row = data[shiftKey];

    if (!row.start) {
      toast.error(
        `${shiftLabel} start time required`
      );
      return;
    }

    if (!row.end) {
      toast.error(
        `${shiftLabel} end time required`
      );
      return;
    }

    if (!row.split || Number(row.split) <= 0) {
      toast.error(
        `${shiftLabel} split required`
      );
      return;
    }

    if (
      !shiftConfig.hoursPerShift ||
      Number(
        shiftConfig.hoursPerShift
      ) <= 0
    ) {
      toast.error(
        "Hrs/shift must be greater than 0"
      );
      return;
    }

    const durationHours =
      getDurationHours(
        row.start,
        row.end
      );
    const targetHours = Number(
      shiftConfig.hoursPerShift
    );

    if (durationHours !== targetHours) {
      toast.error(
        `${shiftLabel} must be exactly ${targetHours} hrs (${row.start} to ${row.end} is ${durationHours} hrs)`
      );
      return;
    }

    const overlapMessage =
      hasShiftOverlap(data);
    if (overlapMessage) {
      toast.error(overlapMessage);
      return;
    }

    try {
      const response =
        await fetch(
          `${apiBaseUrl}/shift-timings/${shiftKey}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              shift_key: shiftKey,
              shift_label: shiftLabel,
              start_time: row.start,
              end_time: row.end,
              time_split: Number(
                row.split
              ),
              shifts_per_day: Number(
                shiftConfig.shiftsPerDay
              ),
              hours_per_shift: Number(
                shiftConfig.hoursPerShift
              ),
            }),
          }
        );

      if (!response.ok) {
        const errorBody =
          await response.json();
        throw new Error(
          errorBody.detail ||
            "Failed to save shift"
        );
      }

      setData((prev) => ({
        ...prev,
        [shiftKey]: {
          ...prev[shiftKey],
          saved: true,
        },
      }));

      window.dispatchEvent(
        new CustomEvent(
          "shift-timing-updated"
        )
      );

      toast.success(
        `${shiftLabel} Saved`
      );
    } catch (error) {
      toast.error(
        error.message ||
          "Failed to save shift"
      );
    }
  };

  return (
    <div
      className="
        bg-white
        rounded-[28px]
        p-5
        md:p-6
        shadow-[0_2px_10px_rgba(15,23,42,0.05)]
        mt-6
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
          mb-5
        "
      >
        <h2
          className="
            text-[24px]
            md:text-[28px]
            font-bold
            text-[#0f172a]
          "
        >
          Shift timing
        </h2>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700">
              Shift/day
            </label>
            <input
              type="number"
              min="1"
              value={shiftConfig.shiftsPerDay}
              disabled={!editMode}
              onChange={(e) =>
                setShiftConfig((prev) => ({
                  ...prev,
                  shiftsPerDay: Number(e.target.value || 0),
                }))
              }
              className="
                w-[84px]
                h-[40px]
                rounded-[10px]
                border
                border-slate-300
                px-2
                text-center
                text-sm
                outline-none
                disabled:bg-slate-100
                disabled:text-slate-500
                focus:border-[#1D60AB]
                focus:ring-4
                focus:ring-blue-100
              "
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700">
              Hrs/shift
            </label>
            <input
              type="number"
              min="1"
              value={shiftConfig.hoursPerShift}
              disabled={!editMode}
              onChange={(e) =>
                setShiftConfig((prev) => ({
                  ...prev,
                  hoursPerShift: Number(e.target.value || 0),
                }))
              }
              className="
                w-[84px]
                h-[40px]
                rounded-[10px]
                border
                border-slate-300
                px-2
                text-center
                text-sm
                outline-none
                disabled:bg-slate-100
                disabled:text-slate-500
                focus:border-[#1D60AB]
                focus:ring-4
                focus:ring-blue-100
              "
            />
          </div>

          <button
            onClick={() =>
              setEditMode(!editMode)
            }
            className={`
              h-[40px]
              px-4
              rounded-[10px]
              flex
              items-center
              gap-2
              text-sm
              font-semibold
              transition-all
              ${
                editMode
                  ? "bg-red-100 text-red-600"
                  : "bg-blue-100 text-[#1D60AB]"
              }
            `}
          >
            <Pencil size={14} />
            {editMode
              ? "Exit Edit"
              : "Edit Mode"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div
            className="
              grid
              grid-cols-[140px_1fr_1fr_1fr_140px]
              gap-4
              px-2
              mb-3
            "
          >
            <div />
            <p className="text-center text-sm font-semibold text-slate-700">
              start
            </p>
            <p className="text-center text-sm font-semibold text-slate-700">
              End
            </p>
            <p className="text-center text-sm font-semibold text-slate-700">
              Time Split
            </p>
            <div />
          </div>

          <div className="space-y-3">
            {SHIFT_ROWS.map((shift) => (
              <div
                key={shift.key}
                className="
                  grid
                  grid-cols-[140px_1fr_1fr_1fr_140px]
                  gap-4
                  items-center
                "
              >
                <p className="text-lg font-bold text-slate-800">
                  {shift.label}
                </p>

                <select
                  value={data[shift.key].start}
                  onChange={(e) =>
                    handleChange(
                      shift.key,
                      "start",
                      e.target.value
                    )
                  }
                  className="
                    h-[52px]
                    rounded-[14px]
                    border
                    border-slate-300
                    bg-white
                    text-center
                    text-lg
                    text-slate-700
                    outline-none
                    focus:border-[#1D60AB]
                    focus:ring-4
                    focus:ring-blue-100
                  "
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={`${shift.key}-start-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>

                <select
                  value={data[shift.key].end}
                  onChange={(e) =>
                    handleChange(
                      shift.key,
                      "end",
                      e.target.value
                    )
                  }
                  className="
                    h-[52px]
                    rounded-[14px]
                    border
                    border-slate-300
                    bg-white
                    text-center
                    text-lg
                    text-slate-700
                    outline-none
                    focus:border-[#1D60AB]
                    focus:ring-4
                    focus:ring-blue-100
                  "
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={`${shift.key}-end-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={data[shift.key].split}
                  onChange={(e) =>
                    handleChange(
                      shift.key,
                      "split",
                      e.target.value
                    )
                  }
                  className="
                    h-[52px]
                    rounded-[14px]
                    border
                    border-slate-300
                    bg-white
                    text-center
                    text-lg
                    text-slate-700
                    outline-none
                    focus:border-[#1D60AB]
                    focus:ring-4
                    focus:ring-blue-100
                  "
                />

                <button
                  disabled={!editMode}
                  onClick={() =>
                    handleSave(
                      shift.label,
                      shift.key
                    )
                  }
                  className={`
                    h-[52px]
                    text-base
                    font-semibold
                    text-white
                    rounded-[14px]
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                    ${
                      data[shift.key].saved
                        ? "bg-green-600"
                        : "bg-[#1D60AB] hover:bg-[#164f90]"
                    }
                  `}
                >
                  save
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
