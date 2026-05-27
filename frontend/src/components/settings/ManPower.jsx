import { useEffect, useState } from "react";

import {
  Users,
  Pencil,
  X,
} from "lucide-react";

import toast from "react-hot-toast";

export default function ManPower() {
  const [manpower, setManpower] =
    useState([]);
  const [isLoading, setIsLoading] =
    useState(false);
  const [isSaving, setIsSaving] =
    useState(false);

  const [editMode, setEditMode] =
    useState(false);

  const [count, setCount] =
    useState("");
  const apiBaseUrl =
    import.meta.env
      .VITE_API_BASE_URL;

  const fetchManpower =
    async () => {
      setIsLoading(true);
      try {
        const response =
          await fetch(
            `${apiBaseUrl}/manpower`
          );
        if (!response.ok) {
          throw new Error();
        }
        const data =
          await response.json();
        setManpower(data);
      } catch (error) {
        toast.error(
          "Failed to load man power"
        );
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchManpower();
  }, []);

  /* =========================
      SAVE
  ========================= */

  const handleSave = async () => {
    if (!count) {
      toast.error(
        "Man power count required"
      );
      return;
    }

    const numericCount =
      Number(count);

    if (
      Number.isNaN(
        numericCount
      ) ||
      numericCount <= 0
    ) {
      toast.error(
        "Enter valid count"
      );
      return;
    }

    setIsSaving(true);
    try {
      const response =
        await fetch(
          `${apiBaseUrl}/manpower`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              count: numericCount,
            }),
          }
        );
      if (!response.ok) {
        throw new Error();
      }

      const created =
        await response.json();
      setManpower([
        created,
        ...manpower,
      ]);
      toast.success(
        "Man Power Added"
      );
      setCount("");
    } catch (error) {
      toast.error(
        "Failed to save man power"
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
    const selected =
      manpower[index];
    if (!selected?.id) {
      toast.error(
        "Invalid record"
      );
      return;
    }

    try {
      const response =
        await fetch(
          `${apiBaseUrl}/manpower/${selected.id}`,
          {
            method: "DELETE",
          }
        );
      if (!response.ok) {
        throw new Error();
      }
      setManpower(
        manpower.filter(
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
    setCount("");
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
            Man Power
          </h2>

          <p
            className="
              text-slate-500
              text-sm
              mt-1
            "
          >
            Configure manpower count
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
            lg:grid-cols-2
            gap-4
          "
        >
          {/* COUNT */}
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

              Man Power Count
            </label>

            <input
              type="number"
              placeholder="Enter count"
              value={count}
              onChange={(e) =>
                setCount(
                  e.target.value
                )
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
          COUNT BOXES
      ========================= */}

      <div
        className="
          flex
          flex-wrap
          gap-3
          mt-5
        "
      >
        {isLoading && (
          <p className="text-sm text-slate-400">
            Loading man power...
          </p>
        )}

        {manpower.map(
          (item, index) => (
            <div
              key={index}
              className="
                relative
                min-w-[90px]
                bg-[#edf4ff]
                border
                border-[#c7dcff]
                rounded-[16px]
                px-5
                py-4
                shadow-sm
                text-center
              "
            >
              {/* DELETE */}
              {editMode && (
                <button
                  onClick={() =>
                    handleDelete(
                      index
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
                    shadow-md
                  "
                >
                  <X
                    size={12}
                  />
                </button>
              )}

              {/* COUNT */}
              <h3
                className="
                  text-[26px]
                  font-bold
                  text-[#1D60AB]
                  leading-none
                "
              >
                {item.count}
              </h3>
            </div>
          )
        )}
      </div>
    </div>
  );
}
