import { useState } from "react";

import toast from "react-hot-toast";

import {
  Clock3,
  AlertTriangle,
  TimerReset,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

import useAppStore from "../store/useAppStore";

export default function EndBatchModal({
  open,
  onClose,
}) {
  const { endBatch } =
    useAppStore();

  const [
    remainingPending,
    setRemainingPending,
  ] = useState(50);

  const [
    pendingType,
    setPendingType,
  ] = useState("");

  const [
    pendingTime,
    setPendingTime,
  ] = useState("");

  const [
    pendingUnit,
    setPendingUnit,
  ] = useState("Minutes");

  if (!open) return null;

  const handleAddPending =
    () => {
      if (
        !pendingType ||
        !pendingTime
      ) {
        toast.error(
          "Fill all fields"
        );
        return;
      }

      const value =
        Number(
          pendingTime
        );

      /* =========================
         VALIDATION
      ========================= */

      if (
        pendingUnit ===
        "Hours"
      ) {
        toast.error(
          "Duration too high"
        );
        return;
      }

      if (
        value >
        remainingPending
      ) {
        toast.error(
          `Only ${remainingPending} min pending remaining`
        );
        return;
      }

      const updated =
        remainingPending -
        value;

      setRemainingPending(
        updated
      );

      toast.success(
        "Pending Updated"
      );

      setPendingType("");
      setPendingTime("");
      setPendingUnit(
        "Minutes"
      );
    };

  const handleEndBatch =
    () => {
      if (
        remainingPending >
        0
      ) {
        toast.error(
          "Pending still remaining"
        );
        return;
      }

      endBatch();

      toast.success(
        "Batch Ended Successfully"
      );

      onClose();
    };

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        bg-black/40
        flex
        items-center
        justify-center
        p-4
      "
    >
      <div
        className="
          w-full
          max-w-[560px]
          bg-white
          rounded-[26px]
          overflow-hidden
          shadow-2xl
          max-h-[95vh]
          overflow-y-auto
        "
      >
        {/* =========================
            HEADER
        ========================= */}

        <div
          className="
            bg-gradient-to-r
            from-[#1D60AB]
            to-[#256ec0]
            px-5
            py-4
          "
        >
          <h2
            className="
              text-white
              text-[24px]
              font-bold
            "
          >
            End Batch Summary
          </h2>

          <p
            className="
              text-blue-100
              text-sm
              mt-1
            "
          >
            Final shift production details
          </p>
        </div>

        {/* =========================
            BODY
        ========================= */}

        <div className="p-5 space-y-5">
          {/* TOP CARDS */}

          <div className="grid grid-cols-3 gap-3">
            {/* PARTS */}

            <div
              className="
                bg-[#eef4ff]
                rounded-[18px]
                p-4
              "
            >
              <p
                className="
                  text-[11px]
                  font-semibold
                  text-slate-500
                "
              >
                Total Parts
              </p>

              <h2
                className="
                  text-[24px]
                  font-bold
                  text-[#1D60AB]
                  mt-2
                "
              >
                1800
              </h2>
            </div>

            {/* DURATION */}

            <div
              className="
                bg-slate-100
                rounded-[18px]
                p-4
              "
            >
              <p
                className="
                  text-[11px]
                  font-semibold
                  text-slate-500
                "
              >
                Duration
              </p>

              <h2
                className="
                  text-[18px]
                  font-bold
                  text-slate-800
                  mt-2
                "
              >
                08:00:00
              </h2>
            </div>

            {/* PENDING */}

            <div
              className={`
                rounded-[18px]
                p-4
                ${
                  remainingPending >
                  0
                    ? "bg-[#fff7ed]"
                    : "bg-[#ecfdf3]"
                }
              `}
            >
              <p
                className="
                  text-[11px]
                  font-semibold
                  text-slate-500
                "
              >
                Pending
              </p>

              <h2
                className={`
                  text-[18px]
                  font-bold
                  mt-2
                  ${
                    remainingPending >
                    0
                      ? "text-orange-500"
                      : "text-green-600"
                  }
                `}
              >
                {remainingPending >
                0
                  ? `${remainingPending} min`
                  : "Completed"}
              </h2>
            </div>
          </div>

          {/* =========================
              ADD PENDING
          ========================= */}

          <div
            className="
              border
              border-slate-200
              rounded-[22px]
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                mb-4
              "
            >
              <AlertTriangle
                size={18}
                className="text-orange-500"
              />

              <h2
                className="
                  text-[18px]
                  font-bold
                  text-slate-800
                "
              >
                Add Pending
              </h2>
            </div>

            <div className="space-y-4">
              {/* TYPE */}

              <select
                value={pendingType}
                onChange={(e) =>
                  setPendingType(
                    e.target.value
                  )
                }
                className="
                  w-full
                  h-[48px]
                  rounded-[16px]
                  border
                  border-slate-300
                  px-4
                  outline-none
                "
              >
                <option value="">
                  Pending Type
                </option>

                <option>
                  Tea Break
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
                  Others
                </option>
              </select>

              {/* TIME */}

              <div className="flex gap-3">
                <select
                  value={
                    pendingTime
                  }
                  onChange={(e) =>
                    setPendingTime(
                      e.target.value
                    )
                  }
                  className="
                    flex-1
                    h-[48px]
                    rounded-[16px]
                    border
                    border-slate-300
                    px-4
                    outline-none
                  "
                >
                  <option value="">
                    Time
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

                <select
                  value={
                    pendingUnit
                  }
                  onChange={(e) =>
                    setPendingUnit(
                      e.target.value
                    )
                  }
                  className="
                    w-[130px]
                    h-[48px]
                    rounded-[16px]
                    border
                    border-slate-300
                    px-4
                    outline-none
                  "
                >
                  <option>
                    Minutes
                  </option>

                  <option>
                    Hours
                  </option>

                  <option>
                    Seconds
                  </option>
                </select>
              </div>

              {/* BUTTON */}

              <button
                onClick={
                  handleAddPending
                }
                className="
                  w-full
                  h-[48px]
                  rounded-[16px]
                  bg-[#1D60AB]
                  hover:bg-[#164f92]
                  text-white
                  font-semibold
                  transition-all
                "
              >
                Add Pending
              </button>
            </div>
          </div>

          {/* =========================
              OEE SUMMARY
          ========================= */}

          <div
            className="
              bg-gradient-to-r
              from-[#eef8ef]
              to-[#f6fff7]
              rounded-[24px]
              p-5
              border
              border-green-200
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    w-12
                    h-12
                    rounded-full
                    bg-green-100
                    flex
                    items-center
                    justify-center
                  "
                >
                  <TrendingUp
                    className="text-green-600"
                    size={22}
                  />
                </div>

                <div>
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-slate-500
                    "
                  >
                    Final OEE
                  </p>

                  <h2
                    className="
                      text-[28px]
                      font-bold
                      text-green-600
                    "
                  >
                    78.6%
                  </h2>
                </div>
              </div>

              <ShieldCheck
                className="
                  text-green-500
                "
                size={36}
              />
            </div>

            {/* SUMMARY */}

            <div className="mt-5 space-y-3">
              {[
                {
                  icon:
                    <Clock3 size={17} />,
                  label:
                    "Run Time",
                  value:
                    "07:10:00",
                  color:
                    "text-green-600",
                },

                {
                  icon:
                    <TimerReset size={17} />,
                  label:
                    "Pending",
                  value:
                    remainingPending >
                    0
                      ? `${remainingPending} min`
                      : "Completed",
                  color:
                    remainingPending >
                    0
                      ? "text-orange-500"
                      : "text-green-600",
                },

                {
                  icon:
                    <TrendingUp size={17} />,
                  label:
                    "Performance",
                  value:
                    "87.3%",
                  color:
                    "text-[#1D60AB]",
                },
              ].map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={index}
                    className="
                      flex
                      items-center
                      justify-between
                    "
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          w-9
                          h-9
                          rounded-full
                          bg-white
                          shadow-sm
                          flex
                          items-center
                          justify-center
                          text-[#1D60AB]
                        "
                      >
                        {
                          item.icon
                        }
                      </div>

                      <p
                        className="
                          text-[14px]
                          font-semibold
                          text-slate-700
                        "
                      >
                        {
                          item.label
                        }
                      </p>
                    </div>

                    <p
                      className={`
                        text-[15px]
                        font-bold
                        ${item.color}
                      `}
                    >
                      {
                        item.value
                      }
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* =========================
              BUTTONS
          ========================= */}

          <div className="flex gap-3">
            {/* CANCEL */}

            <button
              onClick={onClose}
              className="
                flex-1
                h-[50px]
                rounded-[18px]
                bg-slate-200
                hover:bg-slate-300
                text-slate-700
                font-semibold
              "
            >
              Cancel
            </button>

            {/* END BATCH */}

            <button
              disabled={
                remainingPending >
                0
              }
              onClick={
                handleEndBatch
              }
              className="
                flex-1
                h-[50px]
                rounded-[18px]
                bg-red-500
                hover:bg-red-600
                disabled:bg-red-300
                disabled:cursor-not-allowed
                text-white
                font-semibold
              "
            >
              End Batch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}