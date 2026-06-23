import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Wallet,
  History,
  CreditCard,
  Activity,
  TrendingUp,
  Users,
  Clock,
  Calendar,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  StatCard,
  SectionHeader,
  RevenueAnalytics,
  MonthlyBarChart,
} from "../../components/cashier/CashierComponents";

const CashierDashboard = () => {
  const { API_BASE_URL, branding } = useAuth();
  const [isAllTxModalOpen, setIsAllTxModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    totalCollections: "₱0.00",
    todayTransactions: 0,
    pendingPayments: 0,
    recentTransactions: [],
    breakdown: { Cash: 0, GCash: 0, Card: 0 },
  });

  // Timpla ng kulay: 12% opacity para hindi masyadong maputi pero hindi rin masakit sa mata
  const getLightVariant = (hexColor) => {
    if (!hexColor) return "#f8fafc";
    return `${hexColor}1F`; // 1F is ~12% opacity
  };

  const getMediumVariant = (hexColor) => {
    if (!hexColor) return "#f1f5f9";
    return `${hexColor}33`; // 20% opacity
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const fetchData = async () => {
    try {
      const [statsRes, paymentsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/cashier/get_dashboard_stats.php`),
        axios.get(`${API_BASE_URL}/cashier/get_payments.php`),
      ]);
      setStats({
        totalCollections: statsRes.data.totalCollections || "₱0.00",
        todayTransactions: statsRes.data.todayTransactions || 0,
        pendingPayments: statsRes.data.pendingPayments || 0,
        recentTransactions: paymentsRes.data || [],
        breakdown: statsRes.data.breakdown || {},
      });
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    /* FIX: Inalis ang 'fixed inset-0' para hindi mag-overlap sa Sidebar. 
       Ginamit ang 'flex-1' at 'min-h-0' para sumunod sa main container. */
    <div className="p-4 md:p-8 space-y-6">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* STAT CARDS SECTION */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 md:gap-4 shrink-0">
          {/* 1. Total Collections */}
          <StatCard
            title="Total Collections"
            value={stats.totalCollections}
            icon={Wallet}
            colorClass="bg-slate-900"
          />

          {/* 2. Today's Count */}
          <StatCard
            title="Today's Count"
            value={stats.todayTransactions}
            icon={Activity}
            colorClass="bg-indigo-600"
          />

          {/* 3. Pending */}
          <StatCard
            title="Pending"
            value={stats.pendingPayments}
            icon={Clock}
            colorClass="bg-rose-500"
          />

          {/* 4. Active Users */}
          <StatCard
            title="Active Users"
            value="1,240"
            icon={Users}
            colorClass="bg-emerald-500"
          />

          {/* 5. Time Card (Glass Effect) */}
          <div className="bg-white/60 backdrop-blur-md px-3 py-2 md:px-4 md:py-3 rounded-[1.2rem] md:rounded-[1.5rem] border border-white shadow-sm flex items-center gap-3 h-[75px] md:h-[85px] group transition-all duration-300 hover:bg-white/80">
            <div className="p-2 md:p-2 rounded-xl bg-slate-800 text-white shrink-0 shadow-md transition-all duration-300 group-hover:scale-0 group-hover:w-0 group-hover:opacity-0 group-hover:p-0">
              <Clock size={16} className="md:w-[18px]" />
            </div>
            <div className="min-w-0 flex flex-col justify-center transition-all duration-300 group-hover:pl-2">
              <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase leading-none mb-1 transition-all duration-300 group-hover:text-slate-600">
                Time
              </p>
              <h3 className="text-[11px] md:text-base font-black text-slate-800 italic leading-none whitespace-nowrap transition-all duration-300 group-hover:scale-110 origin-left">
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </h3>
            </div>
          </div>

          {/* 6. Date Card (Glass Effect) */}
          <div className="bg-white/60 backdrop-blur-md px-3 py-2 md:px-4 md:py-3 rounded-[1.2rem] md:rounded-[1.5rem] border border-white shadow-sm flex items-center gap-3 h-[75px] md:h-[85px] group transition-all duration-300 hover:bg-white/80">
            <div className="p-2 md:p-2 rounded-xl bg-slate-800 text-white shrink-0 shadow-md transition-all duration-300 group-hover:scale-0 group-hover:w-0 group-hover:opacity-0 group-hover:p-0">
              <Calendar size={16} className="md:w-[18px]" />
            </div>
            <div className="min-w-0 flex flex-col justify-center transition-all duration-300 group-hover:pl-2">
              <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase leading-none mb-1 transition-all duration-300 group-hover:text-slate-600">
                Date
              </p>
              <h3 className="text-[11px] md:text-base font-black text-slate-800 italic leading-none whitespace-nowrap transition-all duration-300 group-hover:scale-110 origin-left">
                {formatDate(currentTime)}
              </h3>
            </div>
          </div>
        </div>

        {/* CHART SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 shrink-0">
          <div className="lg:col-span-2">
            <RevenueAnalytics />
          </div>
          <div className="lg:col-span-1">
            <MonthlyBarChart branding={branding} />
          </div>
        </div>

        {/* DATA SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
          <div className="lg:col-span-2 flex flex-col bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border-2 border-slate-200 shadow-sm">
            <SectionHeader
              title="Recent Activity"
              icon={History}
              action={
                <button
                  onClick={() => setIsAllTxModalOpen(true)}
                  style={{
                    color: branding?.theme_color,
                    backgroundColor: getMediumVariant(branding?.theme_color),
                  }}
                  className="text-[9px] md:text-[10px] font-black uppercase px-3 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl transition-all shadow-sm active:scale-95"
                >
                  Full History
                </button>
              }
            />

            {/* RECENT ACTIVITY LIST (DASHBOARD) */}
            <div className="space-y-4">
              {Array.isArray(stats.recentTransactions) &&
              stats.recentTransactions.length > 0 ? (
                stats.recentTransactions.slice(0, 5).map((tx, idx) => {
                  // Fallback logic para sa properties
                  const name =
                    tx.name ||
                    tx.student_name ||
                    tx.STUDENT_NAME ||
                    "Unknown Student";
                  const amount =
                    tx.amount || tx.amount_paid || tx.AMOUNT_PAID || 0;
                  const displayDate =
                    tx.date || tx.transaction_date || tx.TRANSACTION_DATE;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-500 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm text-[10px] font-black uppercase"
                          style={{
                            backgroundColor: getLightVariant(
                              branding?.theme_color,
                            ),
                            color: branding?.theme_color,
                          }}
                        >
                          {name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase italic leading-none">
                            {name}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {tx.type || tx.fee_category || "Payment"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-blue-600 leading-none">
                          ₱{parseFloat(amount).toLocaleString()}
                        </p>
                        <p className="text-[8px] font-black text-slate-400 uppercase mt-1">
                          {displayDate}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-10 text-slate-400 font-bold italic uppercase text-xs">
                  No recent activity
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <SectionHeader title="Channels" icon={CreditCard} />
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border-4 border-white/5 shadow-2xl space-y-8 relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-40 h-40 blur-[80px] opacity-20 rounded-full"
                style={{ backgroundColor: branding?.theme_color }}
              ></div>
              {Object.entries(stats.breakdown).map(([method, amount]) => (
                <div
                  key={method}
                  className="flex justify-between items-center border-b border-white/5 pb-5 last:border-0 last:pb-0 relative z-10"
                >
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      {method}
                    </p>
                    <p className="text-2xl font-black italic text-white leading-none">
                      ₱{Number(amount).toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp size={18} className="text-emerald-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL FOR FULL HISTORY */}
      {isAllTxModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsAllTxModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-4xl max-h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-4 border-slate-50">
            {/* HEADER - STICKY */}
            <div className="p-8 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-black italic text-slate-800 uppercase leading-none mb-1">
                  Transaction History
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Complete record of collections
                </p>
              </div>
              <button
                onClick={() => setIsAllTxModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* TABLE CONTAINER - DITO TANGGAL ANG MIN-H PARA WALANG SPACE */}
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-white">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <th className="px-4 pb-2">Reference / Student</th>
                    <th className="px-4 pb-2 text-center">Amount</th>
                    <th className="px-4 pb-2 text-center">Method</th>
                    <th className="px-4 pb-2 text-right">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {Array.isArray(stats.recentTransactions) &&
                  stats.recentTransactions.length > 0 ? (
                    stats.recentTransactions.map((tx, idx) => {
                      const name =
                        tx.name ||
                        tx.student_name ||
                        tx.STUDENT_NAME ||
                        "Unknown Student";
                      const studentId =
                        tx.student || tx.student_id || tx.STUDENT_ID || "---";
                      const amount =
                        tx.amount || tx.amount_paid || tx.AMOUNT_PAID || 0;
                      const method =
                        tx.method ||
                        tx.payment_method ||
                        tx.PAYMENT_METHOD ||
                        "---";
                      const type =
                        tx.type || tx.fee_category || tx.FEE_CATEGORY || "---";
                      const displayDate =
                        tx.date || tx.transaction_date || tx.TRANSACTION_DATE;

                      return (
                        <tr key={idx} className="group transition-colors">
                          <td className="p-3 bg-slate-50 group-hover:bg-slate-100 rounded-l-2xl border-y border-l">
                            <p className="text-xs font-black text-slate-800 uppercase italic leading-none">
                              {name}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                              ID: {studentId}
                            </p>
                          </td>
                          <td className="p-3 bg-slate-50 group-hover:bg-slate-100 border-y">
                            <p className="text-xs font-black text-emerald-600 leading-none text-center">
                              ₱{parseFloat(amount).toLocaleString()}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 text-center">
                              {type}
                            </p>
                          </td>
                          <td className="p-3 bg-slate-50 group-hover:bg-slate-100 border-y text-center">
                            <span
                              className="text-[9px] font-black uppercase px-2 py-1 rounded-md bg-white border inline-block"
                              style={{ color: branding?.theme_color }}
                            >
                              {method}
                            </span>
                          </td>
                          <td className="p-3 bg-slate-50 group-hover:bg-slate-100 rounded-r-2xl border-y border-r text-right">
                            <p className="text-[10px] font-bold text-slate-800 uppercase leading-none">
                              {displayDate}
                            </p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                              Confirmed
                            </p>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-20 text-center font-black text-slate-300 italic uppercase"
                      >
                        No transactions recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierDashboard;
