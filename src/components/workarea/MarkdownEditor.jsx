import React, { useEffect, useRef, useState } from 'react';
import { FaBookmark, FaCheck, FaDownload, FaEye, FaPenNib, FaTrashAlt, FaUndo } from 'react-icons/fa';
import { useMarkdownStore } from '../../store/useMarkdownStore';
import { useDebounce } from '../../hooks/useDebounce';
import MarkdownPreview from './MarkdownPreview';
import DatePickerPopover from './DatePickerPopover';
import StatsBar from './StatsBar';
import GlassPanel from '../ui/GlassPanel';
import IconButton from '../ui/IconButton';
import PanelHeader from '../ui/PanelHeader';
import SegmentedControl from '../ui/SegmentedControl';
import StatusPill from '../ui/StatusPill';

const MarkdownEditor = ({ todayKey }) => {
  const {
    content,
    wordCount,
    charCount,
    loading,
    datesWithData,
    setContent,
    saveContent,
    fetchContent,
    fetchDates,
    setCurrentDate,
    currentDate,
  } = useMarkdownStore();
  const debouncedContent = useDebounce(content, 500);
  const [mode, setMode] = useState('edit');
  const [saveState, setSaveState] = useState('idle');
  const [clearedDraft, setClearedDraft] = useState(null);
  const textareaRef = useRef(null);
  const hasEditedRef = useRef(false);

  useEffect(() => {
    setCurrentDate(todayKey);
  }, [setCurrentDate, todayKey]);

  useEffect(() => {
    hasEditedRef.current = false;
    fetchContent(currentDate);
    fetchDates();
  }, [currentDate, fetchContent, fetchDates]);

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
    setClearedDraft(null);
    setContent(value);
  };

  const handleExportTxt = async () => {
    if (loading) return;

    setSaveState('saving');
    try {
      if (hasEditedRef.current) await saveContent();
      const blob = new Blob(['\ufeff', content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `desktop-widgets-draft-${currentDate}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setSaveState('saved');
    } catch (error) {
      console.error('Failed to export markdown draft as txt', error);
      setSaveState('error');
    }
  };

  const persistAfterProgrammaticChange = async () => {
    setSaveState('saving');
    try {
      await saveContent();
      setSaveState('saved');
    } catch (error) {
      console.error('Failed to save markdown draft', error);
      setSaveState('error');
    }
  };

  const handleClear = async () => {
    if (!content || loading) return;
    setClearedDraft({ content, date: currentDate });
    hasEditedRef.current = true;
    setContent('');
    await persistAfterProgrammaticChange();
  };

  const handleUndoClear = async () => {
    if (!clearedDraft || clearedDraft.date !== currentDate || loading) return;
    hasEditedRef.current = true;
    setContent(clearedDraft.content);
    setClearedDraft(null);
    await persistAfterProgrammaticChange();
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
          : '长期保留';

  return (
    <GlassPanel className="flex h-full min-h-[520px] flex-col overflow-hidden" padded={false}>
      <div className="px-5 pb-3 pt-5">
        <PanelHeader
          eyebrow="Markdown"
          title="日记草稿"
          icon={FaPenNib}
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <IconButton
                icon={FaDownload}
                onClick={handleExportTxt}
                disabled={loading}
                title="导出 TXT"
                className="draft-toolbar-button h-9 w-9 text-white/55 disabled:opacity-40"
              />
              <IconButton
                icon={FaTrashAlt}
                onClick={handleClear}
                disabled={loading || !content}
                title="清空当前日期草稿"
                className="draft-toolbar-button h-9 w-9 text-white/50 hover:text-[#ffd0d0] disabled:opacity-35"
              />
              <IconButton
                icon={FaUndo}
                onClick={handleUndoClear}
                disabled={loading || !clearedDraft || clearedDraft.date !== currentDate}
                title="撤回清空"
                className="draft-toolbar-button h-9 w-9 text-white/50 hover:text-[#bdf6d3] disabled:opacity-35"
              />
              <StatusPill
                variant={saveState === 'error' ? 'warning' : 'success'}
                className="min-w-[4.75rem] justify-center"
              >
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

      <div className="px-5 pb-3">
        <DatePickerPopover
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          datesWithData={datesWithData}
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
            placeholder="写下你的记录、计划或复盘..."
            className="h-full w-full resize-none bg-transparent p-5 text-[15px] leading-8 text-white/86 outline-none placeholder-white/26 selection:bg-[#80bfff]/30 md:p-6 md:text-base"
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
              <FaBookmark size={10} />
              按日草稿
            </span>
          }
        />
      </div>
    </GlassPanel>
  );
};

export default MarkdownEditor;
