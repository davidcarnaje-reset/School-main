import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import {
  Search,
  FileText,
  CheckCircle2,
  Printer,
  X,
  Banknote,
  User,
  Receipt,
  CreditCard,
  Layers,
  Calendar,
  Clock,
  AlertCircle,
  Filter,
  ArrowRight,
  ChevronRight,
  Plus,
  Check,
  Sparkles,
  ShieldAlert,
  FileCheck,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  GraduationCap,
  Baby,
  BookOpen,
  School,
  Building2,
  DollarSign
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SectionHeader } from "../../components/cashier/CashierComponents";

const EDUCATION_LEVELS = [
  { id: "ALL", label: "All Levels", icon: Layers },
  { id: "Preschool", label: "Preschool", icon: Baby },
  { id: "Elementary", label: "Elementary", icon: School },
  { id: "HS", label: "High School (JHS)", icon: BookOpen },
  { id: "SHS", label: "Senior High (SHS)", icon: GraduationCap },
  { id: "College", label: "College", icon: Building2 },
];

const PaymentDashboard = () => {
  const { branding, API_BASE_URL, user } = useAuth();

  // Navigation Tabs: 'payments' | 'services' | 'promissory'
  const [activeTab, setActiveTab] = useState("payments");
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [limit, setLimit] = useState(10);

  // Student queue state
  const [students, setStudents] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  // Active / Selected student for checkout
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);

  // Payment checkout states
  const [allocations, setAllocations] = useState({});
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [amountTendered, setAmountTendered] = useState("");
  const [markAsEnrolled, setMarkAsEnrolled] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Receipt Modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Promissory Notes Tab State
  const [promissoryNotes, setPromissoryNotes] = useState([]);
  const [pnLoading, setPnLoading] = useState(false);
  const [isPnModalOpen, setIsPnModalOpen] = useState(false);
  const [pnForm, setPnForm] = useState({
    student_id: "",
    total_balance: "",
    promised_amount: "",
    due_date: "",
    reason: "Educational Financial Hardship",
    notes: "",
    allow_enrollment: true
  });
  const [pnSaving, setPnSaving] = useState(false);

  // 1. Fetch Students Queue (Enrollment Payments / Billing)
  const fetchStudents = async () => {
    setListLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cashier/get_process_payment_students.php`, {
        params: {
          level: selectedLevel,
          search: searchQuery,
          limit: limit,
          tab: activeTab === 'services' ? 'services' : (activeTab === 'promissory' ? 'arrears' : 'all')
        }
      });
      if (res.data.status === "success") {
        setStudents(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setListLoading(false);
    }
  };

  // 2. Fetch Promissory Notes
  const fetchPromissoryNotes = async () => {
    setPnLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cashier/get_promissory_notes.php`, {
        params: {
          search: searchQuery,
          limit: limit
        }
      });
      if (res.data.status === "success") {
        setPromissoryNotes(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load promissory notes:", err);
    } finally {
      setPnLoading(false);
    }
  };

  // Debounced Search Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      if (activeTab === "promissory") {
        fetchPromissoryNotes();
      } else {
        fetchStudents();
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, selectedLevel, limit, activeTab]);

  // Load selected student details
  const loadStudentDetails = async (studentId) => {
    if (!studentId) return;
    setDetailsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cashier/get_student_payable_details.php`, {
        params: { id: studentId }
      });
      if (res.data.status === "success") {
        setStudentDetails(res.data);
        setSelectedStudent(res.data.student);

        // Pre-fill full allocations for convenience
        const initialAllocations = {};
        if (Array.isArray(res.data.billing_items)) {
          res.data.billing_items.forEach(item => {
            if (item.balance_remaining > 0) {
              initialAllocations[item.id] = item.balance_remaining;
            }
          });
        }
        setAllocations(initialAllocations);

        // Select all pending service requests by default
        if (Array.isArray(res.data.service_requests)) {
          setSelectedServiceIds(res.data.service_requests.map(sr => sr.id));
        } else {
          setSelectedServiceIds([]);
        }

        // Auto check enrollment if assessed
        setMarkAsEnrolled(res.data.student.enrollment_status === 'Assessed');
      } else {
        alert(res.data.message || "Student details not found.");
      }
    } catch (err) {
      console.error("Load student details error:", err);
      alert("Failed to load student details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  // Allocation changes
  const handleAllocationChange = (itemId, val, max) => {
    const numeric = Math.min(Math.max(0, parseFloat(val) || 0), max);
    setAllocations(prev => ({
      ...prev,
      [itemId]: numeric
    }));
  };

  const handlePayFull = (itemId, max) => {
    setAllocations(prev => ({
      ...prev,
      [itemId]: max
    }));
  };

  const toggleServiceSelect = (id) => {
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Total Calculation
  const totalBillingAllocated = useMemo(() => {
    return Object.values(allocations).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  }, [allocations]);

  const totalServicesSelected = useMemo(() => {
    if (!studentDetails?.service_requests) return 0;
    return studentDetails.service_requests
      .filter(sr => selectedServiceIds.includes(sr.id))
      .reduce((sum, sr) => sum + (parseFloat(sr.amount) || 0), 0);
  }, [studentDetails, selectedServiceIds]);

  const grandTotal = totalBillingAllocated + totalServicesSelected;

  // Process Unified Payment
  const handleProcessPayment = async () => {
    if (grandTotal <= 0) {
      alert("Please allocate or select an amount to pay.");
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        student_id: selectedStudent.student_id,
        allocations: allocations,
        service_request_ids: selectedServiceIds,
        payment_method: paymentMethod,
        reference_no: referenceNo,
        amount_tendered: parseFloat(amountTendered) || grandTotal,
        mark_as_enrolled: markAsEnrolled,
        cashier_name: user?.full_name || 'Cashier Officer'
      };

      const res = await axios.post(`${API_BASE_URL}/cashier/process_unified_payment.php`, payload);
      if (res.data.status === "success") {
        setReceiptData(res.data.receipt);
        setShowReceiptModal(true);
        // Refresh queue & details
        fetchStudents();
        loadStudentDetails(selectedStudent.student_id);
      } else {
        alert(res.data.message || "Payment failed.");
      }
    } catch (err) {
      console.error("Payment processing error:", err);
      alert("System error while processing payment.");
    } finally {
      setProcessing(false);
    }
  };

  // Save Promissory Note
  const handleSavePn = async (e) => {
    e.preventDefault();
    if (!pnForm.student_id || !pnForm.promised_amount || !pnForm.due_date) {
      alert("Please fill in required fields.");
      return;
    }

    setPnSaving(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/cashier/save_promissory_note.php`, {
        ...pnForm,
        processed_by: user?.full_name || 'Cashier Officer'
      });
      if (res.data.status === "success") {
        alert("Promissory Note successfully recorded!");
        setIsPnModalOpen(false);
        setPnForm({
          student_id: "",
          total_balance: "",
          promised_amount: "",
          due_date: "",
          reason: "Educational Financial Hardship",
          notes: "",
          allow_enrollment: true
        });
        fetchPromissoryNotes();
        fetchStudents();
      } else {
        alert(res.data.message || "Error saving promissory note.");
      }
    } catch (err) {
      console.error("Promissory note error:", err);
      alert("System error while saving promissory note.");
    } finally {
      setPnSaving(false);
    }
  };

  // Settle Promissory Note
  const handleSettlePn = async (noteId) => {
    if (!confirm("Are you sure you want to mark this promissory note as Settled?")) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/cashier/settle_promissory_note.php`, {
        note_id: noteId,
        remarks: "Settled via Cashier Portal"
      });
      if (res.data.status === "success") {
        fetchPromissoryNotes();
      }
    } catch (err) {
      alert("Failed to settle note.");
    }
  };

  // Official Receipt Print Function
  const handlePrintReceipt = (receipt) => {
    const printWindow = window.open("", "_blank", "width=800,height=900");
    const r = receipt || receiptData;
    if (!r) return;

    const itemsHtml = (r.items || [])
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; font-weight: 700; color: #334155; text-transform: uppercase;">${item.item_name}</td>
          <td style="padding: 10px 0; text-align: center; color: #64748b; font-size: 11px;">${item.category || 'Tuition'}</td>
          <td style="padding: 10px 0; font-weight: 800; text-align: right; color: #0f172a;">₱${parseFloat(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Receipt - ${r.or_number}</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; padding: 40px; font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e293b; }
            .receipt-box { max-width: 650px; margin: 0 auto; border: 2px solid #e2e8f0; border-radius: 20px; padding: 35px; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 25px; }
            .school-name { font-size: 22px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin: 0; }
            .sub { font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; font-size: 12px; }
            .info-item { background: #f8fafc; padding: 10px 14px; border-radius: 12px; border: 1px solid #f1f5f9; }
            .info-label { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 3px; }
            .info-val { font-size: 13px; font-weight: 900; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            th { text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
            .total-card { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px 20px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .total-title { font-size: 12px; font-weight: 900; text-transform: uppercase; color: #166534; }
            .total-val { font-size: 24px; font-weight: 900; color: #15803d; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; font-weight: 600; line-height: 1.6; border-top: 1px dashed #e2e8f0; padding-top: 20px; }
            .sign-row { display: flex; justify-content: space-between; margin-top: 40px; margin-bottom: 30px; }
            .sign-line { width: 180px; border-top: 1px solid #64748b; text-align: center; font-size: 10px; font-weight: 700; color: #475569; padding-top: 5px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <h1 class="school-name">${branding?.school_name || "School Academy"}</h1>
              <div class="sub">Official Payment Receipt</div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Receipt Number</div>
                <div class="info-val" style="color: #2563eb;">${r.or_number}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date & Time</div>
                <div class="info-val">${r.date}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Student ID</div>
                <div class="info-val">${selectedStudent?.student_id || r.student_id}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Student Name</div>
                <div class="info-val">${selectedStudent?.full_name || "Student"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Payment Method</div>
                <div class="info-val">${r.payment_method} ${r.reference_no ? `(${r.reference_no})` : ''}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Cashier Officer</div>
                <div class="info-val">${r.cashier || "Cashier"}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: center;">Category</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="total-card">
              <span class="total-title">Total Amount Paid</span>
              <span class="total-val">₱${parseFloat(r.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 25px; padding: 0 10px;">
              <span>Amount Tendered: ₱${parseFloat(r.amount_tendered || r.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span>Change: ₱${parseFloat(r.change_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <div class="sign-row">
              <div class="sign-line">Student / Payor</div>
              <div class="sign-line">Cashier Signature</div>
            </div>

            <div class="footer">
              This serves as an official electronic school receipt.<br>
              Thank you for your payment!
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
      {/* 1. HEADER & TOP TABS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight italic uppercase">
            Process Payment
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5">
            Enrollments, Billing & Arrears Management
          </p>
        </div>

        {/* TOP TAB SWITCHER */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200">
          <button
            onClick={() => { setActiveTab("payments"); setSelectedStudent(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "payments"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <CreditCard size={15} />
            <span>Enrollment & Billing</span>
          </button>

          <button
            onClick={() => { setActiveTab("services"); setSelectedStudent(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "services"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Receipt size={15} />
            <span>Service Requests</span>
          </button>

          <button
            onClick={() => { setActiveTab("promissory"); setSelectedStudent(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "promissory"
                ? "bg-white text-amber-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileText size={15} />
            <span>Arrears & Promissory</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER STRIP: EDUCATION LEVELS (Preschool, Elementary, HS, SHS, College) */}
      <div className="bg-white p-3 md:p-4 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0">
          {EDUCATION_LEVELS.map((lvl) => {
            const Icon = lvl.icon;
            const isSelected = selectedLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 scale-[1.02]"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
                }`}
              >
                <Icon size={14} />
                <span>{lvl.label}</span>
              </button>
            );
          })}
        </div>

        {/* SEARCH & DISPLAY LIMIT SELECTOR */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search Student Name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-100 rounded-full font-bold text-xs text-slate-700 outline-none focus:border-indigo-500 transition-colors"
            />
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs font-black text-slate-600 shrink-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest hidden sm:inline">Show:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border-2 border-slate-100 rounded-full font-black text-xs text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>

          {activeTab === "promissory" && (
            <button
              onClick={() => setIsPnModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-black text-xs uppercase tracking-wider shadow-md transition-all shrink-0"
            >
              <Plus size={15} />
              <span>New Note</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE GRID */}
      {activeTab === "promissory" ? (
        /* PROMISSORY NOTES VIEW */
        <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm p-6 space-y-4">
          <SectionHeader
            title="Arrears & Promissory Note Agreements"
            icon={FileText}
            action={
              <button
                onClick={fetchPromissoryNotes}
                className="p-2 text-slate-400 hover:text-indigo-600 rounded-full"
                title="Refresh"
              >
                <RefreshCw size={15} className={pnLoading ? "animate-spin" : ""} />
              </button>
            }
          />

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black uppercase text-slate-400 border-b-2 border-slate-50">
                  <th className="pb-3 text-left px-4">Student</th>
                  <th className="pb-3 text-left px-4">Grade / Program</th>
                  <th className="pb-3 text-right px-4">Total Balance</th>
                  <th className="pb-3 text-right px-4">Promised Amount</th>
                  <th className="pb-3 text-center px-4">Due Date</th>
                  <th className="pb-3 text-left px-4">Reason / Notes</th>
                  <th className="pb-3 text-center px-4">Status</th>
                  <th className="pb-3 text-center px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pnLoading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400 font-bold text-xs">
                      Loading promissory notes...
                    </td>
                  </tr>
                ) : promissoryNotes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400 font-bold text-xs">
                      No promissory note records found.
                    </td>
                  </tr>
                ) : (
                  promissoryNotes.map((pn) => (
                    <tr key={pn.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-800 text-xs">
                          {pn.first_name} {pn.last_name}
                        </div>
                        <div className="text-[10px] font-bold text-indigo-500 tracking-wider">
                          {pn.student_id}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-xs text-slate-600">
                        {pn.grade_level || pn.program_code || "Active Student"}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-xs text-rose-600">
                        ₱{pn.total_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-xs text-emerald-600">
                        ₱{pn.promised_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-xs text-slate-700">
                        {pn.due_date_formatted}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {pn.reason} {pn.notes ? `(${pn.notes})` : ""}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          pn.status === 'Active'
                            ? "bg-amber-50 text-amber-600 border border-amber-200"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        }`}>
                          {pn.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {pn.status === 'Active' && (
                            <button
                              onClick={() => handleSettlePn(pn.id)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              Settle
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedStudent({ student_id: pn.student_id, full_name: `${pn.first_name} ${pn.last_name}` });
                              loadStudentDetails(pn.student_id);
                              setActiveTab("payments");
                            }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            Pay
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* UNIFIED ENROLLMENT & BILLING WORKSPACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: STUDENT QUEUE LIST */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Students Queue ({students.length})
              </span>
              <button
                onClick={fetchStudents}
                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-full"
                title="Refresh Queue"
              >
                <RefreshCw size={14} className={listLoading ? "animate-spin" : ""} />
              </button>
            </div>

            {listLoading ? (
              <div className="py-20 text-center text-slate-400 font-bold text-xs bg-white rounded-[2rem] border border-slate-100">
                Loading students queue...
              </div>
            ) : students.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-bold text-xs bg-white rounded-[2rem] border-2 border-dashed border-slate-100 p-6">
                No students found matching current level or search query.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[700px] overflow-y-auto no-scrollbar pr-1">
                {students.map((st) => {
                  const isSelected = selectedStudent?.student_id === st.student_id;
                  const isAssessed = st.enrollment_status === 'Assessed';

                  return (
                    <div
                      key={st.student_id}
                      onClick={() => loadStudentDetails(st.student_id)}
                      className={`p-4 rounded-[1.8rem] border-2 transition-all cursor-pointer group flex items-center justify-between ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50 shadow-md scale-[1.01]"
                          : "border-slate-100 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                            : isAssessed
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          <User size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-800 text-sm truncate uppercase group-hover:text-indigo-600 transition-colors">
                              {st.first_name} {st.last_name}
                            </h4>
                            {isAssessed && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-wider shrink-0">
                                Assessed
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-indigo-500 tracking-wider">
                              {st.student_id}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] font-bold text-slate-500 truncate">
                              {st.grade_level || st.program_code || "Active"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3">
                        <p className="text-xs font-black text-slate-800">
                          ₱{st.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                        <span className={`inline-block mt-0.5 text-[8px] font-black uppercase tracking-wider ${
                          st.balance > 0 ? "text-rose-500" : "text-emerald-500"
                        }`}>
                          {st.payment_status || "Unpaid"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: CHECKOUT & PAYMENT DETAILS */}
          <div className="lg:col-span-7">
            {!selectedStudent ? (
              <div className="h-full min-h-[450px] flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 text-center">
                <CreditCard size={44} className="text-slate-300 mb-3" />
                <h3 className="text-lg font-black text-slate-700 uppercase italic">
                  Select a Student from the Queue
                </h3>
                <p className="text-xs text-slate-400 font-bold max-w-sm mt-1">
                  Click on any student on the left or search by student ID to view billable items, process enrollment tuition payments, or generate receipts.
                </p>
              </div>
            ) : detailsLoading ? (
              <div className="h-full min-h-[450px] flex items-center justify-center bg-white rounded-[2.5rem] border border-slate-100">
                <div className="text-center space-y-2">
                  <RefreshCw size={24} className="animate-spin text-indigo-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-400">Loading student assessment details...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm p-6 space-y-6">
                {/* STUDENT SUMMARY BANNER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[2rem] bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-13 h-13 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-lg shadow-indigo-100">
                      {selectedStudent.first_name?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-800 uppercase italic leading-none">
                          {selectedStudent.full_name}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          selectedStudent.enrollment_status === 'Assessed'
                            ? "bg-emerald-100 text-emerald-700"
                            : selectedStudent.enrollment_status === 'Enrolled'
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-200 text-slate-700"
                        }`}>
                          {selectedStudent.enrollment_status}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 mt-1">
                        ID: <span className="text-indigo-600 font-black">{selectedStudent.student_id}</span> • {selectedStudent.grade_level} ({selectedStudent.detected_level})
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:pl-5 border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining Balance</p>
                    <p className="text-xl font-black text-rose-600">
                      ₱{(studentDetails?.billing?.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* 1. BILLING / ENROLLMENT ITEMS */}
                {studentDetails?.billing_items && studentDetails.billing_items.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <DollarSign size={14} className="text-indigo-600" />
                        Enrollment / Assessment Breakdown
                      </span>
                      <button
                        onClick={() => {
                          const full = {};
                          studentDetails.billing_items.forEach(i => {
                            full[i.id] = i.balance_remaining;
                          });
                          setAllocations(full);
                        }}
                        className="text-[10px] font-black uppercase text-indigo-600 hover:underline"
                      >
                        Select All Remaining
                      </button>
                    </div>

                    <div className="space-y-2">
                      {studentDetails.billing_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100"
                        >
                          <div className="min-w-0 pr-3">
                            <h5 className="font-black text-slate-800 text-xs uppercase truncate">
                              {item.item_name}
                            </h5>
                            <span className="text-[10px] font-bold text-slate-400">
                              Total: ₱{item.amount.toLocaleString()} • Paid: ₱{item.paid_amount.toLocaleString()} • Bal: <span className="text-rose-500 font-black">₱{item.balance_remaining.toLocaleString()}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handlePayFull(item.id, item.balance_remaining)}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                            >
                              Full
                            </button>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₱</span>
                              <input
                                type="number"
                                min="0"
                                max={item.balance_remaining}
                                value={allocations[item.id] !== undefined ? allocations[item.id] : ""}
                                onChange={(e) => handleAllocationChange(item.id, e.target.value, item.balance_remaining)}
                                placeholder="0.00"
                                className="w-28 pl-6 pr-2 py-1.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-black text-right text-slate-800 outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. PENDING SERVICE REQUESTS (IF ANY) */}
                {studentDetails?.service_requests && studentDetails.service_requests.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Receipt size={14} className="text-indigo-600" />
                      Document & Service Requests
                    </span>

                    <div className="space-y-2">
                      {studentDetails.service_requests.map((sr) => (
                        <div
                          key={sr.id}
                          onClick={() => toggleServiceSelect(sr.id)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                            selectedServiceIds.includes(sr.id)
                              ? "bg-indigo-50/60 border-indigo-500"
                              : "bg-slate-50/70 border-slate-100 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                              selectedServiceIds.includes(sr.id) ? "bg-indigo-600 text-white" : "border-2 border-slate-300"
                            }`}>
                              {selectedServiceIds.includes(sr.id) && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className="font-black text-slate-800 text-xs uppercase">
                              {sr.item_name}
                            </span>
                          </div>
                          <span className="font-black text-xs text-indigo-600">
                            ₱{sr.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. CHECKOUT CONTROLS & PAYMENT METHOD */}
                <div className="p-5 rounded-[2rem] bg-slate-900 text-white space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Payable Amount</p>
                      <h2 className="text-3xl font-black italic text-emerald-400">
                        ₱{grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </h2>
                    </div>

                    {/* PAYMENT METHOD SELECTOR */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-xl">
                      {["Cash", "GCash", "Card", "Bank"].map((m) => (
                        <button
                          key={m}
                          onClick={() => setPaymentMethod(m)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            paymentMethod === m
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMethod !== "Cash" && (
                    <div className="pt-2">
                      <input
                        type="text"
                        placeholder="Reference / Transaction Number (Optional)..."
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* AMOUNT TENDERED & CHANGE */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                        Amount Tendered (₱)
                      </label>
                      <input
                        type="number"
                        placeholder={grandTotal.toString()}
                        value={amountTendered}
                        onChange={(e) => setAmountTendered(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-black text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                        Change (Sukli)
                      </label>
                      <div className="px-3 py-2 bg-slate-800/60 rounded-xl text-sm font-black text-emerald-400 border border-slate-800">
                        ₱{Math.max(0, (parseFloat(amountTendered) || grandTotal) - grandTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* ENROLLMENT CONFIRMATION CHECKBOX */}
                  {selectedStudent.enrollment_status === 'Assessed' && (
                    <label className="flex items-center gap-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={markAsEnrolled}
                        onChange={(e) => setMarkAsEnrolled(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
                      />
                      <span className="text-xs font-bold text-slate-300">
                        Mark student as officially <strong className="text-emerald-400 font-black">ENROLLED</strong> upon payment confirmation
                      </span>
                    </label>
                  )}

                  {/* ACTION BUTTONS */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleProcessPayment}
                      disabled={processing || grandTotal <= 0}
                      className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Confirm Payment & Print Receipt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. RECEIPT MODAL */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 space-y-6">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                <CheckCircle2 size={30} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic">
                Payment Success!
              </h3>
              <p className="text-xs font-bold text-slate-400">
                Official Receipt #{receiptData.or_number}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Student:</span>
                <span className="font-black text-slate-800">{selectedStudent?.full_name} ({selectedStudent?.student_id})</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Total Paid:</span>
                <span className="font-black text-emerald-600 text-sm">₱{parseFloat(receiptData.amount_paid).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Method:</span>
                <span className="font-black text-slate-800">{receiptData.payment_method}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePrintReceipt(receiptData)}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Printer size={16} />
                <span>Print Official Receipt</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. NEW PROMISSORY NOTE MODAL */}
      {isPnModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500 text-white rounded-xl">
                  <FileText size={18} />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase italic">
                  New Promissory Note
                </h3>
              </div>
              <button
                onClick={() => setIsPnModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePn} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">
                  Student ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. K12-2026-0002"
                  value={pnForm.student_id}
                  onChange={(e) => {
                    const id = e.target.value;
                    setPnForm(prev => ({ ...prev, student_id: id }));
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">
                    Current Balance (₱)
                  </label>
                  <input
                    type="number"
                    placeholder="30000"
                    value={pnForm.total_balance}
                    onChange={(e) => setPnForm(prev => ({ ...prev, total_balance: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">
                    Promised Amount (₱) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="5000"
                    value={pnForm.promised_amount}
                    onChange={(e) => setPnForm(prev => ({ ...prev, promised_amount: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">
                  Promised Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={pnForm.due_date}
                  onChange={(e) => setPnForm(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 block">
                  Reason for Promissory Note
                </label>
                <input
                  type="text"
                  value={pnForm.reason}
                  onChange={(e) => setPnForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <label className="flex items-center gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={pnForm.allow_enrollment}
                  onChange={(e) => setPnForm(prev => ({ ...prev, allow_enrollment: e.target.checked }))}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-0"
                />
                <span className="text-xs font-bold text-amber-900">
                  Allow student to officially enroll with this Promissory Note
                </span>
              </label>

              <button
                type="submit"
                disabled={pnSaving}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md mt-2"
              >
                {pnSaving ? "Saving..." : "Save Promissory Note"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDashboard;
