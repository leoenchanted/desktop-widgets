import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import IconButton from './IconButton';

export default function DesktopDialog({ title, eyebrow, onClose, children, className = '' }) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') { event.stopPropagation(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const nodes = [...panelRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]')].filter(node => node.getClientRects().length);
      if (!nodes.length) { event.preventDefault(); return; }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panelRef.current)) {
        event.preventDefault(); first.focus();
      }
    };
    const panel = panelRef.current;
    panel.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = overflow;
      panel.removeEventListener('keydown', handleKey);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return createPortal(
    <div className="os-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={`glass-panel os-dialog ${className}`}>
        <header className="os-dialog-header">
          <div><span className="panel-kicker">{eyebrow}</span><h2 id={titleId}>{title}</h2></div>
          <IconButton icon={FaTimes} title="关闭窗口" onClick={onClose} />
        </header>
        <div className="os-dialog-body glass-scrollbar">{children}</div>
      </section>
    </div>, document.body,
  );
}
