import { useMemo, useState } from "react";
import { CalendarDays, Gauge, CheckCircle2, RefreshCcw, XCircle, Target, Layers, CalendarRange } from "lucide-react";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "custom", label: "Custom" },
];

const BASE_TODAY = "2026-05-27";
const formatYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const addDaysYmd = (ymd, days) => {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + days);
  return formatYmd(d);
};
const TODAY = formatYmd(new Date());
const dayShiftFromBase =
  Math.floor((new Date(`${TODAY}T00:00:00`).getTime() - new Date(`${BASE_TODAY}T00:00:00`).getTime()) / (24 * 60 * 60 * 1000));

const SHIFT_CONFIG = {
  A: { model: "MDI", teamLeader: "Arun", lineLeader: "Naveen", supervisor: "Karthik", manpower: 14, target: 420 },
  B: { model: "MDX", teamLeader: "Priya", lineLeader: "Raghu", supervisor: "Manoj", manpower: 13, target: 400 },
  C: { model: "MDA", teamLeader: "Sita", lineLeader: "Pavan", supervisor: "Rakesh", manpower: 12, target: 360 },
};

const BASE_SHIFT_ROWS = (() => {
  const rows = [];
  const shifts = ["A", "B", "C"];
  const start = new Date(`${BASE_TODAY}T00:00:00`);

  for (let dayOffset = 0; dayOffset < 40; dayOffset += 1) {
    const d = new Date(start);
    d.setDate(d.getDate() - dayOffset);
    const date = formatYmd(d);
    shifts.forEach((shift, shiftIdx) => {
      const cfg = SHIFT_CONFIG[shift];
      const wave = (dayOffset * 7 + shiftIdx * 11) % 26;
      const reject = 10 + ((dayOffset * 3 + shiftIdx * 5) % 12);
      const rework = 12 + ((dayOffset * 2 + shiftIdx * 4) % 18);
      const produced = cfg.target - (8 + wave);
      const ok = Math.max(0, produced - rework - reject);
      rows.push({
        date,
        shift,
        model: cfg.model,
        teamLeader: cfg.teamLeader,
        lineLeader: cfg.lineLeader,
        supervisor: cfg.supervisor,
        manpower: cfg.manpower,
        target: cfg.target,
        ok,
        rework,
        reject,
        status: "ended",
      });
    });
  }
  return rows;
})();

const BASE_TODAY_SPLITS = [
  { date: "2026-05-27", shift: "A", splitNo: 1, hour: "06:00 - 07:00", target: 52, ok: 48, rework: 2, reject: 2, model: "MDI" },
  { date: "2026-05-27", shift: "A", splitNo: 2, hour: "07:00 - 08:00", target: 52, ok: 47, rework: 3, reject: 2, model: "MDI" },
  { date: "2026-05-27", shift: "A", splitNo: 3, hour: "08:00 - 09:00", target: 50, ok: 46, rework: 2, reject: 2, model: "MDI" },
  { date: "2026-05-27", shift: "A", splitNo: 4, hour: "09:00 - 10:00", target: 53, ok: 49, rework: 2, reject: 2, model: "MDI" },
  { date: "2026-05-27", shift: "A", splitNo: 5, hour: "10:00 - 11:00", target: 53, ok: 48, rework: 3, reject: 2, model: "MDI" },
  { date: "2026-05-27", shift: "A", splitNo: 6, hour: "11:00 - 12:00", target: 53, ok: 50, rework: 1, reject: 2, model: "MDI" },
  { date: "2026-05-27", shift: "A", splitNo: 7, hour: "12:00 - 13:00", target: 54, ok: 51, rework: 2, reject: 1, model: "MDI" },
  { date: "2026-05-27", shift: "A", splitNo: 8, hour: "13:00 - 14:00", target: 53, ok: 49, rework: 3, reject: 1, model: "MDI" },
  { date: "2026-05-27", shift: "B", splitNo: 1, hour: "14:00 - 15:00", target: 50, ok: 45, rework: 3, reject: 2, model: "MDX" },
  { date: "2026-05-27", shift: "B", splitNo: 2, hour: "15:00 - 16:00", target: 50, ok: 46, rework: 2, reject: 2, model: "MDX" },
  { date: "2026-05-27", shift: "B", splitNo: 3, hour: "16:00 - 17:00", target: 50, ok: 44, rework: 3, reject: 3, model: "MDX" },
  { date: "2026-05-27", shift: "B", splitNo: 4, hour: "17:00 - 18:00", target: 50, ok: 45, rework: 3, reject: 2, model: "MDX" },
  { date: "2026-05-27", shift: "B", splitNo: 5, hour: "18:00 - 19:00", target: 50, ok: 46, rework: 2, reject: 2, model: "MDX" },
  { date: "2026-05-27", shift: "B", splitNo: 6, hour: "19:00 - 20:00", target: 50, ok: 47, rework: 2, reject: 1, model: "MDX" },
  { date: "2026-05-27", shift: "B", splitNo: 7, hour: "20:00 - 21:00", target: 50, ok: 45, rework: 3, reject: 2, model: "MDX" },
  { date: "2026-05-27", shift: "B", splitNo: 8, hour: "21:00 - 22:00", target: 50, ok: 44, rework: 2, reject: 4, model: "MDX" },
];

