import { useEffect, useMemo, useState } from "react";
import { Activity, Gauge, ShieldCheck, TrendingUp, BadgeCheck } from "lucide-react";
import useAppStore from "../store/useAppStore";

const toMinutes = (timeValue = "") => {
  const [h, m] = timeValue.split(":").map(Number);
  return Number(h || 0) * 60 + Number(m || 0);
};

const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0));

function MetricCard({ title, value, color, icon: Icon }) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-[#e8edf5] shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        <Icon size={18} className="text-slate-500" />
      </div>
      <p className={`text-4xl font-bold mt-3 ${color}`}>{value.toFixed(1)}%</p>
      <div className="mt-4 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: "currentColor" }} />
      </div>
    </div>
  );
}

export default function OEE() {
  const { currentBatch, batchStarted, hydrateCurrentBatch } = useAppStore();
  const [now, setNow] = useState(Date.now());
  const [liveSummary, setLiveSummary] = useState({ produced: 0, ok: 0, rework: 0, reject: 0, splitRows: [] });
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    hydrateCurrentBatch().catch(() => {});
  }, [hydrateCurrentBatch]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!currentBatch?.id) {
      setLiveSummary({ produced: 0, ok: 0, rework: 0, reject: 0, splitRows: [] });
      return;
    }

    let stopped = false;
    let timerId;

    const fetchLiveSummary = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/batches/${currentBatch.id}/live-summary`);
        if (!response.ok) return;
        const data = await response.json();
        if (stopped) return;
        setLiveSummary({
          produced: Number(data.produced) || 0,
          ok: Number(data.ok) || 0,
          rework: Number(data.rework) || 0,
          reject: Number(data.reject) || 0,
          splitRows: Array.isArray(data.splitRows) ? data.splitRows : [],
        });
      } catch (_) {}
    };

    const run = async () => {
      await fetchLiveSummary();
      if (!stopped) timerId = setTimeout(run, 10000);
    };

    run();
    return () => {
      stopped = true;
      clearTimeout(timerId);
    };
  }, [apiBaseUrl, currentBatch]);

  const shiftProgress = useMemo(() => {
    if (!batchStarted || !currentBatch?.shift) return 0;

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

    const totalSeconds = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 1000));
    const elapsedSeconds = Math.max(0, Math.min(totalSeconds, Math.floor((nowDate.getTime() - start.getTime()) / 1000)));
    return clampPercent((elapsedSeconds / totalSeconds) * 100);
  }, [batchStarted, currentBatch, now]);

  const shiftTarget = useMemo(() => {
    if (!Array.isArray(currentBatch?.splitPlan)) return 0;
    return currentBatch.splitPlan.reduce((sum, row) => sum + (Number(row.target) || 0), 0);
  }, [currentBatch]);

  const produced = Number(liveSummary.produced) || 0;
  const okParts = Number(liveSummary.ok) || 0;

  const availability = clampPercent(shiftProgress);
  const performance = clampPercent(shiftTarget > 0 ? (produced / shiftTarget) * 100 : 0);
  const quality = clampPercent(produced > 0 ? (okParts / produced) * 100 : 0);
  const oee = clampPercent((availability * performance * quality) / 10000);

  const oeeStatus =
    oee >= 85 ? "Excellent" : oee >= 60 ? "Good" : oee > 0 ? "Needs Attention" : "No Data";

  if (!batchStarted || !currentBatch) {
    return (
      <div className="bg-white rounded-3xl border border-[#e8edf5] shadow-sm p-6">
        <h2 className="text-2xl font-bold text-slate-800">OEE</h2>
        <p className="text-slate-600 mt-2">No active batch found. Start a batch to view live OEE.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl border border-[#e8edf5] shadow-sm p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">Live OEE</p>
            <h1 className="text-3xl font-bold text-slate-800 mt-1">{oee.toFixed(1)}%</h1>
            <p className="text-sm text-slate-600 mt-1">Status: {oeeStatus}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-[#eaf2ff] flex items-center justify-center">
            <Gauge size={26} className="text-[#1D60AB]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard title="Availability" value={availability} color="text-emerald-600" icon={ShieldCheck} />
        <MetricCard title="Performance" value={performance} color="text-blue-600" icon={TrendingUp} />
        <MetricCard title="Quality" value={quality} color="text-orange-600" icon={BadgeCheck} />
      </div>

      <div className="bg-white rounded-3xl border border-[#e8edf5] shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800">How OEE Is Calculated</h2>
        <p className="text-sm text-slate-600 mt-2">OEE = Availability x Performance x Quality</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            <p className="text-sm font-semibold text-slate-700">Availability</p>
            <p className="text-xs text-slate-600 mt-1">How much of planned shift time has been used.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            <p className="text-sm font-semibold text-slate-700">Performance</p>
            <p className="text-xs text-slate-600 mt-1">Produced quantity compared to target.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            <p className="text-sm font-semibold text-slate-700">Quality</p>
            <p className="text-xs text-slate-600 mt-1">OK parts compared to total produced.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#e8edf5] shadow-sm p-4">
          <p className="text-xs text-slate-500">Shift</p>
          <p className="text-base font-bold text-slate-800 mt-1">{currentBatch.shiftTime || "-"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8edf5] shadow-sm p-4">
          <p className="text-xs text-slate-500">Target</p>
          <p className="text-base font-bold text-slate-800 mt-1">{shiftTarget}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8edf5] shadow-sm p-4">
          <p className="text-xs text-slate-500">Produced</p>
          <p className="text-base font-bold text-slate-800 mt-1">{produced}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8edf5] shadow-sm p-4">
          <p className="text-xs text-slate-500">OK Parts</p>
          <p className="text-base font-bold text-slate-800 mt-1">{okParts}</p>
        </div>
      </div>
    </div>
  );
}
