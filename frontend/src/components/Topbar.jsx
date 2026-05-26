import {
  useEffect,
  useState,
} from "react";

import {
  Play,
  Square,
} from "lucide-react";

import useAppStore from "../store/useAppStore";

import dinex from "../assets/dinex.png";

import StartBatchModal from "../modals/StartBatchModal";
import EndBatchModal from "../modals/EndBatchModal";
export default function Topbar() {
  const {
    batchStarted = false,
    hydrateCurrentBatch,
  } = useAppStore();

  const [openStart, setOpenStart] =
    useState(false);
const [openEnd, setOpenEnd] =
  useState(false);

  useEffect(() => {
    hydrateCurrentBatch().catch(
      () => {}
    );
  }, [hydrateCurrentBatch]);
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
                ? setOpenEnd(true)
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
    </>
  );
}
