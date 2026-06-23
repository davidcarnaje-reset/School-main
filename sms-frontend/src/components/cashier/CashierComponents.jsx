import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

// ==========================================
// 1. REVENUE ANALYTICS CHART
// ==========================================
export const RevenueAnalytics = ({ data = [] }) => {
  const displayData = data.length > 0 ? data : [
    { day: "Mon", amount: 4000 },
    { day: "Tue", amount: 3000 },
    { day: "Wed", amount: 5000 },
    { day: "Thu", amount: 2780 },
    { day: "Fri", amount: 6890 },
    { day: "Sat", amount: 2390 },
    { day: "Sun", amount: 3490 },
  ];

  return (
    <div className="bg-white p-5 rounded-[2rem] border-2 border-slate-200 shadow-sm hover:border-slate-400 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-700 italic">
            Weekly Revenue Trend
          </h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase">
            Past 7 Days Collection
          </p>
        </div>
        <div className="px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
          <span className="text-[9px] font-black text-emerald-600 uppercase">
            +12.5% Today
          </span>
        </div>
      </div>

      <div className="h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fontWeight: "bold", fill: "#94a3b8" }}
              dy={10}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                borderRadius: "15px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
              itemStyle={{ fontSize: "11px", fontWeight: "bold" }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#4f46e5"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const MonthlyBarChart = ({ branding }) => {
  // LOGIC PARA SA TATLONG BULAN (Prev, Current, Next)
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const d = new Date();
  const currentIdx = d.getMonth();

  const data = [
    { name: months[(currentIdx - 1 + 12) % 12], amount: 45000 },
    { name: months[currentIdx], amount: 65000 },
    { name: months[(currentIdx + 1) % 12], amount: 30000 },
  ];

  return (
    <div className="bg-white p-5 rounded-[2rem] border-2 border-slate-200 shadow-sm hover:border-slate-400 transition-all duration-300 h-[260px]">
      <div className="mb-4">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-700 italic">
          Monthly Overview
        </h2>
        <p className="text-[9px] text-slate-400 font-bold uppercase">
          Quarterly Comparison
        </p>
      </div>

      {/* FIXED HEIGHT SA WRAPPER AT SA CONTAINER PARA IWAS WARNING */}
      <div className="h-40 w-full" style={{ minHeight: "160px" }}>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: "bold", fill: "#94a3b8" }}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                borderRadius: "15px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
            />
            <Bar dataKey="amount" radius={[10, 10, 10, 10]} barSize={40}>
              {/* Added optional chaining ?. para safe */}
              {data?.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === 1 ? branding?.theme_color || "#4f46e5" : "#e2e8f0"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const StatCard = ({ title, value, icon: Icon, colorClass, subText }) => (
  <div className="relative overflow-hidden bg-white px-3 py-1 md:px-4 md:py-2 rounded-[1.2rem] md:rounded-[1.5rem] border-2 border-slate-200 shadow-sm hover:border-slate-400 transition-all duration-300 group flex items-center gap-2 md:gap-3 h-[75px] md:h-[85px] cursor-default">
    {/* ICON - Mawawala (scale-0) at mag-sh-shrink (w-0) kapag nahover ang card */}
    <div
      className={`p-2 md:p-2.5 rounded-xl ${colorClass} text-white shadow-lg shrink-0 transition-all duration-300 group-hover:scale-0 group-hover:w-0 group-hover:opacity-0 group-hover:p-0`}
    >
      <Icon size={16} className="md:w-[18px] md:h-[18px]" />
    </div>

    {/* TEXT CONTENT - Mag-e-expand at lalaki ang font kapag nahover */}
    <div className="min-w-0 flex-1 flex flex-col justify-center h-full transition-all duration-300 group-hover:pl-2">
      <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1 leading-none truncate transition-all duration-300 group-hover:text-[9px] md:group-hover:text-[11px] group-hover:text-slate-600">
        {title}
      </p>

      <h3 className="text-[12px] sm:text-sm md:text-base lg:text-lg font-black text-slate-800 italic tracking-tighter truncate leading-none transition-all duration-300 group-hover:scale-110 origin-left group-hover:text-indigo-600">
        {value}
      </h3>
    </div>
  </div>
);

export const SectionHeader = ({ title, icon: Icon, action }) => (
  <div className="flex items-center justify-between mb-2 px-2">
    <div className="flex items-center gap-2 group">
      <div className="p-2 bg-slate-900 rounded-xl text-white">
        <Icon size={14} />
      </div>
      <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-700 italic">
        {title}
      </h2>
    </div>
    {action && <div>{action}</div>}
  </div>
);