const SHIFT_ROWS = BASE_SHIFT_ROWS.map((row) => ({
  ...row,
  date: addDaysYmd(row.date, dayShiftFromBase),
}));

const TODAY_SPLITS = BASE_TODAY_SPLITS.map((row) => ({
  ...row,
  date: addDaysYmd(row.date, dayShiftFromBase),
}));

const toDate = (value) => new Date(`${value}T00:00:00`);
const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString("en-GB");
const getProduced = (row) => row.ok + row.rework + row.reject;
const SHIFT_END_HOUR = { A: 14, B: 22, C: 6 };
const isShiftFinished = (row, now = new Date()) => {
  if (!row?.date || !row?.shift) return false;
  if (row.date < TODAY) return true;
  if (row.date > TODAY) return false;

  const end = new Date(`${row.date}T00:00:00`);
  const endHour = SHIFT_END_HOUR[row.shift] ?? 0;
  end.setHours(endHour, 0, 0, 0);

  if (row.shift === "C") {
    end.setDate(end.getDate() + 1);
  }

  return now >= end;
};
const getOee = (row) => {
  const produced = getProduced(row);
  if (!row.target || produced <= 0) return 0;
  const quality = (row.ok / produced) * 100;
  const performance = (produced / row.target) * 100;
  const availability = 92;
  return (availability * quality * performance) / 10000;
};

