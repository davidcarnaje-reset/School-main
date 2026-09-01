import React, { useState, useEffect } from 'react';
import { UserCheck, CheckCircle2, Clipboard, Search, X, CheckSquare, Square, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const HrOnboarding = () => {
  const { branding, API_BASE_URL } = useAuth();
  const themeColor = branding?.theme_color || '#2563eb';

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cashier/payroll/employees`);
      if (res.data) {
        // Map to onboarding candidates dynamically based on database properties
        const list = res.data.map(emp => {
          const steps = [
            { name: "Sign employment contract agreement", done: emp.status === 'Active' },
            { name: "IT Portal credentials generated", done: emp.status === 'Active' },
            { name: "PSA birth certificate uploaded", done: emp.psa_status === 'Submitted' },
            { name: "NBI Clearance document submitted", done: emp.nbi_status === 'Submitted' },
            { name: "Statutory accounts setup (SSS / TIN)", done: (emp.sss_number && emp.tin_number) ? true : false }
          ];
          return {
            id: emp.employee_id,
            name: `${emp.first_name} ${emp.last_name}`,
            role: emp.position,
            steps
          };
        });
        setCandidates(list);
      }
    } catch (err) {
      console.error("Error loading onboarding candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Dynamic progress calculator
  const getProgress = (candidate) => {
    if (!candidate.steps || candidate.steps.length === 0) return 0;
    const completed = candidate.steps.filter(s => s.done).length;
    return Math.round((completed / candidate.steps.length) * 100);
  };

  // Toggle checklist step
  const handleToggleStep = (candidateId, stepIdx) => {
    const updated = candidates.map(c => {
      if (c.id === candidateId) {
        const nextSteps = [...c.steps];
        nextSteps[stepIdx] = { ...nextSteps[stepIdx], done: !nextSteps[stepIdx].done };
        return { ...c, steps: nextSteps };
      }
      return c;
    });
    setCandidates(updated);
    
    // Update selected candidate state to refresh modal view
    const match = updated.find(c => c.id === candidateId);
    if (match) setSelectedCandidate(match);
  };

  // Filter candidates
  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <UserCheck className="text-blue-600" size={32} style={{ color: themeColor }} />
            New Hire Onboarding Tracker
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Monitor checklists, account setup steps, and onboarding progress for new staff.</p>
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search employees or roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* TABLE WORKSPACE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-semibold">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Employee ID</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Employee Name</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Role / Department</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Progress</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-wider">Checklist Status</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-bold uppercase tracking-wider">
                    <Loader2 className="animate-spin text-blue-600 inline mr-2" size={16} style={{ color: themeColor }} /> Loading Candidates...
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-bold">No onboarding records found.</td>
                </tr>
              ) : (
                filteredCandidates.map((c) => {
                  const progress = getProgress(c);
                  const totalSteps = c.steps.length;
                  const doneSteps = c.steps.filter(s => s.done).length;
                  
                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => setSelectedCandidate(c)}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 pr-2 font-mono font-bold text-slate-400">{c.id}</td>
                      <td className="py-4 pr-2 font-black text-slate-800 text-sm">{c.name}</td>
                      <td className="py-4 pr-2 text-slate-500 font-bold">{c.role}</td>
                      <td className="py-4 pr-2 w-48">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: themeColor }}></div>
                          </div>
                          <span className="text-[10px] font-mono font-black text-slate-555 w-8">{progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 pr-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          progress === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {doneSteps} of {totalSteps} Done
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidate(c);
                          }}
                          className="px-3.5 py-2 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Manage Checklist
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-2xl w-full max-w-lg space-y-6 relative animate-in zoom-in-95 duration-200">
            {/* CLOSE BUTTON */}
            <button 
              onClick={() => setSelectedCandidate(null)} 
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>

            {/* HEADER */}
            <div className="space-y-1.5 border-b border-slate-100 pb-4">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5" style={{ color: themeColor }}>
                <Clipboard size={12} /> Onboarding Status Details
              </span>
              <h3 className="text-xl font-black text-slate-800">
                {selectedCandidate.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                ID: <span className="font-mono text-slate-600">{selectedCandidate.id}</span> | Role: <span className="text-slate-655">{selectedCandidate.role}</span>
              </p>
            </div>

            {/* COMPLETED PROGRESS BAR */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                <span>Overall Completion</span>
                <span className="font-mono text-slate-700">{getProgress(selectedCandidate)}% Completed</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${getProgress(selectedCandidate)}%`, backgroundColor: themeColor }}></div>
              </div>
            </div>

            {/* CHECKLIST STEPS */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              
              {/* PENDING TASKS SECTION */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Tasks (To-Do)</h4>
                {selectedCandidate.steps.filter(s => !s.done).length === 0 ? (
                  <p className="text-[11px] text-emerald-600 font-bold italic flex items-center gap-1 bg-emerald-50/50 p-2 rounded-xl"><CheckCircle2 size={12} /> All onboarding requirements and tasks completed!</p>
                ) : (
                  selectedCandidate.steps.map((step, idx) => {
                    if (step.done) return null;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => handleToggleStep(selectedCandidate.id, idx)}
                        className="p-3 bg-amber-50/30 border border-amber-100 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-amber-50/60 transition-colors"
                      >
                        <Square className="text-amber-500 shrink-0" size={16} />
                        <span className="text-xs font-semibold text-slate-700 leading-normal">{step.name}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* COMPLETED TASKS SECTION */}
              <div className="space-y-2 pt-2 border-t border-slate-50">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completed Tasks</h4>
                {selectedCandidate.steps.filter(s => s.done).length === 0 ? (
                  <p className="text-[11px] text-slate-400 font-bold italic p-1">No completed tasks yet.</p>
                ) : (
                  selectedCandidate.steps.map((step, idx) => {
                    if (!step.done) return null;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => handleToggleStep(selectedCandidate.id, idx)}
                        className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-slate-100/50 transition-colors"
                      >
                        <CheckSquare className="text-emerald-500 shrink-0" size={16} />
                        <span className="text-xs font-semibold text-slate-400 line-through leading-normal">{step.name}</span>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* ACTION FOOTER */}
            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedCandidate(null)} 
                className="flex-1 py-3 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all"
                style={{ backgroundColor: themeColor }}
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HrOnboarding;
