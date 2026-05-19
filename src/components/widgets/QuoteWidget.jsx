import React from 'react';
import { FaQuoteLeft } from 'react-icons/fa';

const QuoteWidget = () => {
  return (
    <div className="widget-content quote-widget flex h-full min-h-0 flex-col justify-between p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/54">
        <FaQuoteLeft size={12} />
        Daily Quote
      </div>
      <div className="min-h-0 flex-1 overflow-hidden py-3">
        <div className="quote-main font-semibold leading-snug text-white/92">
          The only way to do great work is to love what you do.
        </div>
        <div className="quote-sub mt-2 leading-relaxed text-white/58">
          做出伟大工作的唯一方法，是热爱你正在做的事。
        </div>
      </div>
      <div className="text-right text-xs font-medium text-white/38">Steve Jobs</div>
    </div>
  );
};

export default QuoteWidget;
