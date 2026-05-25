import {
  User,
  Users,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock3,
  TrendingUp,
  Activity,
  CircleDot,
  RefreshCcw,
  Plus
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  TimerReset,
  CirclePause,
  Wrench,
  ShieldCheck,
  BadgeCheck,

} from "lucide-react";
import useAppStore from "../store/useAppStore";

export default function Dashboard() {
const {
  currentBatch,
  splitRows,
} = useAppStore();
const activeShift = "Shift A";
const [selectedSlot, setSelectedSlot] =
  useState(null);
const [openPendingModal, setOpenPendingModal] =
  useState(false);

const [pendingForm, setPendingForm] =
  useState({
    type: "",
    duration: "",
    unit: "Minutes",
  });

const [pendingData, setPendingData] =
  useState([]);
  const handleSavePending = () => {
  if (!pendingForm.type) {
    toast.error(
      "Select pending type"
    );
    return;
  }

  if (!pendingForm.duration) {
    toast.error(
      "Enter pending duration"
    );
    return;
  }

  setPendingData([
    ...pendingData,
    {
      slotId:
        selectedSlot.id,
      shift:
        activeShift,
      type:
        pendingForm.type,
      duration:
        pendingForm.duration,
      unit: pendingForm.unit,
    },
  ]);

  toast.success(
    "Pending Added"
  );

  setOpenPendingModal(false);

  setPendingForm({
    type: "",
    duration: "",
    unit: "Minutes",
  });
};
  return (
<div
  className="
    page-container
    space-y-5
    pb-[90px]
    md:pb-5
  "
>
      {/* =========================
          TOP CARDS
      ========================= */}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* LEFT */}
        <div className="xl:col-span-9 space-y-4">
          {/* PROFILE ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* TEAM LEADER */}
            <div
              className="
                bg-white
                rounded-2xl
                p-4
                shadow-sm
                border
                border-slate-200
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-blue-100
                    flex
                    items-center
                    justify-center
                  "
                >
                  <User
                    size={20}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">
                    Team Leader
                  </p>

                  <h3 className="font-bold text-slate-800 mt-1">
                    {currentBatch?.teamLeader ||
                      "-"}
                  </h3>
                </div>
              </div>
            </div>

            {/* LINE LEADER */}
            <div
              className="
                bg-white
                rounded-2xl
                p-4
                shadow-sm
                border
                border-slate-200
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-blue-100
                    flex
                    items-center
                    justify-center
                  "
                >
                  <User
                    size={20}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">
                    Line Leader
                  </p>

                  <h3 className="font-bold text-slate-800 mt-1">
                    {currentBatch?.lineLeader ||
                      "-"}
                  </h3>
                </div>
              </div>
            </div>

            {/* SUPERVISOR */}
            <div
              className="
                bg-white
                rounded-2xl
                p-4
                shadow-sm
                border
                border-slate-200
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-blue-100
                    flex
                    items-center
                    justify-center
                  "
                >
                  <User
                    size={20}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">
                    Supervisor
                  </p>

                  <h3 className="font-bold text-slate-800 mt-1">
                    {currentBatch?.supervisor ||
                      "-"}
                  </h3>
                </div>
              </div>
            </div>

            {/* MODEL */}
            <div
              className="
                bg-white
                rounded-2xl
                p-4
                shadow-sm
                border
                border-slate-200
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-yellow-100
                    flex
                    items-center
                    justify-center
                  "
                >
                  <Activity
                    size={20}
                    className="text-yellow-600"
                  />
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">
                    Running Model
                  </p>

                  <h3 className="font-bold text-slate-800 mt-1">
                 {currentBatch?.runningModel ||
  "-"}
                  </h3>
                </div>
              </div>
            </div>

            {/* MANPOWER */}
            <div
              className="
                bg-white
                rounded-2xl
                p-4
                shadow-sm
                border
                border-slate-200
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-slate-100
                    flex
                    items-center
                    justify-center
                  "
                >
                  <Users
                    size={20}
                    className="text-slate-600"
                  />
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">
                    Man Power
                  </p>

                  <h3 className="font-bold text-slate-800 mt-1">
                    {currentBatch?.manpower ||
                      "-"}
                  </h3>
                </div>
              </div>
            </div>
          </div>

      {/* =========================
    STATS ROW
========================= */}

<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">

  {/* TARGET */}
  <div
    className="
      bg-white
      rounded-[20px]
      border
      border-[#edf1f7]
      shadow-sm 
      px-5
      py-4
      h-[120px]
      flex
      items-center
      justify-between
    "
  >
    {/* LEFT */}
    <div>
      <p
        className="
          text-[11px]
          uppercase
          font-bold
          tracking-wide
          text-[#7b8bab]
        "
      >
        TARGET (SHIFT)
      </p>

      <h2
        className="
          text-[32px]
          font-bold
          text-[#1e3a8a]
          mt-3
          leading-none mb-7
        "
      >
  {currentBatch?.target ||
  "-"}
      </h2>
      
  
    </div>

    {/* RIGHT ICON */}
    <div
      className="
        w-[58px]
        h-[58px]
        rounded-full
        bg-[#eef4ff]
        flex
        items-center
        justify-center
        shrink-0
      "
    >
      <Target
        size={28}
        strokeWidth={2}
        className="text-[#2563eb]"
      />
    </div>
  </div>

  {/* OK PARTS */}
  <div
    className="
      bg-white
      rounded-[20px]
      border
      border-[#edf1f7]
      shadow-sm
      px-5
      py-4
      h-[120px]
      flex
      items-center
      justify-between
    "
  >
    {/* LEFT */}
    <div>
      <p
        className="
          text-[11px]
          uppercase
          font-bold
          tracking-wide
          text-[#7b8bab]
        "
      >
        OK PARTS
      </p>

      <h2
        className="
          text-[32px]
          font-bold
          text-[#16a34a]
          mt-3
          leading-none
        "
      >
      -
      </h2>

      <p
        className="
          text-[#16a34a]
          text-[14px]
          font-semibold
          mt-2
        "
      >
       -
      </p>
    </div>

    {/* RIGHT ICON */}
    <div
      className="
        w-[58px]
        h-[58px]
        rounded-full
        bg-[#eefdf3]
        flex
        items-center
        justify-center
        shrink-0
      "
    >
      <CheckCircle2
        size={28}
        strokeWidth={2}
        className="text-[#22c55e]"
      />
    </div>
  </div>

  {/* REWORK */}
  <div
    className="
      bg-white
      rounded-[20px]
      border
      border-[#edf1f7]
      shadow-sm
      px-5
      py-4
      h-[120px]
      flex
      items-center
      justify-between
    "
  >
    {/* LEFT */}
    <div>
      <p
        className="
          text-[11px]
          uppercase
          font-bold
          tracking-wide
          text-[#7b8bab]
          leading-4
        "
      >
        REWORK
      
        PARTS
      </p>

      <h2
        className="
          text-[32px]
          font-bold
          text-[#ef4444]
          mt-3
          leading-none
        "
      >
     -
      </h2>

      <p
        className="
          text-[#64748b]
          text-[14px]
          font-semibold
          mt-2
        "
      >
       -
      </p>
    </div>

    {/* RIGHT ICON */}
    <div
      className="
        w-[58px]
        h-[58px]
        rounded-full
        bg-[#fff1f2]
        flex
        items-center
        justify-center
        shrink-0
      "
    >
      <RefreshCcw
        size={28}
        strokeWidth={2}
        className="text-[#ef4444]"
      />
    </div>
  </div>

  {/* REJECT */}
  <div
    className="
      bg-white
      rounded-[20px]
      border
      border-[#edf1f7]
      shadow-sm
      px-5
      py-4
      h-[120px]
      flex
      items-center
      justify-between
    "
  >
    {/* LEFT */}
    <div>
      <p
        className="
          text-[11px]
          uppercase
          font-bold
          tracking-wide
          text-[#7b8bab]
          leading-4
        "
      >
        REJECT
   
        PARTS
      </p>

      <h2
        className="
          text-[32px]
          font-bold
          text-[#e11d48]
          mt-3
          leading-none
        "
      >
 -
      </h2>

      <p
        className="
          text-[#64748b]
          text-[14px]
          font-semibold
          mt-2
        "
      >
    -
      </p>
    </div>

    {/* RIGHT ICON */}
    <div
      className="
        w-[58px]
        h-[58px]
        rounded-full
        bg-[#fff1f2]
        flex
        items-center
        justify-center
        shrink-0
      "
    >
      <XCircle
        size={28}
        strokeWidth={2}
        className="text-[#f43f5e]"
      />
    </div>
  </div>



</div>
      {/* SPLIT TABLE */}
<div
  className="
    bg-white
    rounded-[24px]
    p-4
    shadow-sm
    border
    border-[#e7edf5]
    overflow-auto
  "
>
  {/* TITLE */}
  <h2
    className="
      text-[22px]
      font-bold
      text-[#1e293b]
      mb-4
    "
  >
  Split View (
{currentBatch?.shiftTime ||
  "Shift A"}
)
  </h2>

  {/* TABLE */}
  <div
    className="
      overflow-hidden
      rounded-[18px]
      border
      border-[#e8edf5]
    "
  >
    <table
      className="
        w-full
        min-w-[950px]
        border-collapse
      "
    >
      {/* HEADER */}
      <thead>
        <tr className="bg-[#f8fafc]">
          <th
            className="
              px-3
              py-3
              text-center
              text-[12px]
              font-bold
              uppercase
              tracking-wide
              text-[#64748b]
              border-r
              border-[#e8edf5]
            "
          >
            Hour
          </th>

          <th
            className="
              px-3
              py-3
              text-center
              text-[12px]
              font-bold
              uppercase
              tracking-wide
              text-[#64748b]
              border-r
              border-[#e8edf5]
            "
          >
            Target
          </th>

          <th
            className="
              px-3
              py-3
              text-center
              text-[12px]
              font-bold
              uppercase
              tracking-wide
              text-[#64748b]
              border-r
              border-[#e8edf5]
            "
          >
            Actual
          </th>

          <th
            className="
              px-3
              py-3
              text-center
              text-[12px]
              font-bold
              uppercase
              tracking-wide
              text-[#64748b]
              border-r
              border-[#e8edf5]
            "
          >
            OK Parts
          </th>

          <th
            className="
              px-3
              py-3
              text-center
              text-[12px]
              font-bold
              uppercase
              tracking-wide
              text-[#64748b]
              border-r
              border-[#e8edf5]
            "
          >
            Rework
          </th>

          <th
            className="
              px-3
              py-3
              text-center
              text-[12px]
              font-bold
              uppercase
              tracking-wide
              text-[#64748b]
              border-r
              border-[#e8edf5]
            "
          >
            OEE
          </th>

          <th
            className="
              px-3
              py-3
              text-center
              text-[12px]
              font-bold
              uppercase
              tracking-wide
              text-[#64748b]
            "
          >
            Assign Pending
          </th>
        </tr>
      </thead>

      {/* BODY */}
      <tbody>
  {splitRows.map((row, index) => (
  
          <tr
            key={index}
            className="
              bg-white
              border-t
              border-[#edf2f7]
            "
          >
            {/* HOUR */}
            <td
              className="
                px-3
                py-2.5
                text-center
                text-[14px]
                font-semibold
                text-[#1e293b]
                border-r
                border-[#edf2f7]
              "
            >
            {row.hour}
            </td>

            {/* TARGET */}
            <td
              className="
                px-3
                py-2.5
                text-center
                text-[14px]
                font-semibold
                text-[#334155]
                border-r
                border-[#edf2f7]
              "
            >
              {row.target}
            </td>

            {/* ACTUAL */}
            <td
              className="
                px-3
                py-2.5
                text-center
                text-[14px]
                font-bold
                text-[#2563eb]
                border-r
                border-[#edf2f7]
              "
            >
              {row.actual}
            </td>

            {/* OK */}
            <td
              className="
                px-3
                py-2.5
                text-center
                text-[14px]
                font-bold
                text-[#16a34a]
                border-r
                border-[#edf2f7]
              "
            >
         {row.okParts}
            </td>

            {/* REWORK */}
            <td
              className="
                px-3
                py-2.5
                text-center
                text-[14px]
                font-bold
                text-[#ef4444]
                border-r
                border-[#edf2f7]
              "
            >
              {row.rework}
            </td>

            {/* OEE */}
            <td
              className="
                px-3
                py-2.5
                text-center
                border-r
                border-[#edf2f7]
              "
            >
              <span
                className={`
                  px-2.5
                  py-1
                  rounded-full
                  text-[12px]
                  font-bold
                  ${row.oeeColor}
                `}
              >
                {row.oee ? `${row.oee}%` : '-'}
              </span>
            </td>

         <td className="p-2">
  <div className="flex justify-center items-center">
    <button
      onClick={() => {
        setSelectedSlot(row);

        setOpenPendingModal(true);

        setPendingForm({
          type: "",
          duration: "",
          unit: "Minutes",
        });
      }}
      className="
        h-[34px]
        px-3
        rounded-[10px]
        bg-[#1D60AB]
        hover:bg-[#174d89]
        text-white
        inline-flex
        items-center
        justify-center
        gap-1.5
        text-[12px]
        font-semibold
        transition-all
        whitespace-nowrap
      "
    >
      <Plus size={13} />

      Assign Pending
    </button>
  </div>
</td>
          </tr>
        ))}
      </tbody>
      
    </table>
  </div>
</div>
        </div>

        {/* RIGHT SIDE */}
        <div className="xl:col-span-3 space-y-4">
          {/* TIMER */}
       <div
  className="
    bg-white
    rounded-[22px]
    p-4
    md:p-5
    shadow-[0_2px_12px_rgba(15,23,42,0.06)]
  "
>
  {/* TOP */}
  <div
    className="
      flex
      items-center
      justify-between
      gap-4
      mb-4
    "
  >
    {/* SHIFT */}
    <div>
      <p
        className="
          text-[13px]
          md:text-[14px]
          font-semibold
          text-slate-500
          uppercase
          tracking-wide
        "
      >
        Shift A
      </p>

 
    </div>

    {/* REMAINING */}
    <div className="text-right">
      <p
        className="
          text-[10px]
          md:text-[11px]
          font-semibold
          text-slate-500
          uppercase
          tracking-wide
        "
      >
        Remaining Time :00:00
      </p>

    
    </div>
  </div>

  {/* PROGRESS BAR */}
  <div
    className="
      w-full
      h-[10px]
      bg-[#e2e8f0]
      rounded-full
      overflow-hidden
    "
  >
    <div
      className="
        h-full
        bg-[#22c55e]
        rounded-full
        transition-all
        duration-500
      "
      style={{
        width: "1%",
      }}
    />
  </div>

  {/* CENTER VALUE */}
  <div
    className="
      flex
      justify-center
      items-center
      mt-6
    "
  >
    <h1
      className="
        text-[60px]
        md:text-[72px]
        font-bold
        leading-none
        text-[#0f172a]
      "
    >
      0
    </h1>
  </div>

  {/* LABEL */}
  <div className="text-center mt-2">
    <p
      className="
        text-sm
        md:text-base
        text-slate-500
        font-medium
      "
    >
      Shift Progress
    </p>
  </div>
</div>

       {/* OEE */}
<div
  className="
    bg-white
    rounded-[22px]
    p-4
    shadow-[0_2px_10px_rgba(15,23,42,0.05)]
  "
>
  {/* TITLE */}
  <div className="flex items-center gap-2 mb-4">
    <h2
      className="
        text-[18px]
        md:text-[20px]
        font-bold
        text-slate-800
      "
    >
      OEE - Shift A
    </h2>


  </div>

  {/* CIRCLES */}
  <div
    className="
      grid
      grid-cols-3
      gap-3
      text-center
    "
  >
    {/* AVAILABILITY */}
    <div>
      <p
        className="
          text-[10px]
          md:text-[11px]
          font-semibold
          text-slate-500
          uppercase
          mb-2
        "
      >
        Availability
      </p>

      <div
        className="
          relative
          w-[68px]
          h-[68px]
          md:w-[74px]
          md:h-[74px]
          mx-auto
        "
      >
        {/* BG */}
        <div
          className="
            absolute
            inset-0
            rounded-full
            border-[6px]
            border-slate-200
          "
        />

        {/* PROGRESS */}
        <div
          className="
            absolute
            inset-0
            rounded-full
            border-[6px]
            border-transparent
            border-t-green-500
            border-l-green-500
            rotate-[0deg]
            transition-all
            duration-500
          "
        />

        {/* VALUE */}
        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
          "
        >
          <span
            className="
              text-[15px]
              md:text-[16px]
              font-bold
              text-green-600
            "
          >
            0%
          </span>
        </div>
      </div>
    </div>

    {/* PERFORMANCE */}
    <div>
      <p
        className="
          text-[10px]
          md:text-[11px]
          font-semibold
          text-slate-500
          uppercase
          mb-2
        "
      >
        Performance
      </p>

      <div
        className="
          relative
          w-[68px]
          h-[68px]
          md:w-[74px]
          md:h-[74px]
          mx-auto
        "
      >
        {/* BG */}
        <div
          className="
            absolute
            inset-0
            rounded-full
            border-[6px]
            border-slate-200
          "
        />

        {/* PROGRESS */}
        <div
          className="
            absolute
            inset-0
            rounded-full
            border-[6px]
            border-transparent
            border-t-blue-500
            border-l-blue-500
            rotate-[0deg]
            transition-all
            duration-500
          "
        />

        {/* VALUE */}
        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
          "
        >
          <span
            className="
              text-[15px]
              md:text-[16px]
              font-bold
              text-blue-600
            "
          >
            0%
          </span>
        </div>
      </div>
    </div>

    {/* QUALITY */}
    <div>
      <p
        className="
          text-[10px]
          md:text-[11px]
          font-semibold
          text-slate-500
          uppercase
          mb-2
        "
      >
        Quality
      </p>

      <div
        className="
          relative
          w-[68px]
          h-[68px]
          md:w-[74px]
          md:h-[74px]
          mx-auto
        "
      >
        {/* BG */}
        <div
          className="
            absolute
            inset-0
            rounded-full
            border-[6px]
            border-slate-200
          "
        />

        {/* PROGRESS */}
        <div
          className="
            absolute
            inset-0
            rounded-full
            border-[6px]
            border-transparent
            border-t-purple-500
            border-l-purple-500
            rotate-[0deg]
            transition-all
            duration-500
          "
        />

        {/* VALUE */}
        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
          "
        >
          <span
            className="
              text-[15px]
              md:text-[16px]
              font-bold
              text-purple-600
            "
          >
            0%
          </span>
        </div>
      </div>
    </div>
  </div>

  {/* LINE */}
  <div className="h-[1px] bg-slate-200 my-4" />

  {/* OEE BOX */}
  <div
    className="
      bg-green-50
      rounded-[18px]
      py-4
      text-center
    "
  >
    <p
      className="
        text-[15px]
        md:text-[16px]
        font-semibold
        text-slate-600
      "
    >
      OEE
    </p>

    <h2
      className="
        text-[34px]
        md:text-[42px]
        font-bold
        text-green-600
        mt-1
        leading-none
      "
    >
      0.0%
    </h2>
  </div>
</div>
          
          {/* SHIFT SUMMARY */}
<div
  className="
    bg-white
    rounded-[24px]
    p-4
    shadow-[0_2px_10px_rgba(15,23,42,0.05)]
  "
>
  {/* TITLE */}
  <h2
    className="
      text-[22px]
      md:text-[28px]
      font-bold
      text-[#07124d]
    mb-1
    "
  >
    Shift Summary (A)
  </h2>

  {/* LIST */}
  <div className="space-y-1">
    {[
      {
        label:
          "Planned  Time",
        value: "00:00:00",
        color:
          "text-black",
        icon: TimerReset,
        iconColor:
          "text-[#2563eb]",
      },

      {
        label: "Run Time",
        value: "00:00:00",
        color:
          "text-[#14851d]",
        icon: Clock3,
        iconColor:
          "text-[#2563eb]",
      },

      {
        label: "Idle Time",
        value: "00:00:00",
        color:
          "text-[#ea580c]",
        icon: CirclePause,
        iconColor:
          "text-[#475569]",
      },

      {
        label:
          "Breakdown Time",
        value: "00:00:00",
        color:
          "text-[#ef1111]",
        icon: Wrench,
        iconColor:
          "text-[#ef1111]",
      },

      {
        label:
          "Availability",
        value: "0%",
        color:
          "text-[#14851d]",
        icon: ShieldCheck,
        iconColor:
          "text-[#466b69]",
      },

      {
        label: "Quality",
        value: "0%",
        color:
          "text-black",
        icon: BadgeCheck,
        iconColor:
          "text-[#475569]",
      },

      {
        label:
          "Performance",
        value: "0%",
        color:
          "text-black",
        icon: TrendingUp,
        iconColor:
          "text-[#475569]",
      },
    ].map((item, index) => {
      const Icon = item.icon;

      return (
        <div
          key={index}
          className="
            flex
            items-center
            justify-between
            gap-3
          "
        >
          {/* LEFT */}
          <div
            className="
              flex
              items-center
              gap-3
              min-w-0
              flex-1
            "
          >
            {/* ICON */}
            <div
              className="
                w-9
                h-9
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <Icon
                size={24}
                strokeWidth={2.2}
                className={
                  item.iconColor
                }
              />
            </div>

            {/* LABEL */}
            <p
              className="
                text-[14px]
                md:text-[15px]
                font-semibold
                text-[#4b5563]
                leading-tight
              "
            >
              {item.label}
            </p>
          </div>

          {/* VALUE */}
          <p
            className={`
              text-[17px]
              md:text-[20px]
              font-bold
              shrink-0
              ${item.color}
            `}
          >
            {item.value}
          </p>
        </div>
      );
    })}
  </div>

  {/* OEE */}
  <div
    className="
      mt-5
      rounded-[18px]
      bg-[#eef8ea]
      px-4
      py-4
      flex
      items-center
      justify-between
      gap-3
    "
  >
    {/* LEFT */}
    <div className="flex items-center gap-3">
      <div
        className="
          w-10
          h-10
          rounded-xl
          bg-[#d8f0d1]
          flex
          items-center
          justify-center
        "
      >
        <Activity
          size={22}
          className="text-[#14851d]"
        />
      </div>

      <h2
        className="
          text-[18px]
          md:text-[20px]
          font-bold
          text-[#07124d]
        "
      >
        OEE 
      </h2>
    </div>

    {/* RIGHT */}
    <h1
      className="
        text-[32px]
        md:text-[32px]
        font-bold
        text-[#14851d]
        leading-none
      "
    >
      0%
    </h1>
  </div>
</div>
          
        </div>
      </div>
      {/* =========================
    ASSIGN PENDING MODAL
========================= */}

{openPendingModal && (
  <div
    className="
      fixed
      inset-0
      bg-black/40
      flex
      items-center
      justify-center
      z-50
      p-4
    "
  >
    <div
      className="
        bg-white
        rounded-[28px]
        p-6
        w-full
        max-w-[420px]
        shadow-2xl
      "
    >
      {/* TITLE */}
      <h2
        className="
          text-[24px]
          font-bold
          text-slate-800
          mb-5
        "
      >
        Assign Pending
      </h2>

      {/* TYPE */}
      <div className="mb-4">
        <label
          className="
            text-sm
            font-semibold
            text-slate-700
            mb-2
            block
          "
        >
          Pending Type
        </label>

        <select
          value={pendingForm.type}
          onChange={(e) =>
            setPendingForm({
              ...pendingForm,
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
            bg-white
          "
        >
          <option value="">
            Select Pending
          </option>

          <option>
            Tea Time
          </option>

          <option>
            Lunch
          </option>

          <option>
            Breakfast
          </option>

          <option>
            Dinner
          </option>

          <option>
            Snack Time
          </option>

          <option>
            Other
          </option>
        </select>
      </div>

      {/* DURATION */}
      <div className="mb-6">
        <label
          className="
            text-sm
            font-semibold
            text-slate-700
            mb-2
            block
          "
        >
          Pending Duration
        </label>

        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Duration"
            value={
              pendingForm.duration
            }
            onChange={(e) =>
              setPendingForm({
                ...pendingForm,
                duration:
                  e.target.value,
              })
            }
            className="
              flex-1
              h-[52px]
              rounded-[16px]
              border
              border-slate-300
              px-4
              outline-none
              bg-white
            "
          />

          <select
            value={pendingForm.unit}
            onChange={(e) =>
              setPendingForm({
                ...pendingForm,
                unit:
                  e.target.value,
              })
            }
            className="
              w-[130px]
              h-[52px]
              rounded-[16px]
              border
              border-slate-300
              px-4
              outline-none
              bg-white
            "
          >
            <option>
              Hours
            </option>

            <option>
              Minutes
            </option>

            <option>
              Seconds
            </option>
          </select>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="flex gap-3">
        <button
          onClick={
            handleSavePending
          }
          className="
            flex-1
            h-[50px]
            rounded-[16px]
            bg-[#1D60AB]
            hover:bg-[#164f90]
            text-white
            font-semibold
          "
        >
          Save
        </button>

        <button
          onClick={() =>
            setOpenPendingModal(
              false
            )
          }
          className="
            flex-1
            h-[50px]
            rounded-[16px]
            bg-slate-200
            hover:bg-slate-300
            text-slate-700
            font-semibold
          "
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}