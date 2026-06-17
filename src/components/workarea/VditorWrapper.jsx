import { useCallback, useEffect, useRef, useState } from 'react';
import Vditor from 'vditor';
import 'vditor/dist/index.css';

const VditorWrapper = ({
  content,
  onContentChange,
  className = '',
  glowCaretEnabled = true,
  glowIntensity = 1,
}) => {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const vditorRef = useRef(null);
  const isDestroyingRef = useRef(false);
  const pendingContentRef = useRef(null);
  const frameRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [typing, setTyping] = useState(false);
  const [caret, setCaret] = useState({ left: 0, top: 0, height: 32, visible: false });

  const hideCaret = useCallback(() => {
    setCaret((current) => (current.visible ? { ...current, visible: false } : current));
  }, []);

  const updateGlowingCaret = useCallback(() => {
    const wrapper = wrapperRef.current;
    const selection = window.getSelection?.();

    if (!glowCaretEnabled || !wrapper || !selection || !selection.rangeCount) {
      hideCaret();
      return;
    }

    const anchorNode = selection.anchorNode;
    if (!anchorNode || !wrapper.contains(anchorNode) || !selection.isCollapsed) {
      hideCaret();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getClientRects()[0] || range.getBoundingClientRect();

    if (!rect || (!rect.width && !rect.height)) {
      hideCaret();
      return;
    }

    const wrapperRect = wrapper.getBoundingClientRect();
    const sourceElement = anchorNode.nodeType === Node.ELEMENT_NODE
      ? anchorNode
      : anchorNode.parentElement;
    const computed = window.getComputedStyle(sourceElement || wrapper);
    const lineHeight = Number.parseFloat(computed.lineHeight) || 32;
    const height = rect.height || lineHeight;
    const left = rect.left - wrapperRect.left;
    const top = rect.top - wrapperRect.top;
    const isInView =
      top >= -height &&
      top <= wrapper.clientHeight &&
      left >= 0 &&
      left <= wrapper.clientWidth;

    setCaret({
      left,
      top,
      height,
      visible: isInView,
    });
  }, [glowCaretEnabled, hideCaret]);

  const scheduleCaretUpdate = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(updateGlowingCaret);
  }, [updateGlowingCaret]);

  const pulseTyping = useCallback(() => {
    setTyping(true);
    window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => setTyping(false), 520);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    let instance;
    try {
      instance = new Vditor(containerRef.current, {
        mode: 'wysiwyg',
        theme: 'dark',
        cache: { enable: false },
        placeholder: '输入 Markdown 内容，即时预览...',
        height: '100%',
        tab: '  ',
        toolbar: [],
        toolbarConfig: { pin: false },
        counter: { enable: false },
        value: content || '',
        input: (value) => {
          if (isDestroyingRef.current) return;
          onContentChange(value);
        },
        after: () => {
          vditorRef.current = instance;
          setReady(true);
          if (pendingContentRef.current !== null && pendingContentRef.current !== '') {
            instance.setValue(pendingContentRef.current, false);
            pendingContentRef.current = null;
          }
          scheduleCaretUpdate();
        },
      });
    } catch (error) {
      console.error('Failed to initialize Vditor', error);
      return undefined;
    }

    return () => {
      isDestroyingRef.current = true;
      try {
        const lastContent = instance.getValue();
        if (lastContent && lastContent !== '' && onContentChange) {
          onContentChange(lastContent);
        }
      } catch {
        // Vditor may not be fully initialized yet.
      }
      vditorRef.current = null;
      try {
        instance.destroy();
      } catch {
        // Vditor may not be fully initialized yet in Strict Mode.
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const vd = vditorRef.current;
    if (!vd) {
      pendingContentRef.current = content || '';
      return;
    }

    const currentContent = vd.getValue();
    if (currentContent === content) return;

    vd.setValue(content || '', false);
    scheduleCaretUpdate();
  }, [content, scheduleCaretUpdate]);

  useEffect(() => {
    if (!glowCaretEnabled) hideCaret();
    else scheduleCaretUpdate();
  }, [glowCaretEnabled, hideCaret, scheduleCaretUpdate]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;

    const handleSelectionChange = () => {
      const selection = window.getSelection?.();
      if (selection?.anchorNode && wrapper.contains(selection.anchorNode)) {
        scheduleCaretUpdate();
      }
    };
    const handleInput = () => {
      pulseTyping();
      scheduleCaretUpdate();
    };
    const handleKeyDown = () => {
      pulseTyping();
      scheduleCaretUpdate();
    };
    const handleUpdate = () => scheduleCaretUpdate();
    const handleFocusOut = () => {
      requestAnimationFrame(() => {
        if (!wrapper.contains(document.activeElement)) hideCaret();
      });
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    wrapper.addEventListener('input', handleInput);
    wrapper.addEventListener('keydown', handleKeyDown);
    wrapper.addEventListener('keyup', handleUpdate);
    wrapper.addEventListener('pointerup', handleUpdate);
    wrapper.addEventListener('focusin', handleUpdate);
    wrapper.addEventListener('focusout', handleFocusOut);
    wrapper.addEventListener('compositionstart', handleInput);
    wrapper.addEventListener('compositionend', handleInput);
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      wrapper.removeEventListener('input', handleInput);
      wrapper.removeEventListener('keydown', handleKeyDown);
      wrapper.removeEventListener('keyup', handleUpdate);
      wrapper.removeEventListener('pointerup', handleUpdate);
      wrapper.removeEventListener('focusin', handleUpdate);
      wrapper.removeEventListener('focusout', handleFocusOut);
      wrapper.removeEventListener('compositionstart', handleInput);
      wrapper.removeEventListener('compositionend', handleInput);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      window.clearTimeout(typingTimeoutRef.current);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [hideCaret, pulseTyping, scheduleCaretUpdate]);

  return (
    <div
      ref={wrapperRef}
      className={`relative ${glowCaretEnabled ? 'vditor-glowing-caret-enabled' : ''} ${typing ? 'is-typing' : ''} ${className}`}
      style={{ '--editor-caret-glow': glowIntensity }}
    >
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-white/34">
          编辑器加载中...
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
      {glowCaretEnabled && (
        <span
          className={`glowing-editor-caret ${caret.visible ? 'is-visible' : ''}`}
          style={{
            height: `${caret.height}px`,
            left: `${caret.left}px`,
            top: `${caret.top}px`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default VditorWrapper;
