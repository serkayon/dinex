import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  TimerReset,
  AlertTriangle,
  Gauge,
  Activity,
  BadgePercent,
  Filter,
  Users,
  ChevronDown,
} from "lucide-react";

export default function Production() {
  const dummyData = {
    A: {
      plannedProductionTime: "08:00:00",
      runTime: "07:21:47",
      idleTime: "00:36:38",
      breakdownTime: "01:27:04",
      availability: "92.1%",
      quality: "96.6%",
      performance: "87.3%",
      oee: "78.6%",
    },

    B: {
      plannedProductionTime: "08:00:00",
      runTime: "06:58:21",
      idleTime: "00:42:12",
      breakdownTime: "01:10:30",
      availability: "89.5%",
      quality: "94.1%",
      performance: "84.2%",
      oee: "74.8%",
    },

    C: {
      plannedProductionTime: "08:00:00",
      runTime: "07:40:11",
      idleTime: "00:22:10",
      breakdownTime: "00:49:18",
      availability: "95.2%",
      quality: "97.4%",
      performance: "90.1%",
      oee: "82.5%",
    },
  };

  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    shift: "",
  });

  const [result, setResult] = useState(null);

  const handleFilter = () => {
    if (!filters.shift) return;

    setResult({
      ...dummyData[filters.shift],
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      shift: filters.shift,
    });
  };

  const summaryCards = result
    ? [
        {
          label: "Planned Time",
          value: result.plannedProductionTime,
          icon: <Clock3 size={16} />,
          color: "text-[#1D60AB]",
          bg: "bg-[#EAF3FF]",
        },

        {
          label: "Run Time",
          value: result.runTime,
          icon: <TimerReset size={16} />,
          color: "text-green-600",
          bg: "bg-green-50",
        },

        {
          label: "Idle Time",
          value: result.idleTime,
          icon: <Activity size={16} />,
          color: "text-orange-500",
          bg: "bg-orange-50",
        },

        {
          label: "Breakdown",
          value: result.breakdownTime,
          icon: <AlertTriangle size={16} />,
          color: "text-red-500",
          bg: "bg-red-50",
        },

        {
          label: "Availability",
          value: result.availability,
          icon: <Gauge size={16} />,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
        },

        {
          label: "Quality",
          value: result.quality,
          icon: <BadgePercent size={16} />,
          color: "text-cyan-600",
          bg: "bg-cyan-50",
        },

        {
          label: "Performance",
          value: result.performance,
          icon: <Activity size={16} />,
          color: "text-purple-600",
          bg: "bg-purple-50",
        },
      ]
    : [];

  return (
    <div className="w-full bg-[#F4F7FB] p-3 md:p-5 min-h-screen">
      <div className="bg-white rounded-2xl border shadow-sm p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="bg-[#EAF3FF] p-2 rounded-xl">
            <Filter className="text-[#1D60AB]" size={18} />
          </div>

          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800">
              Production Summary
            </h1>

            <p className="text-xs text-gray-500">
              Filter production OEE details
            </p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-[#F8FAFD] border rounded-2xl p-3 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* From Date */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                From Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1D60AB]"
                />

                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      fromDate: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1D60AB]"
                />
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                To Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1D60AB]"
                />

                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      toDate: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1D60AB]"
                />
              </div>
            </div>

            {/* Shift */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Shift
              </label>

              <div className="relative">
                <Users
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1D60AB]"
                />

                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />

                <select
                  value={filters.shift}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      shift: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl pl-9 pr-8 py-2.5 text-sm appearance-none bg-white outline-none focus:ring-2 focus:ring-[#1D60AB]"
                >
                  <option value="">Select Shift</option>
                  <option value="A">Shift A</option>
                  <option value="B">Shift B</option>
                  <option value="C">Shift C</option>
                </select>
              </div>
            </div>

            {/* Button */}
            <div className="flex items-end">
              <button
                onClick={handleFilter}
                className="w-full bg-[#1D60AB] hover:bg-[#154D8D] text-white text-sm font-medium py-2.5 rounded-xl transition-all"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>

        {/* Result Section */}
        {result && (
          <>
            {/* Result Header */}
            <div className="bg-[#F5F9FF] border rounded-2xl p-3 mb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-800">
                    OEE Summary Result
                  </h2>

                  <p className="text-xs text-gray-600 mt-1">
                    {result.fromDate} to {result.toDate}
                  </p>
                </div>

                <div className="bg-[#1D60AB] text-white px-4 py-2 rounded-xl text-sm font-semibold w-fit">
                  Shift {result.shift}
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {summaryCards.map((item, index) => (
                <div
                  key={index}
                  className="bg-white border rounded-2xl p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        {item.label}
                      </p>

                      <h3 className={`text-base font-bold ${item.color}`}>
                        {item.value}
                      </h3>
                    </div>

                    <div
                      className={`${item.bg} ${item.color} p-2 rounded-xl`}
                    >
                      {item.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Final OEE */}
            <div className="mt-4">
              <div className="bg-[#EAF3FF] border rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl">
                    <Gauge className="text-[#1D60AB]" size={22} />
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Overall Equipment Efficiency
                    </p>

                    <h2 className="text-lg font-bold text-gray-800">
                      OEE (Shift {result.shift})
                    </h2>
                  </div>
                </div>

                <h1 className="text-3xl font-bold text-[#1D60AB]">
                  {result.oee}
                </h1>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}