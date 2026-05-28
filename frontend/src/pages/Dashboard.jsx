import { useEffect, useMemo, useState } from "react";
import {
  User,
  Users,
  Target,
  CheckCircle2,
  RefreshCcw,
  XCircle,
  Activity,
  Clock3,
  TimerReset,
  CirclePause,
  Wrench,
  ShieldCheck,
  BadgeCheck,
  TrendingUp,
  Hourglass,
} from "lucide-react";
import useAppStore from "../store/useAppStore";
import toast from "react-hot-toast";
import useServerNow from "../hooks/useServerNow";

const summaryItems = [
  { label: "Planned Production Time", icon: TimerReset, valueColor: "text-black", iconColor: "text-[#2563eb]" },
  { label: "Run Time", icon: Clock3, valueColor: "text-[#15803d]", iconColor: "text-[#2563eb]" },
  { label: "Idle Time", icon: CirclePause, valueColor: "text-[#ea580c]", iconColor: "text-[#475569]" },
  { label: "Breakdown Time", icon: Wrench, valueColor: "text-[#dc2626]", iconColor: "text-[#dc2626]" },
  { label: "Availability", icon: ShieldCheck, valueColor: "text-[#15803d]", iconColor: "text-[#466b69]" },
  { label: "Quality", icon: BadgeCheck, valueColor: "text-black", iconColor: "text-[#475569]" },
  { label: "Performance", icon: TrendingUp, valueColor: "text-black", iconColor: "text-[#475569]" },
];

