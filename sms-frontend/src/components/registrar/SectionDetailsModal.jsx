import React, { useState, useEffect } from 'react';
import { X, Users, Clock, BookOpen, MapPin, CheckCircle, AlertTriangle, UserCheck, Award, GraduationCap } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const SectionDetailsModal = ({ isOpen, onClose, section }) => {
    const { token, API_BASE_URL } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ section: null, students: [], schedules: [], enrolled_count: 0 });

    useEffect(() => {
        if (isOpen && section) {
            fetchSectionDetails();
        }
    }, [isOpen, section]);

    const fetchSectionDetails = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/registrar/get_section_details.php`, {
                params: { section_id: section.id },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setData(res.data);
            }
        } catch (error) {
            console.error("Error fetching section details", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !section) return null;

    const activeSec = data.section || section;
    const isCollege = activeSec.department === 'College' || ['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(activeSec.grade_level);

    const remainingSlots = activeSec.max_capacity - data.enrolled_count;
    const capacityPercentage = (data.enrolled_count / activeSec.max_capacity) * 100;
    
    // UI Color Logic para sa Capacity
    const capacityColor = capacityPercentage >= 100 ? 'bg-red-500' : capacityPercentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
    const capacityText = capacityPercentage >= 100 ? 'text-red-500' : capacityPercentage >= 80 ? 'text-amber-500' : 'text-emerald-500';

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-slate-50 rounded-[3rem] w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* HEADER */}
                <div className="p-8 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {activeSec.department} • {activeSec.grade_level}
                            </span>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeSec.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                {activeSec.status || 'Active'}
                            </span>
                            {!isCollege && activeSec.adviser_name && (
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                    <UserCheck size={12} /> Adviser: {activeSec.adviser_name}
                                </span>
                            )}
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{activeSec.section_name}</h3>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-100 text-slate-400 hover:text-red-500 rounded-2xl shadow-sm transition-all cursor-pointer">
                        <X size={24}/>
                    </button>
                </div>

                {/* CONTENT AREA */}
                <div className="p-8 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="py-20 text-center font-black text-slate-300 uppercase animate-pulse tracking-widest">Loading Section Data...</div>
                    ) : (
                        <div className="space-y-6">
                            
                            {/* TOP ROW: CAPACITY & ADVISER / PROGRAM WIDGETS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* CAPACITY TRACKER WIDGET */}
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-full bg-slate-50 border-4 border-slate-100 flex items-center justify-center shrink-0">
                                        <Users size={24} className={capacityText} />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class Capacity Status</p>
                                                <p className="text-sm font-bold text-slate-600">
                                                    <span className={`font-black text-lg ${capacityText}`}>{data.enrolled_count}</span> / {activeSec.max_capacity} Enrolled
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${remainingSlots <= 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                                    {remainingSlots <= 0 ? 'FULL CAPACITY' : `${remainingSlots} Slots Left`}
                                                </p>
                                            </div>
                                        </div>
                                        {/* PROGRESS BAR */}
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-1000 ${capacityColor}`} style={{ width: `${Math.min(capacityPercentage, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* CLASS ADVISER WIDGET (FOR ELEM / JHS / KINDER / SHS) OR PROGRAM WIDGET (FOR COLLEGE) */}
                                {!isCollege ? (
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center shrink-0 ${activeSec.adviser_name ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                            <UserCheck size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class Adviser (Tagapayo)</p>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${activeSec.adviser_name ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {activeSec.adviser_name ? 'Assigned' : 'Unassigned'}
                                                </span>
                                            </div>
                                            <h4 className="text-base font-black text-slate-800 uppercase tracking-tight truncate mt-0.5">
                                                {activeSec.adviser_name || 'No Adviser Assigned'}
                                            </h4>
                                            <p className="text-[11px] font-semibold text-slate-400 truncate">
                                                {activeSec.adviser_name ? (activeSec.adviser_email || 'Official Section Adviser') : 'Can be assigned in Section Management'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                                            <GraduationCap size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Degree Program / Strand</p>
                                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-700">
                                                    College Block
                                                </span>
                                            </div>
                                            <h4 className="text-base font-black text-slate-800 uppercase tracking-tight truncate mt-0.5">
                                                {activeSec.program_code || 'General College'}
                                            </h4>
                                            <p className="text-[11px] font-semibold text-slate-400 truncate">
                                                {activeSec.program_description || 'Course & Block Curriculum'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* TWO COLUMN LAYOUT: SCHEDULES & STUDENTS */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                {/* LEFT COLUMN: SCHEDULES */}
                                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-6 border-b border-slate-50 bg-blue-50/30 flex items-center gap-2">
                                        <Clock className="text-blue-500" size={18} />
                                        <h4 className="font-black text-slate-700 uppercase tracking-tight">Master Schedule</h4>
                                    </div>
                                    <div className="p-6 space-y-4 overflow-y-auto max-h-[400px]">
                                        {data.schedules.length === 0 ? (
                                            <p className="text-center text-slate-400 font-bold text-xs py-10">No subjects assigned yet.</p>
                                        ) : (
                                            data.schedules.map((sched, idx) => (
                                                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <p className="font-black text-slate-800 text-sm uppercase">{sched.subject_code}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 truncate">{sched.subject_description}</p>
                                                    <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-slate-200">
                                                        <span className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-1.5"><Clock size={12}/> {sched.schedule}</span>
                                                        <span className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1.5"><Users size={12}/> Prof. {sched.prof_fname} {sched.prof_lname}</span>
                                                        <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1.5"><MapPin size={12}/> {sched.room_name || 'TBA'}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: STUDENT ROSTER */}
                                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-6 border-b border-slate-50 bg-emerald-50/30 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="text-emerald-500" size={18} />
                                            <h4 className="font-black text-slate-700 uppercase tracking-tight">Class Roster</h4>
                                        </div>
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-black">{data.students.length}</span>
                                    </div>
                                    <div className="p-0 overflow-y-auto max-h-[400px]">
                                        {data.students.length === 0 ? (
                                            <p className="text-center text-slate-400 font-bold text-xs py-10">No students enrolled yet.</p>
                                        ) : (
                                            <table className="w-full text-left">
                                                <tbody className="divide-y divide-slate-50">
                                                    {data.students.map((student, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="p-4 pl-6 flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                                    {idx + 1}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black text-slate-700 uppercase">{student.last_name}, {student.first_name}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400">{student.student_id} • {student.gender}</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SectionDetailsModal;