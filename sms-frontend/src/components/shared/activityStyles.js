export const activityStyles = (theme) => `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  
  .ta-root { 
    font-family: 'Plus Jakarta Sans', sans-serif; 
    padding: 1.5rem; 
    max-width: 1280px; 
    margin: 0 auto; 
    display: flex; 
    flex-direction: column; 
    gap: 1.25rem; 
  }
  
  /* --- GLASSMORPHISM BASICS --- */
  .glass-panel {
    background: rgba(255, 255, 255, 0.75); 
    backdrop-filter: blur(16px); 
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  }

  /* --- HEADER --- */
  .ta-header { 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    flex-wrap: wrap; 
    gap: 1rem; 
    border-radius: 1.25rem; 
    padding: 1rem 1.25rem; 
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  }
  .ta-header-left { display: flex; align-items: center; gap: .875rem; }
  .ta-back-btn { 
    display: flex; align-items: center; justify-content: center; 
    width: 38px; height: 38px; 
    border: 1px solid rgba(255, 255, 255, 0.8); 
    border-radius: .75rem; 
    background: rgba(255, 255, 255, 0.5); 
    cursor: pointer; transition: all .15s; 
  }
  .ta-back-btn:hover { background: rgba(255, 255, 255, 0.9); }
  .ta-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0 0 .35rem; }
  .ta-add-btn { 
    display: inline-flex; align-items: center; gap: .45rem; 
    padding: .55rem 1.1rem; border: none; border-radius: .75rem; 
    background: ${theme}; color: white; font-size: .75rem; font-weight: 800; 
    cursor: pointer; transition: opacity .15s, transform .1s; white-space: nowrap; 
    box-shadow: 0 4px 12px ${theme}44;
  }
  .ta-add-btn:hover { opacity: .9; transform: translateY(-1px); }
  .ta-add-btn:active { transform: scale(0.97); }
  
  .ta-class-selector { 
    padding: .4rem .8rem; border: 1px solid rgba(255,255,255, 0.6); border-radius: .6rem; 
    font-family: inherit; font-size: .8rem; font-weight: 700; color: #334155; 
    outline: none; background: rgba(255, 255, 255, 0.5); cursor: pointer; transition: all 0.15s;
  }
  .ta-class-selector:focus { border-color: ${theme}; background: rgba(255, 255, 255, 0.9); }
  
  /* --- STATUS BANNERS --- */
  .ta-status {
    display: flex; align-items: center; gap: .55rem;
    padding: .7rem 1rem; border-radius: .85rem;
    font-size: .8rem; font-weight: 700;
    animation: fadeSlide .25s ease;
    backdrop-filter: blur(8px);
  }
  .ta-status--success { background: rgba(240, 253, 244, 0.85); border: 1px solid rgba(187, 247, 208, 0.5); color: #166534; }
  .ta-status--error   { background: rgba(254, 242, 242, 0.85); border: 1px solid rgba(254, 202, 202, 0.5); color: #991b1b; }
  
  /* --- MAIN CONTAINER & CARDS --- */
  .ta-container {
    border-radius: 1.25rem;
    padding: 1.5rem;
    min-height: 400px;
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  }
  .ta-container-header {
    display: flex; align-items: center; gap: 0.5rem;
    padding-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.05);
    margin-bottom: 1.25rem;
  }
  .ta-container-title { font-size: 1.05rem; font-weight: 800; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 0.5rem; }

  .ta-grid { 
    display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; 
  }
  .ta-card { 
    background: rgba(255, 255, 255, 0.6); 
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.8); 
    border-radius: 1rem; padding: 1.25rem; 
    display: flex; flex-direction: column; gap: .75rem; 
    transition: all 0.2s ease;
    box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  }
  .ta-card:hover {
    background: rgba(255, 255, 255, 0.85);
    border-color: ${theme}66;
    box-shadow: 0 8px 25px rgba(0,0,0,0.06);
    transform: translateY(-3px);
  }
  .ta-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;}
  .ta-card-title { font-size: .95rem; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.3;}
  .ta-badge { 
    padding: .2rem .6rem; border-radius: 2rem; font-size: .65rem; 
    font-weight: 800; text-transform: uppercase; background: rgba(255,255,255,0.7); 
    color: #475569; border: 1px solid rgba(0,0,0,0.05); white-space: nowrap;
  }
  .ta-card-desc { 
    font-size: .8rem; color: #475569; margin: 0; 
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; 
  }
  .ta-card-meta { 
    display: flex; gap: 1rem; font-size: .72rem; font-weight: 700; color: #475569; 
    margin-top: auto; padding-top: 1rem; border-top: 1px solid rgba(0,0,0,0.05); 
  }
  .ta-meta-item { display: flex; align-items: center; gap: .3rem; }
  .ta-grade-btn { 
    width: 100%; padding: .65rem; margin-top: .5rem; background: rgba(255,255,255,0.7); 
    border: 1px solid rgba(255,255,255,0.9); border-radius: .75rem; color: ${theme}; 
    font-weight: 800; font-size: .75rem; cursor: pointer; transition: all .15s; 
  }
  .ta-grade-btn:hover { background: ${theme}; color: white; border-color: ${theme}; }

  /* --- SKELETON LOADING ANIMATION --- */
  @keyframes pulseSkeleton {
    0% { background-color: ${theme}15; } 
    50% { background-color: ${theme}33; } 
    100% { background-color: ${theme}15; }
  }

  .ta-skeleton-card {
    background: rgba(255, 255, 255, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 1rem; padding: 1.25rem;
    display: flex; flex-direction: column; gap: 0.75rem;
    min-height: 180px;
  }
  .ta-skel-line {
    border-radius: 4px;
    animation: pulseSkeleton 1.5s infinite ease-in-out;
  }
  .ta-skel-title { width: 60%; height: 1.2rem; }
  .ta-skel-badge { width: 25%; height: 1.2rem; border-radius: 1rem; }
  .ta-skel-desc1 { width: 100%; height: 0.8rem; margin-top: 0.5rem; }
  .ta-skel-desc2 { width: 80%; height: 0.8rem; }
  .ta-skel-btn   { width: 100%; height: 2.2rem; margin-top: auto; border-radius: 0.75rem; }
  
  /* --- EMPTY STATE --- */
  .ta-empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 4rem 2rem; background: rgba(255,255,255,0.4); border: 2px solid rgba(226, 232, 240, 0.6);
    border-radius: 1rem; text-align: center; gap: 1rem;
  }
  .ta-empty-icon {
    width: 54px; height: 54px; background: rgba(255,255,255,0.8); color: #cbd5e1;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid rgba(255,255,255,0.8);
  }
  .ta-empty-title { margin: 0; font-weight: 800; color: #334155; font-size: 1rem; }
  .ta-empty-desc { margin: 0; font-size: .82rem; color: #64748b; font-weight: 500; }
  
  /* --- MODAL --- */
  .ta-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 1rem; backdrop-filter: blur(4px); }
  .ta-modal { 
    background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(25px);
    width: 100%; max-width: 500px; border-radius: 1.25rem; padding: 1.5rem; 
    box-shadow: 0 20px 40px rgba(0,0,0,0.15); max-height: 90vh; overflow-y: auto; 
    border: 1px solid rgba(255, 255, 255, 0.8);
  }
  .ta-modal-title { font-size: 1.1rem; font-weight: 800; margin-top: 0; margin-bottom: 1.5rem; color: #0f172a; }
  .ta-form-group { margin-bottom: 1rem; }
  .ta-label { display: block; font-size: .75rem; font-weight: 700; color: #475569; margin-bottom: .4rem; }
  .ta-input, .ta-select, .ta-textarea { 
    width: 100%; padding: .65rem; border: 1px solid rgba(0,0,0,0.1); border-radius: .75rem; 
    font-family: inherit; font-size: .85rem; transition: all .15s; box-sizing: border-box; 
    background: rgba(255,255,255,0.7);
  }
  .ta-input:focus, .ta-select:focus, .ta-textarea:focus { outline: none; border-color: ${theme}; background: white; box-shadow: 0 0 0 3px ${theme}22; }
  .ta-textarea { resize: vertical; min-height: 80px; }
  .ta-modal-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1.5rem; }
  .ta-cancel-btn { padding: .55rem 1rem; background: rgba(241, 245, 249, 0.8); color: #475569; border: none; border-radius: .6rem; font-weight: 700; cursor: pointer; font-size: .75rem; transition: background 0.15s;}
  .ta-cancel-btn:hover { background: #e2e8f0; }
`;