import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Award,
  CheckCircle2,
  Printer,
  X,
  Info,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Scholarships = () => {
  const { API_BASE_URL } = useAuth();
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Approved");

  // Modal States
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [targetBilling, setTargetBilling] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchGrants = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/cashier/get_all_approved_scholarships.php`,
      );
      if (res.data.status === "success") {
        setGrants(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrants();
  }, []);

  // Bubukas ang Preview Modal dito
  const handleInitiateApply = async (grant) => {
    setProcessing(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/cashier/get_billing_details.php?id=${grant.student_id}`,
      );
      if (res.data.status === "success") {
        setTargetBilling(res.data);
        setSelectedGrant(grant);
      } else {
        alert("Student has no active billing records.");
      }
    } catch (err) {
      alert("Error fetching billing details.");
    } finally {
      setProcessing(false);
    }
  };

  // Magpapadala ng data sa backend para mag-apply
  const handleFinalApply = async () => {
    if (!selectedGrant) return;
    setProcessing(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/cashier/apply_scholarship_to_billing.php`,
        {
          application_id: selectedGrant.id,
          student_id: selectedGrant.student_id,
          discount_value: selectedGrant.value,
          discount_type: selectedGrant.discount_type,
          scholarship_name: selectedGrant.scholarship_name,
        },
      );

      if (res.data.status === "success") {
        // MAHALAGA: I-set ang receipt info galing sa response ng PHP
        setReceiptInfo(res.data);

        // Huwag muna i-null ang selectedGrant para hindi mag-undefined sa modal
        setShowSuccess(true);
        fetchGrants();
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert(
        "System error. Check if the table 'scholarship_applications' exists.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const filteredGrants = grants.filter((g) => {
    const matchesTab = g.status === activeTab;
    const term = search.toLowerCase();
    const matchesSearch =
      `${g.first_name} ${g.last_name}`.toLowerCase().includes(term) ||
      g.student_id.toLowerCase().includes(term);
    return matchesTab && matchesSearch;
  });

  const handlePrintReceipt = () => {
    const printContent = document.getElementById("printable-receipt");
    const originalContents = document.body.innerHTML;

    // Pansamantalang palitan ang content ng body para sa print view
    document.body.innerHTML = printContent.innerHTML;
    window.print();

    // Ibalik sa dati pagkatapos i-print (o i-reload ang page para safe)
    window.location.reload();
  };

  return (
    <div className="p-6 space-y-6 text-left max-w-7xl mx-auto">
      {/* Header with Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase italic">
            Scholarships
          </h1>
          <div className="flex bg-slate-100 p-1 rounded-xl mt-4 w-fit">
            {["Pending", "Approved", "Rejected", "Applied"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search..."
            className="pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl font-bold text-xs w-64 outline-none focus:border-blue-600 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 text-left">
              <th className="pb-4">Student</th>
              <th className="pb-4">Grant Name</th>
              <th className="pb-4 text-center">Benefit</th>
              <th className="pb-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredGrants.map((grant) => (
              <tr key={grant.id} className="group hover:bg-slate-50/50">
                <td className="py-5">
                  <div className="font-black text-slate-700 text-xs uppercase">
                    {grant.first_name} {grant.last_name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    {grant.student_id}
                  </div>
                </td>
                <td className="py-5 text-xs font-bold text-slate-600 uppercase italic">
                  {grant.scholarship_name}
                </td>
                <td className="py-5 text-center">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">
                    {grant.discount_type === "Percentage"
                      ? `${grant.value}%`
                      : `₱${parseFloat(grant.value).toLocaleString()}`}
                  </span>
                </td>
                <td className="py-5 text-right">
                  {grant.status === "Approved" ? (
                    <button
                      onClick={() => handleInitiateApply(grant)}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-black transition-all"
                    >
                      Apply to Billing
                    </button>
                  ) : (
                    <span className="text-[10px] font-black uppercase text-slate-300 italic">
                      {grant.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PREVIEW MODAL */}
      {selectedGrant &&
        targetBilling &&
        (() => {
          const tuitionItem = targetBilling.items.find((i) =>
            i.item_name.toLowerCase().includes("tuition"),
          );
          const bal = tuitionItem
            ? parseFloat(tuitionItem.amount) -
              parseFloat(tuitionItem.paid_amount)
            : 0;
          const discount =
            selectedGrant.discount_type === "Percentage"
              ? bal * (parseFloat(selectedGrant.value) / 100)
              : parseFloat(selectedGrant.value);

          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl text-left">
                <h2 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                  <Info /> Preview Deduction
                </h2>
                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                    <span>Tuition Balance</span>
                    <span>₱{bal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-emerald-600 uppercase italic border-t pt-4">
                    <span>Less: {selectedGrant.scholarship_name}</span>
                    <span>- ₱{discount.toLocaleString()}</span>
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
                    disabled={processing}
                    className="bg-blue-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-black"
                  >
                    {processing ? "Processing..." : "Confirm Apply"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* SUCCESS MODAL / RECEIPT */}
      {showSuccess && receiptInfo && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[600] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-sm p-10 shadow-2xl">
            {/* ETO YUNG PRINTABLE AREA */}
            <div id="printable-receipt" className="p-4">
              <div className="text-center mb-6">
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
                      <span>{item.item_name}</span>
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

            {/* MGA BUTTONS (Hindi ito masasama sa print dahil sa innerHTML logic natin) */}
            <div className="mt-8 space-y-3">
              <button
                onClick={handlePrintReceipt}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg"
              >
                <Printer size={16} /> Print Official Receipt
              </button>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  setSelectedGrant(null);
                }}
                className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"
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

export default Scholarships;
