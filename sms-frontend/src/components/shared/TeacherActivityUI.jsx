import React, { useEffect } from 'react';
import {
  Layers, Edit3, Target as TargetIcon, X, CheckCircle, School, BookOpen,
  Hash, Calendar, AlignLeft, Video, FileText, Link as LinkIcon
} from 'lucide-react';

// ─── 1. GLOBAL GLASSMORPHISM STYLES ────────────────────────────────────────
export const gcGlassStyles = (themeColor) => `
  @keyframes fadeInOverlay { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(8px); } }
  @keyframes popInModal { 0% { opacity: 0; transform: scale(0.95) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes slideUpFade { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  
  .animate-slide-up { animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

  /* OVERLAYS & MODALS (Responsive & Scroll-Safe) */
  .glass-overlay { 
    position: fixed; 
    inset: 0; 
    z-index: 100; 
    background: rgba(15, 23, 42, 0.45); 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    padding: 1rem; 
    overflow-y: auto; 
    animation: fadeInOverlay 0.3s ease-out forwards; 
  }
  .glass-modal { 
    background: rgba(255, 255, 255, 0.92); 
    backdrop-filter: blur(24px); 
    -webkit-backdrop-filter: blur(24px); 
    border: 1px solid rgba(255, 255, 255, 0.7); 
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); 
    border-radius: 1.5rem; 
    width: 100%; 
    max-height: calc(100vh - 2rem); 
    display: flex; 
    flex-direction: column; 
    animation: popInModal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
    overflow: hidden; 
  }

  /* TABS */
  .gc-tabs { display: flex; gap: 2rem; border-bottom: 1px solid rgba(0,0,0,0.08); padding: 0 1rem; margin-bottom: 1.5rem; }
  .gc-tab { padding: 1rem 0; font-weight: 700; font-size: 0.95rem; color: #64748b; cursor: pointer; position: relative; transition: color 0.2s; }
  .gc-tab:hover { color: ${themeColor}; }
  .gc-tab.active { color: ${themeColor}; }
  .gc-tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 3px; background: ${themeColor}; border-radius: 3px 3px 0 0; }

  /* HERO BANNER */
  .gc-hero { height: 240px; border-radius: 1.5rem; padding: 1.5rem 2rem; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; margin-bottom: 2rem; box-shadow: 0 10px 30px -10px ${themeColor}60; }
  .gc-hero::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, ${themeColor} 0%, #1e293b 100%); z-index: 0; }
  .gc-hero::after { content: ''; position: absolute; right: -10%; top: -20%; width: 350px; height: 350px; background: rgba(255,255,255,0.1); border-radius: 50%; filter: blur(40px); z-index: 1; }

  /* TYPE SELECTOR CARDS */
  .type-card { display: flex; flex-direction: column; text-align: left; padding: 1.25rem; border-radius: 1.25rem; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.8); cursor: pointer; transition: all 0.25s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
  .type-card:hover { background: rgba(255, 255, 255, 0.95); transform: translateY(-3px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border-color: ${themeColor}40; }
  .type-icon-wrapper { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem; }

  /* INPUT FIELDS (GLASS) */
  .glass-input-group { display: flex; flex-direction: column; gap: 0.4rem; }
  .glass-label { font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; }
  .input-with-icon { position: relative; display: flex; align-items: center; }
  .input-icon { position: absolute; left: 1rem; color: #94a3b8; pointer-events: none; }
  .glass-input-modern { width: 100%; padding: 0.85rem 1rem 0.85rem 2.75rem; background: rgba(255,255,255,0.75); backdrop-filter: blur(8px); border: 1.5px solid rgba(203,213,225,0.6); border-radius: 0.75rem; font-family: inherit; font-size: 0.95rem; color: #1e293b; outline: none; transition: all 0.2s ease; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
  .glass-input-modern:focus { background: rgba(255,255,255,0.98); border-color: ${themeColor}; box-shadow: 0 0 0 4px ${themeColor}20; }
`;

