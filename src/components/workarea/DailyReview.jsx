import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaChartLine, FaSyncAlt } from 'react-icons/fa';
import { useDebounce } from '../../hooks/useDebounce';
import { reviewApi } from '../../api/reviewApi';
import { today } from '../../utils/date';
import GlassPanel from '../ui/GlassPanel';
import PanelHeader from '../ui/PanelHeader';

const Metric = ({ value, label, tone = 'text-white' }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3">
    <div className={`text-xl font-semibold ${tone}`}>{value}</div>
    <div className="mt-1 text-[10px] font-medium text-white/35">{label}</div>
  </div>
);

const DailyReview = () => {
  const [review, setReview] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const currentDate = today();
  const debouncedNotes = useDebounce(notes, 500);
  const editedRef = useRef(false);

  const generate = useCallback(async () => {
    setRefreshing(true);
    try {
      const nextReview = await reviewApi.generate(currentDate);
      setReview(nextReview);
      if (!editedRef.current) setNotes(nextReview.notes || '');
    } catch (error) {
      console.error('Failed to generate daily review', error);
    } finally {
      setRefreshing(false);
    }
  }, [currentDate]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const nextReview = await reviewApi.getByDate(currentDate);
        if (cancelled) return;

        if (nextReview) {
          setReview(nextReview);
          setNotes(nextReview.notes || '');
        } else {
          await generate();
        }
      } catch (error) {
        console.error('Failed to load daily review', error);
        await generate();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentDate, generate]);

  useEffect(() => {
    if (!editedRef.current || !review) return;
    reviewApi.saveNotes(currentDate, debouncedNotes).catch((error) => {
      console.error('Failed to save review notes', error);
    });
  }, [currentDate, debouncedNotes, review]);

  const completionRate = review?.todo_total
    ? Math.round((review.todo_completed / review.todo_total) * 100)
    : 0;

  return (
    <GlassPanel className="flex h-full min-h-[260px] flex-col overflow-hidden">
      <PanelHeader
        eyebrow="Review"
        title="今日回顾"
        icon={FaChartLine}
        action={
          <button
            onClick={generate}
            disabled={refreshing}
            className="glass-control flex h-9 w-9 items-center justify-center text-white/55 hover:text-white disabled:opacity-40"
            title="刷新回顾"
          >
            <FaSyncAlt size={12} className={refreshing ? 'animate-spin' : ''} />
          </button>
        }
      />

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-white/35">
          生成中...
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric value={`${completionRate}%`} label="完成率" tone="text-[#7ee7ad]" />
            <Metric value={review?.todo_total || 0} label="任务数" />
            <Metric value={review?.markdown_word_count || 0} label="记录词数" />
            <Metric value={review?.pomodoro_count || 0} label="番茄钟" tone="text-[#80bfff]" />
          </div>

          <textarea
            value={notes}
            onChange={(e) => {
              editedRef.current = true;
              setNotes(e.target.value);
            }}
            placeholder="今日复盘..."
            className="mt-4 min-h-[72px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm leading-6 text-white/68 outline-none placeholder-white/24 transition-all focus:border-[#80bfff]/35 focus:bg-white/9"
            rows={3}
          />
        </>
      )}
    </GlassPanel>
  );
};

export default DailyReview;
