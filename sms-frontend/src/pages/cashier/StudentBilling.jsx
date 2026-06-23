import React, { useState } from "react";
import axios from "axios";
import {
  Search,
  Wallet,
  User,
  Printer,
  CheckCircle2,
  Banknote,
  Receipt,
  Award,
  History,
  TrendingUp,
  CreditCard,
  X,
  Info,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  StatCard,
  SectionHeader,
} from "../../components/cashier/CashierComponents"; // Import natin yung reusable components

const StudentBilling = () => {
  const { API_BASE_URL } = useAuth();
  const [searchId, setSearchId] = useState("");
  const [billingData, setBillingData] = useState(null);
  const [allocations, setAllocations] = useState({});
  const [loading, setLoading] = useState(false);

  const [availableScholarships, setAvailableScholarships] = useState([]);
  const [selectedSch, setSelectedSch] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState(null);
  const [markAsEnrolled, setMarkAsEnrolled] = useState(true);

  const [selectedGrant, setSelectedGrant] = useState(null); // Para sa modal data
  const [processing, setProcessing] = useState(false); // Loading state ng modal button

  // --- LOGIC FUNCTIONS (Retained from your code) ---
  const handleSearch = async () => {
    if (!searchId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/cashier/get_billing_details.php?id=${searchId}`,
      );
      if (res.data.status === "success") {
        setBillingData(res.data);
        const schRes = await axios.get(
          `${API_BASE_URL}/cashier/get_student_scholarships.php?id=${searchId}`,
        );
        setAvailableScholarships(
          schRes.data.status === "success" ? schRes.data.data : [],
        );
        setAllocations({});
      } else {
        alert(res.data.message);
        setBillingData(null);
      }
    } catch (err) {
      alert("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAllocationChange = (itemId, value, max) => {
    const amount = Math.min(parseFloat(value) || 0, max);
    setAllocations((prev) => ({ ...prev, [itemId]: amount }));
  };

  const handlePayFull = (itemId, max) => {
    setAllocations((prev) => ({ ...prev, [itemId]: max }));
  };

  const totalToPost = Object.values(allocations).reduce(
    (sum, val) => sum + val,
    0,
  );

  const handlePostPayment = async () => {
    if (!billingData || !billingData.summary) return;
    setLoading(true);
    try {
      const payload = {
        student_id: billingData.summary.student_id,
        allocations: allocations,
        scholarship_id: selectedSch?.id || null,
        mark_as_enrolled: markAsEnrolled,
      };
      const res = await axios.post(
        `${API_BASE_URL}/cashier/process_billing_payment.php`,
        payload,
      );
      if (res.data.status === "success") {
        setReceiptInfo(
          res.data.receipt || { type: "Payment", total: totalToPost },
        );
        setShowConfirm(false);
        setShowSuccess(true);
        setAllocations({});
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("System error.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalApply = async () => {
    if (!selectedGrant) return;
    setProcessing(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/cashier/apply_scholarship_to_billing.php`,
        {
          application_id: selectedGrant.id,
          student_id: billingData.summary.student_id, // Siguraduhing galing ito sa summary
          discount_value: selectedGrant.value,
          discount_type: selectedGrant.discount_type,
          scholarship_name: selectedGrant.scholarship_name,
        },
      );

      if (res.data.status === "success") {
        setReceiptInfo(res.data);
        setShowSuccess(true);
        // fetchGrants(); // Kung may fetchGrants function ka rin dito para sa sidebar
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("System error. Please contact admin.");
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    const printContent = document.getElementById("printable-receipt");
    const windowUrl = "about:blank";
    const uniqueName = new Date();
    const windowName = "Print" + uniqueName.getTime();
    const printWindow = window.open(
      windowUrl,
      windowName,
      "left=50000,top=50000,width=0,height=0",
    );

    printWindow.document.write(`
      <html>
        <head>
          <title>Official Receipt - ${billingData?.summary?.student_id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              @page { margin: 0.5in; }
              body { font-family: sans-serif; }
            }
          </style>
        </head>
        <body onload="window.print();window.close()">
          <div class="p-8 max-w-[400px] mx-auto border-2 border-slate-100">
            <div class="text-center mb-6">
              <h1 class="text-xl font-black uppercase italic tracking-tighter">School Management System</h1>
              <p class="text-[10px] font-bold text-slate-500">OFFICIAL PAYMENT RECEIPT</p>
            </div>
            
            <div class="space-y-2 mb-6 border-y-2 border-dashed border-slate-200 py-4">
              <div class="flex justify-between text-xs">
                <span class="font-bold text-slate-400">STUDENT:</span>
                <span class="font-black uppercase">${billingData?.summary?.first_name} ${billingData?.summary?.last_name}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="font-bold text-slate-400">ID NO:</span>
                <span class="font-black">${billingData?.summary?.student_id}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="font-bold text-slate-400">DATE:</span>
                <span class="font-black">${new Date().toLocaleString()}</span>
              </div>
            </div>

            <div class="space-y-3 mb-6">
              ${Object.entries(allocations)
                .map(([id, amount]) => {
                  const item = billingData.items.find(
                    (i) => i.id.toString() === id.toString(),
                  );
                  if (amount <= 0) return "";
                  return `
                  <div class="flex justify-between text-xs">
                    <span class="font-bold uppercase text-slate-600">${item?.item_name || "Fee"}</span>
                    <span class="font-black">₱${parseFloat(amount).toLocaleString()}</span>
                  </div>
                `;
                })
                .join("")}
            </div>

            <div class="bg-slate-50 p-4 rounded-xl flex justify-between items-center">
              <span class="text-xs font-black uppercase italic">Total Paid:</span>
              <span class="text-lg font-black italic text-indigo-600">₱${totalToPost.toLocaleString()}</span>
            </div>

            <div class="mt-8 text-center">
              <p class="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Thank you for your payment!</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* 1. HEADER & PREMIUM SEARCH */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">
            Assessments
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
            Manage Billing & Grants
          </p>
        </div>

        <div className="relative group">
          <input
            type="text"
            placeholder="Search Student ID (e.g. 2024-0001)"
            className="w-full md:w-[400px] pl-14 pr-4 py-4 bg-white border-2 border-slate-100 rounded-[2rem] font-bold text-xs shadow-sm outline-none focus:border-indigo-500 transition-all group-hover:border-slate-300"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
            size={20}
          />
          <button
            onClick={handleSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase hover:bg-slate-900 transition-all shadow-md"
          >
            {loading ? "..." : "Find"}
          </button>
        </div>
      </div>

      {!billingData && !loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white/50 border-4 border-dashed border-slate-100 rounded-[4rem]">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-6 text-slate-200">
            <User size={48} />
          </div>
          <h3 className="text-xl font-black text-slate-300 uppercase italic tracking-tighter">
            Enter Student ID to Start
          </h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 italic">
            Ready for Assessment & Payment
          </p>
        </div>
      ) : (
        billingData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT: MAIN BILLING AREA */}
            <div className="lg:col-span-8 space-y-6">
              {/* Student Pill Card */}
              <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-inner">
                    <User size={32} />
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl font-black text-slate-800 uppercase italic leading-none">
                      {billingData.summary.first_name}{" "}
                      {billingData.summary.last_name}
                    </h2>
                    <p className="text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em] mt-1">
                      {billingData.summary.student_id} •{" "}
                      {billingData.summary.year_level || "Active"}
                    </p>
                  </div>
                </div>
                <div className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 font-black text-[10px] uppercase tracking-widest">
                  Account Active
                </div>
              </div>

              {/* Fees Table Card */}
              <div className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-sm overflow-hidden p-8">
                <SectionHeader title="Account Breakdown" icon={Receipt} />
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[10px] font-black uppercase text-slate-400 border-b-2 border-slate-50">
                        <th className="pb-4 text-left px-2">Fee Item</th>
                        <th className="pb-4 text-right px-2">Balance</th>
                        <th className="pb-4 text-center px-2">Input Payment</th>
                        <th className="pb-4 text-right px-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {/* I-filter muna natin ang items na may balance pa */}
                      {billingData.items.filter(
                        (item) =>
                          parseFloat(item.amount) -
                            parseFloat(item.paid_amount) >
                          0,
                      ).length > 0 ? (
                        billingData.items.map((item) => {
                          const balance =
                            parseFloat(item.amount) -
                            parseFloat(item.paid_amount);
                          if (balance <= 0) return null;
                          return (
                            <tr
                              key={item.id}
                              className="group hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="py-5 px-2">
                                <p className="text-xs font-black text-slate-700 uppercase">
                                  {item.item_name}
                                </p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase italic">
                                  Billing Item
                                </p>
                              </td>
                              <td className="py-5 px-2 text-right">
                                <span className="text-xs font-black text-slate-800 italic">
                                  ₱{balance.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-5 px-2 text-center">
                                <input
                                  type="number"
                                  value={allocations[item.id] || ""}
                                  onChange={(e) =>
                                    handleAllocationChange(
                                      item.id,
                                      e.target.value,
                                      balance,
                                    )
                                  }
                                  placeholder="0.00"
                                  className="w-28 text-center p-2.5 bg-slate-100 border-2 border-transparent rounded-xl font-black text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                />
                              </td>
                              <td className="py-5 px-2 text-right">
                                <button
                                  onClick={() =>
                                    handlePayFull(item.id, balance)
                                  }
                                  className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                                >
                                  Full Pay
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        /* ETO ANG LALABAS KAPAG ZERO BALANCE NA LAHAT */
                        <tr>
                          <td colSpan="4" className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center opacity-40">
                              <CheckCircle2
                                size={40}
                                className="text-emerald-500 mb-3"
                              />
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                Account Fully Settled
                              </p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase italic mt-1">
                                No outstanding balances found for this period.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT: SIDEBAR SUMMARY */}
            <div className="lg:col-span-4 space-y-6">
              {/* Totals Summary */}
              <div className="space-y-4">
                <StatCard
                  title="Total Outstanding"
                  value={`₱${parseFloat(billingData.summary.balance).toLocaleString()}`}
                  icon={Wallet}
                  colorClass="bg-slate-900"
                />
                <StatCard
                  title="Current Allocation"
                  value={`₱${totalToPost.toLocaleString()}`}
                  icon={TrendingUp}
                  colorClass="bg-emerald-600"
                />
              </div>

              {/* Final Action Card */}
              <div className="bg-white p-8 rounded-[3rem] border-4 border-slate-900 shadow-xl text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Ready to Process
                </p>
                <h3 className="text-3xl font-black text-slate-800 italic mb-6 leading-none">
                  ₱{totalToPost.toLocaleString()}
                </h3>
                <button
                  disabled={totalToPost <= 0}
                  onClick={() => setShowConfirm(true)}
                  className={`w-full py-5 rounded-[2rem] font-black uppercase text-[11px] shadow-lg transition-all ${
                    totalToPost > 0
                      ? "bg-indigo-600 text-white hover:bg-black scale-105"
                      : "bg-slate-100 text-slate-300 cursor-not-allowed"
                  }`}
                >
                  Post Transaction
                </button>
              </div>

              {/* Grants Sidebar */}
              <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border-2 border-indigo-100">
                <div className="flex items-center gap-2 mb-4">
                  <Award size={18} className="text-indigo-600" />
                  <h3 className="text-[11px] font-black text-indigo-900 uppercase italic">
                    Available Grants
                  </h3>
                </div>
                <div className="space-y-3">
                  {availableScholarships.map((sch, i) => (
                    <div
                      key={i}
                      className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <Award size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-800 uppercase leading-tight">
                            {sch.scholarship_name}
                          </p>
                          <p className="text-[9px] font-bold text-indigo-600 italic mt-1">
                            Grant: ₱{Number(sch.value).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedGrant(sch)} // Dito lalabas yung modal
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* MODALS (Simplified for brevity - logic remains the same) */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-md p-10 animate-in zoom-in duration-300 shadow-2xl border-b-[12px] border-indigo-600 text-left">
            <h2 className="text-2xl font-black text-slate-800 uppercase italic mb-6">
              Payment Breakdown
            </h2>

            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 mb-6 max-h-[300px] overflow-y-auto">
              <div className="space-y-4">
                {Object.entries(allocations).map(([id, amount]) => {
                  const item = billingData.items.find(
                    (i) => i.id.toString() === id.toString(),
                  );
                  if (amount <= 0) return null;
                  return (
                    <div
                      key={id}
                      className="flex justify-between items-center border-b border-slate-200 pb-2"
                    >
                      <div>
                        <p className="text-[10px] font-black text-slate-800 uppercase">
                          {item?.item_name}
                        </p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase italic">
                          Fee Contribution
                        </p>
                      </div>
                      <span className="text-sm font-black text-slate-900 italic">
                        ₱{parseFloat(amount).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-300 flex justify-between items-center">
                <span className="text-xs font-black text-indigo-600 uppercase italic">
                  Grand Total:
                </span>
                <span className="text-xl font-black text-indigo-600 italic">
                  ₱{totalToPost.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Enrollment Checkbox */}
            <label className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-8 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 accent-emerald-600"
                checked={markAsEnrolled}
                onChange={(e) => setMarkAsEnrolled(e.target.checked)}
              />
              <span className="text-[10px] font-black uppercase text-emerald-800 italic">
                Mark as Officially Enrolled
              </span>
            </label>

            <div className="flex flex-col gap-3">
              <button
                onClick={handlePostPayment}
                className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-[11px] shadow-xl hover:bg-black transition-all"
              >
                Confirm & Proceed
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full py-3 text-[10px] font-black text-slate-400 uppercase"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATED SUCCESS MODAL WITH BETTER PRINT */}
      {showSuccess && (
        <div className="fixed inset-0 bg-indigo-900/60 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[4rem] w-full max-w-sm p-12 text-center shadow-2xl border-t-8 border-emerald-500">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 uppercase italic leading-none">
              Success!
            </h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-3">
              Transaction Recorded
            </p>

            <div className="mt-10 space-y-3">
              <button
                onClick={handlePrintReceipt}
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-[11px] flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-xl"
              >
                <Printer size={18} /> Print Receipt
              </button>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  handleSearch();
                }}
                className="w-full text-slate-400 font-black uppercase text-[10px] tracking-widest pt-4"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedGrant &&
        (() => {
          const itemsList = billingData?.items || [];

          // 2. Hanapin ang Tuition item sa 'itemsList'
          const tuitionItem = itemsList.find((i) =>
            i.item_name?.toLowerCase().includes("tuition"),
          );

          // 3. Compute Tuition Balance (Amount - Paid)
          const tuitionBal = tuitionItem
            ? parseFloat(tuitionItem.amount || 0) -
              parseFloat(tuitionItem.paid_amount || 0)
            : 0;

          // 4. Overall Balance para sa display
          const overallBal = parseFloat(billingData?.summary?.balance || 0);

          // 5. Compute Discount (Tuition base)
          const grantVal = parseFloat(selectedGrant.value || 0);
          const discount =
            selectedGrant.discount_type === "Percentage"
              ? tuitionBal * (grantVal / 100)
              : grantVal;

          const fullName = `${billingData?.summary?.first_name || ""} ${billingData?.summary?.last_name || ""}`;

          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl text-left border-4 border-indigo-50">
                <h2 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                  <Info className="text-indigo-600" /> Preview Deduction
                </h2>

                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase border-b pb-2">
                    <span>Student</span>
                    <span className="text-slate-700 italic">{fullName}</span>
                  </div>

                  {/* TUITION BALANCE (Dito nakabase ang discount) */}
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                    <span>Tuition Balance</span>
                    <span className="text-indigo-600">
                      ₱{tuitionBal.toLocaleString()}
                    </span>
                  </div>

                  {/* OVERALL BALANCE (Para sa info) */}
                  <div className="flex justify-between text-[9px] font-bold text-slate-300 uppercase italic">
                    <span>Overall Student Balance</span>
                    <span>₱{overallBal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-xs font-black text-emerald-600 uppercase italic border-t pt-4">
                    <div className="max-w-[150px]">
                      <span>Less: {selectedGrant.scholarship_name}</span>
                      <p className="text-[8px] opacity-70">
                        {selectedGrant.discount_type === "Percentage"
                          ? `${grantVal}% of Tuition Fee`
                          : "Fixed Amount Grant"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span>- ₱{discount.toLocaleString()}</span>
                      {tuitionBal === 0 &&
                        selectedGrant.discount_type === "Percentage" && (
                          <p className="text-[7px] text-red-400 normal-case font-bold">
                            No tuition balance found!
                          </p>
                        )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button
                    onClick={() => setSelectedGrant(null)}
                    className="py-4 text-[10px] font-black uppercase text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinalApply}
                    disabled={
                      processing ||
                      (tuitionBal === 0 &&
                        selectedGrant.discount_type === "Percentage")
                    }
                    className="bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-black transition-all disabled:bg-slate-200"
                  >
                    {processing ? "Processing..." : "Confirm Apply"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* SUCCESS MODAL / RECEIPT (Kopyang-kopya sa Scholarships Tab) */}
      {showSuccess && receiptInfo && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[600] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-sm p-10 shadow-2xl border-t-8 border-indigo-600">
            <div id="printable-receipt" className="p-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-xl font-black text-slate-800 uppercase italic">
                  Scholarship Posting
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Official Acknowledgment
                </p>
              </div>

              <div className="space-y-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-sm">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                  <span>Old Balance:</span>
                  <span className="text-slate-700">
                    ₱{receiptInfo.old_balance?.toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-300">
                  <p className="text-[9px] font-black text-indigo-500 uppercase mb-2">
                    Applied Deductions:
                  </p>
                  {receiptInfo.applied_items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-[11px] font-bold py-1"
                    >
                      <span className="text-slate-600">{item.item_name}</span>
                      <span className="text-emerald-600">
                        -₱{item.discount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-3 border-t-2 border-slate-300 font-black text-indigo-600 italic">
                  <span>Remaining Balance:</span>
                  <span className="text-lg text-slate-900">
                    ₱{receiptInfo.new_balance?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 text-[8px] text-center text-slate-400 uppercase font-bold">
                Date Processed: {new Date().toLocaleString()}
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={handlePrintReceipt}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100"
              >
                <Printer size={16} /> Print Official Receipt
              </button>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  setSelectedGrant(null);
                  handleSearch(); // Refresh billing data para updated ang balance sa screen
                }}
                className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentBilling;