// ─── 2. SKELETON LOADER (Glassmorphism Shimmer) ──────────────────────────────
export const ActivitySkeletonList = ({ themeColor }) => (
  <div className="flex flex-col gap-8 mt-4 animate-slide-up">
    <style>{`
      @keyframes shimmerGlass {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }
      .glass-sk {
        background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%), ${themeColor}15;
        background-size: 1000px 100%;
        animation: shimmerGlass 2s infinite linear;
        border-radius: 8px;
      }
    `}</style>
    
    {[1, 2].map(group => (
      <div key={group} className="mb-2">
        <div className="flex justify-between items-center border-b pb-3 mb-4" style={{ borderColor: `${themeColor}30` }}>
          <div className="glass-sk" style={{ width: '180px', height: '32px' }} />
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="flex items-center gap-4 p-4 border border-white/50 bg-white/30 backdrop-blur-md rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
              <div className="glass-sk shrink-0" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              <div className="flex-1 space-y-2.5">
                <div className="glass-sk" style={{ width: '40%', height: '16px' }} />
                <div className="glass-sk" style={{ width: '15%', height: '12px' }} />
              </div>
              <div className="glass-sk hidden sm:block" style={{ width: '80px', height: '14px' }} />
              <div className="glass-sk shrink-0" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ─── 3. TYPE SELECTOR MODAL ──────────────────────────────────────────────────
export const TypeSelectorModal = ({ isOpen, onClose, onSelectBasic, onSelectExam, onSelectModule, themeColor }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="glass-overlay" onClick={onClose}>
      <div 
        className="glass-modal" 
        style={{ 
          maxWidth: '480px', 
          maxHeight: 'calc(100vh - 2rem)', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Floating / Pinned Top-Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1.5px solid rgba(203, 213, 225, 0.8)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            zIndex: 10,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'; e.currentTarget.style.color = '#64748b'; }}
        >
          <X size={18} />
        </button>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '2rem 1.75rem 1.25rem 1.75rem', textAlign: 'center', overflowY: 'auto', flex: 1 }}>
          <div style={{ width: '56px', height: '56px', background: `linear-gradient(135deg, ${themeColor}15, ${themeColor}30)`, color: themeColor, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', border: '1px solid rgba(255,255,255,0.8)' }}>
            <Layers size={26} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1e293b' }}>What to create?</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.35rem', marginBottom: '1.25rem' }}>Select the type of classwork or material you want to post.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <button className="type-card" onClick={onSelectBasic}>
              <div className="type-icon-wrapper" style={{ background: 'rgba(255,255,255,0.9)', color: '#475569', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}><Edit3 size={20} /></div>
              <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.02rem' }}>Written Work / Performance Task</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.4 }}>Assign written essays, paper photos (handwritten works), dance/video links, or performance tasks for students to submit.</div>
            </button>

            <button className="type-card" style={{ background: `linear-gradient(to right, rgba(255,255,255,0.7), ${themeColor}15)` }} onClick={onSelectExam}>
              <div className="type-icon-wrapper" style={{ background: themeColor, color: 'white', boxShadow: `0 4px 15px ${themeColor}40` }}><TargetIcon size={20} /></div>
              <div style={{ fontWeight: 800, color: themeColor, fontSize: '1.02rem' }}>Interactive Examination / Quiz</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.4 }}>Create an online quiz or quarterly exam with automatic grading in the LMS.</div>
            </button>

            {onSelectModule && (
              <button className="type-card" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.7), rgba(16, 185, 129, 0.12))' }} onClick={onSelectModule}>
                <div className="type-icon-wrapper" style={{ background: '#10b981', color: 'white', boxShadow: '0 4px 15px rgba(16,185,129,0.35)' }}><BookOpen size={20} /></div>
                <div style={{ fontWeight: 800, color: '#059669', fontSize: '1.02rem' }}>Learning Module / Video Lecture</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.4 }}>Share PDF handouts, Google Drive materials, or YouTube/video lecture links with students.</div>
              </button>
            )}
          </div>
        </div>

        {/* Pinned / Sticky Footer */}
        <div style={{ background: 'rgba(248,250,252,0.85)', padding: '0.85rem 1.5rem', borderTop: '1px solid rgba(226,232,240,0.8)', textAlign: 'center', flexShrink: 0 }}>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: '#ffffff', 
              border: '1.5px solid #cbd5e1', 
              color: '#475569', 
              fontWeight: 700, 
              cursor: 'pointer', 
              padding: '0.55rem 2.25rem', 
              borderRadius: '2rem', 
              boxShadow: '0 2px 5px rgba(0,0,0,0.03)', 
              transition: 'all 0.2s',
              fontSize: '0.9rem'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#475569'; }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── 4. CREATE / EDIT ACTIVITY MODAL ─────────────────────────────────────────
