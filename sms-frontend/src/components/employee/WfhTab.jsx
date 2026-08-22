import React from 'react';

const WfhTab = ({ wfhForm, setWfhForm, handleWfhAccomplishment, accomplishments, themeColor }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* WFH FILING FORM */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">WFH Daily Accomplishment Log</h3>
          <form onSubmit={handleWfhAccomplishment} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Working Date</label>
              <input type="date" required value={wfhForm.log_date} onChange={e => setWfhForm({ ...wfhForm, log_date: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accomplishments Summary *</label>
              <textarea required rows={4} placeholder="Describe screen tasks completed, items encoded, etc..." value={wfhForm.description} onChange={e => setWfhForm({ ...wfhForm, description: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accomplishment Document Link / Filename</label>
              <input type="text" placeholder="e.g. processed_admissions_report.pdf" value={wfhForm.attachment} onChange={e => setWfhForm({ ...wfhForm, attachment: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700" />
            </div>
            <button type="submit" className="w-full py-3 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all" style={{ backgroundColor: themeColor }}>Log WFH Output</button>
          </form>
        </div>

        {/* PAST ACCOMPLISHMENTS LOGS */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-800">Daily Accomplishment History</h3>
            <p className="text-xs text-slate-450 mt-1 font-semibold">Track submissions of processed WFH logs.</p>
          </div>
          <div className="space-y-4">
            {accomplishments.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold text-center py-10">No accomplishment entries logged yet.</p>
            ) : (
              accomplishments.map((ac) => (
                <div key={ac.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{new Date(ac.log_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-slate-550 mt-1 leading-relaxed font-semibold">{ac.description}</p>
                    {ac.attachment && (
                      <span className="inline-block mt-2 px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 rounded text-[9px] font-black uppercase tracking-wider font-mono">📎 {ac.attachment}</span>
                    )}
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

export default WfhTab;
