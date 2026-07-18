import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, Search, RefreshCw, Calendar, Clock, User, 
  Tag, Compass, Info, X, ShieldAlert, Monitor, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminAuditLogs = () => {
  const { API_BASE_URL, branding } = useAuth();
  const themeColor = branding?.theme_color || '#6366f1';

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [actionTypes, setActionTypes] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 12;

  useEffect(() => {
    fetchLogs();
  }, [search, selectedRole, selectedAction]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/audit-logs`, {
        params: {
          search,
          user_role: selectedRole,
          action_type: selectedAction
        }
      });
      if (response.data.success) {
        const fetchedLogs = response.data.logs || [];
        setLogs(fetchedLogs);
        
        // Extract unique actions dynamically for the dropdown
        const actions = [...new Set(fetchedLogs.map(l => l.action_type))];
        if (actionTypes.length === 0) {
          setActionTypes(actions);
        }
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedRole('');
    setSelectedAction('');
    setCurrentPage(1);
  };

  // Helper: Get badge colors based on action category
  const getActionBadgeStyle = (action) => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('DEACTIVATE')) {
      return 'bg-rose-50 text-rose-600 border-rose-200';
    }
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('REGISTER') || act.includes('ENCODE')) {
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    }
    if (act.includes('UPDATE') || act.includes('SAVE') || act.includes('EDIT') || act.includes('SET')) {
      return 'bg-amber-50 text-amber-600 border-amber-200';
    }
    if (act.includes('LOGIN')) {
      return 'bg-blue-50 text-blue-600 border-blue-200';
    }
    return 'bg-purple-50 text-purple-600 border-purple-200';
  };

  // Helper: Format action text for readability
  const formatActionText = (action) => {
    return action.replace(/_/g, ' ');
  };

  // Helper: Format timezone-safe date string
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Pagination calculation
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-indigo-600" size={36} style={{ color: themeColor }} />
            System Audit Trail Logs
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            Real-time tracking of security-sensitive administrative adjustments, logins, cashier entries, and registrar activities.
          </p>
        </div>
        
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-5 py-3 text-sm font-bold text-slate-600 bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 rounded-2xl transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Trail
        </button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* TOTAL EVENTS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl flex items-center gap-5">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl" style={{ backgroundColor: `${themeColor}10`, color: themeColor }}>
            <Compass size={24} />
          </div>
          <div>
            <h4 className="text-slate-400 text-xs font-black uppercase tracking-wider">Total Logs Captured</h4>
            <p className="text-3xl font-black text-slate-800 mt-1">{logs.length}</p>
          </div>
        </div>

        {/* DISTINCT USERS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl flex items-center gap-5">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <User size={24} />
          </div>
          <div>
            <h4 className="text-slate-400 text-xs font-black uppercase tracking-wider">Unique Actors</h4>
            <p className="text-3xl font-black text-slate-800 mt-1">
              {[...new Set(logs.map(l => l.user_id))].length}
            </p>
          </div>
        </div>

        {/* DISTINCT ACTIONS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl flex items-center gap-5">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <Tag size={24} />
          </div>
          <div>
            <h4 className="text-slate-400 text-xs font-black uppercase tracking-wider">Action Variations</h4>
            <p className="text-3xl font-black text-slate-800 mt-1">
              {[...new Set(logs.map(l => l.action_type))].length}
            </p>
          </div>
        </div>

      </div>

      {/* FILTERS & SEARCH CONTROLS */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl space-y-4">
        <div className="flex flex-col xl:flex-row gap-4">
          
          {/* SEARCH BAR */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search description, action, or IP host..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 rounded-2xl outline-none text-sm transition-all font-semibold placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* ROLE FILTER */}
            <select
              value={selectedRole}
              onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
              className="px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold text-slate-600 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="Admin">Admin / System Manager</option>
              <option value="Registrar">Registrar Personnel</option>
              <option value="Cashier">Cashier Personnel</option>
              <option value="Teacher">Teacher / Instructor</option>
              <option value="student">Student / Portal Access</option>
            </select>

            {/* ACTION TYPE FILTER */}
            <select
              value={selectedAction}
              onChange={(e) => { setSelectedAction(e.target.value); setCurrentPage(1); }}
              className="px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold text-slate-600 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">All Action Types</option>
              {actionTypes.map(type => (
                <option key={type} value={type}>{formatActionText(type)}</option>
              ))}
            </select>

            {/* RESET BUTTON */}
            {(search || selectedRole || selectedAction) && (
              <button
                onClick={resetFilters}
                className="flex items-center justify-center gap-2 py-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 hover:border-rose-200 text-rose-600 font-bold rounded-2xl text-sm transition-all"
              >
                <X size={16} />
                Clear Filters
              </button>
            )}

          </div>

        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-5 px-6 text-xs font-black uppercase text-slate-400 tracking-wider">Date & Time</th>
                <th className="py-5 px-6 text-xs font-black uppercase text-slate-400 tracking-wider">Action Type</th>
                <th className="py-5 px-6 text-xs font-black uppercase text-slate-400 tracking-wider">Actor / System User</th>
                <th className="py-5 px-6 text-xs font-black uppercase text-slate-400 tracking-wider">Event Details</th>
                <th className="py-5 px-6 text-xs font-black uppercase text-slate-400 tracking-wider">Network Info</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-indigo-600" size={32} style={{ color: themeColor }} />
                      <p className="text-sm font-bold text-slate-400">Loading audit records from database...</p>
                    </div>
                  </td>
                </tr>
              ) : currentLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-24 text-center">
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="p-4 bg-slate-50 rounded-full w-fit mx-auto text-slate-400">
                        <ShieldAlert size={40} />
                      </div>
                      <h3 className="text-lg font-black text-slate-700">No logs matching filters</h3>
                      <p className="text-sm font-medium text-slate-400 leading-relaxed">
                        Try modifying search key phrase, clearing filters, or checking if any operations occurred on selected role profile.
                      </p>
                      {(search || selectedRole || selectedAction) && (
                        <button
                          onClick={resetFilters}
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
                          style={{ backgroundColor: themeColor }}
                        >
                          Clear Active Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                currentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                    
                    {/* TIMESTAMP */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-xs font-bold">{formatDateTime(log.timestamp)}</span>
                      </div>
                    </td>

                    {/* ACTION BADGE */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`px-3 py-1.5 border rounded-lg text-[10px] font-black tracking-wider uppercase ${getActionBadgeStyle(log.action_type)}`}>
                        {formatActionText(log.action_type)}
                      </span>
                    </td>

                    {/* ACTOR PROFILE */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                          {log.actor_name ? log.actor_name.charAt(0).toUpperCase() : <User size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {log.actor_name || 'System Auto'}
                          </p>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 mt-0.5 inline-block rounded-md ${
                            log.user_role === 'student' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {log.user_role} (ID: {log.user_id})
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* EVENT DESCRIPTION */}
                    <td className="py-4 px-6 max-w-[450px]">
                      <div className="flex items-start gap-2">
                        <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-sm font-semibold text-slate-600 leading-relaxed break-words">
                          {log.description}
                        </p>
                      </div>
                    </td>

                    {/* IP ADDRESS */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Monitor size={14} className="text-slate-400" />
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          {log.ip_address || 'Local Host'}
                        </span>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        {!loading && logs.length > logsPerPage && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs font-semibold text-slate-400">
              Showing <span className="font-bold text-slate-700">{indexOfFirstLog + 1}</span> to <span className="font-bold text-slate-700">{Math.min(indexOfLastLog, logs.length)}</span> of <span className="font-bold text-slate-700">{logs.length}</span> security entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-100 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              
              {/* Dynamic Pages */}
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNum = index + 1;
                // Only show current, adjacent pages and first/last page
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-black transition-colors ${
                        currentPage === pageNum 
                          ? 'text-white' 
                          : 'border border-slate-100 text-slate-600 hover:bg-slate-100'
                      }`}
                      style={currentPage === pageNum ? { backgroundColor: themeColor } : {}}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} className="text-slate-400 text-xs px-1">...</span>;
                }
                return null;
              })}

              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-100 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminAuditLogs;
