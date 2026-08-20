import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { 
  Heart, Calendar, AlertTriangle, ClipboardList, RefreshCw, 
  Plus, CheckCircle, ShieldAlert, Clock, HelpCircle, BarChart2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const discQuestions = [
  {
    id: 1,
    question: "When facing a new project or challenge, your main focus is to:",
    options: [
      { text: "Achieve quick results and overcome obstacles directly.", trait: "D" },
      { text: "Get others excited, brainstorm together, and collaborate.", trait: "I" },
      { text: "Maintain a steady pace and support team consensus.", trait: "S" },
      { text: "Analyze the requirements, details, and guidelines carefully.", trait: "C" }
    ]
  },
  {
    id: 2,
    question: "In a group discussion, you typically:",
    options: [
      { text: "Take the lead and set clear goals/tasks.", trait: "D" },
      { text: "Keep the mood light, share stories, and motivate others.", trait: "I" },
      { text: "Listen carefully, agree on details, and offer quiet support.", trait: "S" },
      { text: "Ask clarifying questions and point out potential errors.", trait: "C" }
    ]
  },
  {
    id: 3,
    question: "Under stress or high pressure, you are most likely to:",
    options: [
      { text: "Become impatient, demanding, or take control of everything.", trait: "D" },
      { text: "Over-promise, talk rapidly, or become overly expressive.", trait: "I" },
      { text: "Become quiet, resist sudden changes, and seek security.", trait: "S" },
      { text: "Double-check work, become hyper-critical, or retreat to analyze.", trait: "C" }
    ]
  },
  {
    id: 4,
    question: "Which behavior best describes your communication style?",
    options: [
      { text: "Direct, concise, and focused on the bottom line.", trait: "D" },
      { text: "Enthusiastic, talkative, and engaging.", trait: "I" },
      { text: "Warm, empathetic, and an active listener.", trait: "S" },
      { text: "Precise, structured, and fact-focused.", trait: "C" }
    ]
  },
  {
    id: 5,
    question: "What motivates you the most in a school setting?",
    options: [
      { text: "Winning competitions, achieving goals, and independence.", trait: "D" },
      { text: "Social recognition, popular status, and group activities.", trait: "I" },
      { text: "Sincere appreciation, stability, and peaceful surroundings.", trait: "S" },
      { text: "High marks, quality standards, and intellectual tasks.", trait: "C" }
    ]
  },
  {
    id: 6,
    question: "When others disagree with you, your immediate reaction is to:",
    options: [
      { text: "Defend your position and argue for your point of view.", trait: "D" },
      { text: "Use charm and persuasion to influence their thinking.", trait: "I" },
      { text: "Avoid arguments and try to find a middle ground.", trait: "S" },
      { text: "Present logical data, facts, and documentation.", trait: "C" }
    ]
  },
  {
    id: 7,
    question: "In your daily activities, you prefer environments that are:",
    options: [
      { text: "Fast-paced, challenging, and filled with opportunities.", trait: "D" },
      { text: "Dynamic, fun, and highly collaborative.", trait: "I" },
      { text: "Predictable, stable, and harmonious.", trait: "S" },
      { text: "Orderly, quiet, and detail-oriented.", trait: "C" }
    ]
  },
  {
    id: 8,
    question: "If you have to make a decision, you rely mostly on:",
    options: [
      { text: "Instinct, speed, and overall outcomes.", trait: "D" },
      { text: "Feelings, opinions, and how it affects relationships.", trait: "I" },
      { text: "Consensus, timing, and past experiences.", trait: "S" },
      { text: "Logic, data, and structured analysis.", trait: "C" }
    ]
  },
  {
    id: 9,
    question: "Others would describe you as:",
    options: [
      { text: "Assertive, bold, and goal-driven.", trait: "D" },
      { text: "Outgoing, friendly, and inspiring.", trait: "I" },
      { text: "Dependable, calm, and cooperative.", trait: "S" },
      { text: "Logical, thorough, and careful.", trait: "C" }
    ]
  },
  {
    id: 10,
    question: "Your attitude towards rules and guidelines is:",
    options: [
      { text: "Rules can be challenged if they slow down progress.", trait: "D" },
      { text: "Rules are good but shouldn't hinder creativity.", trait: "I" },
      { text: "Rules provide safety and should be followed steadily.", trait: "S" },
      { text: "Rules are critical and must be strictly maintained.", trait: "C" }
    ]
  }
];

const StudentGuidance = () => {
  const { user, branding, API_BASE_URL } = useAuth();
  const [activeTab, setActiveTab] = useState('tests'); // 'tests', 'appointments', 'incidents'
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Appointments
  const [appointments, setAppointments] = useState([]);
  const [apptForm, setApptForm] = useState({ appointment_date: '', appointment_time: '', reason: '' });
  const [showApptModal, setShowApptModal] = useState(false);

  // Incidents
  const [incidentForm, setIncidentForm] = useState({ incident_date: '', details: '', is_anonymous: false });
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  // Test State
  const [testHistory, setTestHistory] = useState([]);
  const [isTakingTest, setIsTakingTest] = useState(false);
  const [testAnswers, setTestAnswers] = useState({});
  const [testResults, setTestResults] = useState(null);

  const fetchStudentData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/student/get_students.php`);
      const studentsList = res.data.students || [];
      const myData = studentsList.find(s => s.email === user.email);
      if (myData) {
        setStudentData(myData);
        fetchAppointments(myData.student_id);
        fetchTestHistory(myData.student_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.email, API_BASE_URL]);

  const fetchAppointments = async (studentId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/guidance/student-appointments?student_id=${studentId}`);
      if (res.data && res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchTestHistory = async (studentId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/guidance/student-tests?student_id=${studentId}`);
      if (res.data && res.data.success) {
        setTestHistory(res.data.data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user?.email) {
      fetchStudentData();
    }
  }, [user?.email, fetchStudentData]);

  const handleBookAppt = async (e) => {
    e.preventDefault();
    if (!studentData) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/guidance/appointments`, {
        student_id: studentData.student_id,
        ...apptForm
      });
      if (res.data && res.data.success) {
        alert("Session request submitted successfully to Guidance.");
        setShowApptModal(false);
        setApptForm({ appointment_date: '', appointment_time: '', reason: '' });
        fetchAppointments(studentData.student_id);
      }
    } catch (err) { alert("Failed to book appointment."); }
  };

  const handleReportIncident = async (e) => {
    e.preventDefault();
    if (!studentData) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/guidance/incidents`, {
        student_id: studentData.student_id,
        ...incidentForm
      });
      if (res.data && res.data.success) {
        alert("Incident logged. Rest assured it will be reviewed carefully.");
        setShowIncidentModal(false);
        setIncidentForm({ incident_date: '', details: '', is_anonymous: false });
      }
    } catch (err) { alert("Failed to submit report."); }
  };

  // DISC scoring logic
  const handleAnswerSelect = (questionId, trait) => {
    setTestAnswers({ ...testAnswers, [questionId]: trait });
  };

  const handleSubmitTest = async () => {
    if (Object.keys(testAnswers).length < discQuestions.length) {
      alert("Please answer all behavior questions before submitting.");
      return;
    }

    // Count traits
    const counts = { D: 0, I: 0, S: 0, C: 0 };
    Object.values(testAnswers).forEach(t => {
      counts[t]++;
    });

    const total = discQuestions.length;
    const scores = {
      D: Math.round((counts.D / total) * 100),
      I: Math.round((counts.I / total) * 100),
      S: Math.round((counts.S / total) * 100),
      C: Math.round((counts.C / total) * 100)
    };

    // Determine highest trait
    let maxTrait = 'D';
    let maxVal = -1;
    Object.entries(scores).forEach(([trait, val]) => {
      if (val > maxVal) {
        maxVal = val;
        maxTrait = trait;
      }
    });

    const archetypes = {
      D: "Dominance (D-Type) • Goal-oriented, decisive, and direct.",
      I: "Influence (I-Type) • Inspiring, energetic, and collaborative.",
      S: "Steadiness (S-Type) • Steady, supportive, and dependable.",
      C: "Conscientiousness (C-Type) • Logical, analytical, and precise."
    };

    const finalArchetype = archetypes[maxTrait];

    try {
      const res = await axios.post(`${API_BASE_URL}/guidance/submit-test`, {
        student_id: studentData.student_id,
        test_type: 'DISC',
        raw_scores_json: scores,
        personality_type: finalArchetype
      });

      if (res.data && res.data.success) {
        setTestResults({ scores, archetype: finalArchetype });
        setIsTakingTest(false);
        setTestAnswers({});
        fetchTestHistory(studentData.student_id);
      }
    } catch (err) { alert("Failed to submit test results."); }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <RefreshCw className="animate-spin mr-2" />
        <span className="font-bold text-sm">Loading Guidance Center...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
            <Heart size={28} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Guidance & Support Center</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Take behavioral assessments, schedule a meeting with a guidance counselor, or report incident disclosures.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-2">
        <button
          onClick={() => { setActiveTab('tests'); setTestResults(null); }}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'tests' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'
          }`}
        >
          <ClipboardList size={16} />
          <span>Personality Assessments</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'appointments' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'
          }`}
        >
          <Calendar size={16} />
          <span>My Appointments</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'incidents' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'
          }`}
        >
          <ShieldAlert size={16} />
          <span>Report Safety concern</span>
        </button>
      </div>

      {/* TAB 1: TESTS */}
      {activeTab === 'tests' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {!isTakingTest && !testResults ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Take test intro card */}
              <div className="md:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">DISC behavioral assessment</h2>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    The DISC profile is a non-judgmental tool used for understanding behavioral differences. It assesses your personality traits in four areas: Dominance (D), Influence (I), Steadiness (S), and Conscientiousness (C).
                  </p>
                  <ul className="text-xs text-slate-600 font-semibold space-y-2 pt-2">
                    <li className="flex items-center gap-2">🟢 Takes only 5 minutes to complete</li>
                    <li className="flex items-center gap-2">🟢 Answer honestly based on your typical behaviors</li>
                    <li className="flex items-center gap-2">🟢 Instant calculation of your dominant archetype</li>
                  </ul>
                </div>
                <button
                  onClick={() => setIsTakingTest(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 px-6 rounded-2xl shadow-lg mt-4 self-start transition-all"
                >
                  Start Assessment Now
                </button>
              </div>

              {/* History list card */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Assessment History</h3>
                {testHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-6 text-center">No assessments completed yet.</p>
                ) : (
                  <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                    {testHistory.map(hist => (
                      <div key={hist.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-[10px] font-bold text-indigo-600 uppercase">{hist.test_type} Profile</p>
                        <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{hist.personality_type}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-1">Date: {hist.taken_at}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : isTakingTest ? (
            /* ACTIVE DISC TEST FORM */
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">DISC behavioral assessment</h2>
                  <p className="text-xs text-slate-500 font-semibold">Select the single statement that best describes you for each question.</p>
                </div>
                <button 
                  onClick={() => setIsTakingTest(false)} 
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2">
                {discQuestions.map((q, idx) => (
                  <div key={q.id} className="space-y-3">
                    <p className="text-xs font-bold text-slate-800">Question {idx + 1}: {q.question}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = testAnswers[q.id] === opt.trait;
                        return (
                          <div 
                            key={oIdx}
                            onClick={() => handleAnswerSelect(q.id, opt.trait)}
                            className={`p-4 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/60'
                            }`}
                          >
                            {opt.text}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmitTest}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xl mt-6 transition-all"
              >
                Submit Answers
              </button>
            </div>
          ) : (
            /* COMPLETED TEST RESULTS SCREEN */
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 max-w-xl mx-auto">
              <div className="text-center space-y-2">
                <CheckCircle className="text-emerald-500 mx-auto" size={48} />
                <h2 className="text-lg font-bold text-slate-800">Assessment Complete!</h2>
                <p className="text-xs text-slate-500 font-semibold">Here is your dominant behavior profile archetype:</p>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                <p className="text-sm font-bold text-indigo-700">{testResults.archetype}</p>
              </div>

              {/* Progress meters */}
              <div className="space-y-3">
                {Object.entries(testResults.scores).map(([trait, val]) => (
                  <div key={trait} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{trait === 'D' ? 'Dominance (D)' : 
                            trait === 'I' ? 'Influence (I)' :
                            trait === 'S' ? 'Steadiness (S)' :
                            'Conscientiousness (C)'}</span>
                      <span>{val}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setTestResults(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
              >
                Return to Assessment Hub
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-800">My Appointments</h2>
              <p className="text-xs text-slate-500 font-semibold">Review your scheduled counseling sessions and approval statuses.</p>
            </div>
            <button
              onClick={() => setShowApptModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md"
            >
              <Plus size={16} />
              <span>Book Session</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 font-medium">
                You have no counseling sessions scheduled.
              </div>
            ) : (
              appointments.map((appt) => (
                <div key={appt.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Appointment Request</h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">Ref ID #{appt.id}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      appt.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      appt.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                      appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {appt.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span>Date: {appt.appointment_date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock size={14} className="text-slate-400" />
                      <span>Time: {appt.appointment_time.slice(0, 5)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-black uppercase text-slate-400">My Notes / Concern:</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">{appt.reason}</p>
                    </div>
                    {appt.remarks && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                        <p className="text-[9px] font-black uppercase text-slate-400">Counselor Reply Remarks:</p>
                        <p className="text-[11px] text-slate-500 italic mt-0.5">{appt.remarks}</p>
                      </div>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SAFETY INCIDENTS */}
      {activeTab === 'incidents' && (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-xl mx-auto">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <ShieldAlert className="text-red-500 mx-auto" size={40} className="animate-pulse" />
              <h2 className="text-lg font-bold text-slate-800">Report distress / Bullying incident</h2>
              <p className="text-xs text-slate-500 font-semibold">
                If you are going through a personal struggle or witnessed bullying, tell us. Your safety is our absolute priority.
              </p>
            </div>

            <form onSubmit={handleReportIncident} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Incident Date *</label>
                <input 
                  type="date"
                  required
                  value={incidentForm.incident_date}
                  onChange={(e) => setIncidentForm({...incidentForm, incident_date: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Details & Description *</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Tell us what happened, who was involved, or what you are feeling..."
                  value={incidentForm.details}
                  onChange={(e) => setIncidentForm({...incidentForm, details: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-700">Submit Anonymously</p>
                  <p className="text-[10px] text-slate-400 font-medium">Hides your name and student ID from the counselor dashboard.</p>
                </div>
                <input 
                  type="checkbox"
                  checked={incidentForm.is_anonymous}
                  onChange={(e) => setIncidentForm({...incidentForm, is_anonymous: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xl mt-4 transition-all"
              >
                Log Confidential Report
              </button>
            </form>
          </div>
        </div>
      )}

      {/* APPOINTMENT BOOKING MODAL */}
      {showApptModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="text-blue-500" size={18} />
              <span>Request counseling Session</span>
            </h3>
            
            <form onSubmit={handleBookAppt} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Date *</label>
                  <input 
                    type="date"
                    required
                    value={apptForm.appointment_date}
                    onChange={(e) => setApptForm({...apptForm, appointment_date: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Time *</label>
                  <input 
                    type="time"
                    required
                    value={apptForm.appointment_time}
                    onChange={(e) => setApptForm({...apptForm, appointment_time: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Reason / concern *</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Share a brief reason for booking (e.g. academic pressure, family issues, personal check-in)..."
                  value={apptForm.reason}
                  onChange={(e) => setApptForm({...apptForm, reason: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowApptModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all shadow-md"
                >
                  Request Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentGuidance;
