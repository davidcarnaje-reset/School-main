import React, { useState } from 'react';
import { 
  Plus, Search, FileText, Upload, Save, Send, ArrowLeft, 
  Trash2, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import axios from 'axios';

const FilingTab = ({ requests, fetchPortalData, themeColor, API_BASE_URL, user }) => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'create'
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Request States
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  // Files attachment
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [tempFilename, setTempFilename] = useState('');
  const [tempFileNotes, setTempFileNotes] = useState('');

  // Request details table rows (Screenshot 2 details table)
  const [detailsRows, setDetailsRows] = useState([
    { type: 'Overtime', dateFrom: new Date().toISOString().split('T')[0], dateTo: new Date().toISOString().split('T')[0], timeFrom: '17:00', timeTo: '19:00', nextDay: false, reason: '', charging: 'IT' }
  ]);

  const calculateHours = (timeFrom, timeTo, nextDay) => {
    if (!timeFrom || !timeTo) return "00:00";
    const [h1, m1] = timeFrom.split(':').map(Number);
    const [h2, m2] = timeTo.split(':').map(Number);
    let d1 = new Date(2026, 0, 1, h1, m1);
    let d2 = new Date(2026, 0, nextDay ? 2 : 1, h2, m2);
    if (d2 < d1) {
      d2.setDate(d2.getDate() + 1);
    }
    const diffMs = d2 - d1;
    const diffMins = Math.floor(diffMs / 1000 / 60);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const handleAddDetailRow = () => {
    setDetailsRows([
      ...detailsRows,
      { type: 'Overtime', dateFrom: new Date().toISOString().split('T')[0], dateTo: new Date().toISOString().split('T')[0], timeFrom: '17:00', timeTo: '19:00', nextDay: false, reason: '', charging: 'IT' }
    ]);
  };

  const handleRemoveDetailRow = (index) => {
    if (detailsRows.length === 1) return;
    setDetailsRows(detailsRows.filter((_, i) => i !== index));
  };

  const handleDetailRowChange = (index, field, value) => {
    const updated = [...detailsRows];
    updated[index][field] = value;
    setDetailsRows(updated);
  };

  const handleAddFile = (e) => {
    e.preventDefault();
    if (!tempFilename) return;
    setAttachedFiles([...attachedFiles, { filename: tempFilename, notes: tempFileNotes }]);
    setTempFilename('');
    setTempFileNotes('');
  };

  const handleRemoveFile = (idx) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== idx));
  };

  const handleSubmitRequest = async (statusOverride = 'Pending') => {
    try {
      const email = user?.email;
      if (!email) return;

      const firstRowType = detailsRows[0]?.type || 'Leave';

      // Serialize entire structure (screenshot 2 data)
      const payloadDetails = {
        request_date: requestDate,
        notes: notes,
        files: attachedFiles,
        entries: detailsRows.map(row => ({
          ...row,
          total_hours: calculateHours(row.timeFrom, row.timeTo, row.nextDay)
        }))
      };

      const res = await axios.post(`${API_BASE_URL}/employee-portal/requests`, {
        email,
        request_type: firstRowType,
        details: payloadDetails
      });

      if (res.data?.success) {
        alert("Request filed and sent for approval successfully!");
        setViewMode('list');
        // Reset form
        setNotes('');
        setAttachedFiles([]);
        setDetailsRows([{ type: 'Overtime', dateFrom: new Date().toISOString().split('T')[0], dateTo: new Date().toISOString().split('T')[0], timeFrom: '17:00', timeTo: '19:00', nextDay: false, reason: '', charging: 'IT' }]);
        fetchPortalData();
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting request.");
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(r => {
    const statusMatches = statusFilter === 'All Status' || r.status.toLowerCase() === statusFilter.toLowerCase();
    
    let detailsStr = '';
    try {
      const parsed = typeof r.details === 'string' ? JSON.parse(r.details) : r.details;
      detailsStr = parsed.notes || JSON.stringify(parsed);
    } catch(e) {
      detailsStr = r.details;
    }
    
    const searchMatches = searchQuery === '' || 
      r.request_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      detailsStr.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatches && searchMatches;
  });

  return (
    <div className="space-y-6">
      
      {viewMode === 'list' ? (
        // LIST VIEW (Matches Screenshot 1)
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800">Filing & Service Requests</h3>
              <p className="text-xs text-slate-450 mt-1 font-semibold">Track and view status of leaves, overtime and rest day requests.</p>
            </div>
            <button 
              onClick={() => setViewMode('create')}
              className="px-5 py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:scale-105 transition-all flex items-center gap-2"
              style={{ backgroundColor: themeColor }}
            >
              <Plus size={16} /> File New Request
            </button>
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="relative">
              <Search className="text-slate-400 absolute left-3 top-2.5" size={16} />
              <input 
                type="text" 
                placeholder="Search requests..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
            >
              <option value="All Status">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <div className="flex items-center justify-end text-xs text-slate-400 font-bold pr-2">
              Showing {filteredRequests.length} of {requests.length} entries
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Request Date</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Type</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Date From / To</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Specific Hours / Details</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Total Hours / Purpose</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr><td colSpan="7" className="py-8 text-center text-slate-400 font-bold">No requests found.</td></tr>
                ) : (
                  filteredRequests.map((r) => {
                    let d = { request_date: r.created_at, notes: '', entries: [], files: [] };
                    try {
                      d = typeof r.details === 'string' ? JSON.parse(r.details) : r.details;
                    } catch(e) {
                      d = { request_date: r.created_at, notes: r.details, entries: [{ type: r.request_type, reason: r.details }] };
                    }

                    const firstEntry = d.entries?.[0] || {};

                    return (
                      <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 font-mono">{new Date(d.request_date || r.created_at).toLocaleDateString()}</td>
                        <td className="py-4"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-wider">{r.request_type}</span></td>
                        <td className="py-4">
                          {firstEntry.dateFrom ? `${new Date(firstEntry.dateFrom).toLocaleDateString()} - ${new Date(firstEntry.dateTo).toLocaleDateString()}` : '-'}
                        </td>
                        <td className="py-4 font-mono font-bold text-slate-850">
                          {firstEntry.timeFrom ? `${firstEntry.timeFrom} - ${firstEntry.timeTo} ${firstEntry.nextDay ? '(Next Day)' : ''}` : '-'}
                        </td>
                        <td className="py-4 font-medium text-slate-500">
                          {firstEntry.total_hours ? <span className="font-mono font-bold text-slate-800">Hours: {firstEntry.total_hours}</span> : firstEntry.reason || d.notes}
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                            r.status === 'Approved' ? 'bg-emerald-55 text-emerald-700 bg-emerald-50' :
                            r.status === 'Rejected' ? 'bg-red-55 text-red-700 bg-red-50' : 'bg-amber-55 text-amber-700 bg-amber-50'
                          }`}>{r.status}</span>
                        </td>
                        <td className="py-4 text-slate-400 italic text-[11px] font-medium">{r.remarks || 'None'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // CREATE FORM VIEW (Matches Screenshot 2)
        <div className="space-y-6">
          
          <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-850">Log New Service Request</h3>
              <p className="text-xs text-slate-400 mt-0.5">Please ensure all required information fields are correctly logged.</p>
            </div>
            <button 
              onClick={() => setViewMode('list')} 
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Requests
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* BASIC INFO */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-450 border-b border-slate-50 pb-2">Basic Information</h4>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Request Date *</label>
                <input 
                  type="date" 
                  value={requestDate}
                  onChange={e => setRequestDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes & Context</label>
                <textarea 
                  rows={4} 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Provide overall details, context or special notes..." 
                  className="w-full p-3 bg-slate-50 border border-slate-155 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700" 
                />
              </div>
            </div>

            {/* FILES ATTACHMENT */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-450 border-b border-slate-50 pb-2">Files Upload</h4>
                
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors mt-3">
                  <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                  <p className="text-xs font-bold text-slate-600">Simulate files attachment below</p>
                  <p className="text-[10px] text-slate-400 mt-1">Submit files to support request verification</p>
                </div>
              </div>

              {/* Upload helper form */}
              <form onSubmit={handleAddFile} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 items-end bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="sm:col-span-2 space-y-1">
                  <input 
                    type="text" 
                    placeholder="Filename (e.g. proof.pdf)" 
                    value={tempFilename}
                    onChange={e => setTempFilename(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none"
                  />
                  <input 
                    type="text" 
                    placeholder="Short description/notes" 
                    value={tempFileNotes}
                    onChange={e => setTempFileNotes(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-semibold outline-none"
                  />
                </div>
                <button type="submit" className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all" style={{ backgroundColor: themeColor }}>+ Add File</button>
              </form>

              {/* File list */}
              {attachedFiles.length > 0 && (
                <div className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-600 max-h-[100px] overflow-y-auto mt-2">
                  {attachedFiles.map((f, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center">
                      <span>📄 {f.filename} <span className="text-[10px] text-slate-400 italic">({f.notes})</span></span>
                      <button onClick={() => handleRemoveFile(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* DETAILS GRID (Matches Screenshot 2 bottom panel) */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-450 border-b border-slate-50 pb-2">Request Details Grid</h4>
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-bold leading-normal">
              <AlertCircle className="text-amber-600 shrink-0" size={18} />
              <div>
                <p>• If <strong>time from</strong> is greater than <strong>time to</strong> then <strong>time to</strong> will be computed as the following day.</p>
                <p className="mt-0.5">• If <strong>next day</strong> is checked, then both <strong>time from</strong> and <strong>time to</strong> will be evaluated as the following day.</p>
              </div>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left border-collapse text-xs font-semibold min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Type *</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Date From *</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Date To *</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Time From *</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Time To *</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-wider text-center">Next Day</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Reason *</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Charging Dept.</th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-wider text-center">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {detailsRows.map((row, index) => (
                    <tr key={index} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/20">
                      <td className="py-3.5 pr-2">
                        <select 
                          value={row.type} 
                          onChange={e => handleDetailRowChange(index, 'type', e.target.value)}
                          className="p-2 bg-slate-55 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none w-full"
                        >
                          <option value="Overtime">Overtime</option>
                          <option value="Leave">Leave Request</option>
                          <option value="Rest Day">Rest Day Request</option>
                          <option value="Undertime">Undertime</option>
                          <option value="Time Adjustment">Time Adjustment</option>
                          <option value="Offset">Offset</option>
                          <option value="Official Business">Official Business</option>
                          <option value="Change Time">Change Time</option>
                        </select>
                      </td>
                      <td className="py-3.5 pr-2">
                        <input 
                          type="date" 
                          required
                          value={row.dateFrom} 
                          onChange={e => handleDetailRowChange(index, 'dateFrom', e.target.value)}
                          className="p-2 bg-slate-55 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none w-full"
                        />
                      </td>
                      <td className="py-3.5 pr-2">
                        <input 
                          type="date" 
                          required
                          value={row.dateTo} 
                          onChange={e => handleDetailRowChange(index, 'dateTo', e.target.value)}
                          className="p-2 bg-slate-55 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none w-full"
                        />
                      </td>
                      <td className="py-3.5 pr-2">
                        <input 
                          type="time" 
                          required
                          value={row.timeFrom} 
                          onChange={e => handleDetailRowChange(index, 'timeFrom', e.target.value)}
                          className="p-2 bg-slate-55 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none w-full font-mono"
                        />
                      </td>
                      <td className="py-3.5 pr-2">
                        <input 
                          type="time" 
                          required
                          value={row.timeTo} 
                          onChange={e => handleDetailRowChange(index, 'timeTo', e.target.value)}
                          className="p-2 bg-slate-55 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none w-full font-mono"
                        />
                      </td>
                      <td className="py-3.5 text-center">
                        <input 
                          type="checkbox" 
                          checked={row.nextDay}
                          onChange={e => handleDetailRowChange(index, 'nextDay', e.target.checked)}
                          className="w-4 h-4 text-blue-650 cursor-pointer rounded"
                        />
                      </td>
                      <td className="py-3.5 pr-2">
                        <input 
                          type="text" 
                          required
                          placeholder="Filing justification reason..."
                          value={row.reason} 
                          onChange={e => handleDetailRowChange(index, 'reason', e.target.value)}
                          className="p-2 bg-slate-55 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none w-full"
                        />
                      </td>
                      <td className="py-3.5 pr-2">
                        <select 
                          value={row.charging} 
                          onChange={e => handleDetailRowChange(index, 'charging', e.target.value)}
                          className="p-2 bg-slate-55 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none w-full"
                        >
                          <option value="IT">IT Scope</option>
                          <option value="Registrar">Registrar Academics</option>
                          <option value="Cashier">Cashier Finance</option>
                          <option value="Admin">Operations Admin</option>
                          <option value="Guidance">Guidance Guidance</option>
                          <option value="Nurse">Health Clinic</option>
                        </select>
                      </td>
                      <td className="py-3.5 text-center">
                        <button 
                          type="button" 
                          onClick={() => handleRemoveDetailRow(index)}
                          disabled={detailsRows.length === 1}
                          className="text-red-500 hover:text-red-750 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button 
              type="button" 
              onClick={handleAddDetailRow}
              className="mt-2 px-4 py-2 border border-dashed border-slate-300 hover:border-slate-400 text-slate-650 font-bold rounded-xl text-xs flex items-center gap-1 hover:bg-slate-50 transition-all"
            >
              <Plus size={14} /> + Add Details Row
            </button>
          </div>

          {/* ACTION BUTTONS (Matches Screenshot 2 bottom footer) */}
          <div className="flex flex-wrap gap-4 items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <button 
              type="button"
              onClick={() => handleSubmitRequest('Pending')}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              style={{ backgroundColor: themeColor }}
            >
              <Send size={14} /> Save & Send for Approval
            </button>
            
            <button 
              type="button"
              onClick={() => handleSubmitRequest('Pending')} // Local save fallback
              className="px-6 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <Save size={14} /> Save Draft
            </button>

            <button 
              type="button" 
              onClick={() => setViewMode('list')}
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-all ml-auto"
            >
              Cancel
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default FilingTab;
