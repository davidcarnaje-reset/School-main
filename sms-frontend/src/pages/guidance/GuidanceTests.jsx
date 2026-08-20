import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ClipboardList, Search, RefreshCw, X, Eye, 
  HelpCircle, CheckCircle2, User, Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const GuidanceTests = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [testFilter, setTestFilter] = useState('ALL');

  // Detail Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  const fetchAllTests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/guidance/all-tests`);
      if (res.data && res.data.success) {
        setTests(res.data.data);
      }
    } catch (err) {
      console.error("Fetch all tests error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTests();
  }, [API_BASE_URL]);

  const viewDetails = (res) => {
    let scores = {};
    try {
      scores = typeof res.raw_scores_json === 'string' ? JSON.parse(res.raw_scores_json) : res.raw_scores_json;
    } catch (e) {
      scores = res.raw_scores_json || {};
    }
    setSelectedResult({ ...res, scores });
    setShowDetailModal(true);
  };

  const filteredTests = tests.filter(t => {
    const matchesSearch = 
      t.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.personality_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = testFilter === 'ALL' || t.test_type === testFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Psychological Test Records</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Inspect student personality assessments, DISC profile percentages, and psychological traits.
            </p>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student or personality..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700"
          />
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 w-full md:w-auto">
          <ClipboardList size={14} className="text-slate-400 ml-1" />
          <select
            value={testFilter}
            onChange={(e) => setTestFilter(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer w-full md:w-auto"
          >
            <option value="ALL">All Test Types</option>
            <option value="DISC">DISC Assessment</option>
            <option value="MBTI">Personality Test</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-4">Student</th>
                <th className="p-4">Assessment</th>
                <th className="p-4">Archetype / Result</th>
                <th className="p-4">Taken Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400 font-semibold">
                    <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                    Loading assessments...
                  </td>
                </tr>
              ) : filteredTests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400 font-medium">
                    No psychological test records found.
                  </td>
                </tr>
              ) : (
                filteredTests.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{res.student_name}</div>
                      <div className="text-[10px] font-bold text-slate-400">{res.student_id} • Grade {res.grade_level}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        res.test_type === 'DISC' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {res.test_type === 'DISC' ? 'DISC Profile' : 'Personality Test'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700">{res.personality_type}</td>
                    <td className="p-4 text-xs text-slate-500 font-semibold">{res.taken_at}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => viewDetails(res)}
                        className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all"
                        title="View Detailed Results"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL VIEW MODAL */}
      {showDetailModal && selectedResult && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Award className="text-blue-600" size={18} />
                <span>Assessment Detail File</span>
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="pb-4 border-b border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400">Student Profile</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{selectedResult.student_name}</p>
                <p className="text-xs text-slate-500 font-semibold">{selectedResult.student_id} • Grade {selectedResult.grade_level}</p>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Test Type & Result Archetype</p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-700">{selectedResult.test_type} Personality Assessment</p>
                    <p className="text-lg font-black text-blue-600 mt-0.5">{selectedResult.personality_type}</p>
                  </div>
                  <ClipboardList size={30} className="text-slate-300" />
                </div>
              </div>

              {/* Score percentages rendering */}
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-3">Scores Breakdown</p>
                <div className="space-y-3">
                  {Object.entries(selectedResult.scores).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span className="capitalize">{key}</span>
                        <span>{val}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-blue-800">Counselor evaluation tip</p>
                <p className="text-[11px] text-blue-600 leading-relaxed mt-1">
                  You can use these psychological assessment results to guide session interactions, adapt your guidance style, and support student stress/bullying coping behaviors.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GuidanceTests;