function Ring({ label, value, color, track = "#e2e8f0" }) {
  const angle = (value / 100) * 360;
  return (
    <div className="text-center">
      <p className="text-[10px] font-semibold uppercase text-slate-500 mb-2">{label}</p>
      <div
        className="relative w-[72px] h-[72px] mx-auto rounded-full"
        style={{ background: `conic-gradient(${color} ${angle}deg, ${track} ${angle}deg)` }}
      >
        <div className="absolute inset-[7px] rounded-full bg-white flex items-center justify-center">
          <span className="text-[13px] font-bold" style={{ color }}>
            {value.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

const formatDuration = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = String(Math.floor(safe / 3600)).padStart(2, "0");
  const m = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export default function Dashboard() {
  const { currentBatch, batchStarted, splitRows: batchSplitRows } = useAppStore();
  const [liveSummary, setLiveSummary] = useState({
    produced: 0,
    ok: 0,
    rework: 0,
    reject: 0,
    splitRows: [],
  });
  const [activeShiftBreaks, setActiveShiftBreaks] = useState([]);
  const [downtimeOptions, setDowntimeOptions] = useState([]);
  const [splitDowntimes, setSplitDowntimes] = useState([]);
  const [pendingModal, setPendingModal] = useState({ open: false, splitNo: null, splitLabel: "" });
  const [pendingForm, setPendingForm] = useState({ downtimeType: "", otherType: "", durationMinutes: "", notes: "" });
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const plantTimeZone = import.meta.env.VITE_PLANT_TIMEZONE || "Asia/Kolkata";

  const hasBatch = batchStarted && currentBatch;
  const now = useServerNow(apiBaseUrl, hasBatch);
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

  const shiftLabel = currentBatch?.shiftTime || "-";
  const activeRows = hasBatch ? batchSplitRows : [];
  const shiftTarget = activeRows.reduce((sum, row) => sum + (Number(row.target) || 0), 0);
  const runningModel = activeRows.find((row) => row.model && row.model !== "-")?.model || "-";

  const { shiftProgress, remainingSeconds, elapsedSeconds, totalSeconds } = useMemo(() => {
    if (!hasBatch || !currentBatch?.shift) {
      return { shiftProgress: 0, remainingSeconds: 0, elapsedSeconds: 0, totalSeconds: 0 };
    }
    const startHour = Number(currentBatch.shift.start || 0);
    const endHour = Number(currentBatch.shift.end || 0);
    const startSeconds = Math.round(startHour * 3600);
    const endSeconds = Math.round(endHour * 3600);
    const total = ((endSeconds - startSeconds + 86400) % 86400) || 86400;

    const nowParts = clockFormatter.formatToParts(new Date(now));
    const h = Number(nowParts.find((part) => part.type === "hour")?.value || 0);
    const m = Number(nowParts.find((part) => part.type === "minute")?.value || 0);
    const s = Number(nowParts.find((part) => part.type === "second")?.value || 0);
    const currentSeconds = h * 3600 + m * 60 + s;

    const elapsedRaw = (currentSeconds - startSeconds + 86400) % 86400;
    const elapsed = Math.max(0, Math.min(total, elapsedRaw));
    const remaining = Math.max(0, total - elapsed);
    return {
      shiftProgress: Math.max(0, Math.min(100, (elapsed / total) * 100)),
      remainingSeconds: remaining,
      elapsedSeconds: elapsed,
      totalSeconds: total,
    };
  }, [hasBatch, currentBatch, now, clockFormatter]);

  const splitLiveRows = useMemo(() => {
    if (!hasBatch || !Array.isArray(currentBatch?.splitPlan)) return [];

    const summaryBySplitNo = new Map(
      (liveSummary.splitRows || []).map((row) => [
        Number(row.splitNo),
        {
          actual: Number(row.actual) || 0,
          ok: Number(row.ok) || 0,
          rework: Number(row.rework) || 0,
          reject: Number(row.reject) || 0,
          target: Number(row.target) || 0,
          modelId: row.modelId || "",
          from: row.from || row.from_time || "",
          to: row.to || "",
        },
      ])
    );

    return currentBatch.splitPlan.map((planRow) => {
      const splitNo = Number(planRow.splitNo);
      const summaryRow = summaryBySplitNo.get(splitNo);
      const splitTarget = summaryRow ? summaryRow.target : Number(planRow.target) || 0;
      const produced = summaryRow ? summaryRow.actual : 0;
      const ok = summaryRow ? summaryRow.ok : 0;
      const rework = summaryRow ? summaryRow.rework : 0;
      const reject = summaryRow ? summaryRow.reject : 0;
      const model = summaryRow?.modelId || planRow.modelId || "-";
      const from = summaryRow?.from || planRow.from || "-";
      const to = summaryRow?.to || planRow.to || "-";
      const rowProgress = splitTarget > 0 ? (produced / splitTarget) * 100 : 0;

      return {
        splitNo,
        hour: `${from} - ${to}`,
        target: splitTarget,
        model,
        actual: produced,
        ok,
        rework,
        reject,
        oee: `${rowProgress.toFixed(1)}%`,
        dot: rowProgress >= 85 ? "bg-green-500" : rowProgress >= 60 ? "bg-amber-500" : "bg-rose-500",
        pill: rowProgress >= 85 ? "bg-[#eaf8ed] text-[#166534]" : rowProgress >= 60 ? "bg-[#fff3e5] text-[#9a3412]" : "bg-[#ffecef] text-[#be123c]",
      };
    });
  }, [hasBatch, currentBatch, liveSummary, shiftProgress]);

  const liveTotals = useMemo(() => {
    const produced = Number(liveSummary.produced) || 0;
    const ok = Number(liveSummary.ok) || 0;
    const rework = Number(liveSummary.rework) || 0;
    const reject = Number(liveSummary.reject) || 0;
    return {
      produced,
      ok,
      rework,
      reject,
      pending: Math.max(0, shiftTarget - produced),
    };
  }, [liveSummary, shiftTarget]);

  const quality = hasBatch && liveTotals.produced > 0 ? ((liveTotals.ok / Math.max(1, liveTotals.produced)) * 100) : 0;
  const performance = hasBatch && shiftTarget > 0 ? ((liveTotals.produced / shiftTarget) * 100) : 0;
  const availability = hasBatch ? shiftProgress : 0;
  const oee = (availability * performance * quality) / 10000;
  const displayProgress = hasBatch && shiftTarget > 0 ? Math.max(0, Math.min(100, (liveTotals.produced / shiftTarget) * 100)) : 0;

  const peopleCards = [
    { label: "Team Leader", value: currentBatch?.teamLeader || "-", icon: User, iconBox: "bg-[#e8f1ff]", iconColor: "text-[#2563eb]" },
    { label: "Line Leader", value: currentBatch?.lineLeader || "-", icon: User, iconBox: "bg-[#e8f1ff]", iconColor: "text-[#2563eb]" },
    { label: "Supervisor", value: currentBatch?.supervisor || "-", icon: User, iconBox: "bg-[#e8f1ff]", iconColor: "text-[#2563eb]" },
    { label: "Running Model", value: runningModel, icon: Activity, iconBox: "bg-[#fff8e6]", iconColor: "text-[#d97706]" },
    { label: "Man Power", value: currentBatch?.manpower || "-", subText: hasBatch ? "Selected" : "", icon: Users, iconBox: "bg-[#edf2f7]", iconColor: "text-[#475569]" },
  ];

  const statCards = [
    { label: "Target (Shift)", value: shiftTarget.toLocaleString(), subText: "", valueColor: "text-[#1e3a8a]", subColor: "text-slate-500", icon: Target, iconBox: "bg-[#e8f1ff]", iconColor: "text-[#2563eb]" },
    { label: "OK Parts", value: liveTotals.ok.toLocaleString(), subText: hasBatch && liveTotals.produced > 0 ? `${((liveTotals.ok / liveTotals.produced) * 100).toFixed(2)}%` : "0.00%", valueColor: "text-[#16a34a]", subColor: "text-[#16a34a]", icon: CheckCircle2, iconBox: "bg-[#edfdf2]", iconColor: "text-[#16a34a]" },
    { label: "Rework Parts", value: liveTotals.rework.toLocaleString(), subText: hasBatch && liveTotals.produced > 0 ? `${((liveTotals.rework / liveTotals.produced) * 100).toFixed(2)}%` : "0.00%", valueColor: "text-[#dc2626]", subColor: "text-slate-500", icon: RefreshCcw, iconBox: "bg-[#fff1f2]", iconColor: "text-[#dc2626]" },
    { label: "Reject Parts", value: liveTotals.reject.toLocaleString(), subText: hasBatch && liveTotals.produced > 0 ? `${((liveTotals.reject / liveTotals.produced) * 100).toFixed(2)}%` : "0.00%", valueColor: "text-[#e11d48]", subColor: "text-slate-500", icon: XCircle, iconBox: "bg-[#fff1f2]", iconColor: "text-[#e11d48]" },
    { label: "Pending Parts", value: liveTotals.pending.toLocaleString(), subText: hasBatch && shiftTarget > 0 ? `${((liveTotals.pending / shiftTarget) * 100).toFixed(2)}%` : "0.00%", valueColor: "text-[#d97706]", subColor: "text-slate-500", icon: Hourglass, iconBox: "bg-[#fff7ed]", iconColor: "text-[#d97706]" },
  ];

  const splitAssignedDowntimeMap = useMemo(() => {
    const map = new Map();
    splitDowntimes.forEach((item) => {
      const key = Number(item.split_no);
      map.set(key, (map.get(key) || 0) + (Number(item.duration_minutes) || 0));
    });
    return map;
  }, [splitDowntimes]);

  const toMinutes = (timeValue = "") => {
    const [h, m] = timeValue.split(":").map(Number);
    return (Number(h || 0) * 60) + Number(m || 0);
  };

  const getShiftStartMinutes = () => {
    const shiftStartHour = Number(currentBatch?.shift?.start || 0);
    const h = Math.floor(shiftStartHour);
    const m = Math.round((shiftStartHour % 1) * 60);
    return (h * 60 + m + 1440) % 1440;
  };

  const toShiftOffset = (absoluteMinutes, anchorMinutes) =>
    (absoluteMinutes - anchorMinutes + 1440) % 1440;

  const getNowClockMinutes = () => {
    const parts = clockFormatter.formatToParts(new Date(now));
    const h = Number(parts.find((part) => part.type === "hour")?.value || 0);
    const m = Number(parts.find((part) => part.type === "minute")?.value || 0);
    return h * 60 + m;
  };

  const getSplitStatus = (hourRange = "") => {
    if (!hasBatch || !hourRange.includes(" - ")) return "future";
    const [from, to] = hourRange.split(" - ").map((v) => v.trim());
    const startAbs = toMinutes(from);
    const endAbs = toMinutes(to);
    const shiftStartAbs = getShiftStartMinutes();

    const start = toShiftOffset(startAbs, shiftStartAbs);
    let end = toShiftOffset(endAbs, shiftStartAbs);
    if (end <= start) end += 24 * 60;

    const currentRaw = toShiftOffset(getNowClockMinutes(), shiftStartAbs);
    if (currentRaw < start) return "future";

    const current = currentRaw < start ? currentRaw + 24 * 60 : currentRaw;
    if (current >= end) return "completed";
    return "running";
  };

  const getSplitAvailabilityPercent = (hourRange = "") => {
    if (!hasBatch || !hourRange.includes(" - ")) return 0;
    const [from, to] = hourRange.split(" - ").map((v) => v.trim());
    const startAbs = toMinutes(from);
    const endAbs = toMinutes(to);
    const shiftStartAbs = getShiftStartMinutes();

    const start = toShiftOffset(startAbs, shiftStartAbs);
    let end = toShiftOffset(endAbs, shiftStartAbs);
    if (end <= start) end += 24 * 60;

    const total = Math.max(1, end - start);
    const currentRaw = toShiftOffset(getNowClockMinutes(), shiftStartAbs);

    let current = currentRaw;
    if (current < start) current += 24 * 60;

    if (current <= start) return 0;
    if (current >= end) return 100;

    return Math.max(0, Math.min(100, ((current - start) / total) * 100));
  };

  const splitDurationMinutes = (hourRange = "") => {
    if (!hourRange.includes(" - ")) return 0;
    const [from, to] = hourRange.split(" - ").map((v) => v.trim());
    const start = toMinutes(from);
    const end = toMinutes(to);
    return (end - start + 24 * 60) % (24 * 60);
  };

  const splitBreakMinutes = (hourRange = "") => {
    if (!hourRange.includes(" - ")) return 0;
    const [from, to] = hourRange.split(" - ").map((v) => v.trim());
    const startAbs = toMinutes(from);
    const endAbs = toMinutes(to);
    const shiftStartAbs = getShiftStartMinutes();
    const start = toShiftOffset(startAbs, shiftStartAbs);
    let end = toShiftOffset(endAbs, shiftStartAbs);
    if (end <= start) end += 24 * 60;

    return activeShiftBreaks.reduce((sum, item) => {
      const breakStartAbs = toMinutes(item.break_start_time || "");
      let breakStart = toShiftOffset(breakStartAbs, shiftStartAbs);
      if (breakStart < start) breakStart += 24 * 60;
      if (breakStart >= start && breakStart < end) {
        return sum + (Number(item.duration_minutes) || 0);
      }
      return sum;
    }, 0);
  };

  const splitPendingMinutes = (row) => {
    const duration = splitDurationMinutes(row.hour);
    const netDuration = Math.max(0, duration - splitBreakMinutes(row.hour));
    const target = Math.max(0, Number(row.target) || 0);
    const actual = Math.max(0, Number(row.actual) || 0);
    if (netDuration <= 0 || target <= 0) return 0;

    const missingParts = Math.max(0, target - actual);
    const minutesPerPart = netDuration / target;
    return Math.max(0, Math.round(missingParts * minutesPerPart));
  };

  const splitUtilizedMinutes = (row) => {
    const duration = splitDurationMinutes(row.hour);
    const netDuration = Math.max(0, duration - splitBreakMinutes(row.hour));
    const target = Math.max(0, Number(row.target) || 0);
    const actual = Math.max(0, Number(row.actual) || 0);
    if (netDuration <= 0 || target <= 0 || actual <= 0) return 0;

    const minutesPerPart = netDuration / target;
    const utilized = actual * minutesPerPart;
    return Math.max(0, Math.min(netDuration, Math.round(utilized)));
  };

  const splitEffectiveMinutes = (hourRange = "") =>
    Math.max(0, splitDurationMinutes(hourRange) - splitBreakMinutes(hourRange));

  const splitBreakMap = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(splitLiveRows) || !Array.isArray(activeShiftBreaks)) return map;

    const shiftStartAbs = getShiftStartMinutes();
    splitLiveRows.forEach((row) => {
      if (!row.hour?.includes(" - ")) return;
      const [from, to] = row.hour.split(" - ").map((v) => v.trim());
      const startAbs = toMinutes(from);
      const endAbs = toMinutes(to);
      const start = toShiftOffset(startAbs, shiftStartAbs);
      let end = toShiftOffset(endAbs, shiftStartAbs);
      if (end <= start) end += 24 * 60;

      const matches = activeShiftBreaks.filter((item) => {
        const breakStartAbs = toMinutes(item.break_start_time || "");
        let breakStart = toShiftOffset(breakStartAbs, shiftStartAbs);
        if (breakStart < start) breakStart += 24 * 60;
        return breakStart >= start && breakStart < end;
      });
      map.set(Number(row.splitNo), matches);
    });

    return map;
  }, [splitLiveRows, activeShiftBreaks, currentBatch]);

  const currentCycleMs = useMemo(() => {
    if (!hasBatch || !Array.isArray(currentBatch?.splitPlan)) return 10000;
    const nowMinutes = getNowClockMinutes();
    const activeSplit = currentBatch.splitPlan.find((row) => {
      const start = toMinutes(row.from);
      const end = toMinutes(row.to);
      if (start < end) return nowMinutes >= start && nowMinutes < end;
      if (start > end) return nowMinutes >= start || nowMinutes < end;
      return true;
    }) || currentBatch.splitPlan[0];
    const cycleSeconds = Math.max(1, Number(activeSplit?.cycleTimeSeconds) || 1);
    return cycleSeconds * 1000;
  }, [hasBatch, currentBatch, now, clockFormatter]);

  useEffect(() => {
    if (!hasBatch || !currentBatch?.id) {
      setLiveSummary({ produced: 0, ok: 0, rework: 0, reject: 0, splitRows: [] });
      return;
    }

    const fetchLiveSummary = async () => {
      const response = await fetch(`${apiBaseUrl}/batches/${currentBatch.id}/live-summary`);
      if (!response.ok) return;
      const data = await response.json();
      setLiveSummary({
        produced: Number(data.produced) || 0,
        ok: Number(data.ok) || 0,
        rework: Number(data.rework) || 0,
        reject: Number(data.reject) || 0,
        splitRows: Array.isArray(data.splitRows) ? data.splitRows : [],
      });
    };

    let timerId;
    let stopped = false;

    const runCycle = async () => {
      if (stopped) return;
      try {
        await fetchLiveSummary();
      } catch (_) {
      } finally {
        if (!stopped) {
          timerId = setTimeout(runCycle, currentCycleMs);
        }
      }
    };

    fetchLiveSummary();
    timerId = setTimeout(runCycle, currentCycleMs);

    return () => {
      stopped = true;
      clearTimeout(timerId);
    };
  }, [hasBatch, currentBatch, apiBaseUrl, currentCycleMs]);

  useEffect(() => {
    if (!hasBatch || !currentBatch?.id) {
      setDowntimeOptions([]);
      setSplitDowntimes([]);
      return;
    }

    const loadDowntimeData = async () => {
      try {
        const [downtimeRes, splitRes] = await Promise.all([
          fetch(`${apiBaseUrl}/downtimes`),
          fetch(`${apiBaseUrl}/batches/${currentBatch.id}/split-downtimes`),
        ]);
        if (downtimeRes.ok) {
          const rows = await downtimeRes.json();
          setDowntimeOptions(Array.isArray(rows) ? rows : []);
        }
        if (splitRes.ok) {
          const rows = await splitRes.json();
          setSplitDowntimes(Array.isArray(rows) ? rows : []);
        }
      } catch (_) {
      }
    };

    loadDowntimeData();
  }, [hasBatch, currentBatch, apiBaseUrl]);

  useEffect(() => {
    if (!hasBatch || !currentBatch?.shiftTime) {
      setActiveShiftBreaks([]);
      return;
    }

    const fetchBreaksForShift = async () => {
      try {
        const [timingResponse, breakResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/shift-timings`),
          fetch(`${apiBaseUrl}/shift-breaks`),
        ]);
        if (!timingResponse.ok || !breakResponse.ok) {
          return;
        }

        const shiftRows = await timingResponse.json();
        const breakRows = await breakResponse.json();

        const selectedShift = (Array.isArray(shiftRows) ? shiftRows : []).find(
          (row) =>
            row.shift_label === currentBatch.shiftTime ||
            row.shift_key === currentBatch.shiftTime
        );

        if (!selectedShift) {
          setActiveShiftBreaks([]);
          return;
        }

        const filteredBreaks = (Array.isArray(breakRows) ? breakRows : []).filter(
          (item) => item.shift_key === selectedShift.shift_key
        );
        setActiveShiftBreaks(filteredBreaks);
      } catch (_) {
        setActiveShiftBreaks([]);
      }
    };

    fetchBreaksForShift();
  }, [hasBatch, currentBatch, apiBaseUrl]);

  const totalBreakMinutes = useMemo(
    () =>
      activeShiftBreaks.reduce(
        (sum, item) =>
          sum + (Number(item.duration_minutes) || 0),
        0
      ),
    [activeShiftBreaks]
  );

  const remainingPendingForModal = useMemo(() => {
    if (!pendingModal.splitNo) return 0;
    const activeRow = splitLiveRows.find((row) => Number(row.splitNo) === Number(pendingModal.splitNo));
    if (!activeRow) return 0;
    const totalPending = splitPendingMinutes(activeRow);
    const assigned = splitAssignedDowntimeMap.get(Number(pendingModal.splitNo)) || 0;
    return Math.max(0, totalPending - assigned);
  }, [pendingModal.splitNo, splitLiveRows, splitAssignedDowntimeMap]);

  const modalSplitAssignments = useMemo(() => {
    if (!pendingModal.splitNo) return [];
    return splitDowntimes.filter((item) => Number(item.split_no) === Number(pendingModal.splitNo));
  }, [splitDowntimes, pendingModal.splitNo]);

  const modalSplitBreaks = useMemo(() => {
    if (!pendingModal.splitNo) return [];
    return splitBreakMap.get(Number(pendingModal.splitNo)) || [];
  }, [pendingModal.splitNo, splitBreakMap]);

  const openPendingModal = (row) => {
    setPendingModal({
      open: true,
      splitNo: row.splitNo,
      splitLabel: row.hour,
    });
    setPendingForm({
      downtimeType: "",
      otherType: "",
      durationMinutes: "",
      notes: "",
    });
  };

  const closePendingModal = () => {
    setPendingModal({ open: false, splitNo: null, splitLabel: "" });
  };

  const savePendingDowntime = async () => {
    if (!currentBatch?.id || !pendingModal.splitNo) return;
    if (!pendingForm.downtimeType) {
      toast.error("Select downtime type");
      return;
    }

    const resolvedType =
      pendingForm.downtimeType === "other"
        ? pendingForm.otherType.trim()
        : pendingForm.downtimeType;
    if (!resolvedType) {
      toast.error("Enter downtime name");
      return;
    }

    const duration = Number(pendingForm.durationMinutes);
    if (!Number.isFinite(duration) || duration <= 0) {
      toast.error("Enter valid duration");
      return;
    }
    if (duration > remainingPendingForModal) {
      toast.error(`Only ${remainingPendingForModal} min pending remaining`);
      return;
    }

    const response = await fetch(`${apiBaseUrl}/batches/${currentBatch.id}/split-downtimes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        split_no: pendingModal.splitNo,
        downtime_type: resolvedType,
        duration_minutes: duration,
        notes: pendingForm.notes.trim(),
      }),
    });

    if (!response.ok) {
      toast.error("Failed to save pending reason");
      return;
    }
    const created = await response.json();
    setSplitDowntimes((prev) => [...prev, created]);
    toast.success("Pending reason saved");
    setPendingForm({
      downtimeType: "",
      otherType: "",
      durationMinutes: "",
      notes: "",
    });
  };

  return (
    <div className="page-container space-y-4 pb-[90px] md:pb-4">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-9 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {peopleCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-white rounded-2xl border border-[#e9edf5] shadow-sm p-4 h-[120px] flex items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${item.iconBox} flex items-center justify-center`}>
                      <Icon size={20} className={item.iconColor} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{item.label}</p>
                      <h3 className="text-[20px] leading-tight font-bold text-slate-800 mt-1">{item.value}</h3>
                      {item.subText ? <p className="text-[11px] text-slate-500 mt-1">{item.subText}</p> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {statCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-white rounded-[20px] border border-[#e9edf5] shadow-sm px-5 py-4 h-[120px] flex justify-between items-center">
                  <div>
                    <p className="text-[11px] uppercase font-bold tracking-wide text-[#7b8bab]">{item.label}</p>
                    <h2 className={`text-[30px] font-bold mt-3 leading-none ${item.valueColor}`}>{item.value}</h2>
                    {item.subText ? <p className={`text-[14px] font-semibold mt-2 ${item.subColor}`}>{item.subText}</p> : null}
                  </div>
                  <div className={`w-[58px] h-[58px] rounded-full ${item.iconBox} flex items-center justify-center shrink-0`}>
                    <Icon size={28} className={item.iconColor} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-[24px] p-4 shadow-sm border border-[#e7edf5] overflow-auto">
            {/* <h2 className="text-[24px] md:text-[26px] font-bold text-[#09123f] mb-4">8 Hours Split View ({shiftLabel})</h2> */}
            <div className="overflow-hidden rounded-[16px] border border-[#e8edf5]">
              <table className="w-full min-w-[1080px] border-collapse">
                <thead>
                  <tr className="bg-[#f7f9fe]">
                    {["Hour", "Effective Time", "Target", "Model", "Actual", "OK Parts", "Rework", "Reject", "OEE", "Availability", "Pending Reason"].map((head) => (
                      <th key={head} className="px-4 py-3 text-center text-[16px] font-bold text-[#4b5563] border-r border-[#e8edf5] last:border-r-0">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {splitLiveRows.map((row) => {
                    const splitStatus = getSplitStatus(row.hour);
                    const running = splitStatus === "running";
                    const splitAvailability = getSplitAvailabilityPercent(row.hour);
                    const autoBreakAssigned = splitBreakMinutes(row.hour);
                    const manualAssigned = splitAssignedDowntimeMap.get(Number(row.splitNo)) || 0;
                    const totalAssigned = manualAssigned + autoBreakAssigned;
                    const remainingPendingInRow = Math.max(
                      0,
                      splitPendingMinutes(row) - manualAssigned
                    );
                    const disableAssignPending = splitStatus !== "completed" || remainingPendingInRow <= 0;
                    const rowBreaks = splitBreakMap.get(Number(row.splitNo)) || [];
                    const splitAssignments = splitDowntimes.filter(
                      (item) => Number(item.split_no) === Number(row.splitNo)
                    );
                    return (
                      <tr
                        key={row.hour}
                        className={`border-t border-[#edf2f7] ${running ? "bg-[#eaf3ff]" : "bg-white"}`}
                      >
                        <td className="px-3 py-3 text-center text-[18px] font-semibold text-[#1e293b] border-r border-[#edf2f7] w-[170px] min-w-[170px]">
                          <p>{row.hour}</p>
                        </td>
                        <td className="px-3 py-3 text-center text-[16px] font-semibold text-[#334155] border-r border-[#edf2f7]">
                          {splitEffectiveMinutes(row.hour)} min
                        </td>
                        <td className="px-4 py-3 text-center text-[18px] font-semibold text-[#334155] border-r border-[#edf2f7]">{row.target}</td>
                        <td className="px-4 py-3 text-center text-[16px] font-semibold text-[#334155] border-r border-[#edf2f7]">{row.model}</td>
                        <td className="px-4 py-3 text-center text-[18px] font-bold text-[#2563eb] border-r border-[#edf2f7]">{row.actual}</td>
                        <td className="px-4 py-3 text-center text-[18px] font-bold text-[#16a34a] border-r border-[#edf2f7]">{row.ok}</td>
                        <td className="px-4 py-3 text-center text-[18px] font-bold text-[#f97316] border-r border-[#edf2f7]">{row.rework}</td>
                        <td className="px-4 py-3 text-center text-[18px] font-bold text-[#e11d48] border-r border-[#edf2f7]">{row.reject}</td>
                        <td className="px-4 py-3 text-center border-r border-[#edf2f7]">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[18px] font-bold ${row.pill}`}>{row.oee}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-3 text-[18px] font-semibold text-[#1f2937]">
                            <span>{splitAvailability.toFixed(1)}%</span>
                            <span className={`w-3 h-3 rounded-full ${running ? "bg-[#2563eb]" : row.dot}`} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center border-l border-[#edf2f7]">
                          {remainingPendingInRow > 0 ? (
                            <button
                              onClick={() => openPendingModal(row)}
                              disabled={disableAssignPending}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                disableAssignPending
                                  ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                                  : "bg-[#1D60AB] text-white hover:bg-[#164f90]"
                              }`}
                            >
                              Assign Pending
                            </button>
                          ) : (
                            <div className="relative inline-block group">
                              <span className="inline-flex px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-semibold cursor-help">
                                Fully Assigned
                              </span>
                              <div className="hidden group-hover:block absolute z-20 right-0 mt-1 w-64 rounded-lg border border-slate-200 bg-white shadow-lg p-2 text-left">
                                <p className="text-[11px] font-bold text-slate-700 mb-1">Assigned Details</p>
                                {splitAssignments.length === 0 ? (
                                  rowBreaks.length === 0 ? (
                                    <p className="text-[11px] text-slate-500">No details found.</p>
                                  ) : null
                                ) : (
                                  <div className="space-y-1 max-h-44 overflow-auto">
                                    {splitAssignments.map((item) => (
                                      <div key={item.id} className="rounded border border-slate-200 px-2 py-1 bg-slate-50">
                                        <p className="text-[11px] font-semibold text-slate-700">
                                          {item.downtime_type} - {Number(item.duration_minutes) || 0} min
                                        </p>
                                        {item.notes ? (
                                          <p className="text-[10px] text-slate-500 mt-0.5">{item.notes}</p>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {rowBreaks.length > 0 ? (
                                  <div className="space-y-1 max-h-44 overflow-auto mt-1">
                                    {rowBreaks.map((item) => (
                                      <div key={`break-${item.id}`} className="rounded border border-amber-200 px-2 py-1 bg-amber-50">
                                        <p className="text-[11px] font-semibold text-amber-800">
                                          Break Auto-Assigned: {item.break_type} - {Number(item.duration_minutes) || 0} min
                                        </p>
                                        <p className="text-[10px] text-amber-700 mt-0.5">
                                          {item.break_start_time} - {item.break_end_time}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          )}
                          <p className="text-[11px] text-slate-500 mt-1">
                            Utilized: {splitUtilizedMinutes(row)} min
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Pending: {remainingPendingInRow} min
                          </p>
                          <p className="text-[11px] text-[#16a34a]">
                            Assigned: {totalAssigned} min
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white rounded-[22px] p-4 shadow-sm border border-[#e7edf5] h-[256px]">
            <div className="flex items-start justify-between text-[16px] font-semibold text-slate-800 leading-tight gap-2">
              <p>{shiftLabel}</p>
              <p className="tabular-nums">{hasBatch ? formatDuration(remainingSeconds) : "00:00:00"}</p>
            </div>
            <div className="mt-3 h-[18px] rounded-full border border-[#dbe7ff] bg-[#eef4ff] overflow-hidden">
              <div className="h-full bg-[#2563eb] text-white text-center text-[11px] leading-[16px] font-semibold" style={{ width: `${displayProgress}%` }}>
                {`${displayProgress.toFixed(1)}%`}
              </div>
            </div>
            <div className="text-center text-[86px] leading-none font-bold text-slate-800 mt-7 tabular-nums">
              {(liveTotals.ok + liveTotals.rework + liveTotals.reject).toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-[22px] p-4 shadow-sm border border-[#e7edf5]">
            <h2 className="text-[24px] font-bold text-slate-800 mb-4">OEE - {shiftLabel}</h2>
            <div className="grid grid-cols-3 gap-3">
              <Ring label="Availability" value={availability} color="#22c55e" />
              <Ring label="Performance" value={performance} color="#2563eb" />
              <Ring label="Quality" value={quality} color="#7c3aed" />
            </div>
            <div className="mt-4 rounded-[16px] bg-[#edf8ef] py-4 text-center">
              <p className="text-[16px] text-slate-700 font-semibold"></p>
              <h3 className="text-[48px] font-bold text-[#15803d] leading-none">{`${oee.toFixed(1)}%`}</h3>
            </div>
          </div>

          <div className="bg-white rounded-[22px] p-4 shadow-sm border border-[#e7edf5]">
            <h2 className="text-[24px] font-bold text-[#07124d] mb-2">Shift Summary ({shiftLabel})</h2>
            <div className="space-y-1">
              {summaryItems.map((item) => {
                const Icon = item.icon;
                let value = "-";
                if (item.label === "Planned Production Time") value = hasBatch ? formatDuration(totalSeconds) : "00:00:00";
                if (item.label === "Run Time") value = hasBatch ? formatDuration(elapsedSeconds) : "00:00:00";
                if (item.label === "Idle Time") value = formatDuration(totalBreakMinutes * 60);
                if (item.label === "Breakdown Time") value = "00:00:00";
                if (item.label === "Availability") value = `${availability.toFixed(1)}%`;
                if (item.label === "Quality") value = `${quality.toFixed(1)}%`;
                if (item.label === "Performance") value = `${performance.toFixed(1)}%`;
                return (
                  <div key={item.label} className="flex items-center justify-between gap-3 py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon size={16} className={item.iconColor} />
                      <p className="text-[14px] text-slate-600 font-semibold">{item.label}</p>
                    </div>
                    <p className={`text-[16px] font-bold ${item.valueColor}`}>{value}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 rounded-[14px] bg-[#edf8ef] px-3 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-[#15803d]" />
                <p className="text-[16px] font-bold text-[#07124d]">OEE ({shiftLabel})</p>
              </div>
              <p className="text-[30px] font-bold text-[#15803d] leading-none">{`${oee.toFixed(1)}%`}</p>
            </div>
          </div>
        </div>
      </div>

      {pendingModal.open ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <h3 className="text-xl font-bold text-slate-800">Assign Pending Time</h3>
            <p className="text-sm text-slate-500 mt-1">Split: {pendingModal.splitLabel}</p>

            <div className="mt-4">
              <label className="text-sm font-semibold text-slate-700">Downtime Type</label>
              <select
                value={pendingForm.downtimeType}
                onChange={(e) => setPendingForm((prev) => ({ ...prev, downtimeType: e.target.value }))}
                className="mt-1 w-full h-11 rounded-xl border border-slate-300 px-3"
                disabled={remainingPendingForModal <= 0}
              >
                <option value="">Select downtime</option>
                {downtimeOptions.map((d) => (
                  <option key={d.id} value={d.downtime_type}>
                    {d.downtime_type}
                  </option>
                ))}
                <option value="other">Others</option>
              </select>
            </div>

            {pendingForm.downtimeType === "other" ? (
              <div className="mt-3">
                <label className="text-sm font-semibold text-slate-700">Other Downtime Name</label>
                <input
                  value={pendingForm.otherType}
                  onChange={(e) => setPendingForm((prev) => ({ ...prev, otherType: e.target.value }))}
                  className="mt-1 w-full h-11 rounded-xl border border-slate-300 px-3"
                  placeholder="Enter downtime reason"
                  disabled={remainingPendingForModal <= 0}
                />
              </div>
            ) : null}

            <div className="mt-3">
              <label className="text-sm font-semibold text-slate-700">Duration (minutes)</label>
              <p className="text-xs text-slate-500 mt-1">Remaining pending: {remainingPendingForModal} min</p>
              <input
                type="number"
                min="1"
                max={remainingPendingForModal > 0 ? remainingPendingForModal : undefined}
                value={pendingForm.durationMinutes}
                onChange={(e) => setPendingForm((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                className="mt-1 w-full h-11 rounded-xl border border-slate-300 px-3"
                placeholder="e.g. 60"
                disabled={remainingPendingForModal <= 0}
              />
            </div>

            <div className="mt-3">
              <label className="text-sm font-semibold text-slate-700">Notes (Optional)</label>
              <input
                value={pendingForm.notes}
                onChange={(e) => setPendingForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="mt-1 w-full h-11 rounded-xl border border-slate-300 px-3"
                placeholder="Short note"
                disabled={remainingPendingForModal <= 0}
              />
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-700 mb-2">Assigned In This Split</p>
              {modalSplitAssignments.length === 0 && modalSplitBreaks.length === 0 ? (
                <p className="text-xs text-slate-500">No pending reasons assigned yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-auto">
                  {modalSplitAssignments.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                      <span>{item.downtime_type}</span>
                      <span>{Number(item.duration_minutes) || 0} min</span>
                    </div>
                  ))}
                  {modalSplitBreaks.map((item) => (
                    <div key={`modal-break-${item.id}`} className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                      <p className="font-semibold">Break Auto-Assigned: {item.break_type} ({Number(item.duration_minutes) || 0} min)</p>
                      <p className="text-[11px] text-amber-700">{item.break_start_time} - {item.break_end_time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={closePendingModal} className="px-4 h-10 rounded-lg bg-slate-200 text-slate-700 font-semibold">
                Cancel
              </button>
              <button onClick={savePendingDowntime} disabled={remainingPendingForModal <= 0} className="px-4 h-10 rounded-lg bg-[#1D60AB] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
