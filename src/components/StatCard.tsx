import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color: 'blue' | 'amber' | 'red' | 'emerald';
}

const colorMap = {
  blue: {
    bg: 'bg-gradient-to-br from-sky-500 to-blue-600',
    soft: 'bg-sky-50',
    text: 'text-sky-600',
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    soft: 'bg-amber-50',
    text: 'text-amber-600',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-500 to-rose-600',
    soft: 'bg-red-50',
    text: 'text-red-600',
  },
  emerald: {
    bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    soft: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
};

export default function StatCard({ title, value, description, icon: Icon, trend, color }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums">{value}</p>
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
          {trend && (
            <p className={cn('text-xs font-medium mt-2', trend.value >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', colors.soft)}>
          <Icon className={cn('w-[22px] h-[22px]', colors.text)} />
        </div>
      </div>
    </div>
  );
}
