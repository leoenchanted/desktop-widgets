import React, { useEffect, useRef, useState } from 'react';
import { FaCheck, FaEye, FaPenNib, FaRegClock } from 'react-icons/fa';
import { useMarkdownStore } from '../../store/useMarkdownStore';
import { useDebounce } from '../../hooks/useDebounce';
import MarkdownPreview from './MarkdownPreview';
import StatsBar from './StatsBar';
import GlassPanel from '../ui/GlassPanel';
import PanelHeader from '../ui/PanelHeader';
import SegmentedControl from '../ui/SegmentedControl';
import StatusPill from '../ui/StatusPill';

const MarkdownEditor = () => {
  const {
    content,
    wordCount,
    charCount,
    loading,
    setContent,
    saveContent,
    fetchContent,
    currentDate,
  } = useMarkdownStore();
  const debouncedContent = useDebounce(content, 500);
  const [mode, setMode] = useState('edit');
  const [saveState, setSaveState] = useState('idle');
  const textareaRef = useRef(null);
  const hasEditedRef = useRef(false);

  useEffect(() => {
    hasEditedRef.current = false;
    fetchContent(currentDate);
  }, [currentDate, fetchContent]);

  useEffect(() => {
    if (!hasEditedRef.current || loading) return;

    let cancelled = false;
    saveContent()
      .then(() => {
        if (!cancelled) setSaveState('saved');
      })
      .catch(() => {
        if (!cancelled) setSaveState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedContent, loading, saveContent]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        hasEditedRef.current = true;
        setSaveState('saving');
        saveContent()
          .then(() => setSaveState('saved'))
          .catch(() => setSaveState('error'));
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [saveContent]);

  const handleChange = (value) => {
    hasEditedRef.current = true;
    setContent(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const nextValue = content.slice(0, start) + '  ' + content.slice(end);
      handleChange(nextValue);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  const status =
    saveState === 'saving'
      ? '保存中'
      : saveState === 'error'
        ? '保存失败'
        : saveState === 'saved'
          ? '已保存'
          : '就绪';

  return (
    <GlassPanel className="flex h-full min-h-[620px] flex-col overflow-hidden" padded={false}>
      <div className="px-5 pb-3 pt-5">
        <PanelHeader
          eyebrow="Markdown"
          title="日记与草稿"
          icon={FaPenNib}
          action={
            <div className="flex items-center gap-2">
              <StatusPill variant={saveState === 'error' ? 'warning' : 'success'}>
                {saveState === 'saved' && <FaCheck className="mr-1.5" size={10} />}
                {status}
              </StatusPill>
              <SegmentedControl
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'edit', label: '编辑' },
                  { value: 'preview', label: '预览' },
                ]}
              />
            </div>
          }
        />
      </div>

      <div className="soft-divider" />

      <div className="relative flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-white/35">
            加载中...
          </div>
        ) : mode === 'preview' ? (
          <div className="h-full overflow-y-auto p-4 glass-scrollbar md:p-6">
            {content ? (
              <div className="markdown-paper min-h-full p-5 md:p-7">
                <MarkdownPreview content={content} />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-white/30">
                <FaEye className="mb-3" size={18} />
                <span className="text-sm">没有可预览内容</span>
              </div>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="写下今天的想法、计划或复盘..."
            className="h-full w-full resize-none bg-transparent p-6 text-[15px] leading-8 text-white/86 outline-none placeholder-white/26 glass-scrollbar selection:bg-[#80bfff]/30 md:text-base"
            spellCheck={false}
          />
        )}
      </div>

      <div className="soft-divider" />
      <div className="px-5 py-3">
        <StatsBar
          charCount={charCount}
          wordCount={wordCount}
          extra={
            <span className="flex items-center gap-1.5">
              <FaRegClock size={10} />
              {currentDate}
            </span>
          }
        />
      </div>
    </GlassPanel>
  );
};

export default MarkdownEditor;
