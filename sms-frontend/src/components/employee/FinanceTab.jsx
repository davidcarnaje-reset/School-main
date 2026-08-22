import React from 'react';
import { Wallet, FileText } from 'lucide-react';

const FinanceTab = ({ 
  expenseForm, setExpenseForm, handleExpenseSubmit, expenses,
  purchaseForm, setPurchaseForm, handlePurchaseSubmit, purchases,
  themeColor
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* EXPENSE CLAIM REIMBURSEMENT */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
          <h3 className="text-base font-black text-slate-850 uppercase tracking-tight flex items-center gap-2">
            <Wallet size={18} className="text-blue-600" style={{ color: themeColor }} /> Reimbursements & Liquidation
          </h3>
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Claim Type *</label>
              <select value={expenseForm.type} onChange={e => setExpenseForm({ ...expenseForm, type: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700">
                <option value="Reimbursement">Cash Reimbursement</option>
                <option value="Liquidation">Expense Liquidation</option>
                <option value="Cash Advance">Cash Advance Request</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₱) *</label>
              <input type="number" required placeholder="0.00" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense Description *</label>
              <textarea required rows={3} placeholder="Provide details of purchased items/services..." value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attach Receipt Image (Filename/URL)</label>
              <input type="text" placeholder="e.g. receipt_invoice_102.png" value={expenseForm.receipt} onChange={e => setExpenseForm({ ...expenseForm, receipt: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700" />
            </div>

            <button type="submit" className="w-full py-3 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all" style={{ backgroundColor: themeColor }}>Log Claim Request</button>
          </form>

          {/* PAST EXPENSE LIST */}
          <div className="divide-y divide-slate-100 pt-4">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">My Filed Expenses</p>
            {expenses.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold text-center py-4">No logged expenses.</p>
            ) : (
              expenses.map(ex => (
                <div key={ex.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{ex.expense_type}</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">{ex.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">₱{ex.amount?.toLocaleString()}</p>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${ex.status === 'Approved' ? 'text-emerald-600' : ex.status === 'Rejected' ? 'text-red-500' : 'text-amber-500'}`}>{ex.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PURCHASE REQUEST FOR IT / OPERATIONS */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
          <h3 className="text-base font-black text-slate-850 uppercase tracking-tight flex items-center gap-2">
            <FileText size={18} className="text-blue-600" style={{ color: themeColor }} /> Purchase Requisition
          </h3>
          <form onSubmit={handlePurchaseSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requisition Item Name *</label>
              <input type="text" required placeholder="e.g. Acer Aspire PC for registrar clerk" value={purchaseForm.item_name} onChange={e => setPurchaseForm({ ...purchaseForm, item_name: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity *</label>
                <input type="number" required value={purchaseForm.quantity} onChange={e => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Total Cost (₱) *</label>
                <input type="number" required placeholder="0.00" value={purchaseForm.estimated_cost} onChange={e => setPurchaseForm({ ...purchaseForm, estimated_cost: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department Scope *</label>
              <select value={purchaseForm.department} onChange={e => setPurchaseForm({ ...purchaseForm, department: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700">
                <option value="IT">IT Infrastructure</option>
                <option value="Custodian">Custodian Facilities</option>
                <option value="Registrar">Registrar Academics</option>
                <option value="Admin">Operations Administration</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purpose Requisition *</label>
              <textarea required rows={2} placeholder="Explain the business/operational requirement..." value={purchaseForm.purpose} onChange={e => setPurchaseForm({ ...purchaseForm, purpose: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700" />
            </div>

            <button type="submit" className="w-full py-3 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all" style={{ backgroundColor: themeColor }}>Submit Purchase Requisition</button>
          </form>

          {/* REQUISITION LIST */}
          <div className="divide-y divide-slate-100 pt-4">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">My Purchase Logs</p>
            {purchases.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold text-center py-4">No requisition logs.</p>
            ) : (
              purchases.map(pr => (
                <div key={pr.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{pr.item_name} (x{pr.quantity})</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">{pr.purpose}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">₱{pr.estimated_cost?.toLocaleString()}</p>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${pr.status === 'Approved' ? 'text-emerald-600' : pr.status === 'Rejected' ? 'text-red-500' : 'text-amber-500'}`}>{pr.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FinanceTab;
