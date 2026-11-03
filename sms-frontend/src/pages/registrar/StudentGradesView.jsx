import React, { useState } from 'react';
import axios from 'axios';
import {
  FileText, Search, Loader2, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import OfficialSF9Card from '../../components/shared/OfficialSF9Card';

const StudentGradesView = () => {
  const { branding, token, API_BASE_URL } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [grades, setGrades] = useState([]);

  const fetchStudentRecord = async (query) => {
    if (!query) return;
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem('sms_token') || '';
      const res = await axios.get(
        `${API_BASE_URL}/registrar/get_student_records.php?student_id=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.data.success) {
        setStudentData(res.data.student);
        setGrades(res.data.grades || []);
      } else {
        alert(res.data.message || 'Student not found.');
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Error finding student record.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await fetchStudentRecord(searchQuery);
  };

  const handleUnlock = async (class_id, quarter) => {
    if (!window.confirm(`Unlock ${quarter ? `Term / Quarter ${quarter}` : 'Semester'} grades for teacher revision?`)) return;
    try {
      const authToken = token || localStorage.getItem('sms_token') || '';
      const res = await axios.post(
        `${API_BASE_URL}/registrar/unlock_grades.php`,
        { class_id, quarter },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.data.success) {
        alert(res.data.message);
        await fetchStudentRecord(studentData?.student_id || searchQuery);
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      alert('Failed to unlock grades.');
    }
  };

  const isCollege = (studentData?.department || '').toUpperCase() === 'COLLEGE' ||
    (studentData?.grade_level || '').toUpperCase().includes('COLLEGE');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER & SEARCH BAR */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <FileText size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Official SF9 Report Card & Academic Records
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                DepEd DO 015, s. 2026
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Generate Kindergarten, Grade 1–3 (with PACE Form), Grade School, JHS & SHS SF9 Cards or export to Excel
            </p>
          </div>
        </div>

        <form id="searchForm" onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Enter Student ID, LRN, or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold text-xs sm:text-sm transition-all focus:bg-white focus:shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs sm:text-sm hover:bg-slate-800 transition-all flex items-center justify-center min-w-[110px] shadow-lg active:scale-95 cursor-pointer"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {/* EMPTY STATE */}
      {!studentData && !loading && (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center space-y-3 print:hidden">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <GraduationCap size={32} />
          </div>
          <h3 className="text-base font-black text-slate-700">Search a Learner to Generate Official SF9 Card</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-medium">
            Enter a Student ID, 12-digit LRN, or Student Name above. The system automatically formats the card for
            Kindergarten (CO/DV/BG), Grades 1–3 (A–E + PACE Form), Grades 4–6, JHS, or Strengthened SHS.
          </p>
        </div>
      )}

      {/* OFFICIAL SF9 CARD OR COLLEGE RECORD */}
      {studentData && !isCollege && (
        <OfficialSF9Card
          student={studentData}
          rawGrades={grades}
          branding={branding}
          onUnlockQuarter={handleUnlock}
          showRegistrarActions={true}
        />
      )}

      {studentData && isCollege && (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">{studentData.name}</h2>
              <p className="text-xs font-bold text-slate-500">
                ID: {studentData.student_id} | {studentData.grade_level} – {studentData.program}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black print:hidden"
            >
              Print College Grade Slip
            </button>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-black text-slate-500 uppercase">
                <th className="p-3">Subject Code</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-center">Units</th>
                <th className="p-3 text-center">Final Grade</th>
                <th className="p-3 text-center">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
              {grades.map((g, i) => (
                <tr key={i}>
                  <td className="p-3">{g.code}</td>
                  <td className="p-3">{g.description}</td>
                  <td className="p-3 text-center">{g.units || 3}</td>
                  <td className="p-3 text-center font-black text-indigo-700">{g.final_grade || '-'}</td>
                  <td className="p-3 text-center">{g.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentGradesView;
