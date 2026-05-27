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
      rounded-[24px]
      p-4
      md:p-5
      shadow-[0_2px_10px_rgba(15,23,42,0.05)]
      mt-6
    "
  >
    {/* HEADER */}
    <div
      className="
        flex
        flex-col
        lg:flex-row
        lg:items-start
        lg:justify-between
        gap-4
        mb-6
      "
    >
      {/* LEFT */}
      <div className="flex-1">
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

        {/* INPUT SECTION */}
        <div
          className="
            mt-5
            flex
            flex-col
            xl:flex-row
            xl:items-end
            gap-4
          "
        >
          {/* INPUT */}
          <div className="flex-1">
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
                h-[46px]
                rounded-[14px]
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

          {/* BUTTONS */}
          <div
            className="
              flex
              flex-col
              sm:flex-row
              gap-3
            "
          >
            {/* SAVE */}
            <button
              onClick={
                handleSave
              }
              disabled={isSaving}
              className="
                w-full
                sm:w-[120px]
                h-[44px]
                rounded-[14px]
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
                w-full
                sm:w-[120px]
                h-[44px]
                rounded-[14px]
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
      </div>

      {/* EDIT MODE */}
      <button
        onClick={() =>
          setEditMode(!editMode)
        }
        className={`
          h-[44px]
          px-4
          rounded-[14px]
          flex
          items-center
          justify-center
          gap-2
          font-semibold
          transition-all
          shrink-0
          ${
            editMode
              ? "bg-red-100 text-red-600"
              : "bg-blue-100 text-[#1D60AB]"
          }
        `}
      >
        <Pencil size={17} />

        {editMode
          ? "Exit Edit"
          : "Edit Mode"}
      </button>
    </div>

    {/* MANPOWER LIST */}
    <div
      className="
        border
        border-slate-200
        rounded-[22px]
        bg-[#f8fafc]
        p-4
        h-[520px]
        flex
        flex-col
        overflow-hidden
        w-full
      "
    >
      {/* TOP */}
      <div
        className="
          flex
          items-center
          justify-between
          gap-3
          mb-4
          shrink-0
        "
      >
        <div>
          <h3
            className="
              text-[18px]
              font-bold
              text-slate-800
            "
          >
            Man Power List
          </h3>

          <p
            className="
              text-sm
              text-slate-500
              mt-1
            "
          >
            Assigned manpower counts
          </p>
        </div>

        <div
          className="
            text-sm
            font-semibold
            text-[#1D60AB]
            bg-blue-100
            px-3
            py-1
            rounded-full
            shrink-0
          "
        >
          {manpower.length}
        </div>
      </div>

      {/* SCROLL AREA */}
      <div
        className="
          flex-1
          overflow-y-auto
          custom-scrollbar
          pr-2
        "
      >
        {isLoading && (
          <p className="text-sm text-slate-400">
            Loading man power...
          </p>
        )}

        {/* GRID */}
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            md:grid-cols-3
            xl:grid-cols-4
            gap-4
            auto-rows-max
          "
        >
          {manpower.map(
            (item, index) => (
              <div
                key={index}
                className="
                  relative
                  bg-white
                  border
                  border-slate-200
                  rounded-[18px]
                  p-4
                  shadow-sm
                  hover:shadow-md
                  transition-all
                  min-h-[120px]
                  flex
                  flex-col
                  justify-between
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
                      top-3
                      right-3
                      w-7
                      h-7
                      rounded-full
                      bg-red-500
                      hover:bg-red-600
                      text-white
                      flex
                      items-center
                      justify-center
                      shadow-md
                      transition-all
                    "
                  >
                    <X size={13} />
                  </button>
                )}

                {/* CONTENT */}
                <div>
                  <div
                    className="
                      w-12
                      h-12
                      rounded-[14px]
                      bg-blue-100
                      flex
                      items-center
                      justify-center
                      mb-4
                    "
                  >
                    <Users
                      size={22}
                      className="text-[#1D60AB]"
                    />
                  </div>

                  <p
                    className="
                      text-sm
                      text-slate-500
                      font-medium
                    "
                  >
                    Man Power
                  </p>

                  <h3
                    className="
                      text-[28px]
                      font-bold
                      text-[#1D60AB]
                      mt-1
                      leading-none
                    "
                  >
                    {item.count}
                  </h3>
                </div>

                {/* FOOTER */}
                <div
                  className="
                    mt-4
                    pt-3
                    border-t
                    border-slate-100
                  "
                >
                  <p
                    className="
                      text-[12px]
                      text-slate-400
                    "
                  >
                    Assigned manpower count
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  </div>
);
}
