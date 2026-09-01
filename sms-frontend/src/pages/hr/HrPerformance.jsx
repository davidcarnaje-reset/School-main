import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const HrPerformance = () => {
  const { API_BASE_URL, branding } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const themeColor = branding?.theme_color || '#2563eb';

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cashier/payroll/employees`);
      if (res.data) {
        // Map employees to default performance reviews
        const list = res.data.map(emp => ({
          employee: `${emp.first_name} ${emp.last_name} (${emp.position})`,
          evaluator: "Department Manager / Head",
          score: "Pending Review",
          status: "Pending Evaluation",
          date: "Awaiting Schedule"
        }));
        setEvaluations(list);
      }
    } catch (err) {
      console.error("Error loading performance reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Award className="text-blue-600" size={32} style={{ color: themeColor }} />
            Performance Evaluations & KPI
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Dispatch evaluation forms, track grading metrics from academic heads, and archive annual reviews.</p>
        </div>
        <button 
          onClick={() => alert("Evaluation forms dispatched to all department heads.")}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: themeColor }}
        >
          Dispatch Forms
        </button>
      </div>

      {/* EVALUATION LIST */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Performance Reviews Ledger</h3>
        
        {loading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Loader2 className="animate-spin text-blue-600" size={16} style={{ color: themeColor }} /> Loading reviews...
          </div>
        ) : evaluations.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold text-xs">
            No active employee performance reviews logged.
          </div>
        ) : (
          <div className="space-y-4">
            {evaluations.map((e, idx) => (
              <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-200 transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{e.employee}</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Evaluator: <span className="text-slate-700 font-bold">{e.evaluator}</span></p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Date Logged: {e.date}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left sm:text-right">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">KPI Rating Score</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{e.score}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${e.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    <ShieldCheck size={12} />
                    {e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default HrPerformance;
