import React from "react";
import { FaQuoteLeft } from "react-icons/fa";

const QuoteWidget = () => {
  return (
    <div className="flex flex-col h-full justify-between p-2">
      <div className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
        <FaQuoteLeft /> Daily Quote
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-xl font-serif italic leading-relaxed mb-3">
          "The only way to do great work is to love what you do."
        </div>
        <div className="text-sm opacity-80 mb-4">
          做伟大工作的唯一方法是热爱你所做的事情。
        </div>
        <div className="text-right text-xs opacity-60 mt-auto">
          — Steve Jobs
        </div>
      </div>
    </div>
  );
};
export default QuoteWidget;
