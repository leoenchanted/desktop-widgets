import React, { forwardRef } from 'react';

const IconButton = forwardRef(({
  icon: Icon,
  children,
  className = '',
  active = false,
  title,
  ...props
}, ref) => (
  <button
    ref={ref}
    className={`glass-control inline-flex items-center justify-center gap-2 text-sm text-white/70 hover:text-white ${
      children ? 'h-10 px-3' : 'h-10 w-10'
    } ${active ? 'bg-white/18 border-white/30 text-white' : ''} ${className}`}
    title={title}
    aria-label={title}
    {...props}
  >
    {Icon && <Icon size={14} />}
    {children && <span>{children}</span>}
  </button>
));

IconButton.displayName = 'IconButton';

export default IconButton;
