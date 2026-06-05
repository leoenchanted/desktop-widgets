import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaRegFileAlt, FaSearch, FaTimes } from 'react-icons/fa';
import { markdownApi } from '../../api/markdownApi';
import { useDebounce } from '../../hooks/useDebounce';
import IconButton from '../ui/IconButton';

const renderHighlightedText = (text, query) => {
  const keyword = query.trim();
  if (!keyword) return text;

  const fragments = [];
  const source = text || '';
  const lowerSource = source.toLocaleLowerCase();
  const lowerKeyword = keyword.toLocaleLowerCase();
  let cursor = 0;

  while (cursor < source.length) {
    const index = lowerSource.indexOf(lowerKeyword, cursor);
    if (index === -1) break;

    if (index > cursor) {
      fragments.push(source.slice(cursor, index));
    }

    fragments.push(
      <mark key={`${index}-${fragments.length}`} className="draft-search-mark">
        {source.slice(index, index + keyword.length)}
      </mark>,
    );
    cursor = index + keyword.length;
  }

  if (cursor < source.length) {
    fragments.push(source.slice(cursor));
  }

  return fragments.length ? fragments : source;
};

const PANEL_MARGIN = 16;
const PANEL_MAX_WIDTH = 430;
const PANEL_MAX_HEIGHT = 440;
const PANEL_MIN_HEIGHT = 220;

const MarkdownSearchPanel = ({ disabled = false, onBeforeSearch, onSelectResult }) => {
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [panelStyle, setPanelStyle] = useState({
    left: PANEL_MARGIN,
    top: PANEL_MARGIN,
    width: PANEL_MAX_WIDTH,
    maxHeight: PANEL_MAX_HEIGHT,
  });
  const debouncedQuery = useDebounce(query, 260);
  const trimmedQuery = debouncedQuery.trim();

  const updatePanelLayout = useCallback(() => {
    const anchor = rootRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const width = Math.min(PANEL_MAX_WIDTH, Math.max(288, viewportWidth - (PANEL_MARGIN * 2)));
    const maxLeft = Math.max(PANEL_MARGIN, viewportWidth - width - PANEL_MARGIN);
    const left = Math.min(
      Math.max(PANEL_MARGIN, rect.right - width),
      maxLeft,
    );
    const spaceBelow = viewportHeight - rect.bottom - PANEL_MARGIN;
    const spaceAbove = rect.top - PANEL_MARGIN;
    const shouldOpenAbove = spaceBelow < 260 && spaceAbove > spaceBelow;
    const availableHeight = Math.max(
      PANEL_MIN_HEIGHT,
      shouldOpenAbove ? spaceAbove - 8 : spaceBelow - 8,
    );
    const maxHeight = Math.min(PANEL_MAX_HEIGHT, availableHeight);
    const top = shouldOpenAbove
      ? Math.max(PANEL_MARGIN, rect.top - maxHeight - 8)
      : Math.max(
        PANEL_MARGIN,
        Math.min(rect.bottom + 8, viewportHeight - maxHeight - PANEL_MARGIN),
      );

    setPanelStyle({ left, top, width, maxHeight });
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    requestAnimationFrame(() => {
      updatePanelLayout();
      inputRef.current?.focus();
    });

    const handlePointerDown = (event) => {
      if (
        !rootRef.current?.contains(event.target)
        && !panelRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    const handleViewportChange = () => updatePanelLayout();

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    window.visualViewport?.addEventListener('resize', handleViewportChange);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
    };
  }, [open, updatePanelLayout]);

  useEffect(() => {
    if (!open || !trimmedQuery) {
      let cancelled = false;
      window.queueMicrotask(() => {
        if (cancelled) return;
        setResults([]);
        setLoading(false);
        setError('');
      });
      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError('');
    });

    Promise.resolve(onBeforeSearch?.())
      .then(() => markdownApi.searchDrafts(trimmedQuery))
      .then((nextResults) => {
        if (cancelled) return;
        setResults(nextResults);
      })
      .catch((searchError) => {
        if (cancelled) return;
        console.error('Failed to search markdown drafts', searchError);
        setError('搜索失败，请稍后重试');
        setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [onBeforeSearch, open, trimmedQuery]);

  const resultSummary = useMemo(() => {
    if (!trimmedQuery) return '输入关键字检索所有日记草稿';
    if (loading) return '正在检索...';
    if (error) return error;
    return results.length ? `找到 ${results.length} 条相关内容` : '没有找到相关内容';
  }, [error, loading, results.length, trimmedQuery]);

  const handleSelect = async (result) => {
    await onSelectResult(result, query.trim());
    setOpen(false);
  };

  const panel = open && typeof document !== 'undefined'
    ? createPortal(
      <div
        ref={panelRef}
        className="draft-search-panel"
        style={{
          left: panelStyle.left,
          top: panelStyle.top,
          width: panelStyle.width,
          maxHeight: panelStyle.maxHeight,
        }}
      >
        <div className="draft-search-input-row">
          <FaSearch className="shrink-0 text-white/55" size={12} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索日期、页面里的内容"
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder-white/48"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white/48 transition-colors hover:bg-white/12 hover:text-white"
              title="清空搜索"
            >
              <FaTimes size={10} />
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/54">
          <span>{resultSummary}</span>
          {trimmedQuery && results.length > 0 && (
            <span className="shrink-0 text-white/38">最多显示 50 条</span>
          )}
        </div>

        <div className="draft-search-results mt-3">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => handleSelect(result)}
              className="draft-search-result"
            >
              <span className="flex min-w-0 items-center gap-2 text-xs text-white/56">
                <FaRegFileAlt className="shrink-0 text-[#9cc9ff]" size={10} />
                <span className="shrink-0 font-semibold text-white/86">{result.date}</span>
                <span className="min-w-0 truncate text-white/52">{result.pageTitle}</span>
              </span>
              <span className="mt-1.5 block text-left text-sm leading-6 text-white/88">
                {renderHighlightedText(result.excerpt, trimmedQuery)}
              </span>
            </button>
          ))}

          {!loading && !results.length && (
            <div className="draft-search-empty">
              {trimmedQuery ? '换一个关键词试试' : '搜索会覆盖所有日期和页面'}
            </div>
          )}
        </div>
      </div>,
      document.body,
    )
    : null;

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        icon={FaSearch}
        active={open}
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        title="搜索日记草稿"
        className="draft-toolbar-button h-9 w-9 text-white/55 disabled:opacity-40"
      />

      {panel}
    </div>
  );
};

export default MarkdownSearchPanel;
