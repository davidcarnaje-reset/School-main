import React, { useState } from 'react';
import { 
  HelpCircle, X, Sparkles, BookOpen, CheckCircle, 
  Lightbulb, ArrowRight, Shield, Play, Info
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PAGE_GUIDES = {
  '/registrar/students': {
    title: 'Student Records & Registration',
    subtitle: 'Registrar Module',
    overview: 'Manage student profiles, issue TORs, register new students, and track academic records.',
    steps: [
      { step: '1', title: 'Add New Student', desc: 'Click the "+ Add Student" button to launch the 6-step registration wizard.' },
      { step: '2', title: 'Use Quick Fill (Demo Mode)', desc: 'Click "✨ Demo Mode (Auto-Fill)" inside the registration modal to instantly populate sample data for testing.' },
      { step: '3', title: 'Filter & Search', desc: 'Search students by name or LRN, or filter by Grade Level from the top bar.' },
      { step: '4', title: 'View & Print Records', desc: 'Click "View Record" on any student row to inspect full details or print official student profile forms.' }
    ],
    tips: [
      'LRN must be a valid 12-digit number for DepEd compliance.',
      'Use the new Month, Day, Year dropdown date picker for quick Date of Birth selection.',
      'Enrolled students will automatically receive login credentials via email.'
    ]
  },
  '/admin/users': {
    title: 'User Management & Roles',
    subtitle: 'Admin Module',
    overview: 'Control access accounts for Admins, Registrars, Cashiers, Teachers, and Students across the system.',
    steps: [
      { step: '1', title: 'Filter by Role', desc: 'Switch tabs or dropdown filters to quickly locate Employees vs Students.' },
      { step: '2', title: 'Create Account', desc: 'Click "+ Add User" and select the exact account role and campus assignment.' },
      { step: '3', title: 'Account Status', desc: 'Toggle user status between Active / Suspended whenever needed.' }
    ],
    tips: [
      'Each role receives tailored dashboard access based on Module Settings.',
      'Admins can reset forgotten user passwords directly from the action menu.'
    ]
  },
  '/admin/school-setup': {
    title: 'School Profile & Campus Setup',
    subtitle: 'Admin Module',
    overview: 'Configure school name, address, contact numbers, student ID prefixes, active school years, and campus buildings/rooms.',
    steps: [
      { step: '1', title: 'School Branding', desc: 'Update school name, logo, contact number, and Facebook page link.' },
      { step: '2', title: 'Student Prefixes', desc: 'Set distinct ID prefixes for K-12 (e.g. K12-2026) vs College (e.g. COL-2026).' },
      { step: '3', title: 'School Year Setup', desc: 'Create and open/close academic school years.' },
      { step: '4', title: 'Buildings & Rooms', desc: 'Define building floor capacities and assign rooms (Lab / Lecture).' }
    ],
    tips: [
      'Changing active school year updates enrollment filters across all portals.',
      'Room floor selection automatically adapts to the maximum floors set for the chosen building.'
    ]
  },
  '/cashier/fees': {
    title: 'Cashier & Fee Catalog Management',
    subtitle: 'Cashier Module',
    overview: 'Set up tuition items, miscellaneous fees, document fees (TOR/Diploma), and manage student billing.',
    steps: [
      { step: '1', title: 'Create Fee Item', desc: 'Add fee items with categories (Tuition, Document, Miscellaneous).' },
      { step: '2', title: 'Set Applicable Grade', desc: 'Assign fees to specific grade levels or mark as "All".' },
      { step: '3', title: 'Process Payments', desc: 'Issue official receipts (OR) and track payment histories.' }
    ],
    tips: [
      'Document fees like TOR and Certifications appear in Registrar requests.',
      'Installment payment schedules can be customized per student.'
    ]
  }
};

const DEFAULT_GUIDE = {
  title: 'System Help & Guided Tour',
  subtitle: 'SMS Portal Assistance',
  overview: 'Welcome to the School Management System. Use the navigation sidebar to access modules assigned to your role.',
  steps: [
    { step: '1', title: 'Role-Based Access', desc: 'Your navigation options are customized according to your active account role.' },
    { step: '2', title: 'Notifications', desc: 'Check the bell icon on the top right for urgent school announcements and reminders.' },
    { step: '3', title: 'Help & Tips', desc: 'Click this help button anytime on any page to see specific page guides and shortcuts.' }
  ],
  tips: [
    'Always remember to log out when using a shared terminal.',
    'For support or system updates, contact the School Systems Administrator.'
  ]
};

const HelpTutorialModal = ({ isOpen, onClose, onTriggerDemo }) => {
  const location = useLocation();
  const guide = PAGE_GUIDES[location.pathname] || DEFAULT_GUIDE;
  const [activeTab, setActiveTab] = useState('guide');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* HEADER */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              {guide.subtitle}
            </span>
            <h3 className="text-xl font-black tracking-tight mt-2 flex items-center gap-2">
              <Sparkles className="text-amber-300 animate-pulse" size={22} />
              {guide.title}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-2xl backdrop-blur-md transition-colors relative z-10"
          >
            <X size={20} />
          </button>
          
          {/* Decorative background circle */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
          <button 
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'guide' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <BookOpen size={16} />
            Step-by-Step Guide
          </button>
          <button 
            onClick={() => setActiveTab('tips')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'tips' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Lightbulb size={16} />
            Pro Tips & Tricks
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* OVERVIEW BOX */}
          <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
            <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-blue-900 font-bold leading-relaxed">{guide.overview}</p>
          </div>

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">How it works:</h4>
              <div className="space-y-3">
                {guide.steps.map((s, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/80 hover:border-blue-200 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                      {s.step}
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-slate-800">{s.title}</h5>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">System Best Practices:</h4>
              <div className="space-y-3">
                {guide.tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-100/80">
                    <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs font-bold text-amber-900 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          {onTriggerDemo ? (
            <button 
              onClick={() => { onClose(); onTriggerDemo(); }}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <Sparkles size={16} />
              Try Demo / Fill Sample Data
            </button>
          ) : (
            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Shield size={14} className="text-blue-500" />
              Official System User Tutorial
            </div>
          )}

          <button 
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95"
          >
            Got it, thanks!
          </button>
        </div>

      </div>
    </div>
  );
};

export default HelpTutorialModal;
