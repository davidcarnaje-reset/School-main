import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Download,
  Filter,
  Banknote,
  CreditCard,
  Wallet,
  ReceiptText,
  Search,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../context/AuthContext";

const CollectionReports = () => {
  const [reports, setReports] = useState([]);
  const { branding, API_BASE_URL } = useAuth();
  const [stats, setStats] = useState({ total: 0, cash: 0, gcash: 0, card: 0 });
  const [searchTerm, setSearchTerm] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [filters, setFilters] = useState({ start: today, end: today });
  const [loading, setLoading] = useState(false);

  // Theme Helpers mula sa Dashboard
  const getLightVariant = (hexColor) =>
    hexColor ? `${hexColor}1F` : "#f8fafc";
  const getMediumVariant = (hexColor) =>
    hexColor ? `${hexColor}33` : "#f1f5f9";

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/cashier/get_collection_reports.php?start=${filters.start}&end=${filters.end}`,
      );
      if (res.data.status === "success") {
        setReports(res.data.data);
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter(
    (p) =>
      `${p.first_name} ${p.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      p.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.payment_method.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const exportToPDF = () => {
    if (filteredReports.length === 0)
      return alert("Walang data na pwedeng i-export!");
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("COLLECTION REPORT", 14, 20);
      doc.setFontSize(10);
      doc.text(`Period: ${filters.start} to ${filters.end}`, 14, 30);
      autoTable(doc, {
        startY: 45,
        head: [["Date", "Student Name", "Method", "Category", "Amount"]],
        body: filteredReports.map((p) => [
          new Date(p.transaction_date).toLocaleDateString(),
          `${p.first_name} ${p.last_name}`,
          p.payment_method,
          p.fee_category,
          `P${parseFloat(p.amount_paid).toLocaleString()}`,
        ]),
        theme: "grid",
      });
      doc.save(`Collection_Report_${filters.start}.pdf`);
    } catch (err) {
      alert("Error generating PDF.");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 text-left max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* GLASS HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-white shadow-sm">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-3">
            <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg">
              <ReceiptText size={28} />
            </div>
            Collection{" "}
            <span style={{ color: branding?.theme_color }}>Reports</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 ml-1">
            Financial Audit & Analytics[cite: 5]
          </p>
        </div>

        {/* DATE FILTERS */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-100/50 p-2 rounded-[2rem] border border-slate-200/50">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              className="bg-transparent border-0 text-[11px] font-black uppercase outline-none"
              value={filters.start}
              onChange={(e) =>
                setFilters({ ...filters, start: e.target.value })
              }
            />
          </div>
          <ChevronRight size={14} className="text-slate-300 hidden md:block" />
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              className="bg-transparent border-0 text-[11px] font-black uppercase outline-none"
              value={filters.end}
              onChange={(e) => setFilters({ ...filters, end: e.target.value })}
            />
          </div>
          <button
            onClick={fetchReports}
            style={{ backgroundColor: branding?.theme_color }}
            className="p-3 text-white rounded-xl shadow-lg hover:brightness-110 transition-all active:scale-95"
          >
            <Filter size={18} strokeWidth={3} />
          </button>
          <button
            onClick={exportToPDF}
            disabled={loading}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* STAT CARDS - GINAYA SA DASHBOARD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Collection"
          value={stats.total}
          icon={<ReceiptText size={20} />}
          colorClass="bg-slate-900"
        />
        <StatCard
          title="Cash Revenue"
          value={stats.cash}
          icon={<Banknote size={20} />}
          colorClass="bg-emerald-500"
        />
        <StatCard
          title="Digital (GCash)"
          value={stats.gcash}
          icon={<Wallet size={20} />}
          colorClass="bg-blue-500"
        />
        <StatCard
          title="Card Payments"
          value={stats.card}
          icon={<CreditCard size={20} />}
          colorClass="bg-indigo-600"
        />
      </div>

      {/* SEARCH AND TABLE AREA */}
      <div className="bg-white p-2 rounded-[3rem] border-2 border-slate-100 shadow-sm">
        <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96 group">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search student, ID, or method..."
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] font-bold text-xs outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">
            Showing {filteredReports.length} records
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar pb-4 px-2">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-4 text-left">Date / ID</th>
                <th className="px-8 py-4 text-left">Student Details</th>
                <th className="px-8 py-4 text-center">Method</th>
                <th className="px-8 py-4 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((p) => (
                  <tr
                    key={p.payment_id}
                    className="group transition-all hover:translate-x-1"
                  >
                    <td className="px-8 py-5 bg-slate-50 group-hover:bg-slate-100 rounded-l-[1.5rem] border-y border-l border-slate-100">
                      <p className="text-[11px] font-black text-slate-800 uppercase italic">
                        {new Date(p.transaction_date).toLocaleDateString()}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                        Ref: #{p.payment_id}
                      </p>
                    </td>
                    <td className="px-8 py-5 bg-slate-50 group-hover:bg-slate-100 border-y border-slate-100">
                      <div className="font-black text-slate-900 uppercase italic leading-none mb-1">
                        {p.first_name} {p.last_name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {p.student_id}
                      </div>
                    </td>
                    <td className="px-8 py-5 bg-slate-50 group-hover:bg-slate-100 border-y border-slate-100 text-center">
                      <span
                        className="px-4 py-1.5 bg-white border rounded-xl text-[9px] font-black uppercase shadow-sm inline-block"
                        style={{
                          color: branding?.theme_color,
                          borderColor: getMediumVariant(branding?.theme_color),
                        }}
                      >
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="px-8 py-5 bg-slate-50 group-hover:bg-slate-100 rounded-r-[1.5rem] border-y border-r border-slate-100 text-right">
                      <p className="text-lg font-black text-slate-900 italic">
                        ₱
                        {parseFloat(p.amount_paid).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-[9px] font-bold text-emerald-500 uppercase">
                        Confirmed
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-24 text-center">
                    <div className="text-slate-200 font-black uppercase tracking-[0.5em] italic text-xl">
                      No Collections Found
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, colorClass }) => (
  <div className="bg-white/60 backdrop-blur-md px-4 py-3 rounded-[1.5rem] border border-white shadow-sm flex items-center gap-3 h-[85px] group transition-all duration-300 hover:bg-white/80 overflow-hidden cursor-default">
    {/* ICON: Ito yung nawawala at lumiliit (scale-0) kapag naka-hover */}
    <div
      className={`p-2.5 rounded-xl text-white shrink-0 shadow-md transition-all duration-500 ease-in-out ${colorClass} 
      group-hover:scale-0 group-hover:w-0 group-hover:opacity-0 group-hover:p-0 group-hover:mr-[-12px]`}
    >
      {icon}
    </div>

    {/* TEXT CONTENT: Ito yung lumalaki (scale-110) at nagmo-move pakanan */}
    <div className="min-w-0 flex flex-col justify-center transition-all duration-500 ease-in-out group-hover:pl-2">
      <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1.5 transition-all duration-300 group-hover:text-slate-600 tracking-widest">
        {title}
      </p>

      <h3 className="text-lg md:text-xl font-black text-slate-800 italic leading-none whitespace-nowrap transition-all duration-500 ease-in-out group-hover:scale-110 origin-left">
        ₱{Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </h3>
    </div>
  </div>
);

export default CollectionReports;
