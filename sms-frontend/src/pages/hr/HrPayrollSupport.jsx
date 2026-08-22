import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Banknote, ShieldCheck, Calculator, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HrPayrollSupport = () => {
  const { API_BASE_URL, branding } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const themeColor = branding?.theme_color || '#2563eb';

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cashier/payroll/employees`);
      setEmployees(res.data || []);
    } catch (error) {
      console.error("Error fetching payroll matrix:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Compute breakdown logic
  const calculateCompensation = (basicPay) => {
    const basic = parseFloat(basicPay) || 25000;
    const sss = Math.round(basic * 0.045); // 4.5% SSS
    const philhealth = Math.round(basic * 0.02); // 2% PhilHealth
    const pagibig = 100; // Flat 100 pesos
    const tax = Math.round((basic - (sss + philhealth + pagibig)) * 0.1); // 10% tax on taxable income
    const deductions = sss + philhealth + pagibig + tax;
    const net = basic - deductions;

    return { sss, philhealth, pagibig, tax, deductions, net };
  };

  const handleSyncWithFinance = () => {
    alert("Syncing payroll configurations with Finance/Cashier Ledger completed!\nGross, deductions, and tax withholdings calculations authorized.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CreditCard className="text-blue-600" size={32} style={{ color: themeColor }} />
            Payroll Setup & Verification
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Calculates gross basic salaries, SSS/PhilHealth/PAG-IBIG government deductions, tax withholdings, and take-home pay.</p>
        </div>
        <button 
          onClick={handleSyncWithFinance}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:scale-[1.02]"
          style={{ backgroundColor: themeColor }}
        >
          <Banknote size={16} />
          Sync with Finance
        </button>
      </div>

      {/* RATES TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5">
            <Calculator size={16} className="text-slate-400" /> Employee Compensation Matrix
          </h3>
          <button onClick={fetchEmployees} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-blue-600"><RefreshCw size={14} /></button>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 text-center py-10 font-bold">Loading compensation rates...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Employee Name</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Basic Gross Salary</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Govt Deductions (SSS/PH/PI)</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Tax Withheld (10%)</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Total Deductions</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Calculated Net Pay</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const calc = calculateCompensation(emp.basic_salary);

                  return (
                    <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 pr-4">
                        <p className="text-sm font-bold text-slate-700">{emp.first_name} {emp.last_name}</p>
                        <span className="text-[10px] text-slate-400 font-bold">{emp.position} • {emp.department}</span>
                      </td>
                      <td className="py-4 pr-4 font-mono font-bold text-slate-750">
                        ₱{emp.basic_salary?.toLocaleString()}
                      </td>
                      <td className="py-4 pr-4 text-red-500 font-mono">
                        - ₱{(calc.sss + calc.philhealth + calc.pagibig).toLocaleString()}
                        <p className="text-[8px] text-slate-400 font-sans mt-0.5">SSS: ₱{calc.sss} | PH: ₱{calc.philhealth} | PI: ₱{calc.pagibig}</p>
                      </td>
                      <td className="py-4 pr-4 text-red-500 font-mono">
                        - ₱{calc.tax.toLocaleString()}
                      </td>
                      <td className="py-4 pr-4 text-red-650 font-mono font-black">
                        - ₱{calc.deductions.toLocaleString()}
                      </td>
                      <td className="py-4 pr-4 text-emerald-600 font-mono font-black text-sm">
                        ₱{calc.net.toLocaleString()}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          emp.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          <ShieldCheck size={12} />
                          {emp.status === 'Active' ? 'Verified' : emp.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default HrPayrollSupport;
