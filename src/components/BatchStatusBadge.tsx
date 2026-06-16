import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BatchStatus } from '@/types';

interface BatchStatusBadgeProps {
  status: BatchStatus;
  size?: 'sm' | 'md';
}

const statusConfig = {
  pending: { label: '待检测', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  qualified: { label: '合格', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  unqualified: { label: '不合格', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  expired: { label: '已过期', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: AlertTriangle },
};

export default function BatchStatusBadge({ status, size = 'md' }: BatchStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border font-medium',
      config.color,
      sizeClasses
    )}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  );
}
