import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Banknote,
  Users,
  Calendar,
  History,
  Search,
  Plus,
  UserPlus,
  Briefcase,
  Wallet,
  X,
  Edit2,
  Trash2,
  Printer,
  Archive, // DAGDAG ITO (Dito galing ang error)
  ArrowLeft, // DAGDAG ITO
  FileText, // DAGDAG ITO
  CheckCircle, // DAGDAG ITO
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Payroll = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [activeTab, setActiveTab] = useState("Employees");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ilagay ito sa loob ng Payroll component bago ang return statement[cite: 4]
  const getLightVariant = (hexColor) =>
    hexColor ? `${hexColor}1F` : "#f8fafc";
  const getMediumVariant = (hexColor) =>
    hexColor ? `${hexColor}33` : "#f1f5f9";

  const initialForm = {
    id: "",
    employee_id: "",
    first_name: "",
    last_name: "",
    position: "",
    department: "",
    basic_salary: "",
    status: "Active",
  };

  const [formData, setFormData] = useState(initialForm);

  // --- FETCH EMPLOYEES ---
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cashier/get_employees.php`);
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // --- SAVE / UPDATE EMPLOYEE ---
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      // Kung may ID, EDIT ito. Kung wala, ADD NEW.
      const endpoint = formData.id ? "update_employee.php" : "add_employee.php";
      const res = await axios.post(
        `${API_BASE_URL}/cashier/${endpoint}`,
        formData,
      );

      if (res.data.status === "success") {
        alert("Employee saved successfully!"); // Maganda kung may feedback
        setIsModalOpen(false);
        setFormData(initialForm);
        fetchEmployees();
      } else {
        alert(res.data.message || "Failed to save employee");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving employee");
    }
  };

  // 1. Dagdag na States sa taas
  const [periods, setPeriods] = useState([]);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [periodData, setPeriodData] = useState({
    period_name: "",
    start_date: "",
    end_date: "",
  });

  // 2. Fetch Periods function
  const fetchPeriods = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/cashier/get_periods.php`);
      setPeriods(res.data);
    } catch (err) {
      console.error("Error fetching periods");
    }
  };

  // 3. Add to useEffect
  useEffect(() => {
    fetchEmployees();
    fetchPeriods();
  }, []);

  // 4. Handle Create Period
  const handleCreatePeriod = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_BASE_URL}/cashier/add_period.php`,
        periodData,
      );
      if (res.data.status === "success") {
        setIsPeriodModalOpen(false);
        setPeriodData({ period_name: "", start_date: "", end_date: "" });
        fetchPeriods();
      }
    } catch (err) {
      alert("Error creating period");
    }
  };

  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [payrollEntries, setPayrollEntries] = useState([]);

  const handleStartProcess = async (period) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/cashier/process_payroll_init.php?period_id=${period.id}`,
      );
      if (res.data.status === "success") {
        setPayrollEntries(res.data.entries);
        setSelectedPeriod(period); // Dito mag-u-switch ang view natin
      }
    } catch (err) {
      alert("Error initializing payroll");
    } finally {
      setLoading(false);
    }
  };

  // Function para sa real-time    ng inputs sa table
  const updateEntry = (index, field, value) => {
    const newEntries = [...payrollEntries];

    // Gawing whole number ang value (kung hindi net_pay)
    // Gagamit tayo ng Math.max(0, ...) para walang negative values
    const numericValue = value === "" ? 0 : Math.max(0, parseInt(value));

    newEntries[index][field] = numericValue;

    // Computation ng Net Pay
    const basicSalary = parseFloat(newEntries[index].basic_salary) || 0;
    const dailyRate = basicSalary / 22; // Assumption: 22 working days
    const hourlyRate = dailyRate / 8;

    const basePay = dailyRate * newEntries[index].days_worked;
    const otPay = hourlyRate * 1.25 * newEntries[index].overtime_hours;
    // Sample penalty: (Daily Rate / 8 / 60) * late minutes
    const lateDeduction = (hourlyRate / 60) * newEntries[index].late_minutes;

    const total = basePay + otPay - lateDeduction;

    // Net pay lang ang may decimal
    newEntries[index].net_pay = Math.max(0, total).toFixed(2);

    setPayrollEntries(newEntries);
  };

  const handleSavePayroll = async (status) => {
    if (
      status === "Paid" &&
      !window.confirm(
        "Are you sure? This will lock the payroll data for this period.",
      )
    )
      return;

    setLoading(true);
    try {
      const payload = {
        period_id: selectedPeriod.id,
        entries: payrollEntries,
        final_status: status,
      };

      const res = await axios.post(
        `${API_BASE_URL}/cashier/save_payroll.php`,
        payload,
      );

      // Dito natin sisiguraduhin na may fallback message
      const serverMessage =
        res.data.message ||
        (status === "Paid" ? "Payroll Finalized!" : "Draft Saved!");

      if (res.data.status === "success") {
        alert(serverMessage);
        if (status === "Paid") {
          setSelectedPeriod(null);
          fetchPeriods();
        }
      } else {
        alert("Error: " + (res.data.message || "Unknown error occurred."));
      }
    } catch (err) {
      console.error(err);
      alert("System Error: Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const [completedPeriods, setCompletedPeriods] = useState([]);
  const [viewingHistory, setViewingHistory] = useState(null); // Para sa drill-down view

  // Fetch list ng tapos na cutoffs
  const fetchCompletedPeriods = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/cashier/get_completed_periods.php`,
      );
      // I-force natin na maging array ang data. Kung hindi array, gawin itong empty array.
      setCompletedPeriods(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching history");
      setCompletedPeriods([]); // Fallback
    }
  };

  // Fetch specific employee records para sa isang tapos na cutoff
  const handleViewHistory = async (period) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/cashier/get_completed_payroll.php?period_id=${period.id}`,
      );
      if (res.data.status === "success") {
        setPayrollEntries(res.data.entries);
        setViewingHistory(period);
      }
    } catch (err) {
      alert("Error loading history data");
    } finally {
      setLoading(false);
    }
  };

  // I-trigger ang fetch kapag lumipat sa Completed tab
  useEffect(() => {
    if (activeTab === "Completed") {
      fetchCompletedPeriods();
      setViewingHistory(null); // Reset view
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "Completed") {
      fetchCompletedPeriods();
      setViewingHistory(null);
      setPayrollEntries([]); // I-clear ang entries para iwas conflict sa ibang tabs
    }
  }, [activeTab]);

  const printIndividualPayslip = (entry, period) => {
    const printWindow = window.open("", "_blank");

    // Dito natin bubuuin ang itsura ng Payslip (HTML/CSS)
    printWindow.document.write(`
    <html>
      <head>
        <title>Payslip - ${entry.full_name}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; }
          .payslip-card { border: 2px solid #eee; padding: 30px; border-radius: 20px; max-width: 500px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
          .label { font-weight: bold; color: #666; text-transform: uppercase; font-size: 12px; }
          .value { font-weight: 800; }
          .total-row { margin-top: 20px; padding-top: 15px; border-top: 2px dashed #eee; }
          .net-pay { font-size: 24px; color: #059669; font-weight: 900; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="payslip-card">
          <div class="header">
            <h2 style="margin:0; italic">PAYROLL <span style="color:#3b82f6">PRO</span></h2>
            <p style="font-size:10px; color:#999; margin:5px 0 uppercase">${period.period_name}</p>
          </div>
          
          <div class="row">
            <span class="label">Employee Name:</span>
            <span class="value">${entry.full_name}</span>
          </div>
          <div class="row">
            <span class="label">Position:</span>
            <span class="value">${entry.position}</span>
          </div>
          <div class="row">
            <span class="label">Period:</span>
            <span class="value">${period.start_date} - ${period.end_date}</span>
          </div>
          
          <div class="total-row">
            <div class="row">
              <span class="label">Days Worked:</span>
              <span class="value">${entry.days_worked}</span>
            </div>
            <div class="row">
              <span class="label">OT Hours:</span>
              <span class="value">${entry.ot_hours}</span>
            </div>
            <div class="row">
              <span class="label">Late Minutes:</span>
              <span class="value">${entry.late_minutes}</span>
            </div>
          </div>

          <div class="total-row" style="text-align: right;">
            <div class="label">Net Take Home Pay:</div>
            <div class="net-pay">₱${parseFloat(entry.net_pay).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>

          <div class="footer">
            Generated on ${new Date().toLocaleDateString()}<br>
            CONFIDENTIAL DOCUMENT
          </div>
        </div>
        <script>window.print(); window.close();</script>
      </body>
    </html>
  `);
    printWindow.document.close();
  };

  return (
    <div className="p-6 space-y-6 text-left max-w-7xl mx-auto">
      {/* 1. HEADER & TABS - UPDATE THIS PART */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-white shadow-sm mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 rounded-[1.5rem] text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
            <Banknote size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              Payroll <span style={{ color: branding?.theme_color }}>Pro</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
              Personnel & Salary Management
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200 w-full md:w-auto">
          {["Employees", "Periods", "Completed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase transition-all duration-300 ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 2. EMPLOYEES TAB CONTENT */}
      {activeTab === "Employees" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="relative w-72">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search staff..."
                className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl border-none font-bold text-xs outline-none focus:ring-2 ring-blue-500/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                setFormData(initialForm);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white p-4 rounded-2xl flex items-center gap-3 hover:bg-black transition-all shadow-lg shadow-blue-100"
            >
              <UserPlus size={18} />
              <span className="text-[10px] font-black uppercase">
                Add Employee
              </span>
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                  <th className="p-6 text-left">Employee Name</th>
                  <th className="p-6 text-left">Position</th>
                  <th className="p-6 text-center">Basic Salary</th>
                  <th className="p-6 text-center">Status</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              {/* UPDATE TABLE BODY FOR EMPLOYEES */}
              <tbody className="border-separate border-spacing-y-3">
                {employees
                  .filter((emp) =>
                    `${emp.first_name} ${emp.last_name}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((emp) => (
                    <tr
                      key={emp.id}
                      className="group transition-all hover:translate-x-1"
                    >
                      <td className="p-6 bg-white border-y border-l border-slate-100 rounded-l-[2rem]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs uppercase">
                            {emp.first_name[0]}
                            {emp.last_name[0]}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 uppercase italic text-sm leading-none">
                              {emp.first_name} {emp.last_name}
                            </div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">
                              ID: {emp.employee_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 bg-white border-y border-slate-100">
                        <div className="font-bold text-slate-600 text-[10px] uppercase tracking-wider">
                          {emp.position}
                        </div>
                        <div
                          className="text-[9px] font-black uppercase italic mt-0.5"
                          style={{ color: branding?.theme_color }}
                        >
                          {emp.department}
                        </div>
                      </td>
                      <td className="p-6 bg-white border-y border-slate-100 text-center">
                        <span className="text-sm font-black text-slate-900 italic">
                          ₱{parseFloat(emp.basic_salary).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-6 bg-white border-y border-slate-100 text-center">
                        <span
                          className={`text-[8px] font-black px-3 py-1.5 rounded-xl uppercase shadow-sm ${
                            emp.status === "Active"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="p-6 bg-white border-y border-r border-slate-100 rounded-r-[2rem] text-right">
                        <button
                          onClick={() => {
                            setFormData(emp);
                            setIsModalOpen(true);
                          }}
                          className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "Periods" && !selectedPeriod && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-700 uppercase italic">
              Active Cutoff Periods
            </h3>
            <button
              onClick={() => setIsPeriodModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-black transition-all flex items-center gap-2"
            >
              <Plus size={18} /> Create New Cutoff
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {periods
              .filter((p) => p.status !== "Completed")
              .map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border-b-4 border-b-blue-500 group"
                >
                  <div className="p-3 bg-blue-50 w-fit rounded-2xl text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Calendar size={24} />
                  </div>
                  <h4 className="font-black text-slate-800 uppercase text-sm italic">
                    {p.period_name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-tighter">
                    {p.start_date} — {p.end_date}
                  </p>

                  <button
                    onClick={() => handleStartProcess(p)}
                    className="mt-8 w-full py-4 bg-slate-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase italic hover:bg-blue-600 hover:text-white transition-all"
                  >
                    Process Payroll →
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {activeTab === "Completed" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {!viewingHistory ? (
            // --- LIST OF COMPLETED PERIODS (ARCHIVE CARDS) ---
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.isArray(completedPeriods) &&
              completedPeriods.length > 0 ? (
                completedPeriods.map((p) => (
                  <div
                    key={p.id}
                    className="group bg-white border-2 border-slate-50 p-8 rounded-[3.5rem] shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all relative overflow-hidden"
                  >
                    {/* Decorative Accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-100 transition-colors" />

                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="p-4 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-200">
                        <History size={24} />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-full uppercase tracking-widest">
                          Settled
                        </span>
                      </div>
                    </div>

                    <h4 className="font-black text-slate-800 uppercase text-lg italic tracking-tighter leading-tight group-hover:text-emerald-700 transition-colors">
                      {p.period_name}
                    </h4>

                    <div className="flex items-center gap-2 mt-2 border-b border-slate-50 pb-6">
                      <Calendar size={12} className="text-slate-400" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        {p.start_date} — {p.end_date}
                      </p>
                    </div>

                    <button
                      onClick={() => handleViewHistory(p)}
                      className="mt-6 w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase italic tracking-widest hover:bg-emerald-600 shadow-xl shadow-slate-200 hover:shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <FileText size={14} />
                      View Full Report
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-32 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-100">
                  <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Archive size={32} className="text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">
                    Archive is currently empty
                  </p>
                </div>
              )}
            </div>
          ) : (
            // --- DRILL-DOWN REPORT VIEW (DETAILED SUMMARY) ---
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
              {/* COMPLETED HEADER */}
              <div className="bg-emerald-600 p-10 rounded-[3.5rem] text-white shadow-2xl shadow-emerald-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => setViewingHistory(null)}
                      className="p-4 bg-white/20 hover:bg-white text-emerald-600 rounded-2xl transition-all group"
                    >
                      <ArrowLeft
                        size={20}
                        className="group-hover:-translate-x-1 transition-transform"
                      />
                    </button>
                    <div>
                      <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                        {viewingHistory.period_name}
                      </h2>
                      <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                        <CheckCircle size={12} />
                        Payroll Finalized and Disbursed
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="bg-slate-900 px-10 py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl flex items-center gap-3"
                  >
                    <Printer size={18} />
                    Print Masterlist
                  </button>
                </div>
              </div>

              {/* DATA TABLE */}
              <div className="bg-white border-4 border-slate-50 rounded-[3.5rem] overflow-hidden shadow-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-100">
                      <th className="p-8 text-left italic">Personnel Name</th>
                      <th className="p-8 text-center">Attendance</th>
                      <th className="p-8 text-center">OT (Hrs)</th>
                      <th className="p-8 text-center">Late (Min)</th>
                      <th className="p-8 text-right">Net Received</th>
                      <th className="p-8 text-center">Receipts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(payrollEntries || []).map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-emerald-50/30 transition-colors group"
                      >
                        <td className="p-8">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center font-black text-emerald-600 text-xs uppercase">
                              {entry.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div>
                              <div className="font-black text-slate-800 uppercase italic text-sm tracking-tight">
                                {entry.full_name}
                              </div>
                              <div className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">
                                {entry.position}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-8 text-center font-black text-slate-600 text-xs italic">
                          {entry.days_worked}{" "}
                          <span className="text-[8px] text-slate-300 not-italic">
                            Days
                          </span>
                        </td>
                        <td className="p-8 text-center font-black text-slate-600 text-xs italic">
                          {entry.ot_hours || 0}{" "}
                          <span className="text-[8px] text-slate-300 not-italic">
                            Hrs
                          </span>
                        </td>
                        <td className="p-8 text-center font-black text-red-400 text-xs italic">
                          {entry.late_minutes || 0}{" "}
                          <span className="text-[8px] text-slate-300 not-italic">
                            Min
                          </span>
                        </td>
                        <td className="p-8 text-right">
                          <div className="font-black text-lg text-emerald-600 tracking-tighter italic">
                            ₱
                            {parseFloat(entry.net_pay || 0).toLocaleString(
                              undefined,
                              { minimumFractionDigits: 2 },
                            )}
                          </div>
                        </td>
                        <td className="p-8 text-center">
                          <button
                            onClick={() =>
                              printIndividualPayslip(entry, viewingHistory)
                            }
                            className="p-4 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-400 rounded-2xl transition-all shadow-sm active:scale-90"
                            title="Generate Payslip"
                          >
                            <Printer size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* TABLE FOOTER SUMMARY */}
                <div className="bg-emerald-50/50 p-8 flex justify-end items-center gap-8 border-t border-emerald-100">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      Total Disbursement
                    </span>
                    <span className="text-3xl font-black text-slate-900 italic tracking-tighter">
                      ₱{" "}
                      {(payrollEntries || [])
                        .reduce(
                          (acc, curr) => acc + parseFloat(curr.net_pay || 0),
                          0,
                        )
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. MODAL FOR ADD/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl border-[6px] border-slate-100 overflow-hidden animate-in zoom-in duration-300">
            {/* MODAL HEADER WITH BACK BUTTON */}
            <div className="bg-slate-900 p-8 text-white relative">
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group"
                  >
                    <X
                      size={20}
                      className="group-hover:rotate-90 transition-transform"
                    />
                  </button>
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                      {formData.id ? "Update" : "Add"} Personnel
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      Employee Management System
                    </p>
                  </div>
                </div>
                <Users size={40} className="opacity-20" />
              </div>
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSaveEmployee} className="p-10">
              <div className="grid grid-cols-2 gap-6">
                {/* EMPLOYEE ID */}
                <div className="col-span-2 md:col-span-1 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic">
                    Employee ID No.
                  </label>
                  <input
                    required
                    placeholder="e.g. EMP-2024-001"
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 focus:border-blue-500 font-bold text-xs outline-none transition-all shadow-sm"
                    value={formData.employee_id}
                    onChange={(e) =>
                      setFormData({ ...formData, employee_id: e.target.value })
                    }
                  />
                </div>

                {/* STATUS */}
                <div className="col-span-2 md:col-span-1 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic">
                    Employment Status
                  </label>
                  <select
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 focus:border-blue-500 font-black text-xs outline-none transition-all shadow-sm"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                {/* FULL NAME SECTION */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic text-blue-600">
                    Personal Information
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      required
                      className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 focus:border-blue-500 font-bold text-xs outline-none transition-all shadow-sm"
                      placeholder="First Name"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                    />
                    <input
                      required
                      className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 focus:border-blue-500 font-bold text-xs outline-none transition-all shadow-sm"
                      placeholder="Last Name"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* DEPARTMENT */}
                <div className="col-span-2 md:col-span-1 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic">
                    Department
                  </label>
                  <input
                    required
                    placeholder="e.g. Sales / Kitchen"
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 focus:border-blue-500 font-bold text-xs outline-none transition-all shadow-sm"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                  />
                </div>

                {/* POSITION */}
                <div className="col-span-2 md:col-span-1 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic">
                    Job Position
                  </label>
                  <input
                    required
                    placeholder="e.g. Senior Cashier"
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 focus:border-blue-500 font-bold text-xs outline-none transition-all shadow-sm"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                  />
                </div>

                {/* BASIC SALARY */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic">
                    Basic Monthly Salary (PHP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">
                      ₱
                    </span>
                    <input
                      required
                      type="number"
                      placeholder="0.00"
                      className="w-full pl-8 p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 focus:border-blue-500 font-black text-xs outline-none transition-all shadow-sm text-blue-600"
                      value={formData.basic_salary}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          basic_salary: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* SAVE BUTTON */}
              <button
                type="submit"
                className="w-full mt-10 py-5 rounded-[1.5rem] text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
                style={{ backgroundColor: branding?.theme_color }}
              >
                <Plus size={18} />
                {formData.id
                  ? "Sync and Update Record"
                  : "Create New Personnel"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PERIOD MODAL */}
      {isPeriodModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl border-[6px] border-slate-100 overflow-hidden animate-in zoom-in duration-300">
            {/* MODAL HEADER */}
            <div className="bg-slate-900 p-8 text-white relative">
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                    Create Cutoff
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                    Payroll Period Duration
                  </p>
                </div>
                <button
                  onClick={() => setIsPeriodModalOpen(false)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group"
                >
                  <X
                    size={20}
                    className="group-hover:rotate-90 transition-transform"
                  />
                </button>
              </div>
              {/* Subtle Icon Background */}
              <Calendar
                size={60}
                className="absolute -right-2 -bottom-2 opacity-10 text-white"
              />
            </div>

            <form onSubmit={handleCreatePeriod} className="p-8 space-y-6">
              {/* PERIOD NAME */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Period Description
                </label>
                <input
                  required
                  placeholder="e.g. April 1-15, 2024 Payroll"
                  className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 font-bold text-xs outline-none transition-all shadow-inner"
                  value={periodData.period_name}
                  onChange={(e) =>
                    setPeriodData({
                      ...periodData,
                      period_name: e.target.value,
                    })
                  }
                />
              </div>

              {/* DATE RANGE GRID */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic">
                    Start Date
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="date"
                      className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 font-black text-xs outline-none transition-all uppercase"
                      value={periodData.start_date}
                      onChange={(e) =>
                        setPeriodData({
                          ...periodData,
                          start_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic">
                    End Date
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="date"
                      className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 font-black text-xs outline-none transition-all uppercase"
                      value={periodData.end_date}
                      onChange={(e) =>
                        setPeriodData({
                          ...periodData,
                          end_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* INFO BOX */}
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-[9px] text-blue-600 font-bold uppercase leading-relaxed text-center">
                  Notice: Creating a new period will automatically sync all
                  active employees to the payroll processing list.
                </p>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-5 rounded-[1.8rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <CheckCircle size={18} />
                Initialize Period
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "Periods" && selectedPeriod && (
        <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-500">
          {/* HEADER SECTION */}
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            {/* Subtle Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-500/20 transition-all duration-700" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <button
                  onClick={() => setSelectedPeriod(null)}
                  className="group/btn text-slate-400 hover:text-white text-[10px] font-black uppercase mb-3 flex items-center gap-2 transition-all"
                >
                  <span className="group-hover/btn:-translate-x-1 transition-transform">
                    ←
                  </span>
                  Back to Payroll Periods
                </button>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-1.5 bg-blue-500 rounded-full italic" />
                  <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                      {selectedPeriod.period_name}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Processing Live Payroll Data
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-[2rem] border border-slate-700/50 backdrop-blur-sm">
                <button
                  onClick={() => handleSavePayroll("Pending")}
                  className="px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSavePayroll("Paid")}
                  className="bg-blue-600 px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2"
                >
                  Finalize & Pay
                </button>
              </div>
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="bg-white border-4 border-slate-50 rounded-[3rem] overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-100">
                  <th className="p-8 text-left italic">Employee Details</th>
                  <th className="p-8 text-center">Work Attendance</th>
                  <th className="p-8 text-center">Overtime</th>
                  <th className="p-8 text-center">Tardiness</th>
                  <th className="p-8 text-right">Net Compensation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payrollEntries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    {/* Profile Info */}
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 text-xs group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          {entry.first_name[0]}
                          {entry.last_name[0]}
                        </div>
                        <div>
                          <div className="font-black text-slate-800 uppercase italic text-sm tracking-tight">
                            {entry.first_name} {entry.last_name}
                          </div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-blue-500 transition-colors">
                            {entry.position}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Days Worked Input */}
                    <td className="p-8">
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="number"
                          className="w-24 p-3 bg-white border-2 border-slate-100 rounded-2xl text-center font-black text-slate-900 text-sm outline-none focus:border-blue-500 focus:ring-4 ring-blue-500/10 shadow-sm transition-all"
                          value={entry.days_worked}
                          onChange={(e) =>
                            updateEntry(idx, "days_worked", e.target.value)
                          }
                        />
                        <span className="text-[8px] font-black text-slate-400 uppercase">
                          Days
                        </span>
                      </div>
                    </td>

                    {/* Overtime Input */}
                    <td className="p-8">
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="w-20 p-3 bg-slate-50 border-2 border-transparent rounded-2xl text-center font-black text-blue-600 text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
                          value={entry.overtime_hours}
                          onChange={(e) =>
                            updateEntry(idx, "overtime_hours", e.target.value)
                          }
                        />
                        <span className="text-[8px] font-black text-slate-400 uppercase">
                          Hours
                        </span>
                      </div>
                    </td>

                    {/* Late Input */}
                    <td className="p-8">
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          className="w-20 p-3 bg-slate-50 border-2 border-transparent rounded-2xl text-center font-black text-red-500 text-sm outline-none focus:bg-white focus:border-red-500 transition-all"
                          value={entry.late_minutes}
                          onChange={(e) =>
                            updateEntry(idx, "late_minutes", e.target.value)
                          }
                        />
                        <span className="text-[8px] font-black text-slate-400 uppercase">
                          Minutes
                        </span>
                      </div>
                    </td>

                    {/* Net Pay */}
                    <td className="p-8 text-right">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1">
                        Total Payout
                      </div>
                      <div className="font-black text-xl text-slate-900 tracking-tighter italic">
                        <span className="text-blue-500 mr-1 not-italic">₱</span>
                        {parseFloat(entry.net_pay).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer Summary (Optional) */}
            <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex justify-end items-center gap-6">
              <div className="text-[10px] font-black text-slate-400 uppercase">
                Grand Total:
              </div>
              <div className="text-2xl font-black text-slate-900 italic">
                ₱{" "}
                {payrollEntries
                  .reduce((acc, curr) => acc + parseFloat(curr.net_pay), 0)
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
