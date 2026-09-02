import React, { useState } from 'react';

/**
 * Universal Touch-Friendly & Mouse-Hover Tooltip Component
 * Works seamlessly on desktop mouse hover and mobile touchscreen tap/hold.
 */
const Tooltip = ({ text, children, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!text) return children;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent'
  };

  return (
    <div 
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onTouchStart={() => setIsVisible(true)}
      onTouchEnd={() => setTimeout(() => setIsVisible(false), 1800)}
    >
      {children}
      {isVisible && (
        <div 
          className={`absolute ${positionClasses[position] || positionClasses.top} z-[100] pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95`}
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap border border-slate-700/60 flex items-center gap-1.5 leading-none">
            {text}
          </div>
          <div className={`absolute border-4 ${arrowClasses[position] || arrowClasses.top}`} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
