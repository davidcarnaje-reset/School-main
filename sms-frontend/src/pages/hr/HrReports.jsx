import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart2, Calendar, FileText, Download, TrendingUp, Users, PieChart, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HrReports = () => {
  const { API_BASE_URL, branding } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const themeColor = branding?.theme_color || '#2563eb';

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/cashier/payroll/employees`);
      const activeOnly = (res.data || []).filter(e => (e.status || 'Active') === 'Active');
      setEmployees(activeOnly);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const reports = [
    { title: "Institutional Employee Turnover Rate (Q2)", desc: "Quarterly hiring speed, headcount, and resignation ratios report.", date: "July 01, 2026", size: "840 KB", format: "PDF" },
    { title: "Monthly DTR Compliance Audit Summary", desc: "Clock-in timings consistency, late summaries, and compliance logs.", date: "July 11, 2026", size: "1.5 MB", format: "CSV" },
    { title: "Evaluation Performance KPI Rankings", desc: "Consolidated performance rankings for academic faculty and support staff.", date: "August 15, 2026", size: "480 KB", format: "PDF" }
  ];

  // Headcount per department
  const getDeptCount = (deptName) => {
    return employees.filter(e => (e.department || '').toLowerCase().includes(deptName.toLowerCase()) || (e.position || '').toLowerCase().includes(deptName.toLowerCase())).length;
  };

  const teachersCount = getDeptCount('teacher');
  const registrarCount = getDeptCount('registrar');
  const cashierCount = getDeptCount('cashier');
  const itCount = getDeptCount('it');
  const othersCount = Math.max(0, employees.length - (teachersCount + registrarCount + cashierCount + itCount));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <BarChart2 className="text-blue-600" size={32} style={{ color: themeColor }} />
          Performance & Reporting Metrics
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Generates analytical summaries for evaluations, headcount ratios, and department metrics reports.</p>
      </div>

      {/* DEPARTMENT HEADCOUNT ANALYSIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-400">Faculty Headcount</span>
            <Users size={16} className="text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">{loading ? '...' : `${teachersCount} Teachers`}</h3>
          <p className="text-[10px] text-slate-400 font-semibold">Active academic classroom load</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-400">Registrar & Cashier</span>
            <Briefcase size={16} className="text-blue-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">{loading ? '...' : `${registrarCount + cashierCount} Staff`}</h3>
          <p className="text-[10px] text-slate-400 font-semibold">Admissions & financial administration</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-400">IT & Operations</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">{loading ? '...' : `${itCount + othersCount} Staff`}</h3>
          <p className="text-[10px] text-slate-400 font-semibold">Security support & infrastructure</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-400">Total Campus Headcount</span>
            <PieChart size={16} className="text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">{loading ? '...' : `${employees.length} Employees`}</h3>
          <p className="text-[10px] text-slate-400 font-semibold">Full active directory headcount</p>
        </div>
      </div>

      {/* REPORTS DOWNLOAD HUB */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
          <FileText size={16} className="text-slate-400" /> Monthly Analytical Summaries
        </h3>
        
        <div className="space-y-4">
          {reports.map((r, i) => (
            <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-200 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0" style={{ color: themeColor, backgroundColor: `${themeColor}10` }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{r.title}</h4>
                  <p className="text-slate-400 text-xs font-semibold mt-1">{r.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">File Details</p>
                  <p className="text-xs font-bold text-slate-650 mt-0.5">{r.size} • {r.format}</p>
                </div>
                <button 
                  onClick={() => alert(`Downloading ${r.title}...`)}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-350 text-slate-750 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm"
                >
                  <Download size={14} className="inline mr-1" /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HrReports;
