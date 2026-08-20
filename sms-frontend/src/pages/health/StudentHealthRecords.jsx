import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Search, RefreshCw, X, Eye, CheckCircle2, User,
  Heart, ClipboardList, Plus, Edit3, HeartHandshake, Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StudentHealthRecords = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showCheckHistoryModal, setShowCheckHistoryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Edit Health Profile state
  const [profileForm, setProfileForm] = useState({
    blood_type: '', allergies: '', chronic_illnesses: '',
    emergency_contact_name: '', emergency_contact_no: ''
  });

  // Physical check list & form state
  const [checks, setChecks] = useState([]);
  const [checksLoading, setChecksLoading] = useState(false);
  const [showNewCheckForm, setShowNewCheckForm] = useState(false);
  const [checkForm, setCheckForm] = useState({
    height: '', weight: '', blood_pressure: '', temperature: '',
    check_date: new Date().toISOString().split('T')[0], remarks: ''
  });

  const fetchHealthProfiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/health/profiles`);
      if (res.data && res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthProfiles();
  }, [API_BASE_URL]);

  const triggerEditProfile = (student) => {
    setSelectedStudent(student);
    setProfileForm({
      blood_type: student.blood_type || '',
      allergies: student.allergies || '',
      chronic_illnesses: student.chronic_illnesses || '',
      emergency_contact_name: student.emergency_contact_name || '',
      emergency_contact_no: student.emergency_contact_no || ''
    });
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/health/profiles`, {
        student_id: selectedStudent.student_id,
        ...profileForm
      });
      if (res.data && res.data.success) {
        alert("Student medical profile updated.");
        setShowEditProfileModal(false);
        fetchHealthProfiles();
      }
    } catch (err) {
      alert("Failed to save health profile.");
    }
  };

  const triggerCheckHistory = async (student) => {
    setSelectedStudent(student);
    setShowCheckHistoryModal(true);
    setShowNewCheckForm(false);
    fetchCheckHistory(student.student_id);
  };

  const fetchCheckHistory = async (studentId) => {
    setChecksLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/health/checks/${studentId}`);
      if (res.data && res.data.success) {
        setChecks(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChecksLoading(false);
    }
  };

  const handleCreateCheck = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/health/checks`, {
        student_id: selectedStudent.student_id,
        ...checkForm
      });
      if (res.data && res.data.success) {
        alert(`Recorded checkup. Calculated BMI: ${res.data.bmi} (${res.data.status})`);
        setCheckForm({
          height: '', weight: '', blood_pressure: '', temperature: '',
          check_date: new Date().toISOString().split('T')[0], remarks: ''
        });
        setShowNewCheckForm(false);
        fetchCheckHistory(selectedStudent.student_id);
      }
    } catch (err) {
      alert("Failed to submit checkup details.");
    }
  };

  const filteredStudents = students.filter(s => {
    return (
      s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.allergies?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
            <HeartHandshake size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Student Health Records</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Manage clinical cards, review student allergies, emergency contacts, and record body logs (height/weight/BMI).
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name or allergies..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700"
          />
        </div>
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
          Total: {filteredStudents.length} students
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400 font-semibold">
            <RefreshCw className="animate-spin inline-block mr-2" size={16} />
            Loading profiles...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 font-medium">
            No student health profiles found.
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div key={student.student_id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
              
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{student.student_name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{student.student_id} • Grade {student.grade_level}</p>
                  </div>
                  {student.blood_type && (
                    <span className="px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-[10px] font-black text-rose-600">
                      Type {student.blood_type}
                    </span>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-semibold">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Allergies:</p>
                    <p className={`mt-0.5 text-xs ${student.allergies ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                      {student.allergies || "None logged"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Chronic Illnesses:</p>
                    <p className="mt-0.5 text-slate-600 font-bold">{student.chronic_illnesses || "None logged"}</p>
                  </div>
                  {student.emergency_contact_name && (
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-[11px]">
                      <p className="text-[9px] font-black uppercase text-slate-400">Emergency contact:</p>
                      <p className="text-slate-600 font-bold mt-0.5">{student.emergency_contact_name} ({student.emergency_contact_no})</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  onClick={() => triggerEditProfile(student)}
                  className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all flex items-center gap-1 text-[11px] font-bold"
                  title="Update Health Profile"
                >
                  <Edit3 size={14} />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => triggerCheckHistory(student)}
                  className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-1 text-[11px] font-bold"
                  title="Physical Checkups / BMI Logs"
                >
                  <ClipboardList size={14} />
                  <span>Physical Checkups</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditProfileModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <HeartHandshake className="text-rose-500" size={18} />
              <span>Update Student Health Profile</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">{selectedStudent.student_name} ({selectedStudent.student_id})</p>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Blood Type</label>
                  <input 
                    type="text"
                    placeholder="O+, A-, etc."
                    value={profileForm.blood_type}
                    onChange={(e) => setProfileForm({...profileForm, blood_type: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Emergency Name</label>
                  <input 
                    type="text"
                    placeholder="Parent / Guardian name"
                    value={profileForm.emergency_contact_name}
                    onChange={(e) => setProfileForm({...profileForm, emergency_contact_name: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Emergency contact No.</label>
                <input 
                  type="text"
                  placeholder="Mobile phone number"
                  value={profileForm.emergency_contact_no}
                  onChange={(e) => setProfileForm({...profileForm, emergency_contact_no: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Allergies (comma separated)</label>
                <textarea 
                  rows={2}
                  placeholder="Peanuts, Seafood, Penicillin, etc."
                  value={profileForm.allergies}
                  onChange={(e) => setProfileForm({...profileForm, allergies: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Chronic Illnesses</label>
                <textarea 
                  rows={2}
                  placeholder="Asthma, Diabetes, Congenital heart issues..."
                  value={profileForm.chronic_illnesses}
                  onChange={(e) => setProfileForm({...profileForm, chronic_illnesses: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition-all shadow-md"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECK HISTORY / RECORD NEW CHECKUP MODAL */}
      {showCheckHistoryModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ClipboardList className="text-emerald-500" size={18} />
                  <span>Physical Health Check Records</span>
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">{selectedStudent.student_name} ({selectedStudent.student_id})</p>
              </div>
              <button onClick={() => setShowCheckHistoryModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Record check header */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Historical Logs</span>
                {!showNewCheckForm ? (
                  <button 
                    onClick={() => setShowNewCheckForm(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Log New Check</span>
                  </button>
                ) : (
                    <button 
                      onClick={() => setShowNewCheckForm(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl transition-all"
                    >
                      Hide Form
                    </button>
                )}
              </div>

              {/* Form to log checkup */}
              {showNewCheckForm && (
                <form onSubmit={handleCreateCheck} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Height (cm) *</label>
                    <input 
                      type="number" step="0.1" required placeholder="e.g. 165"
                      value={checkForm.height} onChange={(e) => setCheckForm({...checkForm, height: e.target.value})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Weight (kg) *</label>
                    <input 
                      type="number" step="0.1" required placeholder="e.g. 58"
                      value={checkForm.weight} onChange={(e) => setCheckForm({...checkForm, weight: e.target.value})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Blood Pressure</label>
                    <input 
                      type="text" placeholder="e.g. 120/80"
                      value={checkForm.blood_pressure} onChange={(e) => setCheckForm({...checkForm, blood_pressure: e.target.value})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Temperature (°C)</label>
                    <input 
                      type="number" step="0.1" placeholder="e.g. 36.5"
                      value={checkForm.temperature} onChange={(e) => setCheckForm({...checkForm, temperature: e.target.value})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Date of check *</label>
                    <input 
                      type="date" required max={new Date().toLocaleDateString('en-CA')}
                      value={checkForm.check_date} onChange={(e) => setCheckForm({...checkForm, check_date: e.target.value})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Observations / Remarks</label>
                    <textarea 
                      rows={2} placeholder="Observations, posture details, physical state..."
                      value={checkForm.remarks} onChange={(e) => setCheckForm({...checkForm, remarks: e.target.value})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="col-span-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md mt-2 flex items-center justify-center gap-1 transition-all"
                  >
                    <Save size={14} />
                    <span>Save Physical Checkup Log</span>
                  </button>
                </form>
              )}

              {/* Table check records */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="p-3">Check Date</th>
                      <th className="p-3">Height / Weight</th>
                      <th className="p-3">BMI / Status</th>
                      <th className="p-3">BP / Temp</th>
                      <th className="p-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {checksLoading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-slate-400">Loading checkup logs...</td>
                      </tr>
                    ) : checks.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-slate-400">No physical checks logged yet.</td>
                      </tr>
                    ) : (
                      checks.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{c.check_date}</td>
                          <td className="p-3">{c.height ? `${c.height}cm` : '-'} / {c.weight ? `${c.weight}kg` : '-'}</td>
                          <td className="p-3">
                            <div>{c.bmi ? `${c.bmi} BMI` : '-'}</div>
                            {c.bmi && (
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase mt-0.5 ${
                                c.status === 'Healthy' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                c.status === 'Needs Attention' ? 'bg-red-50 text-red-600 border border-red-100' :
                                'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>
                                {c.status}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div>BP: {c.blood_pressure || '-'}</div>
                            <div className="mt-0.5 text-slate-400">Temp: {c.temperature ? `${c.temperature}°C` : '-'}</div>
                          </td>
                          <td className="p-3 text-[11px] text-slate-500 italic max-w-xs truncate" title={c.remarks}>{c.remarks || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentHealthRecords;
