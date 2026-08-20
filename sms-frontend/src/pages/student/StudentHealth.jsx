import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Heart, Calendar, Activity, ClipboardList, RefreshCw, 
  Info, ShieldCheck, User, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StudentHealth = () => {
  const { user, branding, API_BASE_URL } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [physicalChecks, setPhysicalChecks] = useState([]);
  const [visits, setVisits] = useState([]);

  const fetchStudentHealthData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/health/student-profile`);
      if (res.data && res.data.success) {
        setProfile(res.data.profile);
        setPhysicalChecks(res.data.physicalChecks);
        setVisits(res.data.visits);
      }
    } catch (err) {
      console.error("Fetch student health error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentHealthData();
  }, [API_BASE_URL]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <RefreshCw className="animate-spin mr-2" />
        <span className="font-bold text-sm">Loading Health Card...</span>
      </div>
    );
  }

  // Calculate latest physical check details
  const latestCheck = physicalChecks[0] || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl">
            <Heart size={28} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My School Health Card</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Review your official clinic profile, body check histories, allergies, and sick bay consultation logs.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: MEDICAL CARD */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User size={16} className="text-rose-500" />
                <span>My Clinic Profile</span>
              </h2>
              {profile?.blood_type && (
                <span className="px-2 py-0.5 rounded bg-rose-100 border border-rose-200 text-[10px] font-black text-rose-700">
                  Type {profile.blood_type}
                </span>
              )}
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="p-3.5 rounded-2xl border border-red-100 bg-red-50/10">
                <p className="text-[9px] font-black uppercase text-red-500 tracking-wider flex items-center gap-1">
                  <ShieldAlert size={12} />
                  <span>Allergies:</span>
                </p>
                <p className={`text-xs mt-1 font-bold ${profile?.allergies ? 'text-red-700' : 'text-slate-500'}`}>
                  {profile?.allergies || "No allergies recorded"}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase text-slate-400">Chronic Illnesses:</p>
                <p className="text-slate-800 font-bold mt-0.5">{profile?.chronic_illnesses || "None logged"}</p>
              </div>

              {profile?.emergency_contact_name && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black uppercase text-slate-400">Emergency contact:</p>
                  <p className="text-slate-700 font-bold mt-1">{profile.emergency_contact_name}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Phone: {profile.emergency_contact_no}</p>
                </div>
              )}
            </div>
          </div>

          {/* LATEST HEALTH CHECK SUMMARY */}
          {latestCheck && (
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest pb-3 border-b border-slate-100">Latest Body Check</h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase">Height</p>
                  <p className="text-base font-bold text-slate-700 mt-0.5">{latestCheck.height} cm</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase">Weight</p>
                  <p className="text-base font-bold text-slate-700 mt-0.5">{latestCheck.weight} kg</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase">Calculated BMI</p>
                  <p className="text-base font-bold text-indigo-600 mt-0.5">{latestCheck.bmi}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase">Status</p>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase mt-0.5 ${
                    latestCheck.status === 'Healthy' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    latestCheck.status === 'Needs Attention' ? 'bg-red-50 text-red-600 border border-red-100' :
                    'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {latestCheck.status}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: CONSULTATIONS & HISTORIES */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CONSULTATIONS */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-100">
              <Activity size={16} className="text-rose-500" />
              <span>Clinic Visit Logs</span>
            </h2>

            {visits.length === 0 ? (
              <p className="text-xs text-slate-450 font-medium py-6 text-center">You have no recorded sick bay visits.</p>
            ) : (
              <div className="space-y-4">
                {visits.map(v => (
                  <div key={v.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-800 font-bold">Complaint: {v.complaint}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{v.visit_date} • {v.visit_time.slice(0, 5)}</span>
                    </div>
                    {v.treatment && (
                      <p className="text-xs text-slate-500 font-semibold">Treatment: {v.treatment}</p>
                    )}
                    {v.medicine_dispensed && (
                      <p className="text-xs text-slate-600 font-bold">Medicine: {v.medicine_dispensed}</p>
                    )}
                    {v.remarks && (
                      <p className="text-[11px] text-slate-400 italic">Remarks: {v.remarks}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PHYSICAL CHECKS */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-100">
              <ClipboardList size={16} className="text-rose-500" />
              <span>Physical Health Check Logs</span>
            </h2>

            {physicalChecks.length === 0 ? (
              <p className="text-xs text-slate-450 font-medium py-6 text-center">No physical check logs recorded.</p>
            ) : (
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
                    {physicalChecks.map(c => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default StudentHealth;
