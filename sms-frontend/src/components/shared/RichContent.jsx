import React, { useEffect, useMemo, useRef } from 'react';
import katex from 'katex';
import DOMPurify from 'dompurify';
import 'katex/dist/katex.min.css';

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'sub', 'sup', 'br', 'p', 'div', 'span', 'ul', 'ol', 'li'];

export const sanitizeRich = (html) =>
  DOMPurify.sanitize(String(html ?? ''), {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['class', 'data-latex']
  });

const looksLikeHtml = (s) => /<\/?[a-z][\s\S]*>/i.test(String(s ?? ''));

const escapeHtml = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Convert stored value (legacy plain text or rich HTML) to safe HTML
export const toSafeHtml = (value) => {
  const v = String(value ?? '');
  return looksLikeHtml(v) ? sanitizeRich(v) : escapeHtml(v).replace(/\n/g, '<br/>');
};

// Render all math placeholders (<span class="math-tex" data-latex="...">) inside a root element
export const renderMathIn = (root) => {
  if (!root) return;
  root.querySelectorAll('.math-tex').forEach((el) => {
    const latex = el.getAttribute('data-latex') || '';
    try {
      katex.render(latex, el, { throwOnError: false, displayMode: false });
    } catch (e) {
      el.textContent = latex;
    }
  });
};

// True if the HTML has visible text or at least one math formula
export const hasRichContent = (html) => {
  const v = String(html ?? '');
  if (/class=["'][^"']*math-tex/.test(v)) return true;
  const tmp = document.createElement('div');
  tmp.innerHTML = looksLikeHtml(v) ? v : escapeHtml(v);
  return (tmp.textContent || '').replace(/\u00a0/g, ' ').trim().length > 0;
};

// Read-only renderer for question text (bold/italic/underline + KaTeX formulas)
const RichContent = ({ html, className, style, as: Tag = 'div' }) => {
  const ref = useRef(null);
  const safe = useMemo(() => toSafeHtml(html), [html]);

  useEffect(() => {
    renderMathIn(ref.current);
  }, [safe]);

  return <Tag ref={ref} className={className} style={style} dangerouslySetInnerHTML={{ __html: safe }} />;
};

export default RichContent;

