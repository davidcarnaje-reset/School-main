// GradeManagementStyles.js

export const gradeStyles = (theme) => `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  .gm-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 1.5rem;
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 100%;
  }

  /* ── HEADER ── */
  .gm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    background: white;
    border: 1px solid #f1f5f9;
    border-radius: 1.25rem;
    padding: 1rem 1.25rem;
    box-shadow: 0 1px 4px rgba(0,0,0,.05);
  }
  .gm-header-left { display: flex; align-items: center; gap: .875rem; }
  .gm-back-btn {
    display: flex; align-items: center; justify-content: center;
    width: 38px; height: 38px;
    border: 1.5px solid #e2e8f0;
    border-radius: .75rem;
    background: white;
    color: #64748b;
    cursor: pointer;
    transition: background .15s, transform .1s;
    flex-shrink: 0;
  }
  .gm-back-btn:hover { background: #f8fafc; }
  .gm-back-btn:active { transform: scale(.95); }

  .gm-title {
    font-size: 1.2rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 .35rem;
    letter-spacing: -.02em;
  }
  .gm-meta { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; }
  .gm-chip {
    display: inline-flex; align-items: center; gap: .3rem;
    padding: .2rem .55rem;
    background: #f1f5f9;
    border-radius: .45rem;
    font-size: .65rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: .06em;
    border: 1px solid #e2e8f0;
  }
  .gm-chip--level { background: #ede9fe; color: ${theme}; border-color: #ddd6fe; }

  .gm-header-right { display: flex; align-items: center; gap: .6rem; }
  .gm-retry-btn {
    display: inline-flex; align-items: center; gap: .4rem;
    padding: .5rem .9rem;
    border: 1.5px solid #fbbf24;
    border-radius: .75rem;
    background: #fefce8;
    color: #92400e;
    font-size: .72rem;
    font-weight: 700;
    cursor: pointer;
    transition: background .15s;
    font-family: inherit;
  }
  .gm-retry-btn:hover { background: #fef9c3; }
  .gm-save-btn {
    display: inline-flex; align-items: center; gap: .45rem;
    padding: .55rem 1.1rem;
    border: none;
    border-radius: .75rem;
    background: ${theme};
    color: white;
    font-size: .75rem;
    font-weight: 800;
    cursor: pointer;
    transition: opacity .15s, transform .1s;
    box-shadow: 0 2px 8px ${theme}55;
    font-family: inherit;
  }
  .gm-save-btn:hover:not(:disabled) { opacity: .92; transform: translateY(-1px); }
  .gm-save-btn:active:not(:disabled) { transform: scale(.97); }
  .gm-save-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* ── BANNERS ── */
  .gm-offline-banner {
    display: flex; align-items: center; gap: .55rem;
    padding: .7rem 1rem;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: .85rem;
    color: #92400e;
    font-size: .75rem;
    font-weight: 600;
  }
  .gm-status {
    display: flex; align-items: center; gap: .55rem;
    padding: .7rem 1rem;
    border-radius: .85rem;
    font-size: .75rem;
    font-weight: 700;
    animation: fadeSlide .25s ease;
  }
  .gm-status--success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
  .gm-status--error   { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
  @keyframes fadeSlide {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── STATS ── */
  .gm-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: .75rem;
  }
  .gm-stat-card {
    background: white;
    border: 1px solid #f1f5f9;
    border-radius: 1rem;
    padding: .9rem 1rem;
    display: flex;
    align-items: center;
    gap: .75rem;
    box-shadow: 0 1px 3px rgba(0,0,0,.04);
    position: relative;
    overflow: hidden;
  }
  .gm-stat-icon {
    width: 38px; height: 38px;
    border-radius: .7rem;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: white;
  }
  .gm-stat-icon--blue   { background: ${theme}; }
  .gm-stat-icon--green  { background: #10b981; }
  .gm-stat-icon--red    { background: #ef4444; }
  .gm-stat-icon--purple { background: #8b5cf6; }
  .gm-stat-label { font-size: .65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; margin: 0; }
  .gm-stat-value { font-size: 1.35rem; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -.03em; }
  .gm-pass-bar {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 3px; background: #e2e8f0; border-radius: 0 0 1rem 1rem;
  }
  .gm-pass-bar-fill {
    height: 100%;
    background: #8b5cf6;
    border-radius: inherit;
    transition: width .6s ease;
  }

  /* ── CARD ── */
  .gm-card {
    background: white;
    border: 1px solid #f1f5f9;
    border-radius: 1.25rem;
    box-shadow: 0 1px 6px rgba(0,0,0,.05);
    overflow: hidden;
  }

  /* ── TOOLBAR ── */
  .gm-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: .75rem;
    align-items: center;
    padding: .9rem 1.25rem;
    border-bottom: 1px solid #f1f5f9;
    background: #fafafa;
  }
  .gm-search-wrap {
    position: relative;
    flex: 1;
    min-width: 180px;
  }
  .gm-search-icon {
    position: absolute; left: .65rem; top: 50%; transform: translateY(-50%);
    color: #94a3b8; pointer-events: none;
  }
  .gm-search {
    width: 100%;
    padding: .48rem .75rem .48rem 2rem;
    border: 1.5px solid #e2e8f0;
    border-radius: .65rem;
    font-size: .78rem;
    font-family: inherit;
    color: #334155;
    background: white;
    outline: none;
    transition: border-color .15s;
    box-sizing: border-box;
  }
  .gm-search:focus { border-color: ${theme}; }

  .gm-filter-wrap {
    display: flex; align-items: center; gap: .35rem;
    color: #94a3b8; font-size: .72rem;
  }
  .gm-filter-btn {
    padding: .38rem .7rem;
    border: 1.5px solid #e2e8f0;
    border-radius: .55rem;
    background: white;
    color: #64748b;
    font-size: .7rem;
    font-weight: 700;
    cursor: pointer;
    transition: all .15s;
    font-family: inherit;
  }
  .gm-filter-btn.active {
    background: ${theme};
    border-color: ${theme};
    color: white;
  }

  /* ── TABLE ── */
  .gm-table-wrap { overflow-x: auto; }
  .gm-table {
    width: 100%;
    border-collapse: collapse;
    font-size: .8rem;
  }
  .gm-th {
    padding: .75rem 1rem;
    font-size: .65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: #94a3b8;
    background: #fafafa;
    border-bottom: 1.5px solid #f1f5f9;
    white-space: nowrap;
  }
  .gm-th--name   { text-align: left; }
  .gm-th--center { text-align: center; }
  .gm-th-inner   { display: flex; align-items: center; gap: .35rem; }
  .gm-cat-header { display: flex; flex-direction: column; align-items: center; gap: .1rem; }
  .gm-cat-label  { font-size: .65rem; font-weight: 800; color: #64748b; }
  .gm-cat-pct    { font-size: .6rem;  font-weight: 700; color: ${theme}; }

  .gm-row { transition: background .12s; }
  .gm-row:hover { background: #fafcff; }
  .gm-row:not(:last-child) .gm-td { border-bottom: 1px solid #f8fafc; }

  .gm-td         { padding: .6rem 1rem; vertical-align: middle; }
  .gm-td--center { text-align: center; }

  .gm-student-info { display: flex; align-items: center; gap: .6rem; }
  .gm-avatar {
    width: 34px; height: 34px;
    border-radius: .55rem;
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: .75rem;
    color: white;
    flex-shrink: 0;
  }
  .gm-student-name { font-weight: 700; color: #1e293b; font-size: .8rem; margin: 0; }
  .gm-student-id   { font-size: .65rem; font-weight: 600; color: #94a3b8; margin: 0; }

  .gm-input {
    width: 64px;
    padding: .4rem;
    border: 1.5px solid #e2e8f0;
    border-radius: .55rem;
    text-align: center;
    font-size: .8rem;
    font-weight: 700;
    font-family: inherit;
    color: #334155;
    background: #f8fafc;
    outline: none;
    transition: border-color .15s, background .15s;
    -moz-appearance: textfield;
  }
  .gm-input::-webkit-outer-spin-button,
  .gm-input::-webkit-inner-spin-button { -webkit-appearance: none; }
  .gm-input:focus {
    border-color: var(--focus-color, ${theme});
    background: white;
  }

  .gm-final       { font-size: 1rem; font-weight: 900; letter-spacing: -.02em; }
  .gm-final--pass { color: #059669; }
  .gm-final--fail { color: #dc2626; }

  .gm-badge {
    display: inline-block;
    padding: .22rem .65rem;
    border-radius: .4rem;
    font-size: .65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .06em;
  }
  .gm-badge--pass { background: #d1fae5; color: #065f46; }
  .gm-badge--fail { background: #fee2e2; color: #991b1b; }

  .gm-empty {
    text-align: center;
    padding: 2.5rem;
    color: #94a3b8;
    font-size: .82rem;
    font-weight: 600;
  }
    

  /* ── TABLE FOOTER ── */
  .gm-table-footer {
    padding: .65rem 1.25rem;
    font-size: .68rem;
    font-weight: 600;
    color: #94a3b8;
    border-top: 1px solid #f1f5f9;
    background: #fafafa;
    text-align: right;
  }

  /* ── LOADING ── */
  .gm-spinner {
    width: 36px; height: 36px;
    border: 3px solid #e2e8f0;
    border-top-color: ${theme};
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  .gm-btn-spinner {
    width: 13px; height: 13px;
    border: 2px solid rgba(255,255,255,.4);
    border-top-color: white;
    border-radius: 50%;
    animation: spin .6s linear infinite;
    display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin            { animation: spin .6s linear infinite; }
  .gm-loading-text { color: #64748b; font-size: .82rem; font-weight: 600; }

  // Add after the existing styles in gradeStyles()

  /* ── COLLEGE SPECIFIC STYLES ── */
  .gm-period-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.2rem 0.65rem;
    background: ${theme}15;
    border: 1px solid ${theme}30;
    border-radius: 0.5rem;
    font-size: 0.65rem;
    font-weight: 800;
    color: ${theme};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .gm-grade-scale-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.15rem 0.5rem;
    background: #f8fafc;
    border-radius: 0.4rem;
    font-size: 0.6rem;
    font-weight: 700;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }

  /* College final grade display */
  .gm-final--college {
    font-family: 'Plus Jakarta Sans', monospace;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  /* Weight display for college periods */
  .gm-weight-indicator {
    display: inline-block;
    padding: 0.1rem 0.4rem;
    background: ${theme}10;
    border-radius: 0.3rem;
    font-size: 0.55rem;
    font-weight: 800;
    color: ${theme};
    margin-left: 0.25rem;
  }
`;

