import React from 'react';
import { Check, X } from 'lucide-react';

const ApprovalsTab = ({ isManager, approvalsQueue, requests, approvalRemarks, setApprovalRemarks, handleApprovalAction }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-800">
            {isManager ? "Employee Requests Queue" : "My Filed Requests Logs"}
          </h3>
          <p className="text-xs text-slate-455 mt-1 font-semibold">
            {isManager ? "Evaluate leaves, timesheet, and Rest Day adjustment requests filed by staff." : "Verify the approval states of your filed requests."}
          </p>
        </div>

        <div className="space-y-4">
          {(isManager ? approvalsQueue : requests).length === 0 ? (
            <p className="text-xs text-slate-400 font-bold text-center py-10">No requests found in this queue.</p>
          ) : (
            (isManager ? approvalsQueue : requests).map((r) => {
              // Handle details parsing
              let d = { request_date: r.created_at, notes: '', entries: [], files: [] };
              try {
                d = typeof r.details === 'string' ? JSON.parse(r.details) : r.details;
              } catch(e) {
                d = { request_date: r.created_at, notes: r.details, entries: [{ type: r.request_type, reason: r.details }] };
              }

              const firstEntry = d.entries?.[0] || {};

              return (
                <div key={r.id} className="p-5 border border-slate-100 rounded-3xl bg-slate-50/50 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-slate-200 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-wider">{r.request_type}</span>
                      {isManager && <h4 className="text-sm font-black text-slate-800">{r.first_name} {r.last_name} ({r.position})</h4>}
                    </div>
                    
                    <p className="text-xs font-bold text-slate-650 mt-1">
                      Date Range: <span className="text-slate-800 font-mono">
                        {firstEntry.dateFrom ? `${new Date(firstEntry.dateFrom).toLocaleDateString()} - ${new Date(firstEntry.dateTo).toLocaleDateString()}` : 'None'}
                      </span>
                    </p>

                    {firstEntry.timeFrom && (
                      <p className="text-[11px] font-bold text-slate-600">
                        Time: <span className="text-slate-850 font-mono">{firstEntry.timeFrom} - {firstEntry.timeTo} {firstEntry.nextDay ? '(Next Day)' : ''}</span>
                        {firstEntry.total_hours && <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px]">Total hours: {firstEntry.total_hours}</span>}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-550 leading-normal font-semibold">
                      Reason & Note: "{firstEntry.reason || d.notes}"
                    </p>

                    {r.remarks && <p className="text-[10px] text-slate-400 italic font-medium mt-1">Approver Remarks: "{r.remarks}"</p>}
                  </div>

                  <div className="flex items-center gap-4 ml-auto md:ml-0">
                    {r.status === 'Pending' && isManager ? (
                      <div className="space-y-2 w-48">
                        <input 
                          type="text" 
                          placeholder="Remarks (Optional)" 
                          value={approvalRemarks[r.id] || ''}
                          onChange={e => setApprovalRemarks({ ...approvalRemarks, [r.id]: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-semibold outline-none focus:border-blue-500"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleApprovalAction(r.id, 'Approved')} className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm"><Check size={12} /> Approve</button>
                          <button onClick={() => handleApprovalAction(r.id, 'Rejected')} className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm"><X size={12} /> Reject</button>
                        </div>
                      </div>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        r.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                        r.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>{r.status}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalsTab;
