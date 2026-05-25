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
      .VITE_API_BASE_URL ||
    "http://127.0.0.1:8000";

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
            Assign Model
          </h2>

          <p
            className="
              text-slate-500
              text-sm
              mt-1
            "
          >
            Configure production
            running models
          </p>
        </div>

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
            lg:grid-cols-4
            gap-4
          "
        >
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
                h-[52px]
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
                  w-full
                  h-[52px]
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
                  w-[110px]
                  h-[52px]
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
                  hours
                </option>

                <option>
                  minutes
                </option>

                <option>
                  seconds
                </option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-2">
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

            <input
              type="text"
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
              className="
                w-full
                h-[52px]
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
        </div>

        <div
          className="
            flex
            flex-col
            sm:flex-row
            gap-3
            mt-6
          "
        >
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
            Loading models...
          </p>
        )}

        {models.map(
          (model, index) => (
            <div
              key={model.id || index}
              className="
                relative
                min-w-[120px]
                bg-[#edf4ff]
                border
                border-[#c7dcff]
                rounded-[16px]
                px-4
                py-3
                shadow-sm
                transition-all
              "
            >
              {editMode && (
                <button
                  onClick={() =>
                    handleDelete(index)
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
                  <X size={12} />
                </button>
              )}

              <h3
                className="
                  text-[18px]
                  font-bold
                  text-[#1D60AB]
                  text-center
                  leading-none
                "
              >
                {model.model_id}
              </h3>

              <p
                className="
                  text-[14px]
                  font-semibold
                  text-slate-700
                  text-center
                  mt-2
                  leading-none
                "
              >
                {model.cycle_time_duration}{" "}
                {model.cycle_time_unit}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
