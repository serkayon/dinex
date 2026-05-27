import { useEffect, useState } from "react";

import {
  Boxes,
  TimerReset,
  FileText,
  Pencil,
  X,
} from "lucide-react";

import toast from "react-hot-toast";

export default function AssignModel() {
  const [models, setModels] =
    useState([]);
  const [isLoading, setIsLoading] =
    useState(false);
  const [isSaving, setIsSaving] =
    useState(false);

  const [editMode, setEditMode] =
    useState(false);
  const apiBaseUrl =
    import.meta.env
      .VITE_API_BASE_URL;

  const [form, setForm] =
    useState({
      modelId: "",
      cycleTime: "",
      timeType: "min",
      explanation: "",
    });

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const response =
        await fetch(
          `${apiBaseUrl}/models`
        );
      if (!response.ok) {
        throw new Error();
      }
      const data =
        await response.json();
      setModels(data);
    } catch (error) {
      toast.error(
        "Failed to load models"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleSave = async () => {
    if (!form.modelId.trim()) {
      toast.error(
        "Model ID required"
      );
      return;
    }

    if (!form.cycleTime) {
      toast.error(
        "Cycle time required"
      );
      return;
    }

    if (!form.timeType) {
      toast.error(
        "Select time type"
      );
      return;
    }

    if (
      !form.explanation.trim()
    ) {
      toast.error(
        "Explanation required"
      );
      return;
    }

    const cycleTimeNumber =
      Number(form.cycleTime);

    if (
      Number.isNaN(
        cycleTimeNumber
      ) ||
      cycleTimeNumber <= 0
    ) {
      toast.error(
        "Cycle time must be greater than 0"
      );
      return;
    }

    setIsSaving(true);
    try {
      const response =
        await fetch(
          `${apiBaseUrl}/models`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              model_id:
                form.modelId.trim(),
              cycle_time_duration:
                cycleTimeNumber,
              cycle_time_unit:
                form.timeType,
              explanation:
                form.explanation.trim(),
            }),
          }
        );

      if (!response.ok) {
        const errorBody =
          await response.json();
        throw new Error(
          errorBody.detail ||
            "Failed to save model"
        );
      }

      const createdModel =
        await response.json();

      setModels([
        createdModel,
        ...models,
      ]);

      toast.success(
        "Model Assigned Successfully"
      );

      setForm({
        modelId: "",
        cycleTime: "",
        timeType: "min",
        explanation: "",
      });
    } catch (error) {
      toast.error(
        error.message ||
          "Failed to save model"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (
    index
  ) => {
    const model = models[index];
    if (!model?.id) {
      toast.error(
        "Invalid model record"
      );
      return;
    }

    try {
      const response =
        await fetch(
          `${apiBaseUrl}/models/${model.id}`,
          {
            method: "DELETE",
          }
        );
      if (!response.ok) {
        throw new Error();
      }

      setModels(
        models.filter(
          (_, i) => i !== index
        )
      );

      toast.success(
        "Model Deleted"
      );
    } catch (error) {
      toast.error(
        "Failed to delete model"
      );
    }
  };

  const handleClear = () => {
    setForm({
      modelId: "",
      cycleTime: "",
      timeType: "min",
      explanation: "",
    });
  };
return (
  <div
    className="
      bg-white
  rounded-[24px]
  p-4
  md:p-5
    "
  >
    {/* HEADER */}
    <div
      className="
        flex
        items-start
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
          Assign Model
        </h2>

        <p
          className="
            text-slate-500
            text-sm
            mt-1
          "
        >
          Configure production running models
        </p>
      </div>

      <button
        onClick={() =>
          setEditMode(!editMode)
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
          shrink-0
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

    {/* MAIN SECTION */}
 <div
  className="
    grid
    grid-cols-1
    xl:grid-cols-[1.15fr_0.85fr]
    gap-5
    items-start
  "
>
      {/* LEFT FORM */}
      <div
        className="
          bg-[#f8fafc]
          rounded-[24px]
          p-5
          border
          border-slate-200
        "
      >
        <div className="space-y-4">
          {/* TOP INPUTS */}
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-[1fr_auto]
              gap-4
            "
          >
            {/* MODEL ID */}
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
                <Boxes
                  size={16}
                  className="text-[#1D60AB]"
                />

                Model ID
              </label>

              <input
                type="text"
                placeholder="Enter model"
                value={form.modelId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    modelId:
                      e.target.value,
                  })
                }
                className="
                  w-full
                  h-[46px]
                  rounded-[16px]
                  border
                  border-slate-300
                  px-4
                  outline-none
                  text-slate-700
                  focus:border-[#1D60AB]
                  focus:ring-4
                  focus:ring-blue-100
                  bg-white
                "
              />
            </div>

            {/* CYCLE TIME */}
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

                Cycle Time
              </label>

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Duration"
                  value={
                    form.cycleTime
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cycleTime:
                        e.target.value,
                    })
                  }
                  className="
                    w-[120px]
                    h-[46px]
                    rounded-[16px]
                    border
                    border-slate-300
                    px-4
                    outline-none
                    text-slate-700
                    focus:border-[#1D60AB]
                    focus:ring-4
                    focus:ring-blue-100
                    bg-white
                  "
                />

                <select
                  value={
                    form.timeType
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      timeType:
                        e.target.value,
                    })
                  }
                  className="
                    w-[90px]
                    h-[46px]
                    rounded-[16px]
                    border
                    border-slate-300
                    px-3
                    outline-none
                    text-slate-700
                    focus:border-[#1D60AB]
                    focus:ring-4
                    focus:ring-blue-100
                    bg-white
                  "
                >
                  <option>
                    hrs
                  </option>

                  <option>
                    min
                  </option>

                  <option>
                    sec
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* EXPLANATION */}
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
              <FileText
                size={16}
                className="text-[#1D60AB]"
              />

              Explanation
            </label>

            <textarea
              placeholder="Enter explanation"
              value={
                form.explanation
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  explanation:
                    e.target.value,
                })
              }
              rows={2}
              className="
                w-full
                rounded-[16px]
                border
                border-slate-300
                px-4
                py-3
                outline-none
                text-slate-700
                resize-none
                focus:border-[#1D60AB]
                focus:ring-4
                focus:ring-blue-100
                bg-white
              "
            />
          </div>

          {/* BUTTONS */}
          <div
            className="
              flex
              gap-3
              pt-1
            "
          >
            <button
              onClick={
                handleSave
              }
              disabled={isSaving}
              className="
                w-[140px]
                h-[46px]
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

            <button
              onClick={
                handleClear
              }
              className="
                w-[140px]
                h-[46px]
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
      </div>

      {/* RIGHT MODEL LIST */}
      <div
        className="
    border
  border-slate-200
  rounded-[20px]
  bg-[#f8fafc]
  p-4
  h-[300px]
          flex
          flex-col
        "
      >
        {/* HEADER */}
        <div
          className="
            flex
            items-start
            justify-between
            gap-4
            mb-5
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
              Assigned Models
            </h3>

            <p
              className="
                text-sm
                text-slate-500
                mt-1
              "
            >
              Production model configurations
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
            {models.length} Models
          </div>
        </div>

        {/* SCROLL AREA */}
        <div
          className="
            flex-1
            overflow-y-auto
            pr-1
            space-y-3
                custom-scrollbar

          "
        >
          {isLoading && (
            <p className="text-sm text-slate-400">
              Loading models...
            </p>
          )}

          {models.map(
            (model, index) => (
              <div
                key={
                  model.id || index
                }
                className="
                relative
  bg-white
  border
  border-slate-200
  rounded-[16px]
  px-4
  py-3
                  shadow-sm
                  hover:shadow-md
                  transition-all
                "
              >
                {editMode && (
                  <button
                    onClick={() =>
                      handleDelete(
                        index
                      )
                    }
                    className="
                      absolute
                    top-4
right-4
                      w-7
                      h-7
                      rounded-full
                      bg-red-500
                      text-white
                      flex
                      items-center
                      justify-center
                      shadow-md
                    "
                  >
                    <X size={13} />
                  </button>
                )}

                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  "
                >
                  <div>
                    <h3
                      className="
                        text-[18px]
                        font-bold
                        text-[#1D60AB]
                      "
                    >
                      {
                        model.model_id
                      }
                    </h3>

                    <p
                      className="
                        text-sm
                        font-semibold
                        text-slate-600
                        mt-1
                      "
                    >
                      {
                        model.cycle_time_duration
                      }{" "}
                      {
                        model.cycle_time_unit
                      }
                    </p>
                  </div>

                  {model.explanation ? (
                    <p
                      className="
                         text-sm
  text-slate-500
  max-w-[220px]
  leading-relaxed
  break-words
  whitespace-normal
  text-right
  pr-8
                      "
                    >
                      {
                        model.explanation
                      }
                    </p>
                  ) : null}
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
