import React, { useState } from "react";
import axios from "axios";
import {
  Search,
  FileText,
  CheckCircle,
  Printer,
  X,
  Banknote,
  User,
  Receipt,
  CreditCard,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  StatCard,
  SectionHeader,
} from "../../components/cashier/CashierComponents";

const PaymentDashboard = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [searchId, setSearchId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSearch = async () => {
    if (!searchId) return;
    setLoading(true);
    setData(null); // I-reset ang data para mawala ang lumang display
    try {
      const res = await axios.get(
        `${API_BASE_URL}/cashier/get_service_requests.php?id=${searchId}`,
      );
      if (res.data.status === "success") {
        // Dito natin sisiguraduhin na ang format ay: { student: {...}, items: [...] }
        setData(res.data);
        setSelectedIds([]);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error("Search Error:", err);
      alert("Connection Error");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectedItems =
    data?.items?.filter((item) => selectedIds.includes(item.id)) || [];
  const total = selectedItems.reduce(
    (acc, item) => acc + parseFloat(item.amount),
    0,
  );

  const handleProcessPayment = async () => {
    if (selectedIds.length === 0) return;
    setProcessing(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/cashier/process_service_payment.php`,
        {
          request_ids: selectedIds,
          student_id: data.student.student_id,
        },
      );
      if (res.data.status === "success") {
        setShowSuccess(true);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Processing Error");
    } finally {
      setProcessing(false);
    }
  };

  // PROFESSIONAL PRINT RECEIPT
  const handlePrintReceipt = () => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${data?.student?.student_id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body onload="window.print();window.close()">
          <div class="p-6 text-slate-800">
            <div class="text-center border-b-2 border-slate-100 pb-4 mb-4">
              <h1 class="text-lg font-black uppercase italic">School Management System</h1>
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Service Request Receipt</p>
            </div>
            <div class="text-[10px] space-y-1 mb-6">
              <p><strong>NAME:</strong> ${data?.student?.first_name} ${data?.student?.last_name}</p>
              <p><strong>ID:</strong> ${data?.student?.student_id}</p>
              <p><strong>DATE:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div class="space-y-2 mb-6">
              ${selectedItems
                .map(
                  (item) => `
                <div class="flex justify-between text-xs">
                  <span class="uppercase">${item.service_name}</span>
                  <span class="font-bold">₱${parseFloat(item.amount).toLocaleString()}</span>
                </div>
              `,
                )
                .join("")}
            </div>
            <div class="bg-slate-50 p-3 rounded-lg flex justify-between items-center border border-slate-100">
              <span class="text-xs font-black uppercase">Total Amount:</span>
              <span class="text-lg font-black italic">₱${total.toLocaleString()}</span>
            </div>
            <p class="text-[8px] text-center mt-8 text-slate-400 font-bold uppercase tracking-widest italic">Thank you for your transaction!</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">
            Process Payment
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
            Services & Document Requests
          </p>
        </div>

        <div className="relative group">
          <input
            type="text"
            placeholder="Search Student ID..."
            className="w-full md:w-[400px] pl-14 pr-4 py-4 bg-white border-2 border-slate-100 rounded-[2rem] font-bold text-xs shadow-sm outline-none focus:border-indigo-500 transition-all"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500"
            size={20}
          />
          <button
            onClick={handleSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase hover:bg-indigo-600 transition-all"
          >
            {loading ? "..." : "Search"}
          </button>
        </div>
      </div>

      {!data ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white/50 border-4 border-dashed border-slate-100 rounded-[4rem]">
          <ShoppingBag size={48} className="text-slate-200 mb-4" />
          <h3 className="text-xl font-black text-slate-300 uppercase italic">
            Waiting for Student ID
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: REQUEST LIST */}
          <div className="lg:col-span-8 space-y-6">
            {/* STUDENT PILL CARD */}
            <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                <User size={28} />
              </div>
              <div>
                {/* Gagamit tayo ng ?. para hindi mag-error kung null pa ang data.student */}
                <h2 className="text-xl font-black text-slate-800 uppercase italic leading-none">
                  {data?.student_name || "Student Not Found"}
                </h2>
                <p className="text-indigo-500 font-black text-[10px] uppercase tracking-widest mt-1">
                  {data?.student?.student_id || searchId}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-sm overflow-hidden p-8">
              <SectionHeader title="Service Requests" icon={Receipt} />
              <div className="mt-8 space-y-3">
                {data.items.length > 0 ? (
                  data.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all cursor-pointer ${
                        selectedIds.includes(item.id)
                          ? "border-indigo-600 bg-indigo-50/50 shadow-md"
                          : "border-slate-50 bg-slate-50 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-xl ${selectedIds.includes(item.id) ? "bg-indigo-600 text-white" : "bg-white text-slate-400"}`}
                        >
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-700 uppercase">
                            {item.service_name}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                            {item.status}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg text-slate-800 italic">
                          ₱{parseFloat(item.amount).toLocaleString()}
                        </p>
                        {selectedIds.includes(item.id) && (
                          <span className="text-[8px] font-black text-indigo-600 uppercase">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center opacity-30 italic font-black uppercase tracking-widest">
                    No Pending Requests
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: CHECKOUT */}
          <div className="lg:col-span-4 space-y-6">
            <StatCard
              title="Items Selected"
              value={selectedIds.length.toString()}
              icon={CreditCard}
              colorClass="bg-slate-800"
            />

            <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl sticky top-6 border-b-[10px] border-emerald-500">
              <div className="flex items-center gap-2 mb-4 opacity-50">
                <ShieldCheck size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Secure Checkout
                </p>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Total Payable
              </p>
              <h2 className="text-5xl font-black text-emerald-400 mb-8 italic">
                ₱{total.toLocaleString()}
              </h2>

              <button
                disabled={selectedIds.length === 0 || processing}
                onClick={handleProcessPayment}
                className={`w-full py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-lg active:scale-95 ${
                  selectedIds.length > 0
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-900"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                }`}
              >
                {processing ? "Processing..." : "Confirm & Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[4rem] w-full max-w-sm p-12 text-center shadow-2xl border-t-8 border-emerald-500">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 uppercase italic leading-none">
              Paid!
            </h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-3">
              Transaction Complete
            </p>

            <div className="mt-10 space-y-3">
              <button
                onClick={handlePrintReceipt}
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-xl"
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
                Back to Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDashboard;
