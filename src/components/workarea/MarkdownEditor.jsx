import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaBookmark, FaCheck, FaDownload, FaPenNib, FaTrashAlt, FaUndo } from 'react-icons/fa';
import { useMarkdownStore } from '../../store/useMarkdownStore';
import { useDebounce } from '../../hooks/useDebounce';
import DatePickerPopover from './DatePickerPopover';
import StatsBar from './StatsBar';
import TabBar from './TabBar';
import MarkdownSearchPanel from './MarkdownSearchPanel';
import GlassPanel from '../ui/GlassPanel';
import IconButton from '../ui/IconButton';
import PanelHeader from '../ui/PanelHeader';
import SegmentedControl from '../ui/SegmentedControl';
import StatusPill from '../ui/StatusPill';
import VditorWrapper from './VditorWrapper';

const MarkdownEditor = ({ todayKey }) => {
  const {
    content,
    wordCount,
    charCount,
    loading,
    datesWithData,
    pages,
    activePageId,
    setContent,
    saveContent,
    fetchDates,
    setCurrentDate,
    currentDate,
    addPage,
    removePage,
    switchPage,
    renamePage,
    openPageAt,
  } = useMarkdownStore();
  const debouncedContent = useDebounce(content, 500);
  const [editorMode, setEditorMode] = useState('plain');
  const [saveState, setSaveState] = useState('idle');
  const [clearedDraft, setClearedDraft] = useState(null);
  const [contentBackup, setContentBackup] = useState({ pageId: activePageId, content: '' });
  const textareaRef = useRef(null);
  const hasEditedRef = useRef(false);
  const pendingSearchJumpRef = useRef(null);
  const backupContent = contentBackup.pageId === activePageId ? contentBackup.content : '';

  useEffect(() => {
    setCurrentDate(todayKey);
  }, [setCurrentDate, todayKey]);

  useEffect(() => {
    if (content) {
      let cancelled = false;
      window.queueMicrotask(() => {
        if (cancelled) return;
        setContentBackup((current) => (
          current.pageId === activePageId && current.content === content
            ? current
            : { pageId: activePageId, content }
        ));
      });
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [activePageId, content]);

  useEffect(() => {
    hasEditedRef.current = false;
    fetchDates();
  }, [currentDate, fetchDates]);

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

  const handleTextareaChange = (e) => {
    setContentBackup({ pageId: activePageId, content: e.target.value });
    handleChange(e.target.value);
  };

  const handleExportTxt = async () => {
    if (loading) return;

    setSaveState('saving');
    try {
      if (hasEditedRef.current) await saveContent();
      const blob = new Blob(['﻿', content], { type: 'text/plain;charset=utf-8' });
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
    setClearedDraft({ content, date: currentDate, pageId: activePageId });
    hasEditedRef.current = true;
    setContentBackup({ pageId: activePageId, content: '' });
    setContent('');
    await persistAfterProgrammaticChange();
  };

  const handleUndoClear = async () => {
    if (!clearedDraft || clearedDraft.date !== currentDate || clearedDraft.pageId !== activePageId || loading) return;
    hasEditedRef.current = true;
    setContent(clearedDraft.content);
    setClearedDraft(null);
    await persistAfterProgrammaticChange();
  };

  const handleTextareaKeyDown = (e) => {
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

  const handleBeforeDraftSearch = useCallback(async () => {
    if (loading || !hasEditedRef.current) return;

    setSaveState('saving');
    try {
      await saveContent();
      hasEditedRef.current = false;
      setSaveState('saved');
    } catch (error) {
      console.error('Failed to save markdown before searching', error);
      setSaveState('error');
      throw error;
    }
  }, [loading, saveContent]);

  useEffect(() => {
    if (loading || editorMode !== 'plain') return;
    const jump = pendingSearchJumpRef.current;
    const textarea = textareaRef.current;
    if (!jump || !textarea) return;

    requestAnimationFrame(() => {
      const value = textarea.value || '';
      const start = Math.min(jump.matchIndex, value.length);
      const end = Math.min(start + jump.matchLength, value.length);
      const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight) || 28;
      const linesBeforeMatch = value.slice(0, start).split('\n').length - 1;

      textarea.focus();
      textarea.setSelectionRange(start, end);
      textarea.scrollTop = Math.max(0, (linesBeforeMatch * lineHeight) - (textarea.clientHeight / 3));
      pendingSearchJumpRef.current = null;
    });
  }, [activePageId, content, currentDate, editorMode, loading]);

  const handleSearchResultSelect = async (result) => {
    if (loading) return;

    setSaveState('saving');
    try {
      if (hasEditedRef.current) await saveContent();
      pendingSearchJumpRef.current = {
        matchIndex: result.matchIndex,
        matchLength: result.matchLength,
      };
      setEditorMode('plain');
      await openPageAt(result.date, result.pageId);
      hasEditedRef.current = false;
      setClearedDraft(null);
      setSaveState('saved');
    } catch (error) {
      console.error('Failed to open markdown search result', error);
      pendingSearchJumpRef.current = null;
      setSaveState('error');
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
    <GlassPanel className="workspace-editor-panel relative flex h-full min-h-[520px] flex-col overflow-hidden" padded={false}>
      <div className="relative z-10 px-5 pb-3 pt-5">
        <PanelHeader
          eyebrow="Markdown"
          title="日记草稿"
          icon={FaPenNib}
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <MarkdownSearchPanel
                disabled={loading}
                onBeforeSearch={handleBeforeDraftSearch}
                onSelectResult={handleSearchResultSelect}
              />
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
                disabled={loading || !clearedDraft || clearedDraft.date !== currentDate || clearedDraft.pageId !== activePageId}
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
                value={editorMode}
                onChange={(newMode) => {
                  if (newMode === 'markdown' && editorMode === 'plain') {
                    // Restore backup content when entering Markdown mode
                    if (backupContent && !content) {
                      setContent(backupContent);
                    }
                  }
                  setEditorMode(newMode);
                }}
                options={[
                  { value: 'plain', label: '纯文本' },
                  { value: 'markdown', label: 'Markdown' },
                ]}
              />
            </div>
          }
        />
      </div>

      <div className="relative z-10 px-5 pb-3">
        <DatePickerPopover
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          datesWithData={datesWithData}
        />
      </div>

      <div className="relative z-10">
        <TabBar
          pages={pages}
          activePageId={activePageId}
          onSwitch={switchPage}
          onAdd={addPage}
          onRemove={removePage}
          onRename={renamePage}
        />
      </div>

      <div className="soft-divider" />

      <div className="relative z-10 min-h-0 flex-1 overflow-hidden">
        {loading ? (
          <div className="relative z-10 flex h-full items-center justify-center text-sm text-white/35">
            加载中...
          </div>
        ) : editorMode === 'markdown' ? (
          <VditorWrapper
            content={content}
            onContentChange={handleChange}
            className="relative z-10 h-full w-full"
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={content || backupContent}
            onChange={handleTextareaChange}
            onKeyDown={handleTextareaKeyDown}
            placeholder="写下你的记录..."
            className="relative z-10 h-full w-full resize-none bg-transparent p-5 text-[15px] leading-8 text-white/86 outline-none placeholder-white/26 selection:bg-[#80bfff]/30 md:p-6 md:text-base"
            spellCheck={false}
          />
        )}
      </div>

      <div className="soft-divider" />
      <div className="relative z-10 px-5 py-3">
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
