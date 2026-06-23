import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

const CustomAlert = ({ isOpen, type, title, message, onClose, onConfirm, cancelText = "Cancel", confirmText = "Okay" }) => {
  if (!isOpen) return null;

  // Configuration for different alert types
  const config = {
    success: { 
      icon: CheckCircle, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-100', 
      btn: 'bg-emerald-600 hover:bg-emerald-700' 
    },
    error: { 
      icon: XCircle, 
      color: 'text-red-500', 
      bg: 'bg-red-100', 
      btn: 'bg-red-600 hover:bg-red-700' 
    },
    warning: { 
      icon: AlertTriangle, 
      color: 'text-amber-500', 
      bg: 'bg-amber-100', 
      btn: 'bg-amber-600 hover:bg-amber-700' 
    },
    info: { 
      icon: Info, 
      color: 'text-blue-500', 
      bg: 'bg-blue-100', 
      btn: 'bg-blue-600 hover:bg-blue-700' 
    }
  };

  const { icon: Icon, color, bg, btn } = config[type] || config.info;

  // ARCHITECT LOGIC: Kung may 'onConfirm', ibig sabihin Confirmation/Two-Button mode ito.
  const isConfirmationMode = Boolean(onConfirm);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Content Area */}
        <div className="p-8 text-center space-y-4 mt-2">
          <div className={`mx-auto w-24 h-24 flex items-center justify-center rounded-full ${bg} ${color}`}>
            <Icon size={48} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">{title}</h3>
          <p className="text-sm font-bold text-slate-500 leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>

        {/* Buttons Area */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          {isConfirmationMode ? (
            /* DUAL BUTTONS MODE */
            <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-black uppercase text-xs tracking-widest shadow-sm transition-all active:scale-95"
              >
                {cancelText}
              </button>
              <button 
                onClick={onConfirm} 
                className={`flex-1 py-4 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 ${btn}`}
              >
                {confirmText}
              </button>
            </div>
          ) : (
            /* SINGLE BUTTON MODE (Original) */
            <button 
              onClick={onClose} 
              className={`w-full py-4 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 ${btn}`}
            >
              {confirmText}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CustomAlert;