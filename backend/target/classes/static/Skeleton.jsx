import React from 'react';

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div className={`animate-pulse bg-muted/20 rounded ${className}`} {...props}></div>
  );
};