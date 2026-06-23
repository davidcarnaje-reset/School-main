import React from 'react';
import { X, Layers, Users, Clock, MapPin } from 'lucide-react';

const SubjectDetailsModal = ({ isOpen, onClose, subject, classes, loading }) => {
    if (!isOpen || !subject) return null; // Wag i-render kung nakasara

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[3rem] w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* MODAL HEADER */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-blue-50">
                    <div>
                        <h3 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">{subject.subject_code}</h3>
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-1">{subject.subject_description}</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white text-slate-400 hover:text-red-500 rounded-2xl shadow-sm transition-all">
                        <X size={20}/>
                    </button>
                </div>

                {/* MODAL BODY */}
                <div className="p-8 overflow-y-auto bg-slate-50/50 flex-1">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Active Class Assignments</h4>
                    
                    {loading ? (
                        <div className="py-20 text-center font-black text-slate-300 uppercase animate-pulse tracking-widest">Loading schedules...</div>
                    ) : classes.length === 0 ? (
                        <div className="py-20 text-center">
                            <Layers className="mx-auto text-slate-200 mb-3" size={48} />
                            <p className="font-black text-slate-400 uppercase tracking-widest">No Active Classes Yet</p>
                            <p className="text-xs font-bold text-slate-400 mt-2">Go to "Assign Class" to create schedules for this subject.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {classes.map((cls, idx) => (
                                <div key={idx} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between hover:border-blue-200 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black shadow-sm border border-emerald-100">
                                            {cls.section_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-sm uppercase">{cls.section_name} <span className="text-slate-400 font-bold ml-1">({cls.grade_level})</span></p>
                                            <p className="text-xs font-bold text-blue-600 mt-1 flex items-center gap-1 uppercase">
                                                <Users size={12}/> Prof. {cls.first_name} {cls.last_name}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 text-left md:text-right">
                                        <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase flex items-center md:justify-end gap-2 w-max md:ml-auto">
                                            <Clock size={12}/> {cls.schedule}
                                        </span>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center md:justify-end gap-2 tracking-widest">
                                            <MapPin size={12} className="text-blue-400"/> {cls.room || 'TBA'} 
                                            <span className="mx-2 text-slate-200">|</span> 
                                            <span className="text-emerald-500 font-black">{cls.student_count} Enrolled</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubjectDetailsModal;