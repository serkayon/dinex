import { useEffect, useState } from "react";

import {
  Users,
  Factory,
  Timer,
  Target,
  UserCog,
  ShieldCheck,
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

  const initialForm = {
    teamLeader: "",
    lineLeader: "",
    supervisor: "",
    manpower: "",
    shiftTime: "",
    splitTime: "",
    runningModel: "",
    target: "",
  };

  const [form, setForm] =
    useState(initialForm);

  /* RESET WHEN MODAL CLOSES */
  useEffect(() => {
    if (!open) {
      setForm(initialForm);
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

  const handleSubmit = () => {
    const values =
      Object.values(form);

    const hasEmpty =
      values.some(
        (value) =>
          value === ""
      );

    if (hasEmpty) {
      toast.error(
        "Please fill all fields"
      );
      return;
    }

startBatch({
  ...form,

  shift: {
    start: 6,
    end: 14,
    split:
      Number(form.splitTime) /
      60,
  },
});

    toast.success(
      "Batch Started Successfully"
    );

    setForm(initialForm);

    onClose();
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
          max-w-3xl
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
              Start Batch
            </h2>

            <p
              className="
                text-blue-100
                text-sm
                mt-1
              "
            >
              Production Batch Setup
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
        <div className="p-6 md:p-7">
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-5
            "
          >
            {/* TEAM LEADER */}
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
                Team Leader
              </label>

              <select
                name="teamLeader"
                value={
                  form.teamLeader
                }
                onChange={
                  handleChange
                }
                className="
                  w-full
                  h-[50px]
                  rounded-xl
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
                  Select Team Leader
                </option>

                <option>
                  Rakesh Kumar
                </option>

                <option>
                  Arun Prakash
                </option>

                <option>
                  Vignesh Kumar
                </option>
              </select>
            </div>

            {/* LINE LEADER */}
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
                <UserCog
                  size={16}
                  className="text-[#1D60AB]"
                />
                Line Leader
              </label>

              <select
                name="lineLeader"
                value={
                  form.lineLeader
                }
                onChange={
                  handleChange
                }
                className="
                  w-full
                  h-[50px]
                  rounded-xl
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
                  Select Line Leader
                </option>

                <option>
                  Amit Singh
                </option>

                <option>
                  Suresh Babu
                </option>

                <option>
                  Manoj Kumar
                </option>
              </select>
            </div>

            {/* SUPERVISOR */}
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
                <ShieldCheck
                  size={16}
                  className="text-[#1D60AB]"
                />
                Supervisor
              </label>

              <select
                name="supervisor"
                value={
                  form.supervisor
                }
                onChange={
                  handleChange
                }
                className="
                  w-full
                  h-[50px]
                  rounded-xl
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
                  Select Supervisor
                </option>

                <option>
                  Sanjay Verma
                </option>

                <option>
                  Karthik Raj
                </option>

                <option>
                  Rahul Sharma
                </option>
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
                  w-full
                  h-[50px]
                  rounded-xl
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

                <option>
                  6
                </option>

                <option>
                  5
                </option>

                <option>
                  4
                </option>
              </select>
            </div>

            {/* SHIFT TIME */}
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
                <Timer
                  size={16}
                  className="text-[#1D60AB]"
                />
                Shift Time
              </label>

              <select
                name="shiftTime"
                value={
                  form.shiftTime
                }
                onChange={
                  handleChange
                }
                className="
                  w-full
                  h-[50px]
                  rounded-xl
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
                  Select Shift
                </option>

                <option>
                  Shift A
                </option>

                <option>
                  Shift B
                </option>

                <option>
                  Shift C
                </option>
              </select>
            </div>

            {/* SPLIT TIME */}
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
                <Timer
                  size={16}
                  className="text-[#1D60AB]"
                />
                Split Time
              </label>

              <select
                name="splitTime"
                value={
                  form.splitTime
                }
                onChange={
                  handleChange
                }
                className="
                  w-full
                  h-[50px]
                  rounded-xl
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
              <option value="30">
  30 Minutes
</option>

<option value="45">
  45 Minutes
</option>

<option value="60">
  60 Minutes
</option>
              </select>
            </div>

            {/* RUNNING MODEL */}
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
                <Factory
                  size={16}
                  className="text-[#1D60AB]"
                />
                Running Model
              </label>

              <select
                name="runningModel"
                value={
                  form.runningModel
                }
                onChange={
                  handleChange
                }
                className="
                  w-full
                  h-[50px]
                  rounded-xl
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
                  Select Model
                </option>

                <option>
                  MII
                </option>

                <option>
                  KII
                </option>

                <option>
                  OIII
                </option>
              </select>
            </div>

            {/* TARGET */}
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
                <Target
                  size={16}
                  className="text-[#1D60AB]"
                />
                Target Of The Shift
              </label>

              <input
                type="number"
                name="target"
                value={form.target}
                onChange={
                  handleChange
                }
                placeholder="Enter Target"
                className="
                  w-full
                  h-[50px]
                  rounded-xl
                  border
                  border-slate-300
                  px-4
                  text-slate-700
                  outline-none
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