import React from 'react';
import { Layers, Edit3, Target as TargetIcon, X, CheckCircle, School, BookOpen, Hash, Calendar, AlignLeft } from 'lucide-react';

// ─── 1. GLOBAL GLASSMORPHISM STYLES ────────────────────────────────────────
export const gcGlassStyles = (themeColor) => `
  @keyframes fadeInOverlay { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(8px); } }
  @keyframes popInModal { 0% { opacity: 0; transform: scale(0.95) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes slideUpFade { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  
  .animate-slide-up { animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

  /* OVERLAYS & MODALS */
  .glass-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeInOverlay 0.3s ease-out forwards; }
  .glass-modal { background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border-radius: 1.5rem; width: 100%; animation: popInModal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; overflow: hidden; }

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
  .type-card { display: flex; flex-direction: column; text-align: left; padding: 1.5rem; border-radius: 1.25rem; background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.8); cursor: pointer; transition: all 0.25s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
  .type-card:hover { background: rgba(255, 255, 255, 0.9); transform: translateY(-4px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border-color: ${themeColor}40; }
  .type-icon-wrapper { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }

  /* INPUT FIELDS (GLASS) */
  .glass-input-group { display: flex; flex-direction: column; gap: 0.4rem; }
  .glass-label { font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; }
  .input-with-icon { position: relative; display: flex; align-items: center; }
  .input-icon { position: absolute; left: 1rem; color: #94a3b8; pointer-events: none; }
  .glass-input-modern { width: 100%; padding: 0.85rem 1rem 0.85rem 2.75rem; background: rgba(255,255,255,0.6); backdrop-filter: blur(8px); border: 1.5px solid rgba(255,255,255,0.6); border-radius: 0.75rem; font-family: inherit; font-size: 0.95rem; color: #1e293b; outline: none; transition: all 0.2s ease; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
  .glass-input-modern:focus { background: rgba(255,255,255,0.95); border-color: ${themeColor}; box-shadow: 0 0 0 4px ${themeColor}20; }
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
export const TypeSelectorModal = ({ isOpen, onClose, onSelectBasic, onSelectExam, themeColor }) => {
  if (!isOpen) return null;
  return (
    <div className="glass-overlay" onClick={onClose}>
      <div className="glass-modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: `linear-gradient(135deg, ${themeColor}15, ${themeColor}30)`, color: themeColor, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', border: '1px solid rgba(255,255,255,0.8)' }}>
            <Layers size={32} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', tracking: 'tight' }}>What to create?</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.5rem', marginBottom: '2rem' }}>Select the type of activity you want to assign.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="type-card" onClick={onSelectBasic}>
              <div className="type-icon-wrapper" style={{ background: 'rgba(255,255,255,0.9)', color: '#475569', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}><Edit3 size={22} /></div>
              <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>Written Work / Task</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem', lineHeight: 1.4 }}>Standard assignment. Students submit offline or you manually encode their scores.</div>
            </button>
            <button className="type-card" style={{ background: `linear-gradient(to right, rgba(255,255,255,0.6), ${themeColor}15)` }} onClick={onSelectExam}>
              <div className="type-icon-wrapper" style={{ background: themeColor, color: 'white', boxShadow: `0 4px 15px ${themeColor}40` }}><TargetIcon size={22} /></div>
              <div style={{ fontWeight: 800, color: themeColor, fontSize: '1.1rem' }}>Interactive Examination</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem', lineHeight: 1.4 }}>Create a dynamic quiz with multiple choices. The system grades it automatically.</div>
            </button>
          </div>
        </div>
        <div style={{ background: 'rgba(248,250,252,0.5)', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.4)', textAlign: 'center' }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.9)', color: '#64748b', fontWeight: 700, cursor: 'pointer', padding: '0.6rem 2rem', borderRadius: '2rem', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── 4. CREATE ACTIVITY MODAL ────────────────────────────────────────────────
export const CreateActivityModal = ({ isOpen, onClose, formData, setFormData, onSubmit, isSubmitting, selectedClass, modalCategories, isModalKto12, themeColor }) => {
  if (!isOpen) return null;
  const quarterColors = { 1: '#1e40af', 2: '#065f46', 3: '#92400e', 4: '#5b21b6' };
  const quarterBgs = { 1: '#dbeafe', 2: '#d1fae5', 3: '#fef3c7', 4: '#ede9fe' };

  return (
    <div className="glass-overlay" onClick={onClose}>
      <div className="glass-modal" style={{ maxWidth: '600px', padding: 0 }} onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', background: `linear-gradient(to right, rgba(255,255,255,0.7), ${themeColor}15)`, borderBottom: '1px solid rgba(255,255,255,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: themeColor, color: 'white', padding: '0.6rem', borderRadius: '0.75rem', boxShadow: `0 4px 10px ${themeColor}40` }}><Edit3 size={22} /></div>
            <div><h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>New Basic Activity</h2><p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Encode a written work or standard task</p></div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}><X size={18} /></button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={onSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(248,250,252,0.4)' }}>
          
          {/* Class & Quarter Info */}
          <div style={{ display: 'grid', gridTemplateColumns: isModalKto12 ? '1fr 1fr' : '1fr', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <div>
              <label className="glass-label"><School size={12} style={{ display: 'inline', marginRight: '4px' }}/> Assigned Class</label>
              <div style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: '0.75rem', fontFamily: 'inherit', fontSize: '0.95rem', color: '#1e293b', fontWeight: 700, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.01)' }}>
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
                        style={{ padding: '0.75rem 0', borderRadius: '0.75rem', border: selected ? `2px solid ${quarterColors[q]}` : '1px solid rgba(255,255,255,0.7)', background: selected ? quarterBgs[q] : 'rgba(255,255,255,0.6)', color: selected ? quarterColors[q] : '#64748b', fontWeight: selected ? 800 : 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: selected ? 'none' : '0 2px 5px rgba(0,0,0,0.02)' }}>
                        Q{q}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Title & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
            <div className="glass-input-group">
              <label className="glass-label">Activity Title</label>
              <div className="input-with-icon"><BookOpen size={18} className="input-icon" />
                <input required type="text" className="glass-input-modern" placeholder="e.g. Chapter 1 Essay" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
            </div>
            <div className="glass-input-group">
              <label className="glass-label">Grading Category</label>
              <select required className="glass-input-modern" style={{ paddingLeft: '1rem' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                <option value="" disabled>Select...</option>
                {modalCategories.filter(cat => cat.key !== 'performance').map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
              </select>
            </div>
          </div>

          {/* Points & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-input-group">
              <label className="glass-label">Max Score</label>
              <div className="input-with-icon"><Hash size={18} className="input-icon" />
                <input required type="number" min="1" className="glass-input-modern" placeholder="100" value={formData.max_score} onChange={e => setFormData({ ...formData, max_score: e.target.value })} />
              </div>
            </div>
            <div className="glass-input-group">
              <label className="glass-label">Due Date <span style={{fontWeight: 400, textTransform: 'none', color: '#94a3b8'}}>(Optional)</span></label>
              <div className="input-with-icon"><Calendar size={18} className="input-icon" />
                <input type="date" className="glass-input-modern" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="glass-input-group">
            <label className="glass-label">Instructions <span style={{fontWeight: 400, textTransform: 'none', color: '#94a3b8'}}>(Optional)</span></label>
            <div className="input-with-icon align-top">
              <AlignLeft size={18} className="input-icon" style={{ top: '1rem' }} />
              <textarea className="glass-input-modern" placeholder="Enter specific instructions for the students..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ minHeight: '90px', resize: 'vertical' }} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.9)', color: '#64748b', fontWeight: 700, padding: '0.75rem 1.5rem', borderRadius: '0.75rem', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: themeColor, color: 'white', border: 'none', fontWeight: 700, padding: '0.75rem 2rem', borderRadius: '0.75rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: `0 4px 15px ${themeColor}40`, transition: 'all 0.2s' }}>
              {isSubmitting ? 'Saving...' : <><CheckCircle size={18}/> Save Activity</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};