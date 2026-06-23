import React from 'react';
import { BookOpen, Users, Clock, AlertCircle, Zap, ChevronRight, X, CheckCircle2 } from 'lucide-react'; 
import { LOADING_SPINNER } from '../../components/shared/teacherConstants';

/**
 * Reusable LoadingSpinner component
 */
export const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className={LOADING_SPINNER.containerClass}>
    <div className={LOADING_SPINNER.spinnerWrapperClass}>
      <div className={LOADING_SPINNER.spinnerClass} />
      <div className={LOADING_SPINNER.textClass}>{message}</div>
    </div>
  </div>
);

/**
 * Reusable EmptyState component
 */
export const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="py-12 flex flex-col items-center justify-center text-slate-500 opacity-60">
    {Icon && <Icon size={36} className="mb-3 text-slate-400" />}
    <h3 className="text-sm font-bold text-slate-600">{title}</h3>
    {message && <p className="text-xs font-medium text-slate-500 mt-1 text-center max-w-sm">{message}</p>}
  </div>
);

/**
 * Reusable Header component for each page section
 */
export const PageHeader = ({ icon: Icon, title, subtitle, action, badge }) => (
  <div className="animate-stagger flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/40 backdrop-blur-md px-5 py-4 rounded-xl border border-white shadow-sm" style={{ animationDelay: '0ms' }}>
    <div className="flex items-center gap-3 flex-1">
      {Icon && <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm shadow-indigo-500/20">{Icon}</div>}
      <div className="flex-1">
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-600 font-medium mt-1.5">{subtitle}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 flex-wrap sm:flex-nowrap">
      {badge && (
        <span className="text-[11px] font-bold text-slate-700 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-white/80 shrink-0">
          {badge}
        </span>
      )}
      {action}
    </div>
  </div>
);

/**
 * Reusable StatCard component
 */
export const StatCard = ({ icon: Icon, label, value, color, bg, animationDelay = 0, isHighlight = false }) => (
  <div 
    className="animate-stagger bg-white/40 backdrop-blur-md p-4 rounded-xl shadow-sm border border-white flex items-center gap-3 group cursor-default" 
    style={{ animationDelay: `${animationDelay}ms` }}
  >
    <div className={`p-2.5 rounded-lg ${bg} ${color} shrink-0 shadow-inner border border-white/50 group-hover:scale-105 transition-transform duration-300 transform-gpu`}>
      {Icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5 truncate">{label}</p>
      <p className={`text-xl font-black tracking-tight truncate ${isHighlight && value > 0 ? 'text-red-600' : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  </div>
);

/**
 * Reusable Card wrapper
 */
export const Card = ({ children, className = '', animationDelay = 0 }) => (
  <div 
    className={`animate-stagger bg-white/40 backdrop-blur-md rounded-xl shadow-sm border border-white ${className}`}
    style={{ animationDelay: `${animationDelay}ms` }}
  >
    {children}
  </div>
);

/**
 * Reusable CardHeader
 */
export const CardHeader = ({ title, icon: Icon, action }) => (
  <div className="px-5 py-3.5 border-b border-white/60 bg-white/20 flex items-center justify-between shrink-0">
    <div className="flex items-center space-x-2">
      {Icon && <Icon className="w-4 h-4 text-indigo-600" />}
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    </div>
    {action}
  </div>
);

/**
 * 🟢 FIXED & REDESIGNED: Reusable Class Details Modal (Strictly uses Branding Engine)
 */
export const ClassDetailsModal = ({ class: selectedClass, onClose, navigate, themeColor = '#4f46e5' }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
      
      {/* HEADER */}
      <div className="px-6 py-5 border-b border-slate-100/60 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div 
            className="p-2.5 bg-white rounded-xl shadow-sm border"
            style={{ color: themeColor, borderColor: `${themeColor}30` }}
          >
            <BookOpen size={20} className="drop-shadow-sm" />
          </div>
          <h3 className="font-black text-slate-800 text-lg tracking-tight">Class Details</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* BODY */}
      <div className="p-6 space-y-5 bg-slate-50/30">
        
        {/* Subject Highlight Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-default">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl" style={{ backgroundColor: themeColor }}></div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: themeColor }}>Subject Overview</p>
          <p className="text-xl font-black text-slate-800 leading-tight">{selectedClass.subject}</p>
        </div>
        
        {/* Grid Details (Section, Students & Schedule) */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Section Block */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1 hover:border-slate-200 transition-colors cursor-default">
            <div className="flex items-center gap-1.5 mb-1">
              <BookOpen size={14} className="text-slate-400" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Section</p>
            </div>
            <p className="text-sm font-bold text-slate-800 truncate">{selectedClass.section_name || selectedClass.section || 'TBA'}</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              {selectedClass.level || selectedClass.grade_level || 'Level TBA'}
            </p>
          </div>

          {/* Students Count Block */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1 hover:border-slate-200 transition-colors cursor-default">
            <div className="flex items-center gap-1.5 mb-1">
              <Users size={14} className="text-slate-400" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Students</p>
            </div>
            <p className="text-sm font-bold text-slate-800 truncate">
              {selectedClass.student_count || 0}
            </p>
            <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wide">
              Enrolled
            </p>
          </div>

          {/* Schedule Block (Full Width) */}
          <div className="col-span-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1 hover:border-slate-200 transition-colors cursor-default">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={14} className="text-slate-400" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Schedule</p>
            </div>
            <p className="text-sm font-bold text-slate-800 line-clamp-2" title={selectedClass.schedule}>
              {selectedClass.schedule || 'TBA'}
            </p>
          </div>
          
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="px-6 py-5 border-t border-slate-100 bg-white flex justify-end gap-3 items-center">
        <button
          onClick={onClose}
          className="cursor-pointer px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Close
        </button>
        <button
          onClick={() => {
            onClose(); 
            navigate(`/teacher/sections/${selectedClass.id}`, {
              state: {
                subject: selectedClass.subject,
                section: selectedClass.section_name || selectedClass.section,
                grade_level: selectedClass.level || selectedClass.grade_level
              }
            });
          }}
          className="cursor-pointer px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:opacity-90 rounded-xl transition-all flex items-center gap-2"
          style={{ backgroundColor: themeColor }}
        >
          Manage Grades <ChevronRight size={16} />
        </button>
      </div>
    </div>
  </div>
);
/**
 * 🟢 FIXED: Reusable TaskDetailsModal (Brand Engine & Cursor Pointer Applied)
 */
export const TaskDetailsModal = ({ task, onClose, themeColor }) => {
  if (!task) return null;

  const isUrgent = task.status === 'Urgent';
  const isPending = task.status === 'Pending';

  const IconComponent = isUrgent ? Zap : isPending ? AlertCircle : Bell;
  const iconBg = isUrgent ? 'bg-red-100 text-red-500' : isPending ? 'bg-orange-100 text-orange-500' : 'bg-blue-100 text-blue-600';
  const statusBg = isUrgent ? 'bg-red-50 border-red-200 text-red-700' : 'bg-orange-50 border-orange-200 text-orange-700';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-white/20">
        
        <div className="px-6 py-4 flex justify-between items-start pt-6 shrink-0 border-b border-slate-100 bg-slate-50/50">
          <div className="flex gap-4 items-start">
            <div className={`p-3 rounded-2xl shrink-0 ${iconBg}`}>
              <IconComponent size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 leading-tight mb-1 tracking-tight">{task.title}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {task.sender ? `Assigned by ` : 'Task Type: '}
                <span className="font-bold text-slate-700">{task.sender || task.type || 'System'}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="cursor-pointer p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 pt-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
          <div className="flex flex-wrap gap-2 mb-4">
            {task.due && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-700">
                <Clock size={14} /> Due: {task.due}
              </div>
            )}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold uppercase tracking-wider ${statusBg}`}>
              Status: {task.status}
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium cursor-default">
            {task.message || task.description || 'No additional instructions provided for this task.'}
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-white flex justify-end items-center shrink-0">
          <button 
            onClick={onClose} 
            className="cursor-pointer flex items-center gap-2 px-6 py-2.5 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:opacity-90"
            style={{ backgroundColor: themeColor }}
          >
            <CheckCircle2 size={16} /> Mark as Read
          </button>
        </div>
        
      </div>
    </div>
  );
};
/**
 * Reusable Badge component
 */
export const Badge = ({ text, variant = 'default', icon: Icon }) => {
  const variants = {
    success: 'bg-emerald-100/60 text-emerald-700 border-white',
    error: 'bg-red-100/60 text-red-700 border-white',
    warning: 'bg-amber-100/80 text-amber-700 border-white',
    info: 'bg-blue-100/80 text-blue-700 border-white',
    default: 'bg-white/60 text-slate-500 border-white',
  };

  return (
    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm backdrop-blur-sm border flex items-center gap-1 ${variants[variant]}`}>
      {Icon && <Icon size={12} />}
      {text}
    </span>
  );
};

/**
 * Reusable InfoItem
 */
export const InfoItem = ({ icon: Icon, label, value, isMissing = false }) => (
  <div className="flex items-start gap-3">
    <div className="p-1.5 bg-indigo-100/50 rounded-md text-indigo-500 shrink-0">
      {Icon}
    </div>
    <div>
      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`text-xs font-bold ${isMissing ? 'text-slate-400 italic' : 'text-slate-800'}`}>
        {value || 'Not provided'}
      </p>
    </div>
  </div>
);


export const DashboardSkeleton = ({ themeColor }) => (
  <div className="flex flex-col lg:h-full lg:overflow-hidden pb-8 lg:pb-0">
    <style>{`@keyframes dashSkPulse { 0% { background-color: ${themeColor}12; } 50% { background-color: ${themeColor}2e; } 100% { background-color: ${themeColor}12; } } .dash-sk { animation: dashSkPulse 1.6s ease-in-out infinite; border-radius: 6px; }`}</style>
    <div className="shrink-0 space-y-6 mb-6">
      <div className="flex justify-between items-center bg-white/40 backdrop-blur-md px-5 py-4 rounded-xl border border-white shadow-sm gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <div className="dash-sk" style={{ width: '130px', height: '22px' }} />
          <div className="dash-sk" style={{ width: '200px', height: '13px' }} />
        </div>
        <div className="dash-sk" style={{ width: '160px', height: '28px', borderRadius: '2rem' }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="bg-white/40 backdrop-blur-md p-4 rounded-xl shadow-sm border border-white flex items-center gap-3">
            <div className="dash-sk" style={{ width: '42px', height: '42px', borderRadius: '0.75rem', flexShrink: 0 }} />
            <div className="flex flex-col gap-2 flex-1">
              <div className="dash-sk" style={{ width: '70%', height: '10px' }} />
              <div className="dash-sk" style={{ width: '45%', height: '22px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:min-h-0">
      <div className="lg:col-span-2 bg-white/60 backdrop-blur-md rounded-[2rem] border border-white flex flex-col overflow-hidden shadow-sm min-h-[400px] lg:min-h-0">
        <div className="px-6 py-5 border-b border-white/50 bg-white/30 shrink-0 flex justify-between items-center">
          <div className="dash-sk" style={{ width: '140px', height: '16px' }} />
          <div className="dash-sk" style={{ width: '60px', height: '24px', borderRadius: '2rem' }} />
        </div>
        <div className="flex-1 p-4 lg:p-6 space-y-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="flex items-center justify-between p-4 bg-white/70 rounded-2xl border border-white gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <div className="dash-sk" style={{ width: '55%', height: '14px' }} />
                <div className="dash-sk" style={{ width: '35%', height: '11px' }} />
              </div>
              <div className="dash-sk" style={{ width: '90px', height: '28px', borderRadius: '0.75rem' }} />
            </div>
          ))}
        </div>
      </div>
      <div className="lg:col-span-1 bg-white/60 backdrop-blur-md rounded-[2rem] border border-white flex flex-col overflow-hidden shadow-sm min-h-[400px] lg:min-h-0">
        <div className="px-6 py-5 border-b border-white/50 bg-white/30 shrink-0">
          <div className="dash-sk" style={{ width: '160px', height: '16px' }} />
        </div>
        <div className="flex-1 p-4 lg:p-6 space-y-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="p-4 bg-white/70 rounded-2xl border border-white flex items-start gap-3">
              <div className="dash-sk" style={{ width: '36px', height: '36px', borderRadius: '0.75rem', flexShrink: 0 }} />
              <div className="flex flex-col gap-2 flex-1">
                <div className="dash-sk" style={{ width: '75%', height: '12px' }} />
                <div className="dash-sk" style={{ width: '45%', height: '10px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default {
  LoadingSpinner,
  EmptyState,
  PageHeader,
  StatCard,
  Card,
  CardHeader,
  ClassDetailsModal,
  TaskDetailsModal,
  Badge,
  InfoItem,
  DashboardSkeleton,
};