import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import { Bold, Italic, Underline, Subscript, Superscript, List, Sigma, Eraser, X } from 'lucide-react';
import { toSafeHtml, renderMathIn } from './RichContent';

const SNIPPETS = [
  { label: 'a/b', latex: '\\frac{a}{b}', title: 'Fraction' },
  { label: 'xⁿ', latex: 'x^{n}', title: 'Power' },
  { label: 'xₙ', latex: 'x_{n}', title: 'Subscript' },
  { label: '√x', latex: '\\sqrt{x}', title: 'Square root' },
  { label: 'ⁿ√x', latex: '\\sqrt[n]{x}', title: 'Nth root' },
  { label: '∑', latex: '\\sum_{i=1}^{n} i', title: 'Summation' },
  { label: '∫', latex: '\\int_{a}^{b} f(x)\\,dx', title: 'Integral' },
  { label: 'lim', latex: '\\lim_{x \\to 0}', title: 'Limit' },
  { label: 'π', latex: '\\pi', title: 'Pi' },
  { label: 'θ', latex: '\\theta', title: 'Theta' },
  { label: 'α', latex: '\\alpha', title: 'Alpha' },
  { label: 'β', latex: '\\beta', title: 'Beta' },
  { label: 'Δ', latex: '\\Delta', title: 'Delta' },
  { label: '∞', latex: '\\infty', title: 'Infinity' },
  { label: '±', latex: '\\pm', title: 'Plus/minus' },
  { label: '×', latex: '\\times', title: 'Times' },
  { label: '÷', latex: '\\div', title: 'Divide' },
  { label: '≤', latex: '\\leq', title: 'Less or equal' },
  { label: '≥', latex: '\\geq', title: 'Greater or equal' },
  { label: '≠', latex: '\\neq', title: 'Not equal' },
  { label: '≈', latex: '\\approx', title: 'Approximately' },
  { label: '°', latex: '^{\\circ}', title: 'Degree' },
  { label: '→', latex: '\\rightarrow', title: 'Arrow' },
  { label: '( )', latex: '\\left( x \\right)', title: 'Parentheses' }
];

const tbBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
  minWidth: '32px', height: '32px', padding: '0 8px', borderRadius: '8px',
  border: '1px solid #e2e8f0', background: 'white', color: '#334155', cursor: 'pointer',
  fontSize: '0.78rem', fontWeight: 700
};

