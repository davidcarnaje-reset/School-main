import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2, ShieldCheck, AlertTriangle, Sliders, Cpu, UserCheck, Briefcase, Key, Compass, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SchoolPermissionsModal = ({ isOpen, onClose, school }) => {
  const { API_BASE_URL, fetchPermissions } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState([]);
  
  // Accordion state to collapse/expand roles configurations
  const [activeSection, setActiveSection] = useState('hr');

  // Fetch school permissions when modal opens
  useEffect(() => {
    if (isOpen && school) {
      const getPermissions = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`${API_BASE_URL}/schools/${school.id}/permissions`);
          if (res.data.success) {
            setPermissions(res.data.permissions);
          }
        } catch (error) {
          console.error("Error loading school permissions:", error);
        } finally {
          setLoading(false);
        }
      };
      getPermissions();
    }
  }, [isOpen, school]);

  if (!isOpen || !school) return null;

  // Group permissions helper
  const getPermission = (role, moduleName) => {
    return permissions.find(
      (p) => p.role.toLowerCase() === role.toLowerCase() && p.module_name.toLowerCase() === moduleName.toLowerCase()
    );
  };

  // Helper to check if a role itself has any enabled modules
  const isRoleEnabled = (role) => {
    const rolePerms = permissions.filter((p) => p.role.toLowerCase() === role.toLowerCase());
    return rolePerms.some((p) => p.is_enabled === 1);
  };

  const togglePermission = (role, moduleName) => {
    // Interlocking logic for Cashier Payroll vs HR Payroll
    if (role.toLowerCase() === 'cashier' && moduleName.toLowerCase() === 'payroll') {
      const cashierPayrollVal = getPermission('cashier', 'payroll')?.is_enabled;
      if (cashierPayrollVal === 0) { // User wants to turn on Cashier Payroll
        const hrEnabled = isRoleEnabled('hr');
        const hrPayrollVal = getPermission('hr', 'payroll')?.is_enabled;
        
        if (hrEnabled && hrPayrollVal === 1) {
          const confirmText = "May active HR Portal at Payroll na para sa campus na ito. Sigurado ka bang gusto mong i-enable din ang Payroll module sa Cashier?\n\n(Why do you need to turn on this module on the Cashier?)";
          if (!window.confirm(confirmText)) {
            return; // Cancel action
          }
        }
      }
    }

    setPermissions((prev) =>
      prev.map((p) => {
        if (p.role.toLowerCase() === role.toLowerCase() && p.module_name.toLowerCase() === moduleName.toLowerCase()) {
          return { ...p, is_enabled: p.is_enabled === 1 ? 0 : 1 };
        }
        return p;
      })
    );
  };

  // Toggle all modules for a role (Enable/Disable Portal Role)
  const toggleRoleStatus = (role, enable) => {
    // Interlocking logic: if enabling HR, automatically disable Cashier Payroll and enable HR Payroll/Employees
    if (role.toLowerCase() === 'hr' && enable) {
      setPermissions((prev) =>
        prev.map((p) => {
          if (p.role.toLowerCase() === 'hr') {
            return { ...p, is_enabled: 1 }; // Enable all HR modules
          }
          if (p.role.toLowerCase() === 'cashier' && p.module_name.toLowerCase() === 'payroll') {
            return { ...p, is_enabled: 0 }; // Auto-disable Cashier payroll
          }
          return p;
        })
      );
      return;
    }

    setPermissions((prev) =>
      prev.map((p) => {
        if (p.role.toLowerCase() === role.toLowerCase()) {
          return { ...p, is_enabled: enable ? 1 : 0 };
        }
        return p;
      })
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await axios.post(`${API_BASE_URL}/schools/${school.id}/permissions`, {
        permissions: permissions
      });
      if (res.data.success) {
        fetchPermissions(school.id);
        alert("Campus role configuration and modules updated successfully!");
        onClose();
      }
    } catch (error) {
      console.error("Error saving school permissions:", error);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // User-friendly module descriptions
  const moduleLabels = {
    students: "Student Masterlist",
    programs: "Academic Programs",
    subjects: "Subject Curriculum",
    assignments: "Teacher Assignments",
    enrollment: "Enrollment Module",
    requests: "Student Document Requests",
    scholarships: "Scholarship Applications",
    sections: "Section Registry",
    grades: "Grade Recording Sheets",
    billing: "Student Tuition Billing",
    payments: "Process Daily Payments",
    fees: "Tuition Fee Catalog",
    scholarship_catalog: "Scholarship Tiers Catalog",
    reports: "Collection Reports",
    payroll: "Employee Payroll Registry",
    employees: "Staff Directory",
    attendance: "DTR Attendance Logs",
    infrastructure: "Network Infrastructure",
    security: "Security Logs & Audits",
    support: "Tech Support Tickets",
    utilities: "Utility Bills (Zap)",
    contracts: "Third Party Contracts",
    facilities: "Facility Logs & Maintenance",
    inventory: "Equipment & Supplies Inventory",
    maintenance: "Asset Inspections Coordination",
    assets: "Room Assets & Keys Logs"
  };

  const rolesConfig = [
    {
      key: 'hr',
      title: 'Human Resource Portal (HR)',
      description: 'Faculty employees directory, payroll sheets, and DTR logs.',
      icon: <UserCheck className="text-blue-600" size={20} />,
      modules: ['employees', 'payroll', 'attendance']
    },
    {
      key: 'cashier',
      title: 'Finance & Cashier Portal',
      description: 'Tuition fees billing, payment transaction collections, and payroll logs.',
      icon: <Briefcase className="text-emerald-500" size={20} />,
      modules: ['billing', 'payments', 'fees', 'scholarships', 'scholarship_catalog', 'reports', 'payroll']
    },
    {
      key: 'registrar',
      title: 'Registrar & Academics Portal',
      description: 'Student enrollments, curriculum registry, and academic documents management.',
      icon: <GraduationCap className="text-indigo-600" size={20} />,
      modules: ['students', 'programs', 'subjects', 'assignments', 'enrollment', 'requests', 'scholarships', 'sections', 'grades']
    },
    {
      key: 'it',
      title: 'IT & System Admin Portal',
      description: 'System servers infrastructure, network security health, and support ticketing.',
      icon: <Cpu className="text-slate-700" size={20} />,
      modules: ['infrastructure', 'security', 'support']
    },
    {
      key: 'school_admin',
      title: 'School Operations Admin',
      description: 'Electricity & utility bills, third-party vendor agreements, and facilities coordinate.',
      icon: <Compass className="text-violet-600" size={20} />,
      modules: ['utilities', 'contracts', 'facilities']
    },
    {
      key: 'custodian',
      title: 'Property Custodian Portal',
      description: 'Supplies inventories, damage inspections coordination, and classroom assets tracking.',
      icon: <Key className="text-amber-600" size={20} />,
      modules: ['inventory', 'maintenance', 'assets']
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
              <Sliders size={22} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">Roles & Module Config</h2>
              <p className="text-slate-400 text-xs font-medium mt-0.5">Manage modular features for <span className="text-blue-600 font-bold">{school.name}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-6">
          {loading ? (
            <div className="h-80 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="text-sm font-bold uppercase tracking-widest">Loading configuration...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rolesConfig.map((roleObj) => {
                const isExpanded = activeSection === roleObj.key;
                const isEnabled = isRoleEnabled(roleObj.key);

                return (
                  <div 
                    key={roleObj.key}
                    className={`border rounded-3xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-blue-200 shadow-lg shadow-blue-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  >
                    {/* ACCORDION HEADER */}
                    <div 
                      className={`p-5 flex items-center justify-between gap-4 cursor-pointer select-none ${isExpanded ? 'bg-blue-50/20' : 'bg-white'}`}
                      onClick={() => setActiveSection(isExpanded ? null : roleObj.key)}
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 shadow-sm">
                          {roleObj.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-800 tracking-tight leading-tight">{roleObj.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                              {isEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] font-medium mt-1 leading-normal line-clamp-1">{roleObj.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        {/* Global Switch for the role */}
                        <button
                          type="button"
                          onClick={() => toggleRoleStatus(roleObj.key, !isEnabled)}
                          className={`w-11 h-6.5 rounded-full p-0.5 transition-all duration-300 ${isEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                          <div className={`w-5.5 h-5.5 rounded-full bg-white transition-all transform ${isEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
                        </button>
                        
                        <div 
                          className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
                          onClick={() => setActiveSection(isExpanded ? null : roleObj.key)}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>

                    {/* ACCORDION CONTENT */}
                    {isExpanded && (
                      <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        {/* Auto payroll disabled warning badge */}
                        {roleObj.key === 'hr' && isEnabled && (
                          <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl flex items-start gap-2 text-xs font-bold leading-relaxed">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-blue-600" />
                            <span>
                              Ang pag-enable sa HR portal ay awtomatikong magdi-disable sa <strong>Payroll module sa Cashier</strong> upang maiwasan ang conflict.
                            </span>
                          </div>
                        )}

                        {!isEnabled ? (
                          <div className="py-6 text-center text-slate-400 text-xs font-bold uppercase tracking-wider bg-white rounded-2xl border border-slate-100">
                            I-enable ang role sa itaas upang pamahalaan ang mga modules nito.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {permissions
                              .filter((p) => p.role.toLowerCase() === roleObj.key.toLowerCase())
                              .map((p) => (
                                <div key={p.module_name} className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                  <div className="flex-1 min-w-0 pr-2">
                                    <span className="text-xs font-bold text-slate-700 block truncate">{moduleLabels[p.module_name] || p.module_name}</span>
                                    {p.role.toLowerCase() === 'cashier' && p.module_name.toLowerCase() === 'payroll' && isRoleEnabled('hr') && getPermission('hr', 'payroll')?.is_enabled === 1 && (
                                      <span className="text-[9px] text-amber-600 font-bold block mt-0.5">⚠️ Active din sa HR Portal</span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => togglePermission(roleObj.key, p.module_name)}
                                    className={`w-9 h-5.5 rounded-full p-0.5 transition-all duration-300 ${p.is_enabled === 1 ? 'bg-blue-600' : 'bg-slate-200'}`}
                                  >
                                    <div className={`w-4.5 h-4.5 rounded-full bg-white transition-all transform ${p.is_enabled === 1 ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-6 md:p-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
          <button 
            onClick={onClose} 
            disabled={saving}
            className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading || saving}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-200 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {saving && <Loader2 className="animate-spin" size={14} />}
            Save Settings
          </button>
        </div>

      </div>
    </div>
  );
};

export default SchoolPermissionsModal;
