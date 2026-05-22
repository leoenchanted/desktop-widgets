import React, { useEffect, useRef, useState } from 'react';
import { FaCheck, FaClipboard, FaCopy, FaLock, FaThumbtack, FaTrashAlt, FaUndo } from 'react-icons/fa';
import { pinnedNoteApi } from '../../api/pinnedNoteApi';
import { useDebounce } from '../../hooks/useDebounce';
import GlassPanel from '../ui/GlassPanel';
import IconButton from '../ui/IconButton';
import PanelHeader from '../ui/PanelHeader';
import StatusPill from '../ui/StatusPill';
import StatsBar from './StatsBar';

const PinnedNote = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState('idle');
  const [clearedContent, setClearedContent] = useState(null);
  const [copyState, setCopyState] = useState('');
  const hasEditedRef = useRef(false);
  const debouncedContent = useDebounce(content, 500);

  useEffect(() => {
    let cancelled = false;

    pinnedNoteApi.get()
      .then((note) => {
        if (!cancelled) {
          setContent(note.content);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Failed to load pinned note', error);
        if (!cancelled) {
          setSaveState('error');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasEditedRef.current || loading) return undefined;

    let cancelled = false;
    pinnedNoteApi.save(debouncedContent)
      .then(() => {
        if (!cancelled) setSaveState('saved');
      })
      .catch((error) => {
        console.error('Failed to save pinned note', error);
        if (!cancelled) setSaveState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedContent, loading]);

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;

  const status =
    saveState === 'saving'
      ? '保存中'
      : saveState === 'error'
        ? '保存失败'
        : saveState === 'saved'
          ? '已保存'
          : '长期保留';

  const handleChange = (value) => {
    hasEditedRef.current = true;
    setClearedContent(null);
    setCopyState('');
    setSaveState('saving');
    setContent(value);
  };

  const saveImmediately = async (nextContent) => {
    setSaveState('saving');
    try {
      await pinnedNoteApi.save(nextContent);
      setSaveState('saved');
    } catch (error) {
      console.error('Failed to save pinned note', error);
      setSaveState('error');
    }
  };

  const handleClear = async () => {
    if (!content || loading) return;
    setClearedContent(content);
    hasEditedRef.current = true;
    setContent('');
    await saveImmediately('');
  };

  const handleUndoClear = async () => {
    if (!clearedContent || loading) return;
    hasEditedRef.current = true;
    setContent(clearedContent);
    setClearedContent(null);
    await saveImmediately(clearedContent);
  };

  const handleCopy = async () => {
    if (!content.trim()) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopyState('已复制');
      setTimeout(() => setCopyState(''), 1600);
    } catch (error) {
      console.error('Failed to copy pinned note', error);
      setCopyState('复制失败');
    }
  };

  return (
    <GlassPanel className="workspace-fixed-panel flex flex-col overflow-hidden" padded={false}>
      <div className="px-4 pb-3 pt-4">
        <PanelHeader
          eyebrow="Pinned"
          title="置顶记录"
          icon={FaThumbtack}
          meta="长期保留，不随日期切换。请不要在公共电脑保存敏感密码。"
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <IconButton
                icon={FaCopy}
                onClick={handleCopy}
                disabled={loading || !content.trim()}
                title="复制全文"
                className="draft-toolbar-button h-9 w-9 text-white/50 disabled:opacity-35"
              />
              <IconButton
                icon={FaTrashAlt}
                onClick={handleClear}
                disabled={loading || !content}
                title="清空置顶记录"
                className="draft-toolbar-button h-9 w-9 text-white/50 hover:text-[#ffd0d0] disabled:opacity-35"
              />
              <IconButton
                icon={FaUndo}
                onClick={handleUndoClear}
                disabled={loading || !clearedContent}
                title="撤回清空"
                className="draft-toolbar-button h-9 w-9 text-white/50 hover:text-[#bdf6d3] disabled:opacity-35"
              />
            </div>
          }
        />
      </div>

      <div className="soft-divider" />

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-white/34">
            加载中...
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(event) => handleChange(event.target.value)}
            placeholder="把长期需要置顶的信息放在这里..."
            className="h-full w-full resize-none bg-transparent px-4 py-4 text-sm leading-7 text-white/82 outline-none placeholder-white/24 selection:bg-[#80bfff]/30"
            spellCheck={false}
          />
        )}
      </div>

      <div className="soft-divider" />
      <div className="grid gap-2 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusPill
            variant={saveState === 'error' ? 'warning' : 'success'}
            className="min-w-[4.75rem] justify-center"
          >
            {saveState === 'saved' && <FaCheck className="mr-1.5" size={10} />}
            {status}
          </StatusPill>
          {copyState && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/44">
              <FaClipboard size={10} />
              {copyState}
            </span>
          )}
        </div>
        <StatsBar
          charCount={charCount}
          wordCount={wordCount}
          extra={(
            <span className="flex items-center gap-1.5">
              <FaLock size={9} />
              本地保存
            </span>
          )}
        />
      </div>
    </GlassPanel>
  );
};

export default PinnedNote;