const RichQuestionEditor = ({ value, onChange, placeholder = 'Type your question here...' }) => {
  const editorRef = useRef(null);
  const savedRange = useRef(null);
  const editingMath = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [mathOpen, setMathOpen] = useState(false);
  const [latex, setLatex] = useState('');
  const [preview, setPreview] = useState('');
  const mathInputRef = useRef(null);

  // Initial load only (parent should key this component by question id)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = toSafeHtml(value);
    renderMathIn(el);
    setIsEmpty(!el.textContent.trim() && !el.querySelector('.math-tex'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const serialize = () => {
    const clone = editorRef.current.cloneNode(true);
    clone.querySelectorAll('.math-tex').forEach((m) => {
      m.innerHTML = '';
      m.removeAttribute('contenteditable');
    });
    return clone.innerHTML;
  };

  const emit = () => {
    const el = editorRef.current;
    setIsEmpty(!el.textContent.trim() && !el.querySelector('.math-tex'));
    onChange(serialize());
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    editorRef.current.focus();
    const sel = window.getSelection();
    sel.removeAllRanges();
    if (savedRange.current) {
      sel.addRange(savedRange.current);
    } else {
      const r = document.createRange();
      r.selectNodeContents(editorRef.current);
      r.collapse(false);
      sel.addRange(r);
    }
  };

  const exec = (cmd) => {
    restoreSelection();
    document.execCommand(cmd, false, null);
    saveSelection();
    emit();
  };

  // Live KaTeX preview
  useEffect(() => {
    if (!mathOpen) return;
    try {
      setPreview(katex.renderToString(latex || '\\ ', { throwOnError: false }));
    } catch (e) {
      setPreview('');
    }
  }, [latex, mathOpen]);

  const openMath = (existingEl = null) => {
    saveSelection();
    editingMath.current = existingEl;
    setLatex(existingEl ? existingEl.getAttribute('data-latex') || '' : '');
    setMathOpen(true);
    setTimeout(() => mathInputRef.current && mathInputRef.current.focus(), 30);
  };

  const insertSnippet = (snippet) => {
    const ta = mathInputRef.current;
    if (!ta) return setLatex((p) => p + snippet);
    const start = ta.selectionStart ?? latex.length;
    const end = ta.selectionEnd ?? latex.length;
    const next = latex.slice(0, start) + snippet + latex.slice(end);
    setLatex(next);
    setTimeout(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.setSelectionRange(pos, pos);
    }, 10);
  };

  const confirmMath = () => {
    const code = latex.trim();
    setMathOpen(false);
    if (!code) {
      editingMath.current = null;
      return;
    }
    if (editingMath.current) {
      editingMath.current.setAttribute('data-latex', code);
      renderMathIn(editorRef.current);
      editingMath.current = null;
      emit();
      return;
    }
    restoreSelection();
    const span = document.createElement('span');
    span.className = 'math-tex';
    span.setAttribute('data-latex', code);
    span.setAttribute('contenteditable', 'false');
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(span);
      const space = document.createTextNode('\u00a0');
      span.after(space);
      range.setStartAfter(space);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editorRef.current.appendChild(span);
    }
    renderMathIn(editorRef.current);
    emit();
  };

  const onEditorClick = (e) => {
    const math = e.target.closest && e.target.closest('.math-tex');
    if (math && editorRef.current.contains(math)) {
      openMath(math);
    }
  };

  const onPaste = (e) => {
    // Paste as plain text to keep markup clean
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'u'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      exec({ b: 'bold', i: 'italic', u: 'underline' }[e.key.toLowerCase()]);
    }
  };

  const keepFocus = (e) => e.preventDefault();

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        .rq-editor { min-height: 70px; padding: 0.85rem 1rem; outline: none; line-height: 1.6; color: #1e293b; font-size: 1rem; font-weight: 500; word-break: break-word; }
        .rq-editor ul, .rq-editor ol { padding-left: 1.5rem; margin: 0.25rem 0; }
        .rq-editor ul { list-style: disc; } .rq-editor ol { list-style: decimal; }
        .rq-editor .math-tex { display: inline-block; padding: 0 4px; border-radius: 6px; cursor: pointer; background: #eef2ff; border: 1px dashed #c7d2fe; vertical-align: middle; }
        .rq-editor .math-tex:hover { background: #e0e7ff; }
        .rq-wrap:focus-within { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        .rq-ph { position: absolute; top: 0.85rem; left: 1rem; color: #94a3b8; pointer-events: none; font-weight: 500; }
      `}</style>

      <div className="rq-wrap" style={{ border: '1px solid #cbd5e1', borderRadius: '0.85rem', background: 'white', overflow: 'visible', position: 'relative' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0.5rem 0.6rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '0.85rem 0.85rem 0 0' }}>
          <button type="button" title="Bold (Ctrl+B)" onMouseDown={keepFocus} onClick={() => exec('bold')} style={tbBtn}><Bold size={15} /></button>
          <button type="button" title="Italic (Ctrl+I)" onMouseDown={keepFocus} onClick={() => exec('italic')} style={tbBtn}><Italic size={15} /></button>
          <button type="button" title="Underline (Ctrl+U)" onMouseDown={keepFocus} onClick={() => exec('underline')} style={tbBtn}><Underline size={15} /></button>
          <span style={{ width: 1, background: '#e2e8f0', margin: '0 2px' }} />
          <button type="button" title="Subscript" onMouseDown={keepFocus} onClick={() => exec('subscript')} style={tbBtn}><Subscript size={15} /></button>
          <button type="button" title="Superscript" onMouseDown={keepFocus} onClick={() => exec('superscript')} style={tbBtn}><Superscript size={15} /></button>
          <button type="button" title="Bulleted list" onMouseDown={keepFocus} onClick={() => exec('insertUnorderedList')} style={tbBtn}><List size={15} /></button>
          <button type="button" title="Clear formatting" onMouseDown={keepFocus} onClick={() => exec('removeFormat')} style={tbBtn}><Eraser size={15} /></button>
          <span style={{ width: 1, background: '#e2e8f0', margin: '0 2px' }} />
          <button
            type="button"
            title="Insert math formula"
            onMouseDown={keepFocus}
            onClick={() => openMath(null)}
            style={{ ...tbBtn, background: '#eef2ff', color: '#4338ca', borderColor: '#c7d2fe' }}
          >
            <Sigma size={15} /> Math Formula
          </button>
        </div>

        {/* Editable area */}
        <div style={{ position: 'relative' }}>
          {isEmpty && <span className="rq-ph">{placeholder}</span>}
          <div
            ref={editorRef}
            className="rq-editor"
            contentEditable
            suppressContentEditableWarning
            onInput={emit}
            onBlur={saveSelection}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            onClick={onEditorClick}
            onPaste={onPaste}
            onKeyDown={onKeyDown}
          />
        </div>

        {/* Math formula panel */}
        {mathOpen && (
          <div style={{ borderTop: '1px solid #c7d2fe', background: '#f5f7ff', padding: '0.9rem', borderRadius: '0 0 0.85rem 0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {editingMath.current ? 'Edit Math Formula' : 'Insert Math Formula'}
              </span>
              <button type="button" onClick={() => { setMathOpen(false); editingMath.current = null; }} style={{ ...tbBtn, minWidth: 28, height: 28, padding: 0 }}><X size={14} /></button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '0.6rem' }}>
              {SNIPPETS.map((s) => (
                <button key={s.title} type="button" title={s.title} onClick={() => insertSnippet(s.latex)} style={{ ...tbBtn, height: 30, background: 'white' }}>
                  {s.label}
                </button>
              ))}
            </div>

            <textarea
              ref={mathInputRef}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="Type LaTeX, e.g.  x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
              rows={2}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '0.6rem', border: '1px solid #c7d2fe', fontFamily: 'monospace', fontSize: '0.9rem', background: 'white', color: '#1e293b', resize: 'vertical' }}
            />

            <div style={{ margin: '0.6rem 0', padding: '0.75rem', background: 'white', border: '1px dashed #c7d2fe', borderRadius: '0.6rem', minHeight: 48, textAlign: 'center', fontSize: '1.15rem', overflowX: 'auto' }}>
              {latex.trim()
                ? <span dangerouslySetInnerHTML={{ __html: preview }} />
                : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Live preview appears here</span>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => { setMathOpen(false); editingMath.current = null; }} style={{ ...tbBtn, padding: '0 14px' }}>Cancel</button>
              <button type="button" onClick={confirmMath} style={{ ...tbBtn, padding: '0 16px', background: '#4f46e5', color: 'white', borderColor: '#4f46e5' }}>
                {editingMath.current ? 'Update Formula' : 'Insert Formula'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RichQuestionEditor;

