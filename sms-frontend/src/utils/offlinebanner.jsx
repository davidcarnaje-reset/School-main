import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

const OfflineBanner = ({ isServerOffline, isRetrying, onRetry }) => {
  // Kung hindi naman offline, huwag mag-pakita ng kahit ano
  if (!isServerOffline) return null;

  return (
    <div 
      className="animate-stagger relative overflow-hidden bg-white/50 backdrop-blur-md border border-amber-300/60 shadow-sm rounded-xl p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
      style={{ animationDelay: '50ms' }}
    >
      {/* Visual Effects */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 opacity-80"></div>
      <div className="absolute -left-10 -top-10 w-32 h-32 bg-amber-400/20 blur-[30px] rounded-full pointer-events-none"></div>

      {/* Icon and Text Area */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="p-2 bg-amber-100/60 backdrop-blur-sm rounded-lg text-amber-600 shadow-inner border border-amber-200/50">
          <WifiOff size={16} className="opacity-80" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
            </span>
            <h4 className="text-xs font-extrabold text-amber-900 tracking-tight uppercase">Database Offline</h4>
          </div>
          <p className="text-[10px] text-amber-800/80 font-medium leading-tight max-w-lg">
            Cannot connect to database. Displaying offline data. or Not Provided pag wla pa database. Pero pag meron na makikita na. 
          </p>
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={onRetry}
        disabled={isRetrying}
        className="relative z-10 w-full sm:w-auto px-4 py-2 bg-white/60 hover:bg-white/90 backdrop-blur-sm text-amber-700 text-[11px] font-bold rounded-lg border border-amber-300/50 shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        <RefreshCw size={12} className={isRetrying ? "animate-spin" : ""} />
        {isRetrying ? 'Reconnecting...' : 'Retry Connection'}
      </button>
    </div>
  );
};

export default OfflineBanner;