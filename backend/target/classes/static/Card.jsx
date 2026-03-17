import React from 'react';

export const Card = ({ children, className = '', hover = false, ...props }) => {
  const baseClasses = 'bg-panel border border-border rounded-2xl';
  const hoverClasses = hover ? 'transition-all duration-200 hover:border-accent hover:-translate-y-0.5' : '';
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ title, action, className = 'mb-5' }) => (
  <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${className}`}>
    {title && <div className="font-syne font-bold text-base text-text">{title}</div>}
    {action}
  </div>
);