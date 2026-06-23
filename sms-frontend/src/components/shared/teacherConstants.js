/**
 * Shared constants and configurations for teacher dashboard components
 * Reduces duplication and makes theming/styling changes centralized
 * 🟢 INTEGRATED WITH BRAND ENGINE 🟢
 */

// 1. DYNAMIC SHARED STYLES (Tumitingin sa themeColor)
export const SHARED_STYLES = (themeColor = '#2563eb') => `
  /* 🟢 CSS Variables para magamit ng lahat ng components ang Brand Color */
  :root {
    --brand-color: ${themeColor};
    --brand-color-15: ${themeColor}26; /* 15% opacity para sa light backgrounds */
    --brand-color-40: ${themeColor}66; /* 40% opacity para sa scrollbar */
    --brand-color-80: ${themeColor}cc; /* 80% opacity para sa hover */
  }

  /* 🟢 Custom Brand Utility Classes */
  .text-brand { color: var(--brand-color) !important; }
  .bg-brand { background-color: var(--brand-color) !important; }
  .bg-brand-light { background-color: var(--brand-color-15) !important; }
  .border-brand { border-color: var(--brand-color) !important; }
  .border-t-brand { border-top-color: var(--brand-color) !important; }

  @keyframes fadeInUpGPU {
    from { opacity: 0; transform: translate3d(0, 15px, 0); }
    to { opacity: 1; transform: translate3d(0, 0, 0); }
  }

  .animate-stagger {
    animation: fadeInUpGPU 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
    will-change: opacity, transform;
  }

  /* 🟢 Dynamic Scrollbar - Brand Engine Integrated */
  .custom-scroll {
    scrollbar-width: thin;
    scrollbar-color: var(--brand-color-40) transparent;
  }
  .custom-scroll::-webkit-scrollbar { 
    width: 6px; 
    height: 6px; 
  }
  .custom-scroll::-webkit-scrollbar-track { 
    background: transparent; 
  }
  .custom-scroll::-webkit-scrollbar-thumb { 
    background: var(--brand-color-40); 
    border-radius: 20px; 
    border: 1px solid transparent;
    background-clip: content-box;
    transition: background 0.2s ease;
  }
  .custom-scroll::-webkit-scrollbar-thumb:hover { 
    background: var(--brand-color-80); 
  }
`;

// 2. LOADING SPINNER
export const LOADING_SPINNER = {
  containerClass: 'flex items-center justify-center min-h-[60vh] bg-transparent',
  spinnerWrapperClass: 'flex flex-col items-center space-y-3',
  // 🟢 Pinalitan ang 'border-t-indigo-600' ng 'border-t-brand'
  spinnerClass: 'w-8 h-8 border-4 border-white/40 border-t-brand rounded-full animate-spin shadow-md',
  // 🟢 Pinalitan ang 'text-indigo-600' ng 'text-brand'
  textClass: 'text-sm font-bold text-brand',
};

// 3. BADGE STYLES (Mananatiling semantic colors para sa Pass/Fail)
export const BADGE_STYLES = {
  passed: 'bg-emerald-100/60 text-emerald-700 border-white',
  failed: 'bg-red-100/60 text-red-700 border-white',
  default: 'bg-white/60 text-slate-500 border-white',
};

// 4. DEPARTMENT STYLES 
export const DEPARTMENT_STYLES = {
  Registrar: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-100/60',
    border: 'border-white/60',
    icon: 'FileText',
  },
  Cashier: {
    color: 'text-orange-700',
    bg: 'bg-orange-100/60',
    border: 'border-white/60',
    icon: 'DollarSign',
  },
  Admin: {
    // 🟢 Gumagamit na ng Brand Engine
    color: 'text-brand',
    bg: 'bg-brand-light',
    border: 'border-white/60',
    icon: 'ShieldAlert',
  },
  default: {
    // 🟢 Gumagamit na ng Brand Engine
    color: 'text-brand',
    bg: 'bg-brand-light',
    border: 'border-white/60',
    icon: 'Megaphone',
  },
};

// 5. PRIORITY TYPES
export const PRIORITY_TYPES = {
  urgent: {
    style: 'bg-red-100/80 text-red-700',
    label: 'Urgent',
    icon: 'AlertCircle',
  },
  warning: {
    style: 'bg-amber-100/80 text-amber-700',
    label: 'Notice',
    icon: 'AlertTriangle',
  },
  info: {
    // 🟢 Gumagamit na ng Brand Engine
    style: 'bg-brand-light text-brand',
    label: 'Info',
    icon: 'Info',
  },
  general: {
    style: 'bg-white/60 text-slate-500',
    label: 'General',
    icon: null,
  },
};

// 6. STAT CARD COLORS
export const STAT_CARD_COLORS = {
  // 🟢 Ang primary card (Classes) ay susunod sa Brand Engine
  classes: { icon: 'BookOpen', color: 'text-brand', bg: 'bg-brand-light' },
  students: { icon: 'Users', color: 'text-emerald-600', bg: 'bg-emerald-100/60' },
  schedule: { icon: 'Clock', color: 'text-orange-600', bg: 'bg-orange-100/60' },
  grading: { icon: 'AlertCircle', color: 'text-red-600', bg: 'bg-red-100/60' },
};

// 7. SUBJECT CARD COLORS
export const SUBJECT_CARD_COLORS = [
  'bg-brand', // 🟢 Added solid brand color to the mix (imbes na blue-500)
  'bg-orange-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
];

// 8. ANIMATION DELAYS
export const ANIMATION_DELAYS = {
  header: '0ms',
  banner: '50ms',
  firstCard: '100ms',
  increment: 50,
};