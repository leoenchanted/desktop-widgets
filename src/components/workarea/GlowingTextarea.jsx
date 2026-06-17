import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const mirrorStyleProps = [
  'boxSizing',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'letterSpacing',
  'lineHeight',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'textAlign',
  'textIndent',
  'textTransform',
  'wordSpacing',
  'tabSize',
];

const GlowingTextarea = forwardRef(({
  className = '',
  onBlur,
  onChange,
  onClick,
  onCompositionEnd,
  onCompositionStart,
  onFocus,
  onKeyDown,
  onKeyUp,
  onScroll,
  onSelect,
  glowEnabled = true,
  glowIntensity = 1,
  value,
  ...props
}, forwardedRef) => {
  const textareaRef = useRef(null);
  const mirrorRef = useRef(null);
  const markerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const frameRef = useRef(null);
  const [caret, setCaret] = useState({ left: 0, top: 0, height: 32, visible: false });
  const [focused, setFocused] = useState(false);
  const [typing, setTyping] = useState(false);

  useImperativeHandle(forwardedRef, () => textareaRef.current);

  const updateCaret = useCallback(() => {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;

    if (!glowEnabled || !textarea || !mirror || document.activeElement !== textarea) {
      setCaret((current) => (current.visible ? { ...current, visible: false } : current));
      return;
    }

    if (textarea.selectionStart !== textarea.selectionEnd) {
      setCaret((current) => (current.visible ? { ...current, visible: false } : current));
      return;
    }

    const computed = window.getComputedStyle(textarea);
    mirrorStyleProps.forEach((prop) => {
      mirror.style[prop] = computed[prop];
    });
    mirror.style.width = `${textarea.clientWidth}px`;
    mirror.style.minHeight = `${textarea.scrollHeight}px`;

    const cursorIndex = textarea.selectionStart ?? 0;
    const textValue = textarea.value || '';
    const before = textValue.slice(0, cursorIndex);
    const after = textValue.slice(cursorIndex);
    const marker = markerRef.current || document.createElement('span');
    markerRef.current = marker;

    mirror.replaceChildren(
      document.createTextNode(before),
      marker,
      document.createTextNode(after || '\u200b'),
    );

    const lineHeight = Number.parseFloat(computed.lineHeight) || 32;
    const left = marker.offsetLeft - textarea.scrollLeft;
    const top = marker.offsetTop - textarea.scrollTop;
    const isInView =
      top >= -lineHeight &&
      top <= textarea.clientHeight &&
      left >= 0 &&
      left <= textarea.clientWidth;

    setCaret({
      left,
      top,
      height: lineHeight,
      visible: isInView,
    });
  }, [glowEnabled]);

  const scheduleCaretUpdate = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(updateCaret);
  }, [updateCaret]);

  const pulseTyping = useCallback(() => {
    setTyping(true);
    window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => setTyping(false), 520);
  }, []);

  useLayoutEffect(() => {
    scheduleCaretUpdate();
  }, [scheduleCaretUpdate, value]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(scheduleCaretUpdate);
    observer.observe(textarea);
    return () => observer.disconnect();
  }, [scheduleCaretUpdate]);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (document.activeElement === textareaRef.current) scheduleCaretUpdate();
    };
    const handleResize = () => scheduleCaretUpdate();

    document.addEventListener('selectionchange', handleSelectionChange);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      window.removeEventListener('resize', handleResize);
      window.clearTimeout(typingTimeoutRef.current);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [scheduleCaretUpdate]);

  const handleFocus = (event) => {
    setFocused(true);
    scheduleCaretUpdate();
    onFocus?.(event);
  };

  const handleBlur = (event) => {
    setFocused(false);
    setCaret((current) => ({ ...current, visible: false }));
    onBlur?.(event);
  };

  const handleChange = (event) => {
    pulseTyping();
    scheduleCaretUpdate();
    onChange?.(event);
  };

  const handleKeyDown = (event) => {
    pulseTyping();
    scheduleCaretUpdate();
    onKeyDown?.(event);
  };

  const handleKeyUp = (event) => {
    scheduleCaretUpdate();
    onKeyUp?.(event);
  };

  const handleSelect = (event) => {
    scheduleCaretUpdate();
    onSelect?.(event);
  };

  const handleClick = (event) => {
    scheduleCaretUpdate();
    onClick?.(event);
  };

  const handleScroll = (event) => {
    scheduleCaretUpdate();
    onScroll?.(event);
  };

  const handleCompositionStart = (event) => {
    pulseTyping();
    onCompositionStart?.(event);
  };

  const handleCompositionEnd = (event) => {
    pulseTyping();
    scheduleCaretUpdate();
    onCompositionEnd?.(event);
  };

  return (
    <div
      className={`glowing-textarea-shell ${glowEnabled ? 'glow-enabled' : ''} ${focused ? 'is-focused' : ''} ${typing ? 'is-typing' : ''}`}
      style={{ '--editor-caret-glow': glowIntensity }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onBlur={handleBlur}
        onChange={handleChange}
        onClick={handleClick}
        onCompositionEnd={handleCompositionEnd}
        onCompositionStart={handleCompositionStart}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onScroll={handleScroll}
        onSelect={handleSelect}
        className={`glowing-textarea-input ${className}`}
        {...props}
      />
      <div
        ref={mirrorRef}
        className="glowing-textarea-measure"
        aria-hidden="true"
      />
      {glowEnabled && (
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
});

GlowingTextarea.displayName = 'GlowingTextarea';

export default GlowingTextarea;