export const CreateActivityModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  selectedClass,
  modalCategories,
  isModalKto12,
  themeColor,
  isEditing = false
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const quarterColors = { 1: '#1e40af', 2: '#065f46', 3: '#92400e', 4: '#5b21b6' };
  const quarterBgs = { 1: '#dbeafe', 2: '#d1fae5', 3: '#fef3c7', 4: '#ede9fe' };

  return (
    <div className="glass-overlay" onClick={onClose}>
      <div 
        className="glass-modal" 
        style={{ 
          maxWidth: '620px', 
          maxHeight: 'calc(100vh - 2rem)', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0 
        }} 
        onClick={e => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div style={{ 
          flexShrink: 0, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1.25rem 1.75rem', 
          background: `linear-gradient(to right, rgba(255,255,255,0.7), ${themeColor}15)`, 
          borderBottom: '1px solid rgba(226,232,240,0.8)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
            <div style={{ background: themeColor, color: 'white', padding: '0.6rem', borderRadius: '0.75rem', boxShadow: `0 4px 10px ${themeColor}40`, flexShrink: 0 }}>
              <Edit3 size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isEditing ? 'Edit Task / Activity' : 'New Written Work / Performance Task'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isEditing ? 'Update task details, instructions, or due date' : 'Assign essays, paper photos, video links, or performance tasks'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            title="Close"
            style={{ 
              background: 'rgba(255,255,255,0.9)', 
              border: '1px solid rgba(203,213,225,0.8)', 
              borderRadius: '50%', 
              width: '36px', 
              height: '36px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              color: '#64748b', 
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              flexShrink: 0,
              marginLeft: '0.5rem'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* FORM BODY & ACTIONS */}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ 
            padding: '1.5rem 1.75rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.25rem', 
            background: 'rgba(248,250,252,0.4)', 
            overflowY: 'auto', 
            flex: 1 
          }}>
            {/* Class & Quarter Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-slate-200/60">
              <div>
                <label className="glass-label"><School size={12} style={{ display: 'inline', marginRight: '4px' }}/> Assigned Class</label>
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(226,232,240,0.9)', borderRadius: '0.75rem', fontFamily: 'inherit', fontSize: '0.9rem', color: '#1e293b', fontWeight: 700, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.01)' }}>
                  {selectedClass ? `${selectedClass.subject_description} - ${selectedClass.section_name || selectedClass.section}` : 'Loading details...'}
                </div>
              </div>
              {isModalKto12 && (
                <div>
                  <label className="glass-label">Academic Quarter <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    {[1, 2, 3, 4].map(q => {
                      const selected = String(formData.quarter) === String(q);
                      return (
                        <button key={q} type="button" onClick={() => setFormData(prev => ({ ...prev, quarter: q }))}
                          style={{ padding: '0.65rem 0', borderRadius: '0.75rem', border: selected ? `2px solid ${quarterColors[q]}` : '1px solid rgba(203,213,225,0.7)', background: selected ? quarterBgs[q] : 'rgba(255,255,255,0.7)', color: selected ? quarterColors[q] : '#64748b', fontWeight: selected ? 800 : 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                          Q{q}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 glass-input-group">
                <label className="glass-label">Activity Title</label>
                <div className="input-with-icon"><BookOpen size={18} className="input-icon" />
                  <input required type="text" className="glass-input-modern" placeholder="e.g. Chapter 1 Essay" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>
              </div>
              <div className="glass-input-group">
                <label className="glass-label">Grading Category</label>
                <select required className="glass-input-modern" style={{ paddingLeft: '1rem' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option value="" disabled>Select...</option>
                  {modalCategories.map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
                  {!modalCategories.some(cat => cat.key === formData.category) && formData.category && (
                    <option value={formData.category}>{formData.category.charAt(0).toUpperCase() + formData.category.slice(1)}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Points & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass-input-group">
                <label className="glass-label">Max Score</label>
                <div className="input-with-icon"><Hash size={18} className="input-icon" />
                  <input required type="number" min="1" className="glass-input-modern" placeholder="100" value={formData.max_score} onChange={e => setFormData({ ...formData, max_score: e.target.value })} />
                </div>
              </div>
              <div className="glass-input-group">
                <label className="glass-label">Due Date <span style={{fontWeight: 400, textTransform: 'none', color: '#94a3b8'}}>(Optional)</span></label>
                <div className="input-with-icon"><Calendar size={18} className="input-icon" />
                  <input type="date" className="glass-input-modern" value={formData.due_date || ''} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="glass-input-group">
              <label className="glass-label">Instructions <span style={{fontWeight: 400, textTransform: 'none', color: '#94a3b8'}}>(Optional)</span></label>
              <div className="input-with-icon align-top">
                <AlignLeft size={18} className="input-icon" style={{ top: '1rem' }} />
                <textarea className="glass-input-modern" placeholder="Enter specific instructions for the students..." value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ minHeight: '90px', resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {/* Sticky Actions Footer */}
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.75rem', background: 'rgba(255,255,255,0.9)', borderTop: '1px solid rgba(226,232,240,0.8)' }}>
            <button type="button" onClick={onClose} style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', color: '#64748b', fontWeight: 700, padding: '0.65rem 1.5rem', borderRadius: '0.75rem', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: themeColor, color: 'white', border: 'none', fontWeight: 700, padding: '0.65rem 2rem', borderRadius: '0.75rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: `0 4px 15px ${themeColor}40`, transition: 'all 0.2s' }}>
              {isSubmitting ? 'Saving...' : <><CheckCircle size={18}/> {isEditing ? 'Update Activity' : 'Save Activity'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── 5. CREATE MODULE / VIDEO LECTURE MODAL ──────────────────────────────────
export const CreateModuleModal = ({
  isOpen,
  onClose,
  moduleForm,
  setModuleForm,
  onSubmit,
  isSubmitting,
  selectedClass,
  themeColor
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="glass-overlay" onClick={onClose}>
      <div 
        className="glass-modal" 
        style={{ 
          maxWidth: '580px', 
          maxHeight: 'calc(100vh - 2rem)', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0 
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.75rem', background: 'linear-gradient(to right, rgba(255,255,255,0.75), rgba(16,185,129,0.15))', borderBottom: '1px solid rgba(226,232,240,0.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
            <div style={{ background: '#10b981', color: 'white', padding: '0.6rem', borderRadius: '0.75rem', boxShadow: '0 4px 10px rgba(16,185,129,0.35)', flexShrink: 0 }}>
              <BookOpen size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Post Learning Module</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Share a handout, PDF link, or video lecture with your class</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            title="Close"
            style={{ 
              background: 'rgba(255,255,255,0.9)', 
              border: '1px solid rgba(203,213,225,0.8)', 
              borderRadius: '50%', 
              width: '36px', 
              height: '36px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              color: '#64748b',
              flexShrink: 0,
              marginLeft: '0.5rem'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'rgba(248,250,252,0.4)', overflowY: 'auto', flex: 1 }}>
            <div>
              <label className="glass-label"><School size={12} style={{ display: 'inline', marginRight: '4px' }}/> Target Class</label>
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(226,232,240,0.9)', borderRadius: '0.75rem', fontSize: '0.9rem', color: '#1e293b', fontWeight: 700, marginTop: '0.35rem' }}>
                {selectedClass ? `${selectedClass.subject_description} - ${selectedClass.section_name || selectedClass.section}` : 'Selected Class'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModuleForm(prev => ({ ...prev, module_type: 'lecture' }))}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.85rem', borderRadius: '0.85rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem',
                  border: moduleForm.module_type === 'lecture' ? '2px solid #10b981' : '1px solid rgba(203,213,225,0.7)',
                  background: moduleForm.module_type === 'lecture' ? '#ecfdf5' : 'rgba(255,255,255,0.7)',
                  color: moduleForm.module_type === 'lecture' ? '#047857' : '#64748b'
                }}
              >
                <FileText size={18} /> Written Handout / PDF
              </button>
              <button
                type="button"
                onClick={() => setModuleForm(prev => ({ ...prev, module_type: 'video' }))}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.85rem', borderRadius: '0.85rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem',
                  border: moduleForm.module_type === 'video' ? '2px solid #ef4444' : '1px solid rgba(203,213,225,0.7)',
                  background: moduleForm.module_type === 'video' ? '#fef2f2' : 'rgba(255,255,255,0.7)',
                  color: moduleForm.module_type === 'video' ? '#b91c1c' : '#64748b'
                }}
              >
                <Video size={18} /> Video Lecture
              </button>
            </div>

            <div className="glass-input-group">
              <label className="glass-label">Module / Lecture Title <span style={{ color: '#ef4444' }}>*</span></label>
              <div className="input-with-icon">
                <BookOpen size={18} className="input-icon" />
                <input
                  required
                  type="text"
                  className="glass-input-modern"
                  placeholder="e.g. Module 1: Introduction to Philippine Literature"
                  value={moduleForm.title}
                  onChange={e => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
            </div>

            <div className="glass-input-group">
              <label className="glass-label">Resource / Video URL <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8' }}>(Google Drive, PDF Link, or YouTube URL)</span></label>
              <div className="input-with-icon">
                <LinkIcon size={18} className="input-icon" />
                <input
                  type="url"
                  className="glass-input-modern"
                  placeholder="https://drive.google.com/... or https://youtube.com/..."
                  value={moduleForm.file_url}
                  onChange={e => setModuleForm(prev => ({ ...prev, file_url: e.target.value }))}
                />
              </div>
            </div>

            <div className="glass-input-group">
              <label className="glass-label">Lecture Notes / Description <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8' }}>(Optional)</span></label>
              <div className="input-with-icon align-top">
                <AlignLeft size={18} className="input-icon" style={{ top: '1rem' }} />
                <textarea
                  className="glass-input-modern"
                  placeholder="Write a summary, key points, or reading instructions for your students..."
                  value={moduleForm.description}
                  onChange={e => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                  style={{ minHeight: '95px', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.75rem', background: 'rgba(255,255,255,0.9)', borderTop: '1px solid rgba(226,232,240,0.8)' }}>
            <button type="button" onClick={onClose} style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', color: '#64748b', fontWeight: 700, padding: '0.65rem 1.5rem', borderRadius: '0.75rem', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', color: 'white', border: 'none', fontWeight: 700, padding: '0.65rem 2rem', borderRadius: '0.75rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.35)' }}>
              {isSubmitting ? 'Posting...' : <><CheckCircle size={18} /> Post Module</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
