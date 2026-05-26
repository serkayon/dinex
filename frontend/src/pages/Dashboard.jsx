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

const demoSplitRows = [
  { hour: "08:00 - 09:00", target: 200, model: "MDI", actual: 188, ok: 172, rework: 12, oee: "85.2%", availability: "91.5%", dot: "bg-green-500", pill: "bg-[#eaf8ed] text-[#166534]" },
  { hour: "09:00 - 10:00", target: 200, model: "MDI", actual: 195, ok: 183, rework: 10, oee: "88.7%", availability: "93.2%", dot: "bg-green-500", pill: "bg-[#eaf8ed] text-[#166534]" },
  { hour: "10:00 - 11:00", target: 200, model: "ZDI", actual: 175, ok: 160, rework: 10, oee: "79.1%", availability: "86.1%", dot: "bg-rose-500", pill: "bg-[#ffecef] text-[#be123c]" },
  { hour: "11:00 - 12:00", target: 200, model: "JDI", actual: 182, ok: 168, rework: 14, oee: "83.4%", availability: "89.0%", dot: "bg-amber-500", pill: "bg-[#fff3e5] text-[#9a3412]" },
  { hour: "12:00 - 13:00", target: 200, model: "ZDI", actual: 189, ok: 173, rework: 11, oee: "86.6%", availability: "91.3%", dot: "bg-green-500", pill: "bg-[#eaf8ed] text-[#166534]" },
  { hour: "13:00 - 14:00", target: 200, model: "KDI", actual: 189, ok: 171, rework: 13, oee: "86.0%", availability: "90.5%", dot: "bg-amber-500", pill: "bg-[#fff3e5] text-[#9a3412]" },
  { hour: "14:00 - 15:00", target: 200, model: "JDI", actual: 182, ok: 170, rework: 12, oee: "84.2%", availability: "89.1%", dot: "bg-amber-500", pill: "bg-[#fff3e5] text-[#9a3412]" },
  { hour: "15:00 - 16:00", target: 200, model: "MDI", actual: 182, ok: 175, rework: 8, oee: "87.8%", availability: "92.2%", dot: "bg-amber-500", pill: "bg-[#eaf8ed] text-[#166534]" },
];

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
  const [now, setNow] = useState(Date.now());

  const hasBatch = batchStarted && currentBatch;

  const shiftLabel = currentBatch?.shiftTime || "Shift A";
  const activeRows = hasBatch ? batchSplitRows : [];
  const shiftTarget = activeRows.reduce((sum, row) => sum + (Number(row.target) || 0), 0);
  const runningModel = activeRows.find((row) => row.model && row.model !== "-")?.model || "-";

  useEffect(() => {
    if (!hasBatch) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [hasBatch]);

  const { shiftProgress, remainingSeconds, elapsedSeconds, totalSeconds } = useMemo(() => {
    if (!hasBatch || !currentBatch?.shift) {
      return { shiftProgress: 0, remainingSeconds: 0, elapsedSeconds: 0, totalSeconds: 0 };
    }
    const startHour = Number(currentBatch.shift.start || 0);
    const endHour = Number(currentBatch.shift.end || 0);
    const nowDate = new Date(now);
    const start = new Date(nowDate);
    start.setHours(Math.floor(startHour), Math.round((startHour % 1) * 60), 0, 0);
    const end = new Date(start);
    end.setHours(Math.floor(endHour), Math.round((endHour % 1) * 60), 0, 0);
    if (end <= start) end.setDate(end.getDate() + 1);
    if (nowDate < start) start.setDate(start.getDate() - 1);
    if (nowDate > end) end.setDate(end.getDate() + 1);
    const total = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 1000));
    const elapsed = Math.max(0, Math.min(total, Math.floor((nowDate.getTime() - start.getTime()) / 1000)));
    const remaining = Math.max(0, total - elapsed);
    return {
      shiftProgress: Math.max(0, Math.min(100, (elapsed / total) * 100)),
      remainingSeconds: remaining,
      elapsedSeconds: elapsed,
      totalSeconds: total,
    };
  }, [hasBatch, currentBatch, now]);

  const splitLiveRows = useMemo(() => {
    if (!hasBatch || !Array.isArray(currentBatch?.splitPlan)) {
      return [];
    }

    const toSecondsFromClock = (timeValue = "") => {
      const [hours, minutes] = timeValue.split(":").map(Number);
      return (Number(hours || 0) * 3600) + (Number(minutes || 0) * 60);
    };

    let elapsedCursor = elapsedSeconds;
    return currentBatch.splitPlan.map((planRow) => {
      const startSec = toSecondsFromClock(planRow.from);
      let endSec = toSecondsFromClock(planRow.to);
      if (endSec <= startSec) {
        endSec += 24 * 3600;
      }
      const splitDuration = Math.max(1, endSec - startSec);
      const elapsedInSplit = Math.max(0, Math.min(splitDuration, elapsedCursor));
      elapsedCursor = Math.max(0, elapsedCursor - splitDuration);

      const cycleSeconds = Math.max(1, Number(planRow.cycleTimeSeconds) || 1);
      const splitTarget = Number(planRow.target) || 0;
      const produced = Math.min(splitTarget, Math.floor(elapsedInSplit / cycleSeconds));
      const cycles = Math.floor(produced / 5);
      const rem = produced % 5;
      const ok = cycles * 3 + Math.min(rem, 3);
      const rework = cycles + (rem >= 4 ? 1 : 0);
      const reject = cycles;
      const rowProgress = splitTarget > 0 ? (produced / splitTarget) * 100 : 0;

      return {
        hour: `${planRow.from} - ${planRow.to}`,
        target: splitTarget,
        model: planRow.modelId || "-",
        actual: produced,
        ok,
        rework,
        reject,
        oee: `${rowProgress.toFixed(1)}%`,
        availability: `${((elapsedInSplit / splitDuration) * 100).toFixed(1)}%`,
        dot: rowProgress >= 85 ? "bg-green-500" : rowProgress >= 60 ? "bg-amber-500" : "bg-rose-500",
        pill: rowProgress >= 85 ? "bg-[#eaf8ed] text-[#166534]" : rowProgress >= 60 ? "bg-[#fff3e5] text-[#9a3412]" : "bg-[#ffecef] text-[#be123c]",
      };
    });
  }, [hasBatch, currentBatch, elapsedSeconds]);

  const liveTotals = useMemo(() => {
    const produced = splitLiveRows.reduce((sum, row) => sum + row.actual, 0);
    const ok = splitLiveRows.reduce((sum, row) => sum + row.ok, 0);
    const rework = splitLiveRows.reduce((sum, row) => sum + row.rework, 0);
    const reject = splitLiveRows.reduce((sum, row) => sum + row.reject, 0);
    return {
      produced,
      ok,
      rework,
      reject,
      pending: Math.max(0, shiftTarget - produced),
    };
  }, [splitLiveRows, shiftTarget]);

  const quality = hasBatch && liveTotals.produced > 0 ? ((liveTotals.ok / Math.max(1, liveTotals.produced)) * 100) : 0;
  const performance = hasBatch && shiftTarget > 0 ? ((liveTotals.produced / shiftTarget) * 100) : 0;
  const availability = hasBatch ? shiftProgress : 0;
  const oee = (availability * performance * quality) / 10000;
  const displayProgress = hasBatch ? shiftProgress : 23.4;

  const peopleCards = hasBatch
    ? [
        { label: "Team Leader", value: currentBatch?.teamLeader || "-", icon: User, iconBox: "bg-[#e8f1ff]", iconColor: "text-[#2563eb]" },
        { label: "Line Leader", value: currentBatch?.lineLeader || "-", icon: User, iconBox: "bg-[#e8f1ff]", iconColor: "text-[#2563eb]" },
        { label: "Supervisor", value: currentBatch?.supervisor || "-", icon: User, iconBox: "bg-[#e8f1ff]", iconColor: "text-[#2563eb]" },
        { label: "Running Model", value: runningModel, icon: Activity, iconBox: "bg-[#fff8e6]", iconColor: "text-[#d97706]" },
        { label: "Man Power", value: currentBatch?.manpower || "-", subText: "Selected", icon: Users, iconBox: "bg-[#edf2f7]", iconColor: "text-[#475569]" },
      ]
    : [
        { label: "Team Leader", value: "Rakesh Kumar", icon: User, iconBox: "bg-[#e8f1ff]", iconColor: "text-[#2563eb]" },
        { label: "Line Leader", value: "Amit Singh", icon: User, iconBox: "bg-[#e8f1ff]", iconColor: "text-[#2563eb]" },
        { label: "Supervisor", value: "Sanjay Verma", icon: User, iconBox: "bg-[#e8f1ff]", iconColor: "text-[#2563eb]" },
        { label: "Running Model", value: "MDI", icon: Activity, iconBox: "bg-[#fff8e6]", iconColor: "text-[#d97706]" },
        { label: "Man Power", value: "18 / 20", subText: "Present / Total", icon: Users, iconBox: "bg-[#edf2f7]", iconColor: "text-[#475569]" },
      ];

  const statCards = [
    { label: "Target (Shift)", value: hasBatch ? shiftTarget.toLocaleString() : "1,600", subText: "", valueColor: "text-[#1e3a8a]", subColor: "text-slate-500", icon: Target, iconBox: "bg-[#e8f1ff]", iconColor: "text-[#2563eb]" },
    { label: "OK Parts", value: hasBatch ? liveTotals.ok.toLocaleString() : "1,312", subText: hasBatch && liveTotals.produced > 0 ? `${((liveTotals.ok / liveTotals.produced) * 100).toFixed(2)}%` : "82.00%", valueColor: "text-[#16a34a]", subColor: "text-[#16a34a]", icon: CheckCircle2, iconBox: "bg-[#edfdf2]", iconColor: "text-[#16a34a]" },
    { label: "Rework Parts", value: hasBatch ? liveTotals.rework.toLocaleString() : "120", subText: hasBatch && liveTotals.produced > 0 ? `${((liveTotals.rework / liveTotals.produced) * 100).toFixed(2)}%` : "7.50%", valueColor: "text-[#dc2626]", subColor: "text-slate-500", icon: RefreshCcw, iconBox: "bg-[#fff1f2]", iconColor: "text-[#dc2626]" },
    { label: "Reject Parts", value: hasBatch ? liveTotals.reject.toLocaleString() : "50", subText: hasBatch && liveTotals.produced > 0 ? `${((liveTotals.reject / liveTotals.produced) * 100).toFixed(2)}%` : "3.13%", valueColor: "text-[#e11d48]", subColor: "text-slate-500", icon: XCircle, iconBox: "bg-[#fff1f2]", iconColor: "text-[#e11d48]" },
    { label: "Pending Parts", value: hasBatch ? liveTotals.pending.toLocaleString() : "118", subText: hasBatch && shiftTarget > 0 ? `${((liveTotals.pending / shiftTarget) * 100).toFixed(2)}%` : "7.38%", valueColor: "text-[#d97706]", subColor: "text-slate-500", icon: Hourglass, iconBox: "bg-[#fff7ed]", iconColor: "text-[#d97706]" },
  ];

  return (
    <div className="page-container space-y-4 pb-[90px] md:pb-4">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-9 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {peopleCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-white rounded-2xl border border-[#e9edf5] shadow-sm p-4">
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
            <h2 className="text-[24px] md:text-[26px] font-bold text-[#09123f] mb-4">8 Hours Split View ({shiftLabel})</h2>
            <div className="overflow-hidden rounded-[16px] border border-[#e8edf5]">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className="bg-[#f7f9fe]">
                    {["Hour", "Target", "Model", "Actual", "OK Parts", "Rework", "OEE", "Availability"].map((head) => (
                      <th key={head} className="px-4 py-3 text-center text-[16px] font-bold text-[#4b5563] border-r border-[#e8edf5] last:border-r-0">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(hasBatch ? splitLiveRows : demoSplitRows).map((row) => (
                      <tr key={row.hour} className="bg-white border-t border-[#edf2f7]">
                        <td className="px-4 py-3 text-center text-[18px] font-semibold text-[#1e293b] border-r border-[#edf2f7]">{row.hour}</td>
                        <td className="px-4 py-3 text-center text-[18px] font-semibold text-[#334155] border-r border-[#edf2f7]">{row.target}</td>
                        <td className="px-4 py-3 text-center text-[16px] font-semibold text-[#334155] border-r border-[#edf2f7]">{row.model}</td>
                        <td className="px-4 py-3 text-center text-[18px] font-bold text-[#2563eb] border-r border-[#edf2f7]">{row.actual}</td>
                        <td className="px-4 py-3 text-center text-[18px] font-bold text-[#16a34a] border-r border-[#edf2f7]">{row.ok}</td>
                        <td className="px-4 py-3 text-center text-[18px] font-bold text-[#e11d48] border-r border-[#edf2f7]">{row.rework}</td>
                        <td className="px-4 py-3 text-center border-r border-[#edf2f7]">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[18px] font-bold ${row.pill}`}>{row.oee}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-3 text-[18px] font-semibold text-[#1f2937]">
                            <span>{row.availability}</span>
                            <span className={`w-3 h-3 rounded-full ${row.dot}`} />
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white rounded-[22px] p-4 shadow-sm border border-[#83b960]">
            <div className="flex items-start justify-between text-[20px] text-slate-900 leading-tight gap-2">
              <p>{shiftLabel} (time)</p>
              <p>{hasBatch ? formatDuration(remainingSeconds) : "06:12:49"}</p>
            </div>
            <div className="mt-3 h-[26px] rounded border border-[#1f3b7a] bg-[#e7eefc] overflow-hidden">
              <div className="h-full bg-[#3b5ea9] text-white text-center text-[14px] leading-[24px]" style={{ width: `${displayProgress}%` }}>
                {`${displayProgress.toFixed(1)}%`}
              </div>
            </div>
            <div className="text-center text-[56px] leading-none font-semibold mt-6">{hasBatch ? liveTotals.ok.toLocaleString() : "1312"}</div>
          </div>

          <div className="bg-white rounded-[22px] p-4 shadow-sm border border-[#e7edf5]">
            <h2 className="text-[24px] font-bold text-slate-800 mb-4">OEE - {shiftLabel}</h2>
            <div className="grid grid-cols-3 gap-3">
              <Ring label="Availability" value={hasBatch ? availability : 92.1} color="#22c55e" />
              <Ring label="Performance" value={hasBatch ? performance : 87.3} color="#2563eb" />
              <Ring label="Quality" value={hasBatch ? quality : 96.6} color="#7c3aed" />
            </div>
            <div className="mt-4 rounded-[16px] bg-[#edf8ef] py-4 text-center">
              <p className="text-[16px] text-slate-700 font-semibold">OEE</p>
              <h3 className="text-[48px] font-bold text-[#15803d] leading-none">{hasBatch ? `${oee.toFixed(1)}%` : "78.6%"}</h3>
            </div>
          </div>

          <div className="bg-white rounded-[22px] p-4 shadow-sm border border-[#e7edf5]">
            <h2 className="text-[24px] font-bold text-[#07124d] mb-2">Shift Summary ({shiftLabel})</h2>
            <div className="space-y-1">
              {summaryItems.map((item) => {
                const Icon = item.icon;
                let value = "-";
                if (item.label === "Planned Production Time") value = hasBatch ? formatDuration(totalSeconds) : "08:00:00";
                if (item.label === "Run Time") value = hasBatch ? formatDuration(elapsedSeconds) : "07:21:47";
                if (item.label === "Idle Time") value = hasBatch ? "00:00:00" : "00:36:38";
                if (item.label === "Breakdown Time") value = hasBatch ? "00:00:00" : "01:27:04";
                if (item.label === "Availability") value = hasBatch ? `${availability.toFixed(1)}%` : "92.1%";
                if (item.label === "Quality") value = hasBatch ? `${quality.toFixed(1)}%` : "96.6%";
                if (item.label === "Performance") value = hasBatch ? `${performance.toFixed(1)}%` : "87.3%";
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
              <p className="text-[30px] font-bold text-[#15803d] leading-none">{hasBatch ? `${oee.toFixed(1)}%` : "78.6%"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
