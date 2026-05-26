import { useEffect, useState } from "react";

import {
  TimerReset,
  Pencil,
  X,
} from "lucide-react";

import toast from "react-hot-toast";

export default function DowntimeAssign() {
  const [rows, setRows] =
    useState([]);
  const [isLoading, setIsLoading] =
    useState(false);
  const [isSaving, setIsSaving] =
    useState(false);

  const [editMode, setEditMode] =
    useState(false);

  const [form, setForm] =
    useState({
      type: "",
      details: "",
      timeType: "fixed",
      fixedTime: "10 min",
    });
  const apiBaseUrl =
    import.meta.env
      .VITE_API_BASE_URL ||
    "http://127.0.0.1:8000";

  const fetchDowntimes =
    async () => {
      setIsLoading(true);
      try {
        const response =
          await fetch(
            `${apiBaseUrl}/downtimes`
          );
        if (!response.ok) {
          throw new Error();
        }
        const data =
          await response.json();
        setRows(data);
      } catch (error) {
        toast.error(
          "Failed to load downtimes"
        );
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchDowntimes();
  }, []);

  /* =========================
      SAVE
  ========================= */

  const handleSave = async () => {
    if (!form.type.trim()) {
      toast.error(
        "Downtime type required"
      );
      return;
    }

    if (
      !form.details.trim()
    ) {
      toast.error(
        "Details required"
      );
      return;
    }

    const fixedMinutes =
      form.timeType === "fixed"
        ? Number(
            form.fixedTime.replace(
              " min",
              ""
            )
          )
        : null;

    setIsSaving(true);
    try {
      const response =
        await fetch(
          `${apiBaseUrl}/downtimes`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              downtime_type:
                form.type.trim(),
              details:
                form.details.trim(),
              time_type:
                form.timeType,
              fixed_minutes:
                fixedMinutes,
            }),
          }
        );
      if (!response.ok) {
        const errorBody =
          await response.json();
        throw new Error(
          errorBody.detail ||
            "Failed to save downtime"
        );
      }
      const created =
        await response.json();
      setRows([
        created,
        ...rows,
      ]);
      toast.success(
        "Downtime Added"
      );
      setForm({
        type: "",
        details: "",
        timeType: "fixed",
        fixedTime: "10 min",
      });
    } catch (error) {
      toast.error(
        error.message ||
          "Failed to save downtime"
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =========================
      DELETE
  ========================= */

  const handleDelete = async (
    index
  ) => {
    const selected = rows[index];
    if (!selected?.id) {
      toast.error(
        "Invalid record"
      );
      return;
    }
    try {
      const response =
        await fetch(
          `${apiBaseUrl}/downtimes/${selected.id}`,
          {
            method: "DELETE",
          }
        );
      if (!response.ok) {
        throw new Error();
      }
      setRows(
        rows.filter(
          (_, i) => i !== index
        )
      );
      toast.success(
        "Deleted Successfully"
      );
    } catch (error) {
      toast.error(
        "Failed to delete"
      );
    }
  };

  /* =========================
      CLEAR
  ========================= */

  const handleClear = () => {
    setForm({
      type: "",
      details: "",
      timeType: "fixed",
      fixedTime: "10 min",
    });
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
      {/* =========================
          HEADER
      ========================= */}

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
              md:text-[28px]
              font-bold
              text-[#0f172a]
            "
          >
            Downtime Assign
          </h2>

          <p
            className="
              text-slate-500
              text-sm
              mt-1
            "
          >
            Configure downtime
            reasons and timings
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
            h-[46px]
            px-5
            rounded-[14px]
            flex
            items-center
            gap-2
            font-semibold
            transition-all
            ${
              editMode
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-[#1D60AB]"
            }
          `}
        >
          <Pencil size={18} />

          {editMode
            ? "Exit Edit"
            : "Edit Mode"}
        </button>
      </div>

      {/* =========================
          FORM CARD
      ========================= */}

      <div
        className="
          bg-[#f8fafc]
          rounded-[24px]
          p-5
          border
          border-slate-200
        "
      >
        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-3
            gap-4
          "
        >
          {/* TYPE */}
          <div>
            <label
              className="
                text-sm
                font-semibold
                text-slate-700
                mb-2
                block
              "
            >
              Downtime Type
            </label>

            <input
              type="text"
              placeholder="Material"
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type:
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
                text-slate-700
                bg-white
                focus:border-[#1D60AB]
                focus:ring-4
                focus:ring-blue-100
              "
            />
          </div>

          {/* DETAILS */}
          <div>
            <label
              className="
                text-sm
                font-semibold
                text-slate-700
                mb-2
                block
              "
            >
              Details
            </label>

            <input
              type="text"
              placeholder="Explain downtime"
              value={
                form.details
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  details:
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
                text-slate-700
                bg-white
                focus:border-[#1D60AB]
                focus:ring-4
                focus:ring-blue-100
              "
            />
          </div>

          {/* TIME SECTION */}
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
              <TimerReset
                size={16}
                className="text-[#1D60AB]"
              />

              Time
            </label>

            {/* FIXED / VARIABLE */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    timeType:
                      "fixed",
                  })
                }
                className={`
                  flex-1
                  h-[45px]
                  rounded-[14px]
                  font-semibold
                  transition-all
                  ${
                    form.timeType ===
                    "fixed"
                      ? "bg-[#1D60AB] text-white"
                      : "bg-white border border-slate-300 text-slate-700"
                  }
                `}
              >
                Fixed
              </button>

              <button
                onClick={() =>
                  setForm({
                    ...form,
                    timeType:
                      "variable",
                  })
                }
                className={`
                  flex-1
                  h-[45px]
                  rounded-[14px]
                  font-semibold
                  transition-all
                  ${
                    form.timeType ===
                    "variable"
                      ? "bg-[#1D60AB] text-white"
                      : "bg-white border border-slate-300 text-slate-700"
                  }
                `}
              >
                Variable
              </button>
            </div>

            {/* FIXED TIME */}
            {form.timeType ===
    "fixed" ? (
      
      <input
        type="number"
        placeholder="Enter Time"
        value={form.fixedTime}
        onChange={(e) =>
          setForm({
            ...form,
            fixedTime:
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
                focus:border-[#1D60AB]
                focus:ring-4
                focus:ring-blue-100
        "
      />
    ): (
              <div
                className="
                  h-[52px]
                  rounded-[16px]
                  border
                  border-dashed
                  border-slate-300
                  px-4
                  flex
                  items-center
                  text-slate-500
                  text-sm
                  bg-white
                "
              >
                Variable downtime does not require time input
              </div>
            )}
          </div>
        </div>

        {/* BUTTONS */}
        <div
          className="
            flex
            flex-col
            sm:flex-row
            gap-3
            mt-6
          "
        >
          {/* SAVE */}
          <button
            onClick={
              handleSave
            }
            disabled={isSaving}
            className="
              sm:w-[180px]
              h-[52px]
              rounded-[16px]
              bg-[#1D60AB]
              hover:bg-[#164f90]
              text-white
              font-semibold
              shadow-md
              transition-all
              disabled:opacity-60
            "
          >
            {isSaving
              ? "Saving..."
              : "Save"}
          </button>

          {/* CLEAR */}
          <button
            onClick={
              handleClear
            }
            className="
              sm:w-[180px]
              h-[52px]
              rounded-[16px]
              bg-slate-200
              hover:bg-slate-300
              text-slate-700
              font-semibold
              transition-all
            "
          >
            Clear
          </button>
        </div>
      </div>

      {/* =========================
          TABLE
      ========================= */}

      <div
        className="
          overflow-x-auto
          mt-6
          border
          border-slate-200
          rounded-[24px]
        "
      >
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-[#f8fafc]">
              <th
                className="
                  px-5
                  py-4
                  text-left
                  text-sm
                  font-bold
                  text-slate-700
                  border-b
                  border-slate-200
                "
              >
                Type
              </th>

              <th
                className="
                  px-5
                  py-4
                  text-left
                  text-sm
                  font-bold
                  text-slate-700
                  border-b
                  border-slate-200
                "
              >
                Details
              </th>

              <th
                className="
                  px-5
                  py-4
                  text-left
                  text-sm
                  font-bold
                  text-slate-700
                  border-b
                  border-slate-200
                "
              >
                Time
              </th>

              {editMode && (
                <th
                  className="
                    px-5
                    py-4
                    text-center
                    text-sm
                    font-bold
                    text-slate-700
                    border-b
                    border-slate-200
                  "
                >
                  Delete
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {rows.length ===
              0 && !isLoading ? (
              <tr>
                <td
                  colSpan={
                    editMode
                      ? 4
                      : 3
                  }
                  className="
                    py-10
                    text-center
                    text-slate-400
                    text-sm
                  "
                >
                  No downtime data
                </td>
              </tr>
            ) : isLoading ? (
              <tr>
                <td
                  colSpan={
                    editMode
                      ? 4
                      : 3
                  }
                  className="
                    py-10
                    text-center
                    text-slate-400
                    text-sm
                  "
                >
                  Loading downtime data...
                </td>
              </tr>
            ) : (
              rows.map(
                (
                  row,
                  index
                ) => (
                  <tr
                    key={index}
                    className="
                      border-b
                      border-slate-100
                    "
                  >
                    {/* TYPE */}
                    <td
                      className="
                        px-5
                        py-4
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      {row.downtime_type || row.type}
                    </td>

                    {/* DETAILS */}
                    <td
                      className="
                        px-5
                        py-4
                        text-sm
                        text-slate-600
                      "
                    >
                      {
                        row.details
                      }
                    </td>

                    {/* TIME */}
                    <td
                      className="
                        px-5
                        py-4
                      "
                    >
                      <span
                        className="
                          inline-flex
                          items-center
                          px-3
                          py-1.5
                          rounded-full
                          text-xs
                          font-semibold
                          bg-blue-100
                          text-[#1D60AB]
                        "
                      >
                        {(row.time_type || row.timeType) ===
                        "fixed"
                          ? row.fixed_minutes != null
                            ? `${row.fixed_minutes} min`
                            : row.fixedTime
                          : "Variable"}
                      </span>
                    </td>

                    {/* DELETE */}
                    {editMode && (
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() =>
                            handleDelete(
                              index
                            )
                          }
                          className="
                            w-8
                            h-8
                            rounded-full
                            bg-red-500
                            text-white
                            inline-flex
                            items-center
                            justify-center
                          "
                        >
                          <X
                            size={
                              14
                            }
                          />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
