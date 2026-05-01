import React from 'react';

const Skeleton = ({ className = '', variant = 'rectangular', ...props }) => {
  const variants = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded h-4'
  };

  return (
    <div
      className={`animate-pulse bg-bg-tertiary ${variants[variant]} ${className}`}
      {...props}
    />
  );
};

export default Skeleton;
