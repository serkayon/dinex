import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Coffee,
  Pencil,
  Plus,
  X,
} from "lucide-react";

import toast from "react-hot-toast";

export default function ShiftSplitting() {
  const [shiftData, setShiftData] =
    useState({
      shiftA: {
        start: "06:00",
        end: "14:00",
        split: 8,
      },
      shiftB: {
        start: "14:00",
        end: "22:00",
        split: 8,
      },
      shiftC: {
        start: "22:00",
        end: "06:00",
        split: 8,
      },
    });
  const apiBaseUrl =
    import.meta.env
      .VITE_API_BASE_URL;

  const fetchShiftTimings =
    useCallback(async () => {
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

        setShiftData((prev) => {
          const nextShiftData = {
            ...prev,
          };
          rows.forEach((row) => {
            if (
              row.shift_key &&
              nextShiftData[
                row.shift_key
              ]
            ) {
              nextShiftData[
                row.shift_key
              ] = {
                start: row.start_time,
                end: row.end_time,
                split: Number(
                  row.time_split
                ),
              };
            }
          });
          return nextShiftData;
        });
      } catch (error) {
        toast.error(
          "Failed to load shift timing"
        );
      }
    }, [apiBaseUrl]);


  /* =========================
      ACTIVE SHIFT
  ========================= */

  const [activeShift, setActiveShift] =
    useState("shiftA");

  /* =========================
      EDIT MODE
  ========================= */

  const [editMode, setEditMode] =
    useState(false);

  /* =========================
      BREAK MODAL
  ========================= */

  const [openModal, setOpenModal] =
    useState(false);

  const [selectedSlot, setSelectedSlot] =
    useState(null);

  /* =========================
      BREAKS
  ========================= */

  const [breaks, setBreaks] =
    useState([]);

  /* =========================
      BREAK FORM
  ========================= */

  const [form, setForm] = useState({
    type: "",
    duration: "",
    breakFrom: "",
    breakTo: "",
  });

  const toRailwayTime = (
    value
  ) => {
    const normalized =
      ((Math.round(value) %
        (24 * 60)) +
        24 * 60) %
      (24 * 60);
    const hour = Math.floor(
      normalized / 60
    );
    const minute =
      normalized % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  };

  const railwayToMinutes = (
    timeValue
  ) => {
    const [hours, minutes] =
      timeValue
        .split(":")
        .map(Number);
    return (
      hours * 60 + minutes
    );
  };

  const minutesBetween = (
    startTime,
    endTime
  ) =>
    (railwayToMinutes(
      endTime
    ) -
      railwayToMinutes(
        startTime
      ) +
      24 * 60) %
    (24 * 60);

  const resolveSlotAbsoluteMinute = (
    slotStartMinute,
    clockMinute
  ) => {
    let absoluteMinute =
      clockMinute;
    if (
      absoluteMinute <
      slotStartMinute
    ) {
      absoluteMinute +=
        24 * 60;
    }
    return absoluteMinute;
  };

  const fetchShiftBreaks =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            `${apiBaseUrl}/shift-breaks`
          );
        if (!response.ok) {
          throw new Error();
        }
        const rows =
          await response.json();
        setBreaks(rows);
      } catch (error) {
        toast.error(
          "Failed to load shift breaks"
        );
      }
    }, [apiBaseUrl]);

  useEffect(() => {
    fetchShiftTimings();
    fetchShiftBreaks();

    const handleShiftTimingUpdate =
      () => {
        fetchShiftTimings();
      };

    window.addEventListener(
      "shift-timing-updated",
      handleShiftTimingUpdate
    );

    return () => {
      window.removeEventListener(
        "shift-timing-updated",
        handleShiftTimingUpdate
      );
    };
  }, [
    fetchShiftTimings,
    fetchShiftBreaks,
  ]);

  /* =========================
      GENERATE SPLITS
  ========================= */

  const splitRows = useMemo(() => {
    const current =
      shiftData[activeShift];

    if (
      !current ||
      !current.split ||
      Number(current.split) <= 0
    )
      return [];

    const toMinutes = (
      timeValue
    ) => {
      const [hours, minutes] =
        timeValue
          .split(":")
          .map(Number);
      return (
        hours * 60 +
        minutes
      );
    };

    const startMinutes =
      toMinutes(
        current.start
      );
    const endMinutes =
      toMinutes(current.end);

    const totalMinutes =
      (endMinutes -
        startMinutes +
        24 * 60) %
      (24 * 60);
    const eachMinutes =
      totalMinutes /
      Number(current.split);

    const rows = [];

    let start = startMinutes;

    for (
      let i = 0;
      i <
      Number(current.split);
      i++
    ) {
      const end =
        (start +
          eachMinutes) %
        (24 * 60);

      rows.push({
        id: i,
        start,
        end,
        totalMinutes:
          eachMinutes,
      });

      start = end;
    }

    return rows;
  }, [activeShift, shiftData]);

  const breakTimeOptions =
    useMemo(() => {
      if (!selectedSlot) {
        return [];
      }

      const options = [];
      for (
        let minuteOffset = 0;
        minuteOffset <=
        selectedSlot.totalMinutes;
        minuteOffset += 5
      ) {
        options.push(
          toRailwayTime(
            selectedSlot.start +
              minuteOffset
          )
        );
      }
      return options;
    }, [selectedSlot]);

  /* =========================
      FORMAT TIME
  ========================= */

  const formatTime = (
    value
  ) => {
    const normalized =
      ((Math.round(value) %
        (24 * 60)) +
        24 * 60) %
      (24 * 60);
    const hour = Math.floor(
      normalized / 60
    );
    const minute =
      normalized % 60;

    const formattedHour =
      String(hour).padStart(
        2,
        "0"
      );
    const formattedMinute =
      String(minute).padStart(
        2,
        "0"
      );

    return `${formattedHour}:${formattedMinute}`;
  };

  /* =========================
      OPEN BREAK
  ========================= */

  const handleOpenBreak =
    (slot) => {
      setSelectedSlot(slot);

      setOpenModal(true);

      setForm({
        type: "",
        duration: "",
        breakFrom: "",
        breakTo: "",
      });
    };

  /* =========================
      SAVE BREAK
  ========================= */

  const handleSaveBreak =
    async () => {
      if (!form.type) {
        toast.error(
          "Select break type"
        );
        return;
      }

      if (!form.duration) {
        toast.error(
          "Select break duration"
        );
        return;
      }

      if (!form.breakFrom) {
        toast.error(
          "Select break from time"
        );
        return;
      }

      if (!form.breakTo) {
        toast.error(
          "Select break to time"
        );
        return;
      }

      if (!selectedSlot) {
        toast.error(
          "No split selected"
        );
        return;
      }

      const durationNumber =
        Number(form.duration);
      if (
        durationNumber <= 0 ||
        durationNumber >
          selectedSlot.totalMinutes
      ) {
        toast.error(
          "Invalid break duration for this split"
        );
        return;
      }

      const fromMinutes =
        railwayToMinutes(
          form.breakFrom
        );
      const toMinutes =
        railwayToMinutes(
          form.breakTo
        );
      const splitStartMinutes =
        railwayToMinutes(
          toRailwayTime(
            selectedSlot.start
          )
        );
      const splitEndAbsoluteMinutes =
        splitStartMinutes +
        Number(
          selectedSlot.totalMinutes
        );
      const fromAbsoluteMinutes =
        resolveSlotAbsoluteMinute(
          splitStartMinutes,
          fromMinutes
        );
      const toAbsoluteMinutes =
        resolveSlotAbsoluteMinute(
          splitStartMinutes,
          toMinutes
        );

      if (
        toAbsoluteMinutes <=
        fromAbsoluteMinutes
      ) {
        toast.error(
          "Break To must be after Break From"
        );
        return;
      }

      if (
        fromAbsoluteMinutes <
          splitStartMinutes ||
        toAbsoluteMinutes >
          splitEndAbsoluteMinutes
      ) {
        toast.error(
          "Break time must be within selected split"
        );
        return;
      }

      const selectedDuration =
        toAbsoluteMinutes -
        fromAbsoluteMinutes;
      if (selectedDuration !== durationNumber) {
        toast.error(
          `Break duration mismatch. Selected time is ${selectedDuration} min`
        );
        return;
      }

      try {
        const response =
          await fetch(
            `${apiBaseUrl}/shift-breaks`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                shift_key:
                  activeShift,
                split_start_time:
                  toRailwayTime(
                    selectedSlot.start
                  ),
                split_end_time:
                  toRailwayTime(
                    selectedSlot.end
                  ),
                break_type:
                  form.type,
                duration_minutes:
                  durationNumber,
                break_start_time:
                  form.breakFrom,
                break_end_time:
                  form.breakTo,
              }),
            }
          );
        if (!response.ok) {
          const errorBody =
            await response.json();
          throw new Error(
            errorBody.detail ||
              "Failed to add break"
          );
        }

        const createdBreak =
          await response.json();
        setBreaks([
          createdBreak,
          ...breaks,
        ]);

        toast.success(
          "Break Added"
        );
        setOpenModal(false);
      } catch (error) {
        toast.error(
          error.message ||
            "Failed to add break"
        );
      }
    };

  /* =========================
      DELETE BREAK
  ========================= */

  const handleDeleteBreak =
    async (breakId) => {
      try {
        const response =
          await fetch(
            `${apiBaseUrl}/shift-breaks/${breakId}`,
            {
              method: "DELETE",
            }
          );
        if (!response.ok) {
          throw new Error();
        }

        setBreaks(
          breaks.filter(
            (item) =>
              item.id !== breakId
          )
        );

        toast.success(
          "Break Removed"
        );
      } catch (error) {
        toast.error(
          "Failed to remove break"
        );
      }
    };

  return (
    <>
      {/* =========================
          MAIN CARD
      ========================= */}

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
        {/* HEADER */}
        <div
          className="
            flex
            items-center
            justify-between
            gap-4
            mb-6
          "
        >
          <div>
            <h2
              className="
                text-[24px]
                font-bold
                text-slate-800
              "
            >
              Shift Splitting
            </h2>

            <p
              className="
                text-sm
                text-slate-500
                mt-1
              "
            >
              Automatic split
              generation with
              break management
            </p>
          </div>

          {/* EDIT MODE */}
          <button
            onClick={() =>
              setEditMode(
                !editMode
              )
            }
            className={`
              h-[44px]
              px-5
              rounded-[14px]
              font-semibold
              transition-all
              ${editMode
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-[#1D60AB]"
              }
            `}
          >
            {editMode
              ? "Exit Edit"
              : "Edit Mode"}
          </button>
        </div>

        {/* SHIFT BUTTONS */}
        <div
          className="
            flex
            flex-wrap
            gap-3
            mb-7
          "
        >
          {[
            {
              key: "shiftA",
              label:
                "Shift A",
            },

            {
              key: "shiftB",
              label:
                "Shift B",
            },

            {
              key: "shiftC",
              label:
                "Shift C",
            },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() =>
                setActiveShift(
                  item.key
                )
              }
              className={`
                h-[50px]
                px-7
                rounded-[16px]
                font-semibold
                text-[17px]
                transition-all
                ${activeShift ===
                    item.key
                    ? "bg-[#1D60AB] text-white shadow-md"
                    : "bg-slate-100 text-slate-700"
                  }
              `}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* SPLITS */}
        <div className="space-y-4">
          {splitRows.map(
            (slot) => {
              const slotBreaks =
                breaks
                  .filter(
                    (
                      item
                    ) =>
                      item.shift_key ===
                        activeShift &&
                      item.split_start_time ===
                        toRailwayTime(
                          slot.start
                        ) &&
                      item.split_end_time ===
                        toRailwayTime(
                          slot.end
                        )
                  )
                  .map((item) => {
                    const splitStartAbsoluteMinutes =
                      slot.start;
                    const splitEndAbsoluteMinutes =
                      splitStartAbsoluteMinutes +
                      slot.totalMinutes;
                    const breakStartAbsoluteMinutes =
                      resolveSlotAbsoluteMinute(
                        splitStartAbsoluteMinutes,
                        railwayToMinutes(
                          item.break_start_time
                        )
                      );
                    const breakEndAbsoluteMinutesRaw =
                      resolveSlotAbsoluteMinute(
                        splitStartAbsoluteMinutes,
                        railwayToMinutes(
                          item.break_end_time
                        )
                      );
                    const breakEndAbsoluteMinutes =
                      breakEndAbsoluteMinutesRaw <=
                      breakStartAbsoluteMinutes
                        ? breakEndAbsoluteMinutesRaw +
                          24 * 60
                        : breakEndAbsoluteMinutesRaw;

                    return {
                      ...item,
                      startAbsoluteMinutes:
                        Math.max(
                          splitStartAbsoluteMinutes,
                          Math.min(
                            breakStartAbsoluteMinutes,
                            splitEndAbsoluteMinutes
                          )
                        ),
                      endAbsoluteMinutes:
                        Math.max(
                          splitStartAbsoluteMinutes,
                          Math.min(
                            breakEndAbsoluteMinutes,
                            splitEndAbsoluteMinutes
                          )
                        ),
                    };
                  })
                  .sort(
                    (
                      first,
                      second
                    ) =>
                      first.startAbsoluteMinutes -
                      second.startAbsoluteMinutes
                  );

              const usedMinutes =
                slotBreaks.reduce(
                  (
                    total,
                    item
                  ) =>
                    total +
                    (Number(
                      item.duration_minutes
                    ) || 0),
                  0
                );

              const finalMinutes =
                slot.totalMinutes -
                usedMinutes;

              return (
                <div
                  key={slot.id}
                  className="
                    bg-[#f8fafc]
                    border
                    border-slate-200
                    rounded-[22px]
                    p-4
                  "
                >
                  <div
                    className="
                      flex
                      flex-col
                      xl:flex-row
                      xl:items-center
                      gap-4
                    "
                  >
                    {/* TIME */}
                    <div
                      className="
                        min-w-[170px]
                      "
                    >
                      <h3
                        className="
                          text-[17px]
                          font-bold
                          text-slate-800
                        "
                      >
                        {formatTime(
                          slot.start
                        )}{" "}
                        -
                        {" "}
                        {formatTime(
                          slot.end
                        )}
                      </h3>

                      <p
                        className="
                          text-sm
                          text-[#1D60AB]
                          font-semibold
                          mt-1
                        "
                      >
                        {finalMinutes}{" "}
                        min
                      </p>
                    </div>

                    {/* BREAK BUTTON */}
                    <button
                      onClick={() =>
                        handleOpenBreak(
                          slot
                        )
                      }
                      className="
                        h-[42px]
                        px-4
                        rounded-[14px]
                        bg-[#1D60AB]
                        hover:bg-[#164f90]
                        text-white
                        flex
                        items-center
                        justify-center
                        gap-2
                        text-sm
                        font-semibold
                        transition-all
                        w-fit
                      "
                    >
                      <Plus
                        size={16}
                      />

                      Add Break
                    </button>

                    {/* BREAKS */}
                    <div
                      className="
                        flex-1
                        min-w-[280px]
                      "
                    >
                      {slotBreaks.length ===
                        0 && (
                          <div
                            className="
                              text-sm
                              text-slate-400
                              py-2
                            "
                          >
                            No
                            breaks
                            added
                          </div>
                        )}

                      {slotBreaks.length >
                        0 && (
                          <div
                            className="
                              relative
                              w-full
                              h-[98px]
                              rounded-[16px]
                              border
                              border-slate-200
                              bg-slate-50
                              overflow-hidden
                            "
                          >
                            <div
                              className="
                                absolute
                                left-0
                                right-0
                                top-1/2
                                h-[2px]
                                -translate-y-1/2
                                bg-slate-200
                              "
                            />
                            {slotBreaks.map(
                              (
                                item,
                                index
                              ) => (
                                <div
                                  key={
                                    item.id ??
                                    index
                                  }
                                  className="
                                    absolute
                                    top-2
                                    bottom-2
                                    bg-[#fff3e8]
                                    border
                                    border-[#ffcf9c]
                                    rounded-[16px]
                                    px-3
                                    py-2
                                    overflow-hidden
                                  "
                                  style={{
                                    left: `${((item.startAbsoluteMinutes - slot.start) / slot.totalMinutes) * 100}%`,
                                    width: `${Math.max((((item.endAbsoluteMinutes - item.startAbsoluteMinutes) / slot.totalMinutes) * 100), 10)}%`,
                                  }}
                                >
                                  {/* DELETE */}
                                  {editMode && (
                                    <button
                                      onClick={() =>
                                        handleDeleteBreak(
                                          item.id
                                        )
                                      }
                                      className="
                                        absolute
                                        -top-2
                                        -right-2
                                        w-6
                                        h-6
                                        rounded-full
                                        bg-red-500
                                        text-white
                                        flex
                                        items-center
                                        justify-center
                                      "
                                    >
                                      <X
                                        size={
                                          13
                                        }
                                      />
                                    </button>
                                  )}

                                  <div className="flex items-center gap-2">
                                    <Coffee
                                      size={
                                        15
                                      }
                                      className="text-[#ff7a00]"
                                    />

                                    <p
                                      className="
                                        text-sm
                                        font-bold
                                        text-slate-700
                                        truncate
                                      "
                                    >
                                      {
                                        item.break_type
                                      }
                                    </p>
                                  </div>

                                  <p
                                    className="
                                      text-xs
                                      text-slate-500
                                      mt-1
                                      truncate
                                    "
                                  >
                                    {
                                      item.duration_minutes
                                    }{" "}
                                    Minutes
                                  </p>
                                  <p
                                    className="
                                      text-xs
                                      text-slate-500
                                      mt-1
                                      truncate
                                    "
                                  >
                                    {item.break_start_time} -{" "}
                                    {item.break_end_time}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        )}

                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* =========================
          BREAK MODAL
      ========================= */}

      {openModal && (
        <div
          className="
            fixed
            inset-0
            bg-black/40
            flex
            items-center
            justify-center
            z-50
            p-4
          "
        >
          <div
            className="
              bg-white
              rounded-[28px]
              p-6
              w-full
              max-w-[420px]
              shadow-2xl
            "
          >
            {/* TITLE */}
            <h2
              className="
                text-[24px]
                font-bold
                text-slate-800
                mb-5
              "
            >
              Add Break
            </h2>

            {/* BREAK TYPE */}
            <div className="mb-4">
              <label
                className="
                  text-sm
                  font-semibold
                  text-slate-700
                  mb-2
                  block
                "
              >
                Break Type
              </label>

              <select
                value={
                  form.type
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    type: e
                      .target
                      .value,
                  })
                }
                className="
                  w-full
                  h-[52px]
                  rounded-[16px]
                  border
                  border-slate-300
                  px-4
                  outline-none
                  bg-white
                "
              >
                <option value="">
                  Select Break
                </option>
              <option>
                  Breakfast
                </option>
             

                <option>
                  Lunch
                </option>

                <option>
                  Dinner
                </option>
               <option>
                  Tea Break
                </option>
                     <option>
              General Meeting
                </option>
              </select>
            </div>

            {/* DURATION */}
            <div className="mb-6">
              <label
                className="
                  text-sm
                  font-semibold
                  text-slate-700
                  mb-2
                  block
                "
              >
                Break Duration
              </label>

              <select
                value={
                  form.duration
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    duration:
                      e.target
                        .value,
                  })
                }
                className="
                  w-full
                  h-[52px]
                  rounded-[16px]
                  border
                  border-slate-300
                  px-4
                  outline-none
                  bg-white
                "
              >
                <option value="">
                  Select Time
                </option>

                <option>
                  10
                </option>

                <option>
                  20
                </option>

                <option>
                  30
                </option>

                <option>
                  40
                </option>

                <option>
                  50
                </option>

                <option>
                  60
                </option>
              </select>
            </div>

            <div className="mb-4">
              <label
                className="
                  text-sm
                  font-semibold
                  text-slate-700
                  mb-2
                  block
                "
              >
                Break From
              </label>

              <select
                value={
                  form.breakFrom
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    breakFrom:
                      e.target.value,
                  })
                }
                className="
                  w-full
                  h-[52px]
                  rounded-[16px]
                  border
                  border-slate-300
                  px-4
                  outline-none
                  bg-white
                "
              >
                <option value="">
                  Select From
                </option>
                {breakTimeOptions.map(
                  (time) => (
                    <option
                      key={`from-${time}`}
                      value={time}
                    >
                      {time}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="mb-6">
              <label
                className="
                  text-sm
                  font-semibold
                  text-slate-700
                  mb-2
                  block
                "
              >
                Break To
              </label>

              <select
                value={form.breakTo}
                onChange={(e) =>
                  setForm({
                    ...form,
                    breakTo:
                      e.target.value,
                  })
                }
                className="
                  w-full
                  h-[52px]
                  rounded-[16px]
                  border
                  border-slate-300
                  px-4
                  outline-none
                  bg-white
                "
              >
                <option value="">
                  Select To
                </option>
                {breakTimeOptions.map(
                  (time) => (
                    <option
                      key={`to-${time}`}
                      value={time}
                    >
                      {time}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3">
              <button
                onClick={
                  handleSaveBreak
                }
                className="
                  flex-1
                  h-[50px]
                  rounded-[16px]
                  bg-[#1D60AB]
                  hover:bg-[#164f90]
                  text-white
                  font-semibold
                "
              >
                Add Break
              </button>

              <button
                onClick={() =>
                  setOpenModal(
                    false
                  )
                }
                className="
                  flex-1
                  h-[50px]
                  rounded-[16px]
                  bg-slate-200
                  hover:bg-slate-300
                  text-slate-700
                  font-semibold
                "
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
