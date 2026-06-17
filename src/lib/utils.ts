export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(dateStr: string): { label: string; color: string; bgColor: string } {
  const days = daysUntil(dateStr);
  if (days < 0) {
    return { label: '已过期', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' };
  }
  if (days <= 15) {
    return { label: `${days}天后到期`, color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' };
  }
  if (days <= 30) {
    return { label: `${days}天后到期`, color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' };
  }
  if (days <= 60) {
    return { label: `${days}天后到期`, color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' };
  }
  return { label: '正常', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' };
}

export function getUsageColor(rate: number): string {
  if (rate >= 80) return 'bg-emerald-500';
  if (rate >= 50) return 'bg-sky-500';
  if (rate >= 30) return 'bg-amber-500';
  return 'bg-red-500';
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
