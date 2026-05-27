import {
  useEffect,
  useState,
  useMemo,
} from "react";

import {
  Play,
  Square,
} from "lucide-react";

import useAppStore from "../store/useAppStore";

import dinex from "../assets/dinex.png";

import StartBatchModal from "../modals/StartBatchModal";
import EndBatchModal from "../modals/EndBatchModal";
import useServerNow from "../hooks/useServerNow";
export default function Topbar() {
  const {
    batchStarted = false,
    hydrateCurrentBatch,
    currentBatch,
  } = useAppStore();

  const [openStart, setOpenStart] =
    useState(false);
const [openEnd, setOpenEnd] =
  useState(false);
const [openEndConfirm, setOpenEndConfirm] =
  useState(false);
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const plantTimeZone = import.meta.env.VITE_PLANT_TIMEZONE || "Asia/Kolkata";
const now = useServerNow(apiBaseUrl, batchStarted);
const clockFormatter = useMemo(
  () =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: plantTimeZone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  [plantTimeZone]
);

  useEffect(() => {
    hydrateCurrentBatch().catch(
      () => {}
    );
  }, [hydrateCurrentBatch]);

  const remainingSeconds =
    useMemo(() => {
      if (
        !batchStarted ||
        !currentBatch?.shift
      ) {
        return 0;
      }

      const startHour = Number(
        currentBatch.shift.start || 0
      );
      const endHour = Number(
        currentBatch.shift.end || 0
      );
      const startSeconds = Math.round(startHour * 3600);
      const endSeconds = Math.round(endHour * 3600);
      const totalSeconds = ((endSeconds - startSeconds + 86400) % 86400) || 86400;

      const nowParts =
        clockFormatter.formatToParts(
          new Date(now)
        );
      const h = Number(
        nowParts.find(
          (part) =>
            part.type === "hour"
        )?.value || 0
      );
      const m = Number(
        nowParts.find(
          (part) =>
            part.type === "minute"
        )?.value || 0
      );
      const s = Number(
        nowParts.find(
          (part) =>
            part.type === "second"
        )?.value || 0
      );
      const currentSeconds =
        h * 3600 + m * 60 + s;
      const elapsedSeconds =
        (currentSeconds -
          startSeconds +
          86400) %
        86400;
      const clampedElapsed =
        Math.max(
          0,
          Math.min(
            totalSeconds,
            elapsedSeconds
          )
        );

      return Math.max(
        0,
        totalSeconds - clampedElapsed
      );
    }, [
      batchStarted,
      currentBatch,
      now,
      clockFormatter,
    ]);

  const formatDuration = (
    totalSeconds
  ) => {
    const safe = Math.max(
      0,
      Math.floor(totalSeconds)
    );
    const h = String(
      Math.floor(safe / 3600)
    ).padStart(2, "0");
    const m = String(
      Math.floor(
        (safe % 3600) / 60
      )
    ).padStart(2, "0");
    const s = String(
      safe % 60
    ).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const isBeforeLast30Min =
    remainingSeconds > 30 * 60;

  const handleEndBatchClick =
    () => {
      setOpenEndConfirm(true);
    };

  return (
    <>
      <header
        className="
          w-full
          bg-gradient-to-r
          from-[#f5f7fb]
          to-[#eef2ff]
          border-b
          border-slate-200
          px-3
          md:px-4
          py-3
          flex
          items-center
          justify-between
          gap-3
          sticky
          top-0
          z-40
        "
      >
        {/* =========================
            LEFT
        ========================= */}

        <div
          className="
            flex
            items-center
            gap-3
            min-w-0
            flex-1
          "
        >
          {/* LOGO */}
          <div
            className="
              w-12
              h-12
              md:w-14
              md:h-14
              rounded-2xl
              bg-white
              shadow-sm
              border
              border-slate-300
              flex
              items-center
              justify-center
              overflow-hidden
              shrink-0
            "
          >
            <img
              src={dinex}
              alt="logo"
              className="
                w-9
                h-9
                md:w-11
                md:h-11
                object-contain
              "
            />
          </div>

          {/* TITLE */}
          <div className="min-w-0">
            <h1
              className="
                text-[#0b63b6]
                text-[15px]
                sm:text-[18px]
                md:text-[26px]
                font-bold
                leading-tight
                truncate
              "
            >
              Dinex Production Traceability
              System
            </h1>

            <p
              className="
                text-slate-600
                text-[11px]
                sm:text-sm
                md:text-[15px]
                mt-1
                truncate
              "
            >
              Powered by Serkayon
            </p>
          </div>
        </div>

        {/* =========================
            RIGHT
        ========================= */}

        <div
          className="
            flex
            items-center
            gap-2
            md:gap-3
            shrink-0
          "
        >
          {/* START/END BATCH */}
          <button
            onClick={() =>
              batchStarted
                ? handleEndBatchClick()
                : setOpenStart(true)
            }
            className={`
              h-11
              md:h-12
              px-3
              md:px-5
              rounded-2xl
              text-white
              flex
              items-center
              justify-center
              gap-2
              font-semibold
              shadow-lg
              transition-all
              duration-300

              ${
                batchStarted
                  ? "bg-[#dc2626] hover:bg-[#b91c1c]"
                  : "bg-[#16a34a] hover:bg-[#15803d]"
              }
            `}
          >
            {batchStarted ? (
              <Square size={17} />
            ) : (
              <Play size={17} />
            )}

            <span
              className="
                hidden
                sm:block
                text-sm
                md:text-base
              "
            >
              {batchStarted
                ? "End Batch"
                : "Start Batch"}
            </span>
          </button>
        </div>
      </header>

      {/* MODAL */}
      <StartBatchModal
        open={openStart}
        onClose={() =>
          setOpenStart(false)
        }
      />
      <EndBatchModal
  open={openEnd}
  onClose={() =>
    setOpenEnd(false)
  }
/>

      {openEndConfirm ? (
        <div className="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-5">
            <h3 className="text-xl font-bold text-slate-800">
              End Batch Confirmation
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              You should end batch only in the last 30 minutes of shift.
            </p>
            <p className="text-xs mt-2 font-semibold text-slate-500">
              Remaining shift time: {formatDuration(remainingSeconds)}
            </p>
            {isBeforeLast30Min ? (
              <p className="text-xs mt-1 text-amber-600">
                You are trying to end batch before last 30 minutes.
              </p>
            ) : (
              <p className="text-xs mt-1 text-emerald-600">
                You are within the last 30 minutes.
              </p>
            )}

            <div className="mt-5 flex gap-2 justify-end">
              <button
                onClick={() =>
                  setOpenEndConfirm(false)
                }
                className="px-4 h-10 rounded-lg bg-slate-200 text-slate-700 font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setOpenEndConfirm(false);
                  setOpenEnd(true);
                }}
                className="px-4 h-10 rounded-lg bg-[#1D60AB] text-white font-semibold hover:bg-[#164f90]"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