export default function Production() {
  const [period, setPeriod] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedShiftDetail, setSelectedShiftDetail] = useState(null);
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);
  const [now] = useState(() => new Date());

  const shiftRowsByPeriod = useMemo(() => {
    if (period === "today") {
      return SHIFT_ROWS.filter((item) => item.date === TODAY && item.status === "ended" && isShiftFinished(item, now));
    }
    if (period === "7d" || period === "30d") {
      const days = period === "7d" ? 7 : 30;
      const end = toDate(TODAY);
      const start = new Date(end);
      start.setDate(start.getDate() - (days - 1));
      return SHIFT_ROWS.filter((item) => {
        const d = toDate(item.date);
        return d >= start && d <= end && item.status === "ended" && isShiftFinished(item, now);
      });
    }
    if (!customFrom || !customTo) return [];
    const from = toDate(customFrom);
    const to = toDate(customTo);
    if (to < from) return [];
    return SHIFT_ROWS.filter((item) => {
      const d = toDate(item.date);
      return d >= from && d <= to && item.status === "ended" && isShiftFinished(item, now);
    });
  }, [period, customFrom, customTo, now]);

  const dayWiseRows = useMemo(() => {
    const map = new Map();
    shiftRowsByPeriod.forEach((row) => {
      const key = row.date;
      if (!map.has(key)) {
        map.set(key, { date: row.date, shifts: 0, target: 0, ok: 0, rework: 0, reject: 0, manpowerSum: 0 });
      }
      const current = map.get(key);
      current.shifts += 1;
      current.target += row.target;
      current.ok += row.ok;
      current.rework += row.rework;
      current.reject += row.reject;
      current.manpowerSum += Number(row.manpower) || 0;
    });
    return Array.from(map.values())
      .map((item) => ({
        ...item,
        avgManpower: item.shifts > 0 ? (item.manpowerSum / item.shifts).toFixed(1) : "0.0",
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [shiftRowsByPeriod]);

  const totals = useMemo(() => {
    const target = shiftRowsByPeriod.reduce((sum, item) => sum + item.target, 0);
    const ok = shiftRowsByPeriod.reduce((sum, item) => sum + item.ok, 0);
    const rework = shiftRowsByPeriod.reduce((sum, item) => sum + item.rework, 0);
    const reject = shiftRowsByPeriod.reduce((sum, item) => sum + item.reject, 0);
    const avgOee = shiftRowsByPeriod.length ? shiftRowsByPeriod.reduce((sum, item) => sum + getOee(item), 0) / shiftRowsByPeriod.length : 0;
    return { target, ok, rework, reject, avgOee };
  }, [shiftRowsByPeriod]);

  const todaySplitGroups = useMemo(() => {
    const groups = new Map();
    const finishedTodayShiftSet = new Set(
      SHIFT_ROWS.filter((item) => item.date === TODAY && item.status === "ended" && isShiftFinished(item, now)).map(
        (item) => `${item.date}-${item.shift}`
      )
    );
    TODAY_SPLITS.forEach((row) => {
      if (!finishedTodayShiftSet.has(`${row.date}-${row.shift}`)) return;
      const key = `${row.date}-${row.shift}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    return Array.from(groups.entries()).map(([key, rows]) => {
      const splitIndex = key.lastIndexOf("-");
      const date = key.slice(0, splitIndex);
      const shift = key.slice(splitIndex + 1);
      return { date, shift, rows: rows.sort((a, b) => a.splitNo - b.splitNo) };
    });
  }, [now]);

  const buildSplitGroupsFromShiftRows = (shiftRows) => {
    if (!Array.isArray(shiftRows) || shiftRows.length === 0) return [];
    return shiftRows.map((shiftRow) => {
      const rows = buildSplitDetails(shiftRow);
      return { date: shiftRow.date, shift: shiftRow.shift, rows, shiftMeta: shiftRow };
    });
  };

  const buildSplitDetails = (shiftRow) => {
    if (!shiftRow) return [];
    const splitCount = 8;
    const targetBase = Math.floor(shiftRow.target / splitCount);
    const targetRem = shiftRow.target - targetBase * splitCount;
    const produced = getProduced(shiftRow);
    const producedBase = Math.floor(produced / splitCount);
    const producedRem = produced - producedBase * splitCount;
    const okBase = Math.floor(shiftRow.ok / splitCount);
    const okRem = shiftRow.ok - okBase * splitCount;
    const reworkBase = Math.floor(shiftRow.rework / splitCount);
    const reworkRem = shiftRow.rework - reworkBase * splitCount;
    const rejectBase = Math.floor(shiftRow.reject / splitCount);
    const rejectRem = shiftRow.reject - rejectBase * splitCount;

    const startHourByShift = shiftRow.shift === "A" ? 6 : shiftRow.shift === "B" ? 14 : 22;
    return Array.from({ length: splitCount }).map((_, idx) => {
      const fromHour = (startHourByShift + idx) % 24;
      const toHour = (fromHour + 1) % 24;
      const target = targetBase + (idx < targetRem ? 1 : 0);
      const ok = okBase + (idx < okRem ? 1 : 0);
      const rework = reworkBase + (idx < reworkRem ? 1 : 0);
      const reject = rejectBase + (idx < rejectRem ? 1 : 0);
      const producedSplit = producedBase + (idx < producedRem ? 1 : 0);
      const balance = Math.max(0, producedSplit - (ok + rework + reject));
      const finalOk = ok + balance;
      return {
        splitNo: idx + 1,
        hour: `${String(fromHour).padStart(2, "0")}:00 - ${String(toHour).padStart(2, "0")}:00`,
        model: shiftRow.model,
        target,
        ok: finalOk,
        rework,
        reject,
      };
    });
  };

  return (
    <div className="w-full bg-[#F4F7FB] p-3 md:p-5 min-h-screen">
      <div className="bg-white rounded-2xl border border-[#e9edf5] shadow-sm p-4 md:p-5">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#09123f]">Production Report</h1>
            <p className="text-sm text-slate-500 mt-1">Mock analytics with distinct layouts by period</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#1D60AB]"
            >
              {PERIODS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {period === "custom" ? (
              <>
                <div className="relative">
                  <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1D60AB]" />
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-11 rounded-xl border border-slate-300 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#1D60AB]"
                  />
                </div>
                <div className="relative">
                  <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1D60AB]" />
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-11 rounded-xl border border-slate-300 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#1D60AB]"
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mt-5">
          <div className="bg-[#e8f1ff] rounded-2xl p-4 border border-[#d9e7ff]">
            <p className="text-xs font-bold uppercase text-[#1D60AB]">Total Target</p>
            <h3 className="text-3xl font-bold text-[#1e3a8a] mt-2">{totals.target.toLocaleString()}</h3>
            <Target size={16} className="text-[#1D60AB] mt-2" />
          </div>
          <div className="bg-[#edfdf2] rounded-2xl p-4 border border-[#d6f6e2]">
            <p className="text-xs font-bold uppercase text-[#15803d]">OK Parts</p>
            <h3 className="text-3xl font-bold text-[#15803d] mt-2">{totals.ok.toLocaleString()}</h3>
            <CheckCircle2 size={16} className="text-[#15803d] mt-2" />
          </div>
          <div className="bg-[#fff7ed] rounded-2xl p-4 border border-[#ffe8cb]">
            <p className="text-xs font-bold uppercase text-[#c2410c]">Rework</p>
            <h3 className="text-3xl font-bold text-[#c2410c] mt-2">{totals.rework.toLocaleString()}</h3>
            <RefreshCcw size={16} className="text-[#c2410c] mt-2" />
          </div>
          <div className="bg-[#fff1f2] rounded-2xl p-4 border border-[#ffdce1]">
            <p className="text-xs font-bold uppercase text-[#be123c]">Reject</p>
            <h3 className="text-3xl font-bold text-[#be123c] mt-2">{totals.reject.toLocaleString()}</h3>
            <XCircle size={16} className="text-[#be123c] mt-2" />
          </div>
          <div className="bg-[#eff6ff] rounded-2xl p-4 border border-[#dbeafe]">
            <p className="text-xs font-bold uppercase text-[#1e40af]">Avg OEE</p>
            <h3 className="text-3xl font-bold text-[#1e40af] mt-2">{totals.avgOee.toFixed(1)}%</h3>
            <Gauge size={16} className="text-[#1e40af] mt-2" />
          </div>
        </div>

        {period === "today" ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Layers size={16} className="text-[#1D60AB]" />
              <span>Today Ended Shifts - Split-wise View</span>
            </div>
            {todaySplitGroups.map((group) => (
              <div key={`${group.date}-${group.shift}`} className="rounded-2xl border border-[#e8edf5] overflow-hidden">
                <div className="px-4 py-3 bg-[#f7f9fe] border-b border-[#e8edf5] flex items-center justify-between">
                  <div>
                    <h2 className="text-sm md:text-base font-bold text-slate-700">
                      {formatDate(group.date)} - Shift {group.shift}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Incharges: {(SHIFT_ROWS.find((item) => item.date === group.date && item.shift === group.shift)?.teamLeader) || "-"} / {(SHIFT_ROWS.find((item) => item.date === group.date && item.shift === group.shift)?.lineLeader) || "-"} / {(SHIFT_ROWS.find((item) => item.date === group.date && item.shift === group.shift)?.supervisor) || "-"} | Manpower: {(SHIFT_ROWS.find((item) => item.date === group.date && item.shift === group.shift)?.manpower) || "-"}
                    </p>
                  </div>
                  <span className="text-xs text-slate-600">{group.rows.length} splits</span>
                </div>
                {(() => {
                  const totalTarget = group.rows.reduce((sum, row) => sum + row.target, 0);
                  const totalOk = group.rows.reduce((sum, row) => sum + row.ok, 0);
                  const totalRework = group.rows.reduce((sum, row) => sum + row.rework, 0);
                  const totalReject = group.rows.reduce((sum, row) => sum + row.reject, 0);
                  const avgOee =
                    group.rows.length > 0
                      ? group.rows.reduce((sum, row) => sum + getOee(row), 0) / group.rows.length
                      : 0;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 p-3 border-b border-[#e8edf5] bg-white">
                      <div className="bg-[#e8f1ff] rounded-xl p-3 border border-[#d9e7ff]">
                        <p className="text-[11px] font-bold uppercase text-[#1D60AB]">Total Target</p>
                        <p className="text-2xl font-bold text-[#1e3a8a] mt-1">{totalTarget}</p>
                      </div>
                      <div className="bg-[#edfdf2] rounded-xl p-3 border border-[#d6f6e2]">
                        <p className="text-[11px] font-bold uppercase text-[#15803d]">OK Parts</p>
                        <p className="text-2xl font-bold text-[#15803d] mt-1">{totalOk}</p>
                      </div>
                      <div className="bg-[#fff7ed] rounded-xl p-3 border border-[#ffe8cb]">
                        <p className="text-[11px] font-bold uppercase text-[#c2410c]">Rework</p>
                        <p className="text-2xl font-bold text-[#c2410c] mt-1">{totalRework}</p>
                      </div>
                      <div className="bg-[#fff1f2] rounded-xl p-3 border border-[#ffdce1]">
                        <p className="text-[11px] font-bold uppercase text-[#be123c]">Reject</p>
                        <p className="text-2xl font-bold text-[#be123c] mt-1">{totalReject}</p>
                      </div>
                      <div className="bg-[#eff6ff] rounded-xl p-3 border border-[#dbeafe]">
                        <p className="text-[11px] font-bold uppercase text-[#1e40af]">Avg OEE</p>
                        <p className="text-2xl font-bold text-[#1e40af] mt-1">{avgOee.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })()}
                <div className="overflow-auto">
                  <table className="w-full min-w-[900px] border-collapse">
                    <thead>
                      <tr className="bg-white">
                        {["Split", "Hour", "Model", "Target", "OK", "Rework", "Reject", "Produced", "OEE"].map((head) => (
                          <th key={head} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-[#edf2f7]">
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((item) => (
                        <tr key={`${group.shift}-${item.splitNo}`} className="border-b border-[#edf2f7] last:border-b-0">
                          <td className="px-3 py-2 text-sm font-bold text-[#1D60AB]">{item.splitNo}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{item.hour}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{item.model}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-slate-800">{item.target}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-[#15803d]">{item.ok}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-[#c2410c]">{item.rework}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-[#be123c]">{item.reject}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-slate-700">{getProduced(item)}</td>
                          <td className="px-3 py-2 text-sm font-bold text-[#1e40af]">{getOee(item).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {period === "7d" ? (
          <div className="mt-5 rounded-2xl border border-[#e8edf5] overflow-hidden">
            <div className="px-4 py-3 bg-[#eef6ff] border-b border-[#e8edf5] flex items-center justify-between">
              <h2 className="text-sm md:text-base font-bold text-[#123b73]">Last 7 Days - Shift-wise Overview</h2>
              <span className="text-xs text-slate-600">{shiftRowsByPeriod.length} shifts</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {shiftRowsByPeriod
                .slice()
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .map((item, idx) => (
                  <button
                    key={`${item.date}-${item.shift}-${idx}`}
                    onClick={() => setSelectedShiftDetail(item)}
                    className="rounded-xl border border-[#dbe7f7] bg-white p-3 shadow-sm text-left hover:border-[#1D60AB] hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-800">{formatDate(item.date)} - Shift {item.shift}</p>
                      <p className="text-xs font-semibold text-[#1D60AB]">{item.model}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{item.teamLeader} / {item.lineLeader} / {item.supervisor}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div className="rounded bg-slate-50 p-2"><span className="text-slate-500">Manpower</span><p className="font-bold text-slate-700">{item.manpower}</p></div>
                      <div className="rounded bg-slate-50 p-2"><span className="text-slate-500">Target</span><p className="font-bold text-slate-700">{item.target}</p></div>
                      <div className="rounded bg-green-50 p-2"><span className="text-green-700">OK</span><p className="font-bold text-green-700">{item.ok}</p></div>
                      <div className="rounded bg-orange-50 p-2"><span className="text-orange-700">Rework</span><p className="font-bold text-orange-700">{item.rework}</p></div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-rose-700 font-semibold">Reject: {item.reject}</p>
                      <p className="text-sm font-bold text-[#1e40af]">OEE {getOee(item).toFixed(1)}%</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ) : null}

        {(period === "30d" || period === "custom") ? (
          <div className="mt-5 rounded-2xl border border-[#e8edf5] overflow-hidden">
            <div className="px-4 py-3 bg-[#f4f8f6] border-b border-[#e8edf5] flex items-center justify-between">
              <h2 className="text-sm md:text-base font-bold text-[#22543d]">
                {period === "30d" ? "Last 30 Days - Day-wise Summary" : "Custom Range - Day-wise Summary"}
              </h2>
              <div className="inline-flex items-center gap-2 text-xs text-slate-600">
                <CalendarRange size={14} />
                <span>{dayWiseRows.length} days</span>
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className="bg-white">
                    {["Date", "Shifts", "Incharges", "Avg Manpower", "Target", "OK", "Rework", "Reject", "Produced", "Day OEE", "View Details"].map((head) => (
                      <th key={head} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-[#edf2f7]">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dayWiseRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-3 py-8 text-center text-sm text-slate-500">No finished shifts for selected dates.</td>
                    </tr>
                  ) : (
                    dayWiseRows.map((item) => {
                      const produced = item.ok + item.rework + item.reject;
                      const dayOee = getOee({ target: item.target, ok: item.ok, rework: item.rework, reject: item.reject });
                      const people = shiftRowsByPeriod
                        .filter((row) => row.date === item.date)
                        .map((row) => `${row.shift}:${row.teamLeader}/${row.lineLeader}/${row.supervisor}`)
                        .join(" | ");
                      return (
                        <tr key={item.date} className="border-b border-[#edf2f7] last:border-b-0">
                          <td className="px-3 py-2 text-sm font-semibold text-slate-700">{formatDate(item.date)}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{item.shifts}</td>
                          <td className="px-3 py-2 text-xs text-slate-600">{people || "-"}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{item.avgManpower}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-slate-800">{item.target}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-[#15803d]">{item.ok}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-[#c2410c]">{item.rework}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-[#be123c]">{item.reject}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{produced}</td>
                          <td className="px-3 py-2 text-sm font-bold text-[#1e40af]">{dayOee.toFixed(1)}%</td>
                          <td className="px-3 py-2 text-sm text-slate-700">
                            <button
                              onClick={() => setSelectedDayDetail(item.date)}
                              className="px-3 py-1.5 rounded-lg bg-[#1D60AB] text-white text-xs font-semibold hover:bg-[#164f90]"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {selectedShiftDetail ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-4 py-3 bg-[#eef6ff] border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Split-wise Details - {formatDate(selectedShiftDetail.date)} Shift {selectedShiftDetail.shift}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {selectedShiftDetail.teamLeader} / {selectedShiftDetail.lineLeader} / {selectedShiftDetail.supervisor} | Manpower: {selectedShiftDetail.manpower}
                </p>
              </div>
              <button
                onClick={() => setSelectedShiftDetail(null)}
                className="px-3 h-9 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            {(() => {
              const totalTarget = Number(selectedShiftDetail.target) || 0;
              const totalOk = Number(selectedShiftDetail.ok) || 0;
              const totalRework = Number(selectedShiftDetail.rework) || 0;
              const totalReject = Number(selectedShiftDetail.reject) || 0;
              const avgOee = getOee(selectedShiftDetail);
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 p-3 border-b border-slate-200 bg-white">
                  <div className="bg-[#e8f1ff] rounded-xl p-3 border border-[#d9e7ff]">
                    <p className="text-[11px] font-bold uppercase text-[#1D60AB]">Total Target</p>
                    <p className="text-2xl font-bold text-[#1e3a8a] mt-1">{totalTarget}</p>
                  </div>
                  <div className="bg-[#edfdf2] rounded-xl p-3 border border-[#d6f6e2]">
                    <p className="text-[11px] font-bold uppercase text-[#15803d]">OK Parts</p>
                    <p className="text-2xl font-bold text-[#15803d] mt-1">{totalOk}</p>
                  </div>
                  <div className="bg-[#fff7ed] rounded-xl p-3 border border-[#ffe8cb]">
                    <p className="text-[11px] font-bold uppercase text-[#c2410c]">Rework</p>
                    <p className="text-2xl font-bold text-[#c2410c] mt-1">{totalRework}</p>
                  </div>
                  <div className="bg-[#fff1f2] rounded-xl p-3 border border-[#ffdce1]">
                    <p className="text-[11px] font-bold uppercase text-[#be123c]">Reject</p>
                    <p className="text-2xl font-bold text-[#be123c] mt-1">{totalReject}</p>
                  </div>
                  <div className="bg-[#eff6ff] rounded-xl p-3 border border-[#dbeafe]">
                    <p className="text-[11px] font-bold uppercase text-[#1e40af]">Avg OEE</p>
                    <p className="text-2xl font-bold text-[#1e40af] mt-1">{avgOee.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })()}

            <div className="overflow-auto max-h-[70vh]">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="bg-white">
                    {["Split", "Hour", "Model", "Target", "OK", "Rework", "Reject", "Produced", "OEE"].map((head) => (
                      <th key={head} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-[#edf2f7]">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {buildSplitDetails(selectedShiftDetail).map((row) => (
                    <tr key={`detail-${row.splitNo}`} className="border-b border-[#edf2f7] last:border-b-0">
                      <td className="px-3 py-2 text-sm font-bold text-[#1D60AB]">{row.splitNo}</td>
                      <td className="px-3 py-2 text-sm text-slate-700">{row.hour}</td>
                      <td className="px-3 py-2 text-sm text-slate-700">{row.model}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-slate-800">{row.target}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-[#15803d]">{row.ok}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-[#c2410c]">{row.rework}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-[#be123c]">{row.reject}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-slate-700">{getProduced(row)}</td>
                      <td className="px-3 py-2 text-sm font-bold text-[#1e40af]">{getOee(row).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {selectedDayDetail ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-4 py-3 bg-[#eef6ff] border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Day Details - {formatDate(selectedDayDetail)}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  All shifts split-wise summary
                </p>
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="px-3 h-9 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div className="max-h-[78vh] overflow-auto p-4 space-y-4 bg-[#f8fbff]">
              {buildSplitGroupsFromShiftRows(
                shiftRowsByPeriod
                  .filter((row) => row.date === selectedDayDetail)
                  .sort((a, b) => a.shift.localeCompare(b.shift))
              ).map((group) => {
                const totalTarget = group.rows.reduce((sum, row) => sum + row.target, 0);
                const totalOk = group.rows.reduce((sum, row) => sum + row.ok, 0);
                const totalRework = group.rows.reduce((sum, row) => sum + row.rework, 0);
                const totalReject = group.rows.reduce((sum, row) => sum + row.reject, 0);
                const avgOee = group.rows.length ? group.rows.reduce((sum, row) => sum + getOee(row), 0) / group.rows.length : 0;
                return (
                  <div key={`day-${group.date}-${group.shift}`} className="rounded-2xl border border-[#e8edf5] overflow-hidden bg-white">
                    <div className="px-4 py-3 bg-[#f7f9fe] border-b border-[#e8edf5] flex items-center justify-between">
                      <div>
                        <h4 className="text-sm md:text-base font-bold text-slate-700">
                          Shift {group.shift} - {group.shiftMeta.model}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Incharges: {group.shiftMeta.teamLeader} / {group.shiftMeta.lineLeader} / {group.shiftMeta.supervisor} | Manpower: {group.shiftMeta.manpower}
                        </p>
                      </div>
                      <span className="text-xs text-slate-600">{group.rows.length} splits</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 p-3 border-b border-[#e8edf5] bg-white">
                      <div className="bg-[#e8f1ff] rounded-xl p-3 border border-[#d9e7ff]">
                        <p className="text-[11px] font-bold uppercase text-[#1D60AB]">Total Target</p>
                        <p className="text-2xl font-bold text-[#1e3a8a] mt-1">{totalTarget}</p>
                      </div>
                      <div className="bg-[#edfdf2] rounded-xl p-3 border border-[#d6f6e2]">
                        <p className="text-[11px] font-bold uppercase text-[#15803d]">OK Parts</p>
                        <p className="text-2xl font-bold text-[#15803d] mt-1">{totalOk}</p>
                      </div>
                      <div className="bg-[#fff7ed] rounded-xl p-3 border border-[#ffe8cb]">
                        <p className="text-[11px] font-bold uppercase text-[#c2410c]">Rework</p>
                        <p className="text-2xl font-bold text-[#c2410c] mt-1">{totalRework}</p>
                      </div>
                      <div className="bg-[#fff1f2] rounded-xl p-3 border border-[#ffdce1]">
                        <p className="text-[11px] font-bold uppercase text-[#be123c]">Reject</p>
                        <p className="text-2xl font-bold text-[#be123c] mt-1">{totalReject}</p>
                      </div>
                      <div className="bg-[#eff6ff] rounded-xl p-3 border border-[#dbeafe]">
                        <p className="text-[11px] font-bold uppercase text-[#1e40af]">Avg OEE</p>
                        <p className="text-2xl font-bold text-[#1e40af] mt-1">{avgOee.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="overflow-auto">
                      <table className="w-full min-w-[900px] border-collapse">
                        <thead>
                          <tr className="bg-white">
                            {["Split", "Hour", "Model", "Target", "OK", "Rework", "Reject", "Produced", "OEE"].map((head) => (
                              <th key={head} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-[#edf2f7]">
                                {head}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {group.rows.map((row) => (
                            <tr key={`day-detail-${group.shift}-${row.splitNo}`} className="border-b border-[#edf2f7] last:border-b-0">
                              <td className="px-3 py-2 text-sm font-bold text-[#1D60AB]">{row.splitNo}</td>
                              <td className="px-3 py-2 text-sm text-slate-700">{row.hour}</td>
                              <td className="px-3 py-2 text-sm text-slate-700">{row.model}</td>
                              <td className="px-3 py-2 text-sm font-semibold text-slate-800">{row.target}</td>
                              <td className="px-3 py-2 text-sm font-semibold text-[#15803d]">{row.ok}</td>
                              <td className="px-3 py-2 text-sm font-semibold text-[#c2410c]">{row.rework}</td>
                              <td className="px-3 py-2 text-sm font-semibold text-[#be123c]">{row.reject}</td>
                              <td className="px-3 py-2 text-sm font-semibold text-slate-700">{getProduced(row)}</td>
                              <td className="px-3 py-2 text-sm font-bold text-[#1e40af]">{getOee(row).toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
