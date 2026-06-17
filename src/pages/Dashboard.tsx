import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { useStore } from '@/store';
import {
  FileKey2,
  AlertTriangle,
  PackageX,
  TrendingUp,
  Clock,
  ChevronRight,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { getExpiryStatus, formatDate, getUsageColor, cn } from '@/lib/utils';
import { LICENSE_TYPE_LABELS } from '../../shared/types';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { overview, expiringList, usageStats, fetchAll, loading } = useStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchAll().then(() => setReady(true));
  }, [fetchAll]);

  const idleList = usageStats.filter(u => u.usageRate < 50).slice(0, 5);

  return (
    <Layout
      title="仪表盘"
      subtitle="软件许可证资产总览与预警"
      actions={
        <Button variant="secondary" size="sm" onClick={() => navigate('/licenses')}>
          <FileKey2 className="w-4 h-4" />
          管理许可证
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-5 animate-stagger">
          <StatCard
            title="许可证总数"
            value={overview?.totalLicenses ?? 0}
            description="全部在册许可证"
            icon={FileKey2}
            color="blue"
          />
          <StatCard
            title="即将到期"
            value={overview?.expiringCount ?? 0}
            description="60天内需续期"
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="闲置授权"
            value={overview?.idleCount ?? 0}
            description="使用率低于50%"
            icon={PackageX}
            color="red"
          />
          <StatCard
            title="整体使用率"
            value={`${overview?.overallUsageRate ?? 0}%`}
            description="已分配 / 总购买"
            icon={TrendingUp}
            color="emerald"
          />
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-slate-900">到期预警</h3>
                <span className="text-xs text-slate-500">（60天内）</span>
              </div>
              <button
                onClick={() => navigate('/calendar')}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
              >
                查看日历 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {loading || !ready ? (
                <div className="p-8 text-center text-slate-500 text-sm">加载中...</div>
              ) : expiringList.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">暂无即将到期的许可证</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {expiringList.slice(0, 8).map(lic => {
                    const status = getExpiryStatus(lic.expiryDate);
                    return (
                      <div
                        key={lic.id}
                        className="px-6 py-3.5 hover:bg-slate-50 transition-colors flex items-center gap-4 group cursor-pointer"
                        onClick={() => navigate('/licenses')}
                      >
                        <div className={cn('w-1 h-10 rounded-full', status.bgColor.split(' ')[0].replace('50', '500'))} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 text-sm truncate">{lic.productName}</p>
                            <span className="text-xs text-slate-400">v{lic.version}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {lic.vendor} · {LICENSE_TYPE_LABELS[lic.licenseType]} · 剩余 {lic.totalQuantity - lic.allocatedQuantity}/{lic.totalQuantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={status.color.includes('red') ? 'danger' : status.color.includes('orange') ? 'warning' : 'warning'}>
                            {status.label}
                          </Badge>
                          <p className="text-xs text-slate-400 mt-1">{formatDate(lic.expiryDate)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-slate-900">闲置授权提示</h3>
            </div>
            <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto">
              {loading || !ready ? (
                <div className="p-6 text-center text-slate-500 text-sm">加载中...</div>
              ) : idleList.length === 0 ? (
                <div className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">暂无闲置授权</p>
                </div>
              ) : (
                idleList.map(item => (
                  <div
                    key={item.licenseId}
                    className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => navigate('/reports')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900 truncate pr-2">{item.productName}</p>
                      <span className="text-xs font-bold text-slate-700 font-mono tabular-nums">{item.usageRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', getUsageColor(item.usageRate))}
                        style={{ width: `${item.usageRate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>已分配 {item.allocatedQuantity}/{item.totalQuantity}</span>
                      {item.suggestedQuantity < item.totalQuantity && (
                        <span className="text-red-600 font-medium flex items-center gap-1">
                          <PackageX className="w-3 h-3" />
                          建议缩减至 {item.suggestedQuantity}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
