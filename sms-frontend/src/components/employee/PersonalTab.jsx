import React from 'react';
import { User, Bell, Download } from 'lucide-react';
import { download201FormPDF } from '../../utils/employee201FormGenerator';

const PersonalTab = ({ employeeInfo, portalNotifs, unreadNotifsCount, handleMarkNotifRead, themeColor, API_BASE_URL }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center">
        <div className="w-24 h-24 bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 flex items-center justify-center text-slate-400 font-black text-4xl uppercase shadow-inner shrink-0">
          {employeeInfo?.profile_image ? (
            <img src={`${API_BASE_URL}/uploads/profiles/${employeeInfo.profile_image}`} className="w-full h-full object-cover" alt="Profile" />
          ) : (
            <User size={40} />
          )}
        </div>
        <div className="space-y-2 text-center md:text-left">
          <p className="text-xs font-black uppercase text-blue-600 tracking-widest leading-none">Employment Record Profile</p>
          <h2 className="text-2xl font-black text-slate-800">
            {employeeInfo?.first_name} {employeeInfo?.middle_name ? `${employeeInfo.middle_name.trim().charAt(0)}.` : ''} {employeeInfo?.last_name} {employeeInfo?.suffix || ''}
          </h2>
          <p className="text-sm font-bold text-slate-400">{employeeInfo?.position} • {employeeInfo?.department} Department</p>
        </div>
        <div className="md:ml-auto text-center md:text-right shrink-0 bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 flex flex-col items-center md:items-end gap-3">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Salary Configuration</p>
            <p className="text-2xl font-black text-slate-800 mt-1">₱{employeeInfo?.basic_salary?.toLocaleString()}</p>
            <p className="text-[10px] text-slate-550 mt-0.5">Base Pay / {employeeInfo?.salary_type || 'Monthly'} Release</p>
          </div>
          <button 
            onClick={() => download201FormPDF(employeeInfo)} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-200 flex items-center gap-1.5 cursor-pointer mt-1"
            style={{ backgroundColor: themeColor }}
          >
            <Download size={14} /> Download 201 File
          </button>
        </div>
      </div>

      {/* DETAILS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-450">Employment Details</h3>
          <div className="divide-y divide-slate-50 text-xs font-semibold text-slate-650">
            <div className="py-2.5 flex justify-between"><span>Employee ID Number</span><strong className="text-slate-800 font-mono">{employeeInfo?.employee_id}</strong></div>
            <div className="py-2.5 flex justify-between"><span>Current Status</span><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold uppercase">{employeeInfo?.status}</span></div>
            <div className="py-2.5 flex justify-between"><span>Primary Email</span><strong className="text-slate-850">{employeeInfo?.email}</strong></div>
            <div className="py-2.5 flex justify-between"><span>Phone Contact</span><strong className="text-slate-850">{employeeInfo?.phone_number || '-'}</strong></div>
          </div>
        </div>

        {/* NOTIFICATIONS CONTAINER */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm space-y-4 flex flex-col max-h-[300px]">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-450 flex items-center gap-2">
            <Bell size={14} className="text-slate-400" /> Portal Notifications ({unreadNotifsCount})
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {portalNotifs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10 font-bold">No notifications yet.</p>
            ) : (
              portalNotifs.map(n => (
                <div key={n.id} className={`p-3 rounded-2xl border transition-all cursor-pointer ${n.is_read ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-blue-50/30 border-blue-100'}`} onClick={() => handleMarkNotifRead(n.id)}>
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-slate-800">{n.title}</h4>
                    {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" style={{ backgroundColor: themeColor }}></span>}
                  </div>
                  <p className="text-[10px] text-slate-550 mt-1 leading-normal font-semibold">{n.message}</p>
                  <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider block mt-1">{new Date(n.created_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalTab;
