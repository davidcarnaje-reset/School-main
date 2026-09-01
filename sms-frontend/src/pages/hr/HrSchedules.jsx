import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Plus, Trash2, UserCheck, Calendar, Search, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HrSchedules = () => {
  const { API_BASE_URL, branding } = useAuth();
  const themeColor = branding?.theme_color || '#2563eb';

  // State managers
  const [templates, setTemplates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Shift form state
  const [newShift, setNewShift] = useState({
    shift_name: '',
    time_in: '08:00',
    time_out: '17:00',
    work_days: 'Monday - Friday'
  });

  // Assignment Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignMode, setAssignMode] = useState('template'); // 'template' or 'custom'
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customShift, setCustomShift] = useState({
    shift_name: 'Custom Shift',
    time_in: '08:00',
    time_out: '17:00',
    work_days: 'Monday - Friday'
  });

  // Convert 24h input (08:00) to 12h database format (08:00 AM)
  const formatTo12Hour = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hrs = parseInt(h, 10);
    const mins = m;
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    hrs = hrs % 12;
    hrs = hrs ? hrs : 12;
    return `${String(hrs).padStart(2, '0')}:${mins} ${ampm}`;
  };

  // Convert 12h database format (08:00 AM) back to 24h input (08:00)
  const formatTo24Hour = (time12) => {
    if (!time12) return '08:00';
    const match = time12.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return '08:00';
    let hrs = parseInt(match[1], 10);
    const mins = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hrs < 12) hrs += 12;
    if (ampm === 'AM' && hrs === 12) hrs = 0;
    return `${String(hrs).padStart(2, '0')}:${mins}`;
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/employee-portal/shifts/templates`);
      if (res.data?.success) {
        setTemplates(res.data.templates || []);
        if (res.data.templates?.length > 0) {
          setSelectedTemplateId(res.data.templates[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading shift templates:", err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/employee-portal/shifts`);
      if (res.data?.success) {
        setEmployees(res.data.shifts || []);
      }
    } catch (err) {
      console.error("Error loading employee schedules:", err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchEmployees();
  }, []);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newShift.shift_name.trim()) return alert("Please enter a shift name.");

    try {
      const payload = {
        shift_name: newShift.shift_name,
        time_in: formatTo12Hour(newShift.time_in),
        time_out: formatTo12Hour(newShift.time_out),
        work_days: newShift.work_days
      };

      const res = await axios.post(`${API_BASE_URL}/employee-portal/shifts/templates`, payload);
      if (res.data?.success) {
        alert("Shift template added successfully!");
        setNewShift({ shift_name: '', time_in: '08:00', time_out: '17:00', work_days: 'Monday - Friday' });
        fetchTemplates();
      }
    } catch (err) {
      console.error("Failed to create template:", err);
      alert("Error creating template: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm("Are you sure you want to delete this shift template?")) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/employee-portal/shifts/templates/${id}`);
      if (res.data?.success) {
        alert("Shift template deleted!");
        fetchTemplates();
      }
    } catch (err) {
      console.error("Failed to delete template:", err);
      alert("Error deleting template.");
    }
  };

  const handleOpenAssignModal = (user) => {
    setSelectedUser(user);
    if (user.shift_id && user.shift_id !== 'CUSTOM') {
      setAssignMode('template');
      const matched = templates.find(t => String(t.id) === String(user.shift_id) || t.shift_name === user.shift_name);
      if (matched) {
        setSelectedTemplateId(matched.id);
      }
    } else if (user.shift_id === 'CUSTOM') {
      setAssignMode('custom');
      setCustomShift({
        shift_name: user.shift_name || 'Custom Shift',
        time_in: formatTo24Hour(user.time_in),
        time_out: formatTo24Hour(user.time_out),
        work_days: user.work_days || 'Monday - Friday'
      });
    } else {
      setAssignMode('template');
      if (templates.length > 0) {
        setSelectedTemplateId(templates[0].id);
      }
    }
  };

  const handleAssignShiftSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      let payload = {};
      if (assignMode === 'template') {
        const selectedTpl = templates.find(t => String(t.id) === String(selectedTemplateId));
        if (!selectedTpl) return alert("Please select a valid template.");
        payload = {
          user_id: selectedUser.user_id,
          shift_id: String(selectedTpl.id),
          shift_name: selectedTpl.shift_name,
          time_in: selectedTpl.time_in,
          time_out: selectedTpl.time_out,
          work_days: selectedTpl.work_days || 'Monday - Friday'
        };
      } else {
        payload = {
          user_id: selectedUser.user_id,
          shift_id: 'CUSTOM',
          shift_name: customShift.shift_name || 'Custom Shift',
          time_in: formatTo12Hour(customShift.time_in),
          time_out: formatTo12Hour(customShift.time_out),
          work_days: customShift.work_days || 'Monday - Friday'
        };
      }

      const res = await axios.post(`${API_BASE_URL}/employee-portal/shifts`, payload);
      if (res.data?.success) {
        alert(`Shift assigned successfully to ${selectedUser.full_name}!`);
        setSelectedUser(null);
        fetchEmployees();
      }
    } catch (err) {
      console.error("Failed to assign shift:", err);
      alert("Error assigning shift.");
    }
  };

  const handleRemoveShift = async (user) => {
    if (!confirm(`Are you sure you want to remove shift assignment for ${user.full_name}?`)) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/employee-portal/shifts/remove`, { user_id: user.user_id });
      if (res.data?.success) {
        alert("Shift assignment removed. The employee will revert to standard academic hours.");
        fetchEmployees();
      }
    } catch (err) {
      console.error("Failed to remove shift:", err);
      alert("Error removing shift assignment.");
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter(emp =>
    (emp.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.shift_name || 'Default standard').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Clock className="text-blue-600" size={32} style={{ color: themeColor }} />
            Time Schedule Creator
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Create reusable shift configurations and assign shifts or customize schedules for staff members.
          </p>
        </div>
        <button
          onClick={() => { fetchTemplates(); fetchEmployees(); }}
          className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-all rounded-2xl flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Reload Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SHIFT CREATOR / TEMPLATES LIST */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* CREATE SHIFT CARD */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Plus size={18} className="text-blue-500" style={{ color: themeColor }} />
              Create Shift Template
            </h2>
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Shift Name</label>
                <input
                  type="text"
                  placeholder="e.g. Regular Day Shift"
                  value={newShift.shift_name}
                  onChange={(e) => setNewShift({ ...newShift, shift_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Work Schedule Days</label>
                <select
                  value={newShift.work_days}
                  onChange={(e) => setNewShift({ ...newShift, work_days: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Monday - Friday">Monday - Friday (5 Days)</option>
                  <option value="Monday - Saturday">Monday - Saturday (6 Days)</option>
                  <option value="Tuesday - Saturday">Tuesday - Saturday (6 Days)</option>
                  <option value="Sunday - Thursday">Sunday - Thursday (5 Days)</option>
                  <option value="Monday - Sunday">Monday - Sunday (7 Days)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Time In</label>
                  <input
                    type="time"
                    value={newShift.time_in}
                    onChange={(e) => setNewShift({ ...newShift, time_in: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Time Out</label>
                  <input
                    type="time"
                    value={newShift.time_out}
                    onChange={(e) => setNewShift({ ...newShift, time_out: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: themeColor }}
              >
                Create Template
              </button>
            </form>
          </div>

          {/* TEMPLATES CATALOG CARD */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Layers size={18} className="text-slate-400" />
              Templates Catalog
            </h2>
            {loadingTemplates ? (
              <p className="text-xs text-slate-450 font-bold py-6 text-center">Loading templates...</p>
            ) : templates.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-6 text-center">No custom templates created yet.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center hover:scale-[1.01] transition-all">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{tpl.shift_name}</p>
                      <span className="text-[10px] font-semibold text-slate-455 block mt-0.5">
                        {tpl.time_in} - {tpl.time_out} • {tpl.work_days || 'Monday - Friday'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all"
                      title="Delete shift template"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* EMPLOYEE ASSIGNMENTS VIEW */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
            
            {/* SEARCH AND TITLE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <UserCheck size={18} className="text-slate-400" />
                Employee Schedule Tags
              </h2>
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff, position, or shift..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-150 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* EMPLOYEES SCHEDULE TABLE */}
            {loadingEmployees ? (
              <p className="text-xs text-slate-450 font-bold py-16 text-center">Loading employee directory list...</p>
            ) : filteredEmployees.length === 0 ? (
              <p className="text-xs text-slate-450 font-bold py-16 text-center">No active employees found matching query.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest">Employee</th>
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest">Current Time Schedule</th>
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => {
                      const hasShift = emp.shift_name && emp.time_in;
                      return (
                        <tr key={emp.user_id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 pr-4">
                            <p className="text-sm font-bold text-slate-700">{emp.full_name}</p>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{emp.role}</span>
                          </td>
                          <td className="py-4">
                            {hasShift ? (
                              <div>
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  emp.shift_id === 'CUSTOM'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                }`}>
                                  {emp.shift_name}
                                </span>
                                <p className="text-[10px] font-bold text-slate-500 mt-1.5 flex items-center gap-1">
                                  <Clock size={12} className="text-slate-400" /> {emp.time_in} - {emp.time_out}
                                </p>
                                <p className="text-[9px] font-bold text-slate-450 mt-0.5 uppercase tracking-wider">
                                  Days: {emp.work_days || 'Monday - Friday'}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-50 border border-slate-100 text-slate-455">
                                  Default Standard
                                </span>
                                <p className="text-[10px] font-semibold text-slate-400 mt-1.5">
                                  08:00 AM - 05:00 PM
                                </p>
                                <p className="text-[9px] font-bold text-slate-450 mt-0.5 uppercase tracking-wider">
                                  Days: Monday - Friday
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="py-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenAssignModal(emp)}
                              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all"
                              style={{ color: themeColor }}
                            >
                              Tag/Assign Shift
                            </button>
                            {hasShift && (
                              <button
                                onClick={() => handleRemoveShift(emp)}
                                className="px-3.5 py-2 bg-red-55/10 hover:bg-red-50 text-red-600 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all"
                              >
                                Reset
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ASSIGN SHIFT DIALOG MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-6 md:p-8 w-full max-w-md space-y-6 relative hover:scale-[1.01] transition-transform">
            
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-55 rounded-xl transition-all"
            >
              ✕
            </button>

            {/* TITLE */}
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800">Tag Employee Shift</h3>
              <p className="text-xs font-semibold text-slate-450">
                Configure schedule assignment for <strong className="text-slate-755">{selectedUser.full_name}</strong>
              </p>
            </div>

            {/* MODE SELECTOR */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
              <button
                type="button"
                onClick={() => setAssignMode('template')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  assignMode === 'template'
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-100'
                    : 'text-slate-450 hover:text-slate-800'
                }`}
              >
                Predefined Template
              </button>
              <button
                type="button"
                onClick={() => setAssignMode('custom')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  assignMode === 'custom'
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-100'
                    : 'text-slate-450 hover:text-slate-800'
                }`}
              >
                Custom Shift (Irregular)
              </button>
            </div>

            <form onSubmit={handleAssignShiftSubmit} className="space-y-4">
              
              {/* MODE 1: TEMPLATE SELECTION */}
              {assignMode === 'template' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Predefined Shift</label>
                  {templates.length === 0 ? (
                    <div className="p-3 text-center bg-slate-50 border border-slate-150 text-slate-400 text-xs font-bold rounded-2xl">
                      No templates available. Please create one first.
                    </div>
                  ) : (
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.shift_name} ({t.time_in} - {t.time_out})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* MODE 2: CUSTOM IRREGULAR SCHEDULE INPUTS */}
              {assignMode === 'custom' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Custom Shift Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Custom Irregular Hours"
                      value={customShift.shift_name}
                      onChange={(e) => setCustomShift({ ...customShift, shift_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Custom Work Days</label>
                    <select
                      value={customShift.work_days}
                      onChange={(e) => setCustomShift({ ...customShift, work_days: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Monday - Friday">Monday - Friday (5 Days)</option>
                      <option value="Monday - Saturday">Monday - Saturday (6 Days)</option>
                      <option value="Tuesday - Saturday">Tuesday - Saturday (6 Days)</option>
                      <option value="Sunday - Thursday">Sunday - Thursday (5 Days)</option>
                      <option value="Monday - Sunday">Monday - Sunday (7 Days)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Time In</label>
                      <input
                        type="time"
                        value={customShift.time_in}
                        onChange={(e) => setCustomShift({ ...customShift, time_in: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Time Out</label>
                      <input
                        type="time"
                        value={customShift.time_out}
                        onChange={(e) => setCustomShift({ ...customShift, time_out: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 hover:text-slate-800 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignMode === 'template' && templates.length === 0}
                  className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all disabled:opacity-40"
                  style={{ backgroundColor: themeColor }}
                >
                  Save Tag
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default HrSchedules;
