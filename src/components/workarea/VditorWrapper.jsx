import { useEffect, useRef } from 'react';
import Vditor from 'vditor';
import 'vditor/dist/index.css';

const VditorWrapper = ({ content, onContentChange, className = '' }) => {
  const containerRef = useRef(null);
  const vditorRef = useRef(null);
  const isUpdatingRef = useRef(false);

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
          if (isUpdatingRef.current) {
            isUpdatingRef.current = false;
            return;
          }
          onContentChange(value);
        },
        after: () => {
          vditorRef.current = instance;
        },
      });
    } catch (e) {
      console.error('Failed to initialize Vditor', e);
      return;
    }

    return () => {
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
    if (!vd) return;

    const currentContent = vd.getValue();
    if (currentContent === content) return;

    isUpdatingRef.current = true;
    vd.setValue(content || '', false);
  }, [content]);

  return <div ref={containerRef} className={className} />;
};

export default VditorWrapper;
