import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { useStore } from '@/store';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { getExpiryStatus, formatDate, daysUntil, cn } from '@/lib/utils';
import { LICENSE_TYPE_LABELS } from '../../shared/types';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function ExpiryCalendar() {
  const { licenses } = useStore();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const expiryByDate = useMemo(() => {
    const map = new Map<string, typeof licenses>();
    for (const lic of licenses) {
      const date = lic.expiryDate;
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(lic);
    }
    return map;
  }, [licenses]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [startWeekday, daysInMonth]);

  const monthStats = useMemo(() => {
    let expiring = 0;
    let expired = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const items = expiryByDate.get(dateStr) || [];
      for (const lic of items) {
        const days = daysUntil(lic.expiryDate);
        if (days < 0) expired++;
        else expiring++;
      }
    }
    const total = expiring + expired;
    return { total, expiring, expired };
  }, [viewYear, viewMonth, daysInMonth, expiryByDate]);

  const selectedItems = selectedDate ? expiryByDate.get(selectedDate) || [] : [];

  const getDateDotColor = (dateStr: string) => {
    const items = expiryByDate.get(dateStr);
    if (!items || items.length === 0) return null;
    const hasExpired = items.some(i => daysUntil(i.expiryDate) < 0);
    const hasUrgent = items.some(i => {
      const d = daysUntil(i.expiryDate);
      return d >= 0 && d <= 15;
    });
    if (hasExpired) return 'bg-red-500';
    if (hasUrgent) return 'bg-orange-500';
    return 'bg-amber-400';
  };

  return (
    <Layout
      title="到期日历"
      subtitle="按月查看即将到期的许可证"
      actions={
        <Button variant="secondary" size="sm" onClick={goToToday}>
          <CalendarIcon className="w-4 h-4" />
          今天
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold text-slate-900 min-w-[140px] text-center">
                  {viewYear} 年 {viewMonth + 1} 月
                </h3>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-slate-600">即将到期</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-slate-600">15天内到期</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-slate-600">已过期</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
              {WEEKDAYS.map((w, i) => (
                <div
                  key={w}
                  className={cn(
                    'py-2.5 text-center text-xs font-semibold',
                    i === 0 || i === 6 ? 'text-red-500' : 'text-slate-500',
                  )}
                >
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={idx} className="h-28 bg-slate-50/50 border-b border-r border-slate-100" />;
                }
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const items = expiryByDate.get(dateStr) || [];
                const isToday =
                  today.getFullYear() === viewYear &&
                  today.getMonth() === viewMonth &&
                  today.getDate() === day;
                const isSelected = selectedDate === dateStr;
                const dotColor = getDateDotColor(dateStr);
                const weekday = idx % 7;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      'h-28 border-b border-r border-slate-100 p-2 text-left transition-colors relative',
                      isSelected ? 'bg-brand-50' : 'hover:bg-slate-50',
                      weekday === 0 || weekday === 6 ? 'bg-slate-50/30' : '',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                          isToday
                            ? 'bg-brand-600 text-white'
                            : weekday === 0 || weekday === 6
                              ? 'text-red-500'
                              : 'text-slate-600',
                        )}
                      >
                        {day}
                      </span>
                      {dotColor && <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />}
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      {items.slice(0, 3).map(lic => {
                        const status = getExpiryStatus(lic.expiryDate);
                        return (
                          <div
                            key={lic.id}
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded truncate font-medium border',
                              status.bgColor,
                              status.color,
                            )}
                          >
                            {lic.productName.length > 8 ? lic.productName.slice(0, 8) + '…' : lic.productName}
                          </div>
                        );
                      })}
                      {items.length > 3 && (
                        <div className="text-[10px] text-slate-500 px-1.5">+{items.length - 3} 更多</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-brand-600" />
              本月统计
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-slate-50">
                <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{monthStats.total}</p>
                <p className="text-xs text-slate-500 mt-1">到期总数</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-50">
                <p className="text-2xl font-bold text-amber-700 font-mono tabular-nums">{monthStats.expiring}</p>
                <p className="text-xs text-amber-600 mt-1">即将到期</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50">
                <p className="text-2xl font-bold text-red-700 font-mono tabular-nums">{monthStats.expired}</p>
                <p className="text-xs text-red-600 mt-1">已过期</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h4 className="font-semibold text-slate-900">
                {selectedDate ? formatDate(selectedDate) + ' 到期详情' : '选择日期查看详情'}
              </h4>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {!selectedDate ? (
                <div className="p-12 text-center">
                  <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">点击日历中的日期查看详情</p>
                </div>
              ) : selectedItems.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">该日期无许可证到期</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selectedItems.map(lic => {
                    const status = getExpiryStatus(lic.expiryDate);
                    const days = daysUntil(lic.expiryDate);
                    return (
                      <div key={lic.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{lic.productName}</p>
                            <p className="text-xs text-slate-500">{lic.vendor} · v{lic.version}</p>
                          </div>
                          <Badge
                            variant={
                              status.color.includes('red')
                                ? 'danger'
                                : status.color.includes('orange') || status.color.includes('amber')
                                  ? 'warning'
                                  : 'success'
                            }
                          >
                            {days < 0 ? (
                              <span className="flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                已过期
                              </span>
                            ) : days <= 15 ? (
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {days}天
                              </span>
                            ) : (
                              `${days}天`
                            )}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{LICENSE_TYPE_LABELS[lic.licenseType]}</span>
                          <span className="font-mono">剩余 {lic.totalQuantity - lic.allocatedQuantity}/{lic.totalQuantity}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
