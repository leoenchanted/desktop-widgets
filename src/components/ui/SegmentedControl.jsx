import React from 'react';

const SegmentedControl = ({ options, value, onChange, className = '' }) => (
  <div className={`inline-flex rounded-2xl bg-white/8 p-1 ${className}`}>
    {options.map((option) => (
      <button
        key={option.value}
        onClick={() => onChange(option.value)}
        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
          value === option.value
            ? 'bg-white/18 text-white shadow-[0_8px_20px_rgba(0,0,0,0.16)]'
            : 'text-white/45 hover:text-white/78'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default SegmentedControl;
