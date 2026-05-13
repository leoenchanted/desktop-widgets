import React, { useState, useEffect, useRef } from 'react';
import { useMarkdownStore } from '../../store/useMarkdownStore';
import { useDebounce } from '../../hooks/useDebounce';
import MarkdownPreview from './MarkdownPreview';
import StatsBar from './StatsBar';

const MarkdownEditor = () => {
  const { content, wordCount, charCount, loading, setContent, saveContent, fetchContent, currentDate } = useMarkdownStore();
  const debouncedContent = useDebounce(content, 500);
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef(null);
  const prevDateRef = useRef(currentDate);

  // Load content when date changes
  useEffect(() => {
    if (prevDateRef.current !== currentDate) {
      prevDateRef.current = currentDate;
      fetchContent(currentDate);
    } else if (prevDateRef.current === currentDate && !content) {
      fetchContent(currentDate);
    }
  }, [currentDate]);

  // Auto-save on debounce
  useEffect(() => {
    if (debouncedContent) {
      saveContent();
    }
  }, [debouncedContent]);

  // Handle tab in textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = content.slice(0, start) + '  ' + content.slice(end);
      setContent(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="bg-black/60 border-2 border-red-500/70 rounded-lg flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-red-500/30">
        <span className="text-[10px] uppercase tracking-widest font-bold text-red-400/80">
          MARKDOWN
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all ${
              preview
                ? 'bg-red-500/80 text-white'
                : 'bg-white/10 text-white/50 hover:bg-white/20'
            }`}
          >
            {preview ? '编辑' : '预览'}
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="flex-1 overflow-y-auto glass-scrollbar relative">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/30 text-xs">加载中...</div>
        ) : preview ? (
          <div className="p-4">
            <MarkdownPreview content={content} />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="开始写点什么..."
            className="w-full h-full min-h-[250px] bg-transparent text-sm text-white/80 placeholder-white/20 resize-none outline-none p-4 font-mono leading-relaxed"
            spellCheck={false}
          />
        )}
      </div>

      {/* Stats */}
      <div className="px-4 py-2 border-t border-red-500/30">
        <StatsBar charCount={charCount} wordCount={wordCount} />
      </div>
    </div>
  );
};

export default MarkdownEditor;
