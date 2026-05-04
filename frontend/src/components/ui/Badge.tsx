import React from 'react';
import { TaskStatus } from '../../types';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variants = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', className = '' }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
  >
    {label}
  </span>
);

export default Badge;

// Convenience component for task status badges
export const StatusBadge: React.FC<{ status: TaskStatus; isOverdue?: boolean }> = ({
  status,
  isOverdue,
}) => {
  if (isOverdue && status !== 'completed') {
    return <Badge label="Overdue" variant="danger" />;
  }

  const map: Record<TaskStatus, { label: string; variant: BadgeProps['variant'] }> = {
    pending: { label: 'Pending', variant: 'warning' },
    'in-progress': { label: 'In Progress', variant: 'info' },
    completed: { label: 'Completed', variant: 'success' },
  };

  const { label, variant } = map[status];
  return <Badge label={label} variant={variant} />;
};
