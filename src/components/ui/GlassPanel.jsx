import React from 'react';

const GlassPanel = ({
  as: Component = 'section',
  className = '',
  children,
  padded = true,
  hover = false,
}) => (
  <Component
    className={`glass-panel ${padded ? 'p-4' : ''} ${
      hover ? 'transition-all duration-300 hover:-translate-y-1 hover:border-white/30' : ''
    } ${className}`}
  >
    {children}
  </Component>
);

export default GlassPanel;
