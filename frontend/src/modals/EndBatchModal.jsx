import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, CheckCircle2, Clock3, ShieldAlert, Target, Users, XCircle } from "lucide-react";
import useAppStore from "../store/useAppStore";

const formatDuration = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = String(Math.floor(safe / 3600)).padStart(2, "0");
  const m = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const toMinutes = (timeValue = "") => {
  const [h, m] = timeValue.split(":").map(Number);
  return Number(h || 0) * 60 + Number(m || 0);
};

export default function EndBatchModal({ open, onClose }) {
  const { currentBatch, endBatch } = useAppStore();
  const [now, setNow] = useState(Date.now());
  const [liveSummary, setLiveSummary] = useState({ produced: 0, ok: 0, rework: 0, reject: 0, splitRows: [] });
  const [activeShiftBreaks, setActiveShiftBreaks] = useState([]);
  const [splitDowntimes, setSplitDowntimes] = useState([]);
  const [confirmEarlyEnd, setConfirmEarlyEnd] = useState(false);
  const [loading, setLoading] = useState(false);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    if (!open) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open]);

  useEffect(() => {
    if (!open || !currentBatch?.id) return;
    const load = async () => {
      try {
        const [summaryRes, splitRes] = await Promise.all([
          fetch(`${apiBaseUrl}/batches/${currentBatch.id}/live-summary`),
          fetch(`${apiBaseUrl}/batches/${currentBatch.id}/split-downtimes`),
        ]);
        if (summaryRes.ok) {
          const data = await summaryRes.json();
          setLiveSummary({
            produced: Number(data.produced) || 0,
            ok: Number(data.ok) || 0,
            rework: Number(data.rework) || 0,
            reject: Number(data.reject) || 0,
            splitRows: Array.isArray(data.splitRows) ? data.splitRows : [],
          });
        }
        if (splitRes.ok) {
          const rows = await splitRes.json();
          setSplitDowntimes(Array.isArray(rows) ? rows : []);
        }
      } catch (_) {}
    };
    load();
  }, [open, currentBatch, apiBaseUrl]);

  useEffect(() => {
    if (!open || !currentBatch?.shiftTime) return;
    const loadBreaks = async () => {
      try {
        const [timingRes, breakRes] = await Promise.all([fetch(`${apiBaseUrl}/shift-timings`), fetch(`${apiBaseUrl}/shift-breaks`)]);
        if (!timingRes.ok || !breakRes.ok) return;
        const shiftRows = await timingRes.json();
        const breakRows = await breakRes.json();
        const selectedShift = (Array.isArray(shiftRows) ? shiftRows : []).find(
          (row) => row.shift_label === currentBatch.shiftTime || row.shift_key === currentBatch.shiftTime
        );
        if (!selectedShift) {
          setActiveShiftBreaks([]);
          return;
        }
        const filtered = (Array.isArray(breakRows) ? breakRows : []).filter((item) => item.shift_key === selectedShift.shift_key);
        setActiveShiftBreaks(filtered);
      } catch (_) {
        setActiveShiftBreaks([]);
      }
    };
    loadBreaks();
  }, [open, currentBatch, apiBaseUrl]);

  const getShiftStartMinutes = () => {
    const shiftStartHour = Number(currentBatch?.shift?.start || 0);
    const h = Math.floor(shiftStartHour);
    const m = Math.round((shiftStartHour % 1) * 60);
    return (h * 60 + m + 1440) % 1440;
  };

  const toShiftOffset = (absoluteMinutes, anchorMinutes) => (absoluteMinutes - anchorMinutes + 1440) % 1440;

  const splitAssignedDowntimeMap = useMemo(() => {
    const map = new Map();
    splitDowntimes.forEach((item) => {
      const key = Number(item.split_no);
      map.set(key, (map.get(key) || 0) + (Number(item.duration_minutes) || 0));
    });
    return map;
  }, [splitDowntimes]);

  const splitRows = useMemo(() => {
    if (!Array.isArray(currentBatch?.splitPlan)) return [];
    const summaryBySplitNo = new Map(
      (liveSummary.splitRows || []).map((row) => [
        Number(row.splitNo),
        { actual: Number(row.actual) || 0, target: Number(row.target) || 0, ok: Number(row.ok) || 0, rework: Number(row.rework) || 0, reject: Number(row.reject) || 0 },
      ])
    );
    return currentBatch.splitPlan.map((planRow) => {
      const splitNo = Number(planRow.splitNo);
      const summary = summaryBySplitNo.get(splitNo);
      return {
        splitNo,
        hour: `${planRow.from} - ${planRow.to}`,
        target: summary?.target ?? Number(planRow.target) ?? 0,
        actual: summary?.actual ?? 0,
        ok: summary?.ok ?? 0,
        rework: summary?.rework ?? 0,
        reject: summary?.reject ?? 0,
      };
    });
  }, [currentBatch, liveSummary]);

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
    const shiftStartAbs = getShiftStartMinutes();
    const start = toShiftOffset(toMinutes(from), shiftStartAbs);
    let end = toShiftOffset(toMinutes(to), shiftStartAbs);
    if (end <= start) end += 24 * 60;

    return activeShiftBreaks.reduce((sum, item) => {
      const breakStartAbs = toMinutes(item.break_start_time || "");
      let breakStart = toShiftOffset(breakStartAbs, shiftStartAbs);
      if (breakStart < start) breakStart += 24 * 60;
      if (breakStart >= start && breakStart < end) return sum + (Number(item.duration_minutes) || 0);
      return sum;
    }, 0);
  };

  const splitPendingMinutes = (row) => {
    const duration = splitDurationMinutes(row.hour);
    const netDuration = Math.max(0, duration - splitBreakMinutes(row.hour));
    const target = Math.max(0, Number(row.target) || 0);
    const actual = Math.max(0, Number(row.actual) || 0);
    if (netDuration <= 0 || target <= 0) return 0;
    const minutesPerPart = netDuration / target;
    return Math.max(0, Math.round(Math.max(0, target - actual) * minutesPerPart));
  };

  const splitUtilizedMinutes = (row) => {
    const duration = splitDurationMinutes(row.hour);
    const netDuration = Math.max(0, duration - splitBreakMinutes(row.hour));
    const target = Math.max(0, Number(row.target) || 0);
    const actual = Math.max(0, Number(row.actual) || 0);
    if (netDuration <= 0 || target <= 0 || actual <= 0) return 0;
    const minutesPerPart = netDuration / target;
    return Math.max(0, Math.min(netDuration, Math.round(actual * minutesPerPart)));
  };

  const splitManualAssignedMinutes = (row) =>
    splitAssignedDowntimeMap.get(Number(row.splitNo)) || 0;

  const splitAutoBreakAssignedMinutes = (row) =>
    splitBreakMinutes(row.hour);

  const splitBreakEntries = (row) => {
    if (!row.hour?.includes(" - ")) return [];
    const [from, to] = row.hour.split(" - ").map((v) => v.trim());
    const startAbs = toMinutes(from);
    const endAbs = toMinutes(to);
    const shiftStartAbs = getShiftStartMinutes();
    const start = toShiftOffset(startAbs, shiftStartAbs);
    let end = toShiftOffset(endAbs, shiftStartAbs);
    if (end <= start) end += 24 * 60;

    return activeShiftBreaks.filter((item) => {
      const breakStartAbs = toMinutes(item.break_start_time || "");
      let breakStart = toShiftOffset(breakStartAbs, shiftStartAbs);
      if (breakStart < start) breakStart += 24 * 60;
      return breakStart >= start && breakStart < end;
    });
  };

  const totalPendingMinutes = useMemo(() => {
    return splitRows.reduce((sum, row) => {
      const plannedPending = splitPendingMinutes(row);
      const assigned = splitAssignedDowntimeMap.get(Number(row.splitNo)) || 0;
      return sum + Math.max(0, plannedPending - assigned);
    }, 0);
  }, [splitRows, splitAssignedDowntimeMap, activeShiftBreaks]);

  const shiftTimeCards = useMemo(() => {
    const totalMinutes = splitRows.reduce((sum, row) => sum + splitDurationMinutes(row.hour), 0);
    const utilizedMinutes = splitRows.reduce((sum, row) => sum + splitUtilizedMinutes(row), 0);
    const assignedMinutes = splitRows.reduce((sum, row) => {
      const manual = splitManualAssignedMinutes(row);
      const autoBreak = splitAutoBreakAssignedMinutes(row);
      return sum + manual + autoBreak;
    }, 0);
    const pendingMinutes = totalPendingMinutes;
    return { totalMinutes, utilizedMinutes, pendingMinutes, assignedMinutes };
  }, [splitRows, splitAssignedDowntimeMap, totalPendingMinutes, activeShiftBreaks]);

  const shiftTarget = splitRows.reduce((sum, row) => sum + (Number(row.target) || 0), 0);
  const produced = Number(liveSummary.produced) || 0;
  const quality = produced > 0 ? ((Number(liveSummary.ok) || 0) / produced) * 100 : 0;
  const performance = shiftTarget > 0 ? (produced / shiftTarget) * 100 : 0;
  const availability = 92;
  const oee = (availability * performance * quality) / 10000;

  const remainingSeconds = useMemo(() => {
    if (!currentBatch?.shift) return 0;
    const nowDate = new Date(now);
    const startHour = Number(currentBatch.shift.start || 0);
    const endHour = Number(currentBatch.shift.end || 0);
    const start = new Date(nowDate);
    const end = new Date(nowDate);
    start.setHours(Math.floor(startHour), Math.round((startHour % 1) * 60), 0, 0);
    end.setHours(Math.floor(endHour), Math.round((endHour % 1) * 60), 0, 0);
    if (end <= start) {
      if (nowDate >= start) end.setDate(end.getDate() + 1);
      else start.setDate(start.getDate() - 1);
    }
    return Math.max(0, Math.floor((end.getTime() - nowDate.getTime()) / 1000));
  }, [currentBatch, now]);

  const isEarlyEnd = remainingSeconds > 30 * 60;

  if (!open) return null;

  const doEndBatch = async () => {
    try {
      setLoading(true);
      await endBatch();
      toast.success("Batch ended successfully");
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to end batch");
    } finally {
      setLoading(false);
      setConfirmEarlyEnd(false);
    }
  };

  const handleEndClick = async () => {
    if ((isEarlyEnd || totalPendingMinutes > 0) && !confirmEarlyEnd) {
      setConfirmEarlyEnd(true);
      return;
    }
    await doEndBatch();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-[980px] bg-white rounded-[24px] shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-[#1D60AB] to-[#256ec0] px-5 py-4">
          <h2 className="text-white text-[24px] font-bold">End Batch Summary</h2>
          <p className="text-blue-100 text-sm mt-1">Review full shift summary before ending batch</p>
        </div>

        <div className="p-5 space-y-4">
          {isEarlyEnd ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 flex items-start gap-2">
              <ShieldAlert size={18} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Shift still has more than 30 minutes left</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Remaining shift time: {formatDuration(remainingSeconds)}. You can continue anyway and end batch.
                </p>
              </div>
            </div>
          ) : null}

          {totalPendingMinutes > 0 ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 flex items-start gap-2">
              <AlertTriangle size={18} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Pending time will remain if you end now</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Remaining pending: {totalPendingMinutes} min. For demo, you can continue and end batch anyway.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 flex items-start gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 mt-0.5" />
              <p className="text-sm font-bold text-emerald-800">All pending assigned. Batch can be ended.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Total Hours (Shift)</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{shiftTimeCards.totalMinutes} min</p>
            </div>

            <div className="relative rounded-xl border border-blue-200 bg-blue-50 p-3 group cursor-help">
              <p className="text-xs font-semibold text-blue-700">Utilized</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">{shiftTimeCards.utilizedMinutes} min</p>
              <div className="hidden group-hover:block absolute z-20 left-0 top-full mt-1 w-72 rounded-lg border border-slate-200 bg-white shadow-lg p-2">
                <p className="text-[11px] font-bold text-slate-700 mb-1">Utilized Split-wise</p>
                <div className="space-y-1 max-h-44 overflow-auto">
                  {splitRows.map((row) => (
                    <p key={`u-${row.splitNo}`} className="text-[11px] text-slate-600">
                      Split {row.splitNo} ({row.hour}) - {splitUtilizedMinutes(row)} min
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative rounded-xl border border-rose-200 bg-rose-50 p-3 group cursor-help">
              <p className="text-xs font-semibold text-rose-700">Pending</p>
              <p className="text-2xl font-bold text-rose-800 mt-1">{shiftTimeCards.pendingMinutes} min</p>
              <div className="hidden group-hover:block absolute z-20 left-0 top-full mt-1 w-72 rounded-lg border border-slate-200 bg-white shadow-lg p-2">
                <p className="text-[11px] font-bold text-slate-700 mb-1">Pending Split-wise</p>
                <div className="space-y-1 max-h-44 overflow-auto">
                  {splitRows.map((row) => {
                    const plannedPending = splitPendingMinutes(row);
                    const assigned = splitAssignedDowntimeMap.get(Number(row.splitNo)) || 0;
                    const pending = Math.max(0, plannedPending - assigned);
                    return (
                      <p key={`p-${row.splitNo}`} className="text-[11px] text-slate-600">
                        Split {row.splitNo} ({row.hour}) - {pending} min
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="relative rounded-xl border border-emerald-200 bg-emerald-50 p-3 group cursor-help">
              <p className="text-xs font-semibold text-emerald-700">Assigned</p>
              <p className="text-2xl font-bold text-emerald-800 mt-1">{shiftTimeCards.assignedMinutes} min</p>
              <div className="hidden group-hover:block absolute z-20 left-0 top-full mt-1 w-72 rounded-lg border border-slate-200 bg-white shadow-lg p-2">
                <p className="text-[11px] font-bold text-slate-700 mb-1">Assigned Split-wise</p>
                <div className="space-y-1 max-h-44 overflow-auto">
                  {splitRows.map((row) => {
                    const assigned = splitAssignedDowntimeMap.get(Number(row.splitNo)) || 0;
                    const autoBreak = splitAutoBreakAssignedMinutes(row);
                    const totalAssigned = assigned + autoBreak;
                    const breakEntries = splitBreakEntries(row);
                    const manualEntries = splitDowntimes.filter((item) => Number(item.split_no) === Number(row.splitNo));
                    return (
                      <div key={`a-${row.splitNo}`} className="text-[11px] text-slate-600 rounded border border-slate-200 px-2 py-1 bg-slate-50">
                        <p className="font-semibold text-slate-700">
                          Split {row.splitNo} ({row.hour}) - {totalAssigned} min
                        </p>
                        <p>Manual: {assigned}m | Break: {autoBreak}m</p>
                        {manualEntries.length > 0 ? (
                          <p className="text-slate-500">
                            Manual Details: {manualEntries.map((item) => `${item.downtime_type} (${Number(item.duration_minutes) || 0}m)`).join(", ")}
                          </p>
                        ) : null}
                        {breakEntries.length > 0 ? (
                          <p className="text-slate-500">
                            Break Details: {breakEntries.map((item) => `${item.break_type} ${item.break_start_time}-${item.break_end_time}`).join(", ")}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            <div className="bg-[#e8f1ff] rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-500">Target (Shift)</p>
              <p className="text-2xl font-bold text-[#1e3a8a] mt-1">{shiftTarget}</p>
              <Target size={14} className="text-[#1D60AB] mt-1" />
            </div>
            <div className="bg-[#edfdf2] rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-500">OK</p>
              <p className="text-2xl font-bold text-[#15803d] mt-1">{liveSummary.ok}</p>
            </div>
            <div className="bg-[#fff7ed] rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-500">Rework</p>
              <p className="text-2xl font-bold text-[#c2410c] mt-1">{liveSummary.rework}</p>
            </div>
            <div className="bg-[#fff1f2] rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-500">Reject</p>
              <p className="text-2xl font-bold text-[#be123c] mt-1">{liveSummary.reject}</p>
            </div>
            <div className="bg-[#eff6ff] rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-500">OEE</p>
              <p className="text-2xl font-bold text-[#1e40af] mt-1">{oee.toFixed(1)}%</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">Shift Summary Details</p>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1"><Clock3 size={13} /> Remaining: {formatDuration(remainingSeconds)}</span>
                <span className="inline-flex items-center gap-1"><Users size={13} /> Manpower: {currentBatch?.manpower || "-"}</span>
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="bg-white">
                    {["Split", "Hour", "Target", "Actual", "OK", "Rework", "Reject", "Pending (Min)", "Assigned (Min)"].map((head) => (
                      <th key={head} className="px-3 py-2 text-left text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {splitRows.map((row) => {
                    const plannedPending = splitPendingMinutes(row);
                    const assigned = splitManualAssignedMinutes(row);
                    const pending = Math.max(0, plannedPending - assigned);
                    return (
                      <tr key={row.splitNo} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-2 text-sm font-semibold text-slate-700">{row.splitNo}</td>
                        <td className="px-3 py-2 text-sm text-slate-700">{row.hour}</td>
                        <td className="px-3 py-2 text-sm text-slate-700">{row.target}</td>
                        <td className="px-3 py-2 text-sm text-slate-700">{row.actual}</td>
                        <td className="px-3 py-2 text-sm text-[#15803d] font-semibold">{row.ok}</td>
                        <td className="px-3 py-2 text-sm text-[#c2410c] font-semibold">{row.rework}</td>
                        <td className="px-3 py-2 text-sm text-[#be123c] font-semibold">{row.reject}</td>
                        <td className={`px-3 py-2 text-sm font-semibold ${pending > 0 ? "text-rose-600" : "text-emerald-600"}`}>{pending}</td>
                        <td className="px-3 py-2 text-sm text-[#1D60AB] font-semibold">
                          {assigned + splitAutoBreakAssignedMinutes(row)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {confirmEarlyEnd ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
              <p className="text-sm font-bold text-amber-800">Continue anyway?</p>
              <p className="text-xs text-amber-700 mt-1">
                {isEarlyEnd && totalPendingMinutes > 0
                  ? `You are ending before final 30 minutes and ${totalPendingMinutes} min pending will remain.`
                  : isEarlyEnd
                    ? "You are ending batch before final 30 minutes of shift."
                    : `${totalPendingMinutes} min pending will remain after ending this batch.`}
              </p>
            </div>
          ) : null}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setConfirmEarlyEnd(false);
                onClose();
              }}
              className="flex-1 h-12 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold"
              disabled={loading}
            >
              Cancel
            </button>
            {confirmEarlyEnd ? (
              <button
                onClick={doEndBatch}
                className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-60"
                disabled={loading}
              >
                Continue Anyway & End Batch
              </button>
            ) : (
              <button
                onClick={handleEndClick}
                className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold disabled:opacity-60"
                disabled={loading}
              >
                End Batch
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
