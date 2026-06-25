import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaCalendarCheck, FaChartArea, FaExternalLinkAlt } from 'react-icons/fa';
import { activityApi, countActivityWords } from '../../api/activityApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useMarkdownStore } from '../../store/useMarkdownStore';
import { usePomodoroStore } from '../../store/usePomodoroStore';
import { useTodoStore } from '../../store/useTodoStore';
import { formatShort, parseDateKey } from '../../utils/date';
import GlassPanel from '../ui/GlassPanel';
import PanelHeader from '../ui/PanelHeader';

const RECENT_DAYS = 183;
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function chunkWeeks(days) {
  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

function getMonthLabels(weeks) {
  const labels = [];
  let lastMonth = '';

  weeks.forEach((week, index) => {
    const firstRealDay = week.find((day) => !day.isFuture);
    if (!firstRealDay) return;

    const date = parseDateKey(firstRealDay.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (monthKey === lastMonth) return;
    lastMonth = monthKey;

    labels.push({
      key: monthKey,
      index,
      label: `${date.getMonth() + 1}月`,
    });
  });

  return labels;
}

function getActivityScore(day) {
  const markdownScore = Math.min(40, day.markdownWords / 20);
  const todoScore = Math.min(30, day.completedTodos * 8);
  const focusScore = Math.min(25, day.focusMinutes / 2);
  const reviewScore = day.hasReview ? 5 : 0;
  return Math.round(markdownScore + todoScore + focusScore + reviewScore);
}

function getActivityLevel(score) {
  if (score <= 0) return 0;
  if (score < 20) return 1;
  if (score < 45) return 2;
  if (score < 75) return 3;
  return 4;
}

function getStreak(days) {
  let streak = 0;
  const realDays = days.filter((day) => !day.isFuture).slice().reverse();
  for (const day of realDays) {
    if (day.score <= 0) break;
    streak += 1;
  }
  return streak;
}

function recalculateDay(day) {
  const score = getActivityScore(day);
  return {
    ...day,
    score,
    level: getActivityLevel(score),
  };
}

const BreakdownRow = ({ label, value, max, tone = 'green' }) => {
  const numericValue = Number(value) || 0;
  const width = Math.max(0, Math.min(100, Math.round((numericValue / max) * 100)));

  return (
    <div className="activity-breakdown-row">
      <div className="activity-breakdown-label">
        <span>{label}</span>
        <strong>{numericValue}</strong>
      </div>
      <div className="activity-breakdown-track">
        <span className={`activity-breakdown-fill tone-${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};

const ActivityHeatmap = ({ todayKey, selectedDate, onDateSelect }) => {
  const scrollRef = useRef(null);
  const [storedDays, setStoredDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewDate, setPreviewDate] = useState(null);
  const markdownCurrentDate = useMarkdownStore((state) => state.currentDate);
  const markdownPages = useMarkdownStore((state) => state.pages);
  const markdownContent = useMarkdownStore((state) => state.content);
  const todoCurrentDate = useTodoStore((state) => state.currentDate);
  const todoItems = useTodoStore((state) => state.items);
  const pomodoroCurrentDate = usePomodoroStore((state) => state.currentDate);
  const pomodoroSessionCount = usePomodoroStore((state) => state.sessionCount);
  const pomodoroFocusMinutes = usePomodoroStore((state) => state.focusMinutes);

  const liveMarkdownStats = useMemo(() => {
    const content = markdownPages.length
      ? markdownPages.map((page) => page.content || '').join('\n')
      : markdownContent;

    return {
      chars: content.length,
      words: countActivityWords(content),
    };
  }, [markdownContent, markdownPages]);

  const markdownDigest = `${markdownCurrentDate}:${liveMarkdownStats.chars}:${liveMarkdownStats.words}`;
  const todoDigest = `${todoCurrentDate}:${todoItems.length}:${todoItems.filter((item) => Boolean(item.completed)).length}`;
  const pomodoroDigest = `${pomodoroCurrentDate}:${pomodoroSessionCount}:${pomodoroFocusMinutes}`;
  const refreshKey = useDebounce(`${todayKey}:${markdownDigest}:${todoDigest}:${pomodoroDigest}`, 800);

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    activityApi.getHeatmapWindow(RECENT_DAYS, todayKey)
      .then((nextDays) => {
        if (cancelled) return;
        setStoredDays(nextDays);
      })
      .catch((error) => {
        console.error('Failed to load activity heatmap', error);
        if (!cancelled) setStoredDays([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey, todayKey]);

  const days = useMemo(() => storedDays.map((day) => {
    if (day.isFuture) return day;
    let nextDay = day;

    if (day.date === markdownCurrentDate) {
      nextDay = {
        ...nextDay,
        markdownChars: liveMarkdownStats.chars,
        markdownWords: liveMarkdownStats.words,
      };
    }

    if (day.date === todoCurrentDate) {
      nextDay = {
        ...nextDay,
        completedTodos: todoItems.filter((item) => Boolean(item.completed)).length,
        totalTodos: todoItems.length,
      };
    }

    if (day.date === pomodoroCurrentDate) {
      nextDay = {
        ...nextDay,
        focusMinutes: pomodoroFocusMinutes,
        pomodoroCount: pomodoroSessionCount,
      };
    }

    return recalculateDay(nextDay);
  }), [
    liveMarkdownStats.chars,
    liveMarkdownStats.words,
    markdownCurrentDate,
    pomodoroCurrentDate,
    pomodoroFocusMinutes,
    pomodoroSessionCount,
    storedDays,
    todoCurrentDate,
    todoItems,
  ]);

  const weeks = useMemo(() => chunkWeeks(days), [days]);
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);
  const activeDate = previewDate || selectedDate || todayKey;
  const activeDay = useMemo(
    () => days.find((day) => day.date === activeDate) || days.find((day) => day.date === todayKey) || null,
    [activeDate, days, todayKey],
  );
  const realDays = useMemo(() => days.filter((day) => !day.isFuture), [days]);
  const totals = useMemo(() => ({
    activeDays: realDays.filter((day) => day.score > 0).length,
    streak: getStreak(days),
  }), [days, realDays]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || loading || !weeks.length) return;
    requestAnimationFrame(() => {
      scroller.scrollLeft = scroller.scrollWidth;
    });
  }, [loading, weeks.length]);

  const handleDayClick = (day) => {
    if (day.isFuture) return;
    setPreviewDate(day.date);
  };

  const handleJumpToDate = () => {
    if (!activeDay?.date || activeDay.isFuture) return;
    onDateSelect?.(activeDay.date);
  };

  return (
    <GlassPanel className="activity-heatmap-panel workspace-fixed-panel flex flex-col overflow-hidden" padded={false}>
      <div className="px-4 pb-3 pt-4">
        <PanelHeader
          eyebrow="Review Map"
          title="活动热力图"
          icon={FaChartArea}
          action={
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/58">
              近 6 个月
            </span>
          }
        />
      </div>

      <div className="activity-heatmap-body min-h-0 flex-1 px-4 pb-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-white/35">
            正在统计...
          </div>
        ) : (
          <>
            <div className="activity-hero">
              <div>
                <span>{totals.activeDays}</span>
                <small>活跃天数</small>
              </div>
              <div>
                <span>{totals.streak}</span>
                <small>连续天数</small>
              </div>
            </div>

            <div ref={scrollRef} className="activity-heatmap-scroll glass-scrollbar">
              <div className="activity-month-row" style={{ gridTemplateColumns: `repeat(${weeks.length}, var(--activity-cell))` }}>
                {monthLabels.map((month) => (
                  <span
                    key={month.key}
                    style={{ gridColumn: `${month.index + 1} / span 3` }}
                  >
                    {month.label}
                  </span>
                ))}
              </div>

              <div className="activity-heatmap-layout">
                <div className="activity-weekday-labels">
                  {WEEKDAY_LABELS.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
                <div
                  className="activity-heatmap-grid"
                  style={{ gridTemplateColumns: `repeat(${weeks.length}, var(--activity-cell))` }}
                >
                  {weeks.map((week, weekIndex) => week.map((day, dayIndex) => (
                    <button
                      key={day.date}
                      type="button"
                      disabled={day.isFuture}
                      aria-label={`${day.date} 活动等级 ${day.level}`}
                      title={`${day.date}，${day.score} 分`}
                      onClick={() => handleDayClick(day)}
                      className={`activity-day-cell level-${day.level} ${day.date === activeDate ? 'is-selected' : ''} ${day.date === selectedDate ? 'is-workspace-date' : ''} ${day.date === todayKey ? 'is-today' : ''}`}
                      style={{
                        gridColumn: weekIndex + 1,
                        gridRow: dayIndex + 1,
                      }}
                    />
                  )))}
                </div>
              </div>

              <div className="activity-legend">
                <span>少</span>
                {[0, 1, 2, 3, 4].map((level) => (
                  <i key={level} className={`activity-day-cell level-${level}`} />
                ))}
                <span>多</span>
              </div>
            </div>

            <div className="activity-day-detail">
              <div className="activity-day-detail-head">
                <span className="flex items-center gap-2">
                  <FaCalendarCheck size={11} />
                  {activeDay ? `${formatShort(activeDay.date)} · ${activeDay.date}` : todayKey}
                </span>
                <strong>{activeDay?.score || 0} 分</strong>
              </div>

              <div className="activity-breakdown">
                <BreakdownRow label="记录字数" value={activeDay?.markdownWords || 0} max={1200} tone="green" />
                <BreakdownRow label="完成任务" value={activeDay?.completedTodos || 0} max={5} tone="green" />
                <BreakdownRow label="专注分钟" value={activeDay?.focusMinutes || 0} max={90} tone="green" />
                <BreakdownRow label="每日回顾" value={activeDay?.hasReview ? 1 : 0} max={1} tone="green" />
              </div>

              <button
                type="button"
                onClick={handleJumpToDate}
                disabled={!activeDay || activeDay.date === selectedDate}
                className="activity-jump-button"
              >
                <FaExternalLinkAlt size={10} />
                {activeDay?.date === selectedDate ? '当前已在这一天' : '跳到这一天的数据'}
              </button>
            </div>
          </>
        )}
      </div>
    </GlassPanel>
  );
};

export default ActivityHeatmap;
