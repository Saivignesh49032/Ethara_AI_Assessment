import React from 'react';

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-bg-tertiary text-text-secondary border-border',
    // Status
    TODO: 'bg-[var(--color-status-todo)]/10 text-[var(--color-status-todo)] border-[var(--color-status-todo)]/20',
    IN_PROGRESS: 'bg-[var(--color-status-in-progress)]/10 text-[var(--color-status-in-progress)] border-[var(--color-status-in-progress)]/20',
    IN_REVIEW: 'bg-[var(--color-status-in-review)]/10 text-[var(--color-status-in-review)] border-[var(--color-status-in-review)]/20',
    DONE: 'bg-[var(--color-status-done)]/10 text-[var(--color-status-done)] border-[var(--color-status-done)]/20',
    // Priority
    LOW: 'bg-[var(--color-priority-low)]/10 text-[var(--color-priority-low)] border-[var(--color-priority-low)]/20',
    MEDIUM: 'bg-[var(--color-priority-medium)]/10 text-[var(--color-priority-medium)] border-[var(--color-priority-medium)]/20',
    HIGH: 'bg-[var(--color-priority-high)]/10 text-[var(--color-priority-high)] border-[var(--color-priority-high)]/20',
    URGENT: 'bg-[var(--color-priority-urgent)]/10 text-[var(--color-priority-urgent)] border-[var(--color-priority-urgent)]/20',
    // Roles
    ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    MEMBER: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  };

  const classes = `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant] || variants.default} ${className}`;

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default Badge;
