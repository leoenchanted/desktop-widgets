import React from 'react';
import { FaQuoteLeft } from 'react-icons/fa';

const QuoteWidget = () => {
  return (
    <div className="flex h-full flex-col justify-between p-5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/54">
        <FaQuoteLeft size={12} />
        Daily Quote
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-4 text-xl font-semibold leading-snug text-white/92">
          The only way to do great work is to love what you do.
        </div>
        <div className="text-sm leading-relaxed text-white/58">
          做出伟大工作的唯一方法，是热爱你正在做的事。
        </div>
      </div>
      <div className="text-right text-xs font-medium text-white/38">Steve Jobs</div>
    </div>
  );
};

export default QuoteWidget;
