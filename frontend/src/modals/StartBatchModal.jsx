import { useEffect, useState } from "react";

import {
  Users,
  Boxes,
  Target,
  X,
} from "lucide-react";

import useAppStore from "../store/useAppStore";

import toast from "react-hot-toast";

export default function StartBatchModal({
  open,
  onClose,
}) {
  const {
    startBatch,
  } = useAppStore();
  const apiBaseUrl =
    import.meta.env
      .VITE_API_BASE_URL ||
    "http://127.0.0.1:8000";

  const initialForm = {
    teamLeader: "",
    lineLeader: "",
    supervisor: "",
    manpower: "",
    shiftTime: "",
  };

  const [form, setForm] =
    useState(initialForm);
  const [batchIncharges, setBatchIncharges] =
    useState([]);
  const [manpowerOptions, setManpowerOptions] =
    useState([]);
  const [models, setModels] =
    useState([]);
  const [selectedBatchInchargeId, setSelectedBatchInchargeId] =
    useState("");
  const [shiftRows, setShiftRows] =
    useState([]);
  const [activeShiftLabel, setActiveShiftLabel] =
    useState("");
  const [activeShiftRow, setActiveShiftRow] =
    useState(null);
  const [splitPlanRows, setSplitPlanRows] =
    useState([]);
  const capitalize = (
    text = ""
  ) =>
    text.replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );

  const toMinutes = (timeValue = "") => {
    const [hours, minutes] =
      timeValue
        .split(":")
        .map(Number);
    return (
      Number(hours || 0) * 60 +
      Number(minutes || 0)
    );
  };

  const isNowWithinShift = (
    startTime,
    endTime,
    nowMinutes
  ) => {
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);

    if (start < end) {
      return (
        nowMinutes >= start &&
        nowMinutes < end
      );
    }

    if (start > end) {
      return (
        nowMinutes >= start ||
        nowMinutes < end
      );
    }

    return true;
  };

  useEffect(() => {
    const fetchBatchIncharges =
      async () => {
        if (!open) return;

        try {
          const response =
            await fetch(
              `${apiBaseUrl}/batch-incharges`
            );
          if (!response.ok) {
            throw new Error();
          }

          const rows =
            await response.json();
          setBatchIncharges(
            Array.isArray(rows)
              ? rows
              : []
          );
        } catch (error) {
          toast.error(
            "Failed to load batch incharges"
          );
        }
      };

    const fetchManpower =
      async () => {
        if (!open) return;

        try {
          const response =
            await fetch(
              `${apiBaseUrl}/manpower`
            );
          if (!response.ok) {
            throw new Error();
          }

          const rows =
            await response.json();
          setManpowerOptions(
            Array.isArray(rows)
              ? rows
              : []
          );
        } catch (error) {
          toast.error(
            "Failed to load man power"
          );
        }
      };

    const fetchModels =
      async () => {
        if (!open) return;

        try {
          const response =
            await fetch(
              `${apiBaseUrl}/models`
            );
          if (!response.ok) {
            throw new Error();
          }

          const rows =
            await response.json();
          setModels(
            Array.isArray(rows)
              ? rows
              : []
          );
        } catch (error) {
          toast.error(
            "Failed to load models"
          );
        }
      };

    const fetchShiftTimings =
      async () => {
        if (!open) return;

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
          if (!Array.isArray(rows) || rows.length === 0) {
            return;
          }

          setShiftRows(rows);

          const now = new Date();
          const nowMinutes =
            now.getHours() * 60 +
            now.getMinutes();

          const currentShift =
            rows.find((row) =>
              isNowWithinShift(
                row.start_time,
                row.end_time,
                nowMinutes
              )
            ) || null;

          if (currentShift) {
            const shiftLabel =
              currentShift.shift_label ||
              currentShift.shift_key ||
              "";
            setActiveShiftLabel(shiftLabel);
            setActiveShiftRow(
              currentShift
            );
            setForm((prev) => ({
              ...prev,
              shiftTime:
                prev.shiftTime ||
                shiftLabel,
            }));
          }
        } catch (error) {
          toast.error(
            "Failed to load shift timings"
          );
        }
      };

    fetchBatchIncharges();
    fetchManpower();
    fetchModels();
    fetchShiftTimings();
  }, [open, apiBaseUrl]);

  useEffect(() => {
    if (!activeShiftRow) {
      setSplitPlanRows([]);
      return;
    }

    const splitCount = Number(
      activeShiftRow.time_split
    );
    if (
      Number.isNaN(splitCount) ||
      splitCount <= 0
    ) {
      setSplitPlanRows([]);
      return;
    }

    const startMinutes =
      toMinutes(
        activeShiftRow.start_time
      );
    const endMinutes =
      toMinutes(
        activeShiftRow.end_time
      );
    const totalMinutes =
      (endMinutes -
        startMinutes +
        24 * 60) %
      (24 * 60);
    const eachMinutes =
      totalMinutes /
      splitCount;

    const rows = [];
    let currentStart =
      startMinutes;

    for (
      let index = 0;
      index < splitCount;
      index += 1
    ) {
      const currentEnd =
        (currentStart +
          eachMinutes) %
        (24 * 60);

      const toClock = (
        minuteValue
      ) => {
        const normalized =
          ((Math.round(minuteValue) %
            (24 * 60)) +
            24 * 60) %
          (24 * 60);
        const hours =
          Math.floor(
            normalized / 60
          );
        const minutes =
          normalized % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      };

      rows.push({
        splitNo: index + 1,
        from: toClock(
          currentStart
        ),
        to: toClock(currentEnd),
        modelId: "",
        target: "",
      });

      currentStart =
        currentEnd;
    }

    setSplitPlanRows(rows);
  }, [activeShiftRow]);

  /* RESET WHEN MODAL CLOSES */
  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setSelectedBatchInchargeId("");
      setBatchIncharges([]);
      setManpowerOptions([]);
      setModels([]);
      setActiveShiftLabel("");
      setActiveShiftRow(null);
      setSplitPlanRows([]);
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleBatchInchargeSelect = (
    e
  ) => {
    const selectedId =
      e.target.value;
    setSelectedBatchInchargeId(
      selectedId
    );

    const selected =
      batchIncharges.find(
        (item) =>
          String(item.id) ===
          selectedId
      );

    if (!selected) {
      setForm((prev) => ({
        ...prev,
        teamLeader: "",
        lineLeader: "",
        supervisor: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      teamLeader:
        selected.team_leader_name ||
        "",
      lineLeader:
        selected.line_leader_name ||
        "",
      supervisor:
        selected.supervisor_name ||
        "",
    }));
  };

  const handleSplitPlanChange = (
    splitIndex,
    field,
    value
  ) => {
    setSplitPlanRows((prev) =>
      prev.map((row, index) =>
        index === splitIndex
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  const handleSubmit = async () => {
    if (
      !selectedBatchInchargeId ||
      !form.manpower
    ) {
      toast.error(
        "Select incharge group and manpower"
      );
      return;
    }
    if (
      splitPlanRows.length === 0
    ) {
      toast.error(
        "No shift split rows found"
      );
      return;
    }

    const hasInvalidSplitRow =
      splitPlanRows.some(
        (row) =>
          !row.modelId ||
          !row.target ||
          Number(row.target) <= 0
      );

    if (hasInvalidSplitRow) {
      toast.error(
        "Fill model and target for all split rows"
      );
      return;
    }

    const activeShiftRow =
      shiftRows.find(
        (row) =>
          (row.shift_label ||
            row.shift_key) ===
          form.shiftTime
      ) || null;

    const shiftStart =
      activeShiftRow?.start_time
        ? toMinutes(
            activeShiftRow.start_time
          ) / 60
        : 6;
    const shiftEnd =
      activeShiftRow?.end_time
        ? toMinutes(
            activeShiftRow.end_time
          ) / 60
        : 14;
    const shiftSplit =
      Number(
        activeShiftRow?.time_split
      ) > 0
        ? 8 /
          Number(
            activeShiftRow.time_split
          )
        : 1;

    const toCycleSeconds = (
      duration,
      unit
    ) => {
      const value =
        Number(duration) || 0;
      if (unit === "hrs") {
        return value * 3600;
      }
      if (unit === "min") {
        return value * 60;
      }
      return value;
    };

    try {
      await startBatch({
        ...form,
        splitPlan: splitPlanRows.map(
          (row) => {
            const selectedModel =
              models.find(
                (model) =>
                  model.model_id ===
                  row.modelId
              ) || null;
            const cycleDuration =
              selectedModel?.cycle_time_duration || 0;
            const cycleUnit =
              selectedModel?.cycle_time_unit || "sec";
            return {
              splitNo: row.splitNo,
              from: row.from,
              to: row.to,
              modelId: row.modelId,
              target: Number(
                row.target
              ),
              cycleTimeDuration:
                cycleDuration,
              cycleTimeUnit:
                cycleUnit,
              cycleTimeSeconds:
                toCycleSeconds(
                  cycleDuration,
                  cycleUnit
                ),
            };
          }
        ),
        shift: {
          start: shiftStart,
          end: shiftEnd,
          split: shiftSplit,
        },
      });

      toast.success(
        "Batch Started Successfully"
      );

      setForm(initialForm);
      onClose();
    } catch (error) {
      toast.error(
        error.message ||
          "Failed to start batch"
      );
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    onClose();
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        bg-black/50
        backdrop-blur-[2px]
        flex
        items-center
        justify-center
        p-4
        overflow-auto
    
      "
    >
      {/* MODAL */}
      <div
        className="
          w-full
          max-w-4xl
          bg-white
          rounded-[28px]
          shadow-2xl
          overflow-hidden
          animate-in
          fade-in
          zoom-in-95
          duration-200
          
        "
      >
        {/* HEADER */}
        <div
          className="
            bg-[#1D60AB]
            px-6
            py-5
            flex
            items-center
            justify-between
          "
        >
          <div>
            <h2
              className="
                text-white
                text-[28px]
                font-bold
              "
            >
              {activeShiftLabel
                ? `${activeShiftLabel}`
                : "Start Batch"}
            </h2>

            <p
              className="
                text-blue-100
                text-sm
                mt-1
              "
            >
              {activeShiftLabel
                ? `Production Batch Setup`
                : "Production Batch Setup"}
            </p>
          </div>

          <button
            onClick={
              handleCancel
            }
            className="
              w-10
              h-10
              rounded-full
              bg-white/20
              flex
              items-center
              justify-center
              text-white
              hover:bg-white/30
              transition-all
            "
          >
            <X size={22} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 md:p-6">
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-[2.3fr_0.9fr]
              gap-4
            "
          >
            {/* BATCH INCHARGES */}
            <div>
              <label
                className="
                  text-sm
                  font-semibold
                  text-slate-700
                  mb-2
                  flex
                  items-center
                  gap-2
                "
              >
                <Users
                  size={16}
                  className="text-[#1D60AB]"
                />
                Batch Incharges
              </label>

              <select
                name="batchIncharge"
                value={
                  selectedBatchInchargeId
                }
                onChange={
                  handleBatchInchargeSelect
                }
                className="
                  w-full
                  h-[50px]
                  rounded-[14px]
                  border
                  border-slate-300
                  px-4
                  text-slate-700
                  outline-none
                  focus:border-[#1D60AB]
                  focus:ring-4
                  focus:ring-blue-100
                  transition-all
                "
              >
                <option value="">
                  Select Incharge Group
                </option>
                {batchIncharges.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {`Team Leader: ${capitalize(
                        item.team_leader_name
                      )} | Line Leader: ${capitalize(
                        item.line_leader_name
                      )} | Supervisor: ${capitalize(
                        item.supervisor_name
                      )}`}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* MANPOWER */}
            <div>
              <label
                className="
                  text-sm
                  font-semibold
                  text-slate-700
                  mb-2
                  flex
                  items-center
                  gap-2
                "
              >
                <Users
                  size={16}
                  className="text-[#1D60AB]"
                />
                Man Power
              </label>

              <select
                name="manpower"
                value={
                  form.manpower
                }
                onChange={
                  handleChange
                }
                className="
                  w-full md:max-w-[180px]
                  h-[50px]
                  rounded-[14px]
                  border
                  border-slate-300
                  px-4
                  text-slate-700
                  outline-none
                  focus:border-[#1D60AB]
                  focus:ring-4
                  focus:ring-blue-100
                "
              >
                <option value="">
                  Select Man Power
                </option>
                {manpowerOptions.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={String(
                        item.count
                      )}
                    >
                      {item.count}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="mt-5 rounded-[18px] border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 bg-[#f8fafc] border-b border-slate-200 flex items-center justify-between gap-3">
              <p className="text-[17px] font-bold text-slate-800">
                Split-wise Target and Model
              </p>
              <p className="text-sm font-semibold text-[#1D60AB]">
                {activeShiftLabel
                  ? `${activeShiftLabel} - ${splitPlanRows.length} splits`
                  : `${splitPlanRows.length} splits`}
              </p>
            </div>

            <div className="px-4 py-3">
              <div className="hidden md:grid grid-cols-[160px_1fr_160px] gap-3 px-1 mb-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Split Time
                </p>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Model
                </p>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Target
                </p>
              </div>

              <div className="space-y-2">
              {splitPlanRows.map(
                (row, index) => (
                  <div
                    key={`split-${row.splitNo}`}
                    className="grid grid-cols-1 md:grid-cols-[160px_1fr_160px] gap-3 p-2 rounded-[14px] border border-slate-200 bg-slate-50"
                  >
                    <div className="h-[46px] rounded-[12px] border border-slate-300 bg-white px-3 flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>{row.from}</span>
                      <span className="text-slate-400">to</span>
                      <span>{row.to}</span>
                    </div>

                    <div>
                      <label className="md:hidden text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                        <Boxes
                          size={14}
                          className="text-[#1D60AB]"
                        />
                        Model
                      </label>
                      <select
                        value={
                          row.modelId
                        }
                        onChange={(e) =>
                          handleSplitPlanChange(
                            index,
                            "modelId",
                            e.target.value
                          )
                        }
                        className="
                          w-full
                          h-[46px]
                          rounded-[12px]
                          border
                          border-slate-300
                          px-4
                          text-slate-700
                          outline-none
                          focus:border-[#1D60AB]
                          focus:ring-4
                          focus:ring-blue-100
                          bg-white
                        "
                      >
                        <option value="">
                          Select Model
                        </option>
                        {models.map(
                          (model) => (
                            <option
                              key={
                                model.id
                              }
                              value={
                                model.model_id
                              }
                            >
                              {
                                model.model_id
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="md:hidden text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                        <Target
                          size={14}
                          className="text-[#1D60AB]"
                        />
                        Target
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={
                          row.target
                        }
                        onChange={(e) =>
                          handleSplitPlanChange(
                            index,
                            "target",
                            e.target.value
                          )
                        }
                        placeholder="Target"
                        className="
                          w-full
                          h-[46px]
                          rounded-[12px]
                          border
                          border-slate-300
                          px-4
                          text-slate-700
                          outline-none
                          focus:border-[#1D60AB]
                          focus:ring-4
                          focus:ring-blue-100
                          bg-white
                        "
                      />
                    </div>
                  </div>
                )
              )}
              </div>
            </div>
          </div>

          {/* BUTTONS */}
          <div
            className="
              flex
              flex-col
              sm:flex-row
              justify-end
              gap-3
              mt-8
            "
          >
            <button
              onClick={
                handleCancel
              }
              className="
                h-[52px]
                px-6
                rounded-xl
                border
                border-slate-300
                bg-white
                text-slate-700
                font-semibold
                hover:bg-slate-100
                transition-all
              "
            >
              Cancel
            </button>

            <button
              onClick={
                handleSubmit
              }
              className="
                h-[52px]
                px-8
                rounded-xl
                bg-[#1D60AB]
                hover:bg-[#174d8b]
                text-white
                font-semibold
                shadow-lg
                transition-all
              "
            >
              Save Batch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
