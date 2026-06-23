// src/components/shared/gradingStyles.js

export const gradingStyles = (theme) => `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  
  .tag-root { font-family: 'Plus Jakarta Sans', sans-serif; padding: 1.5rem; max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }
  
  /* --- HEADER --- */
  .tag-header { 
    display: flex; align-items: center; justify-content: space-between; 
    padding: 1rem 1.25rem; border-radius: 1.25rem;
    background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  }
  .tag-header-info { display: flex; align-items: center; gap: 1rem; }
  .tag-back-btn { 
    display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; 
    border-radius: 0.75rem; background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(255, 255, 255, 0.8); cursor: pointer;
    transition: all 0.15s;
  }
  .tag-back-btn:hover { background: rgba(255, 255, 255, 0.9); }
  .tag-badge-group { display: flex; gap: 0.5rem; margin-top: 0.25rem; }
  .tag-badge { padding: 0.2rem 0.6rem; border-radius: 2rem; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; background: rgba(255,255,255,0.9); border: 1px solid rgba(0,0,0,0.05); color: #64748b; }

  /* --- CONTAINER & TABLE --- */
  .tag-container {
    background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px);
    border-radius: 1.25rem; padding: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05); overflow-x: auto;
  }
  .tag-table { width: 100%; border-collapse: collapse; min-width: 600px; }
  .tag-th { text-align: left; padding: 1rem; font-size: 0.75rem; font-weight: 800; color: #64748b; border-bottom: 1.5px solid rgba(0,0,0,0.05); }
  .tag-td { padding: 0.8rem 1rem; border-bottom: 1px solid rgba(0,0,0,0.05); }

  /* --- INPUTS & BUTTONS --- */
  .tag-input {
    width: 80px; padding: 0.5rem; border-radius: 0.6rem; border: 1px solid rgba(0,0,0,0.1); background: rgba(255,255,255,0.7);
    text-align: center; font-weight: 700; font-family: inherit; transition: all 0.2s;
  }
  .tag-input:focus { outline: none; border-color: ${theme}; background: white; box-shadow: 0 0 0 3px ${theme}22; }

  .tag-save-btn {
    display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem;
    background: ${theme}; color: white; border: none; border-radius: 0.75rem;
    font-weight: 800; font-size: 0.8rem; cursor: pointer; box-shadow: 0 4px 12px ${theme}44; transition: all 0.15s;
  }
  .tag-save-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px ${theme}66; }
  .tag-save-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

  .tag-view-btn {
    display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.4rem 0.8rem;
    background: ${theme}15; color: ${theme}; border: none; border-radius: 0.5rem;
    font-size: 0.7rem; font-weight: 800; cursor: pointer; transition: all 0.15s;
  }
  .tag-view-btn:hover { background: ${theme}33; }

  /* --- STATUS BANNER --- */
  .tag-status { padding: 0.7rem 1rem; border-radius: 0.85rem; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; backdrop-filter: blur(8px); }
  .tag-status--success { background: rgba(240, 253, 244, 0.85); border: 1px solid rgba(187, 247, 208, 0.5); color: #166534; }
  .tag-status--error { background: rgba(254, 242, 242, 0.85); border: 1px solid rgba(254, 202, 202, 0.5); color: #991b1b; }

  /* --- MODAL --- */
  .tag-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 1rem; backdrop-filter: blur(4px); }
  .tag-modal { 
    background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(25px); border: 1px solid rgba(255, 255, 255, 0.8);
    width: 100%; max-width: 600px; border-radius: 1.25rem; padding: 1.5rem; box-shadow: 0 20px 40px rgba(0,0,0,0.15); 
  }

  /* --- SKELETON LOADING --- */
  @keyframes pulseSkeleton { 0% { background-color: ${theme}15; } 50% { background-color: ${theme}33; } 100% { background-color: ${theme}15; } }
  .skeleton { animation: pulseSkeleton 1s infinite ease-in-out; border-radius: 4px; }
`;