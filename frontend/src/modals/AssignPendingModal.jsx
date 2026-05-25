import { useState } from "react";

import toast from "react-hot-toast";

import useAppStore from "../store/useAppStore";

export default function AssignPendingModal({
  open,
  onClose,
  splitId,
}) {
  const {
    downtime,
    assignPending,
  } = useAppStore();

  const [form, setForm] = useState({
    method: "",
    customMethod: "",
    startTime: "",
    endTime: "",
  });

  if (!open) return null;

  const handleSave = () => {
    assignPending(splitId, form);

    toast.success(
      "Pending Assigned"
    );

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="section-title">
          Assign Pending
        </h2>

        <div className="space-y-4">
          <select
            className="form-select"
            value={form.method}
            onChange={(e) =>
              setForm({
                ...form,
                method:
                  e.target.value,
              })
            }
          >
            <option>
              Select Method
            </option>

            {downtime.map(
              (item, index) => (
                <option key={index}>
                  {item.type}
                </option>
              )
            )}

            <option>Other</option>
          </select>

          {form.method === "Other" && (
            <>
              <input
                placeholder="Method Name"
                className="form-input"
                value={
                  form.customMethod
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    customMethod:
                      e.target
                        .value,
                  })
                }
              />

              <input
                type="time"
                className="form-input"
                value={
                  form.startTime
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    startTime:
                      e.target
                        .value,
                  })
                }
              />

              <input
                type="time"
                className="form-input"
                value={form.endTime}
                onChange={(e) =>
                  setForm({
                    ...form,
                    endTime:
                      e.target
                        .value,
                  })
                }
              />
            </>
          )}

          <div className="w-full h-3 bg-bg-card rounded-full overflow-hidden">
            <div className="h-full bg-green-500 w-[45%] progress-bar-animated" />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="btn btn-warning"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}