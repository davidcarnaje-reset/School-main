import React from 'react';
import { Printer, X, FileText } from 'lucide-react';

const PayslipsTab = ({ payslips, selectedPayslip, setSelectedPayslip, employeeInfo, branding, themeColor }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-800">My Payslip Ledger</h3>
          <p className="text-xs text-slate-455 mt-1 font-semibold">Verify payslip releases and review detailed compensation sheets.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-semibold">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Released Period</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Position Record</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Days Worked</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">OT Hours</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Pay</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody>
              {payslips.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-400 font-bold">No payslips have been released yet.</td></tr>
              ) : (
                payslips.map((ps) => (
                  <tr key={ps.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 text-slate-850 font-bold">Period ID #{ps.period_id}</td>
                    <td className="py-4 text-slate-500">{ps.position}</td>
                    <td className="py-4 font-mono">{ps.days_worked} days</td>
                    <td className="py-4 font-mono">{ps.ot_hours} hrs</td>
                    <td className="py-4 font-mono font-bold text-slate-800">₱{ps.net_pay?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-4">
                      <button onClick={() => setSelectedPayslip(ps)} className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1">
                        <FileText size={12} /> View Payslip
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINTABLE PAYSLIP BREAKDOWN MODAL */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-slate-900/60 z-[99] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">Payslip Sheet Details</h3>
              <button onClick={() => setSelectedPayslip(null)} className="p-2 text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>
            
            {/* PRINT BODY */}
            <div id="payslip-print-area" className="p-10 overflow-y-auto space-y-8 text-slate-700">
              {/* BRANDING HEADER */}
              <div className="flex justify-between items-start border-b border-slate-150 pb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-850 tracking-tight">{branding?.school_name || "School Cloud Management"}</h2>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Campus Operations Accounting Department</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-[9px] font-black uppercase tracking-widest border border-emerald-200">Release Paid</span>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono font-bold">Ledger ID: #{selectedPayslip.id}</p>
                </div>
              </div>

              {/* EMPLOYEE WORK DETAILS */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100 text-xs">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Employee Name</p>
                  <p className="text-sm font-bold text-slate-850">{selectedPayslip.full_name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{selectedPayslip.position} • {employeeInfo?.department}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Payment Released Period</p>
                  <p className="text-sm font-bold text-slate-850 font-mono">Period #{selectedPayslip.period_id}</p>
                  <p className="text-[10px] text-slate-400 font-bold font-mono">DTR Status: Complete</p>
                </div>
              </div>

              {/* BREAKDOWN MATRIX */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Compensation Matrix</p>
                <div className="border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs font-semibold">
                  <div className="p-3 bg-slate-50 flex justify-between font-black text-[10px] uppercase text-slate-400"><span>Details description</span><span className="text-right">Amount (₱)</span></div>
                  <div className="p-3.5 flex justify-between"><span>Basic Compensation Allocation</span><span className="font-mono text-slate-800 font-bold">₱{employeeInfo?.basic_salary?.toLocaleString()}</span></div>
                  <div className="p-3.5 flex justify-between text-emerald-600"><span>Overtime Rendered ({selectedPayslip.ot_hours} Hours)</span><span className="font-mono font-bold">+ ₱{(selectedPayslip.ot_hours * 150)?.toLocaleString()}</span></div>
                  <div className="p-3.5 flex justify-between text-red-500"><span>Late / Attendance Deductions ({selectedPayslip.late_minutes} Mins)</span><span className="font-mono font-bold">- ₱{(selectedPayslip.late_minutes * 2)?.toLocaleString()}</span></div>
                  <div className="p-4 bg-slate-50 flex justify-between text-sm font-black text-slate-850 border-t border-slate-200"><span>Net Take-home Pay</span><span className="font-mono text-lg text-emerald-600">₱{selectedPayslip.net_pay?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                </div>
              </div>

              {/* LEGEND FOOTER */}
              <p className="text-[9px] text-slate-400 italic text-center pt-4">This document serves as an official electronic copy of the compensation details released by School Finance.</p>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-[2.5rem] flex gap-3">
              <button onClick={() => setSelectedPayslip(null)} className="flex-1 py-3.5 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Close Details</button>
              <button onClick={() => window.print()} className="flex-1 py-3.5 font-black text-white rounded-xl shadow-lg bg-blue-600 hover:bg-blue-700 transition-all flex justify-center items-center gap-2" style={{ backgroundColor: themeColor }}>
                <Printer size={16} /> Print Payslip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayslipsTab;
