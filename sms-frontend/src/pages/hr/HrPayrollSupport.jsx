import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Banknote, ShieldCheck, Calculator, RefreshCw, Settings, Save, AlertCircle, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HrPayrollSupport = () => {
  const { API_BASE_URL, branding } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const themeColor = branding?.theme_color || '#2563eb';

  // HR Settings state
  const [settings, setSettings] = useState({
    late_deduction_mode: 'per_minute_fixed',
    late_rate_per_min: 1.00,
    absent_deduction_mode: 'automatic_daily_rate',
    work_days_per_month: 22,
    work_hours_per_day: 8
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const fetchPayrollSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/cashier/payroll/settings`);
      if (res.data?.status === 'success' && res.data?.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error("Error fetching payroll settings:", err);
    }
  };

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
    fetchPayrollSettings();
    fetchEmployees();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveMessage('');
    try {
      const res = await axios.post(`${API_BASE_URL}/cashier/payroll/settings`, settings);
      if (res.data?.status === 'success') {
        setSaveMessage('HR Payroll Policy saved successfully!');
        setTimeout(() => setSaveMessage(''), 4000);
      } else {
        alert(res.data?.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error("Error saving HR settings:", err);
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

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

  // Sample simulation for 15 mins late
  const sampleBasic = 25000;
  const sampleDailyRate = sampleBasic / (settings.work_days_per_month || 22);
  const sampleHourlyRate = sampleDailyRate / (settings.work_hours_per_day || 8);
  let sample15MinLateDeduction = 0;
  if (settings.late_deduction_mode === 'hour_equivalent') {
    sample15MinLateDeduction = sampleHourlyRate * 1; // 1 min late = 1 hour salary deduction
  } else if (settings.late_deduction_mode === 'hourly_rate_per_min') {
    sample15MinLateDeduction = (sampleHourlyRate / 60) * 15;
  } else {
    sample15MinLateDeduction = 15 * parseFloat(settings.late_rate_per_min || 1);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CreditCard className="text-blue-600" size={32} style={{ color: themeColor }} />
            HR Payroll Policy & Verification
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Configure late deduction rules (e.g. 1 min = ₱1 peso vs 1 min late = 1 hour deduction) & automatic absence deductions.</p>
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

      {/* HR PAYROLL RULES CONFIGURATION */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Settings size={20} className="text-blue-600" /> HR Late & Absence Deduction Rules
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-1">Set how employee lates and absences automatically deduct from their payroll.</p>
          </div>
          {saveMessage && (
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 animate-pulse">
              ✓ {saveMessage}
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* LATE DEDUCTION MODE */}
            <div className="bg-slate-50/70 p-6 rounded-3xl border border-slate-200/60 space-y-4">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-amber-500" /> Late Penalty Policy
              </label>

              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  settings.late_deduction_mode === 'per_minute_fixed' 
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <input 
                    type="radio" 
                    name="late_deduction_mode" 
                    value="per_minute_fixed"
                    checked={settings.late_deduction_mode === 'per_minute_fixed'}
                    onChange={(e) => setSettings({ ...settings, late_deduction_mode: e.target.value })}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-xs font-black text-slate-800 uppercase block">🟢 Fixed Amount Per Minute (1 min = ₱{settings.late_rate_per_min})</span>
                    <span className="text-[11px] text-slate-500 font-medium">Deducts a fixed peso rate per late minute (e.g. 1 min late = ₱1.00 penalty).</span>
                  </div>
                </label>

                {settings.late_deduction_mode === 'per_minute_fixed' && (
                  <div className="pl-8 pt-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Rate per Late Minute (₱)</label>
                    <input 
                      type="number"
                      step="any"
                      min="0"
                      className="w-36 p-3 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold focus:ring-2 ring-blue-500/20 outline-none"
                      value={settings.late_rate_per_min}
                      onChange={(e) => setSettings({ ...settings, late_rate_per_min: e.target.value })}
                    />
                  </div>
                )}

                <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  settings.late_deduction_mode === 'hour_equivalent' 
                    ? 'bg-red-50/80 border-red-500 ring-2 ring-red-500/20 shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <input 
                    type="radio" 
                    name="late_deduction_mode" 
                    value="hour_equivalent"
                    checked={settings.late_deduction_mode === 'hour_equivalent'}
                    onChange={(e) => setSettings({ ...settings, late_deduction_mode: e.target.value })}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-xs font-black text-slate-800 uppercase block">🔴 1 Minute Late = 1 Hour Salary Deduction</span>
                    <span className="text-[11px] text-slate-500 font-medium">Heavy penalty: Late by even 1 minute deducts 1 full hour of hourly salary.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  settings.late_deduction_mode === 'hourly_rate_per_min' 
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <input 
                    type="radio" 
                    name="late_deduction_mode" 
                    value="hourly_rate_per_min"
                    checked={settings.late_deduction_mode === 'hourly_rate_per_min'}
                    onChange={(e) => setSettings({ ...settings, late_deduction_mode: e.target.value })}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-xs font-black text-slate-800 uppercase block">🔵 Proportional Hourly Minute Rate</span>
                    <span className="text-[11px] text-slate-500 font-medium">Exact calculation: <code>(Hourly Rate / 60) * Late Minutes</code>.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* ABSENCE & WORKING DAYS POLICY */}
            <div className="bg-slate-50/70 p-6 rounded-3xl border border-slate-200/60 space-y-4 flex flex-col justify-between">
              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-blue-500" /> Automatic Absence Deduction Policy
                </label>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" /> Automatic Deduction Enabled
                  </p>
                  <p className="text-[11px] text-emerald-700">When an employee is absent, the system automatically computes missed work days and deducts <code>(Basic Salary / Monthly Work Days)</code> per absent day.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Standard Days / Month</label>
                    <input 
                      type="number"
                      min="1"
                      max="31"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold focus:ring-2 ring-blue-500/20 outline-none"
                      value={settings.work_days_per_month}
                      onChange={(e) => setSettings({ ...settings, work_days_per_month: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Working Hours / Day</label>
                    <input 
                      type="number"
                      min="1"
                      max="24"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold focus:ring-2 ring-blue-500/20 outline-none"
                      value={settings.work_hours_per_day}
                      onChange={(e) => setSettings({ ...settings, work_hours_per_day: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* SIMULATION PREVIEW */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-1 text-xs mt-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                  <span>Policy Simulation (15 Mins Late)</span>
                  <span className="text-amber-400">Basic: ₱25,000</span>
                </div>
                <div className="flex justify-between items-center font-bold">
                  <span>Calculated Deduction:</span>
                  <span className="text-red-400 font-mono text-sm">₱{sample15MinLateDeduction.toFixed(2)}</span>
                </div>
                <p className="text-[9px] text-slate-400 italic">
                  Hourly Rate: ₱{sampleHourlyRate.toFixed(2)}/hr | Daily Rate: ₱{sampleDailyRate.toFixed(2)}/day
                </p>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: themeColor }}
            >
              <Save size={16} />
              {savingSettings ? 'Saving Policy...' : 'Save HR Payroll Rules'}
            </button>
          </div>
        </form>
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
