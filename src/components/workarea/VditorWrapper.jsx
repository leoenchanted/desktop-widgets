import { useEffect, useRef, useState } from 'react';
import Vditor from 'vditor';
import 'vditor/dist/index.css';

const VditorWrapper = ({ content, onContentChange, className = '' }) => {
  const containerRef = useRef(null);
  const vditorRef = useRef(null);
  const isDestroyingRef = useRef(false);
  const pendingContentRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let instance;
    try {
      instance = new Vditor(containerRef.current, {
        mode: 'wysiwyg',
        theme: 'dark',
        cache: { enable: false },
        placeholder: '输入 Markdown 内容，即时渲染...',
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
        },
      });
    } catch (e) {
      console.error('Failed to initialize Vditor', e);
      return;
    }

    return () => {
      isDestroyingRef.current = true;
      // Save Vditor's current content to store before destroy
      try {
        const lastContent = instance.getValue();
        if (lastContent && lastContent !== '' && onContentChange) {
          onContentChange(lastContent);
        }
      } catch {
        // Vditor may not be fully initialized yet
      }
      vditorRef.current = null;
      try {
        instance.destroy();
      } catch {
        // Vditor may not be fully initialized yet (Strict Mode double-mount)
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
  }, [content]);

  return (
    <div className={`relative ${className}`}>
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-white/34">
          编辑器加载中...
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
};

export default VditorWrapper;
