import React, { useState, useEffect } from 'react';
import { UserCheck, CheckCircle2, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const HrClearance = () => {
  const { API_BASE_URL, branding } = useAuth();
  const [clearanceList, setClearanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const themeColor = branding?.theme_color || '#2563eb';

  const fetchClearance = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cashier/payroll/employees`);
      if (res.data) {
        // Filter for Suspended / Inactive employees as offboarding clearance candidates
        const list = res.data
          .filter(emp => emp.status === 'Inactive' || emp.status === 'Suspended')
          .map(emp => ({
            name: `${emp.first_name} ${emp.last_name}`,
            status: `${emp.status} Employee`,
            clearance: "Pending assets handover",
            items: ["IT access revoke", "Finance clearance audit", "Workspace assets handback"]
          }));
        setClearanceList(list);
      }
    } catch (err) {
      console.error("Error loading clearance list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClearance();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <UserCheck className="text-blue-600" size={32} style={{ color: themeColor }} />
          Clearance & Offboarding
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Review department clearances, track equipment return status, and manage exit routing pipelines.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Exit Route Directory</h3>
        
        {loading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Loader2 className="animate-spin text-blue-600" size={16} style={{ color: themeColor }} /> Loading offboard candidates...
          </div>
        ) : clearanceList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
            No employees in the offboarding clearance pipeline.
          </div>
        ) : (
          <div className="space-y-4">
            {clearanceList.map((c, i) => (
              <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0" style={{ color: themeColor, backgroundColor: `${themeColor}10` }}>
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">Status: {c.status}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left sm:text-right">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Clearance Status</p>
                    <p className="text-xs font-bold text-amber-600 mt-0.5">{c.clearance}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600">
                    Pending Clearance
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

export default HrClearance;
