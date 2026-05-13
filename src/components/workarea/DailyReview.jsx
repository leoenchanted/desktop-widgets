import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { reviewApi } from '../../api/reviewApi';
import { today } from '../../utils/date';

const DailyReview = () => {
  const [review, setReview] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const currentDate = today();
  const debouncedNotes = useDebounce(notes, 500);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const r = await reviewApi.generate(currentDate);
      setReview(r);
      setNotes(r.notes || '');
    } catch {}
    setLoading(false);
  }, [currentDate]);

  useEffect(() => {
    (async () => {
      try {
        const r = await reviewApi.getByDate(currentDate);
        if (r) {
          setReview(r);
          setNotes(r.notes || '');
        } else {
          generate();
        }
      } catch {
        generate();
      }
    })();
  }, [currentDate]);

  useEffect(() => {
    if (debouncedNotes && review) {
      reviewApi.saveNotes(currentDate, debouncedNotes).catch(() => {});
    }
  }, [debouncedNotes]);

  if (loading) {
    return (
      <div className="bg-black/60 border-2 border-red-500/70 rounded-lg flex items-center justify-center p-4 h-full">
        <span className="text-white/30 text-xs">生成中...</span>
      </div>
    );
  }

  return (
    <div className="bg-black/60 border-2 border-red-500/70 rounded-lg flex flex-col p-4 h-full">
      <span className="text-[10px] uppercase tracking-widest font-bold text-red-400/80 mb-3">
        今日回顾
      </span>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-lg font-semibold text-white">{review?.todo_total || 0}</div>
          <div className="text-[9px] text-white/30">总任务</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-lg font-semibold text-green-400">
            {review?.todo_completed || 0}/{review?.todo_total || 0}
          </div>
          <div className="text-[9px] text-white/30">已完成</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-lg font-semibold text-white">{review?.markdown_word_count || 0}</div>
          <div className="text-[9px] text-white/30">字数</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-lg font-semibold text-red-400">{review?.pomodoro_count || 0}</div>
          <div className="text-[9px] text-white/30">番茄钟</div>
        </div>
      </div>

      {/* Notes */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="今天感想..."
        className="w-full bg-white/5 border border-red-500/30 rounded-lg p-2 text-[11px] text-white/60 placeholder-white/20 resize-none outline-none focus:bg-white/10 focus:border-red-500/50 transition-all min-h-[50px] flex-1"
        rows={2}
      />
    </div>
  );
};

export default DailyReview;
