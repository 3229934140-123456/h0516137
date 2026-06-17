import Layout from '@/components/Layout';
import Badge from '@/components/Badge';
import { useStore } from '@/store';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Package,
  BarChart2,
  Lightbulb,
} from 'lucide-react';
import { getUsageColor, cn } from '@/lib/utils';

export default function UsageReport() {
  const { usageStats, overview } = useStore();

  const lowUsage = usageStats.filter(u => u.usageRate < 50);
  const highUsage = usageStats.filter(u => u.usageRate >= 90);
  const totalSuggestedSaving = usageStats.reduce(
    (sum, u) => sum + Math.max(0, u.totalQuantity - u.suggestedQuantity),
    0,
  );

  return (
    <Layout
      title="统计报表"
      subtitle="使用率分析与采购建议"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-4 gap-5 animate-stagger">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500">整体使用率</p>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
                {overview?.overallUsageRate ?? 0}
              </p>
              <span className="text-slate-500 pb-1">%</span>
            </div>
            <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700', getUsageColor(overview?.overallUsageRate ?? 0))}
                style={{ width: `${overview?.overallUsageRate ?? 0}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm text-slate-500">低使用率许可证</p>
            </div>
            <p className="text-3xl font-bold text-amber-700 font-mono tabular-nums">{lowUsage.length}</p>
            <p className="text-xs text-slate-500 mt-2">使用率低于 50%，建议缩减</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm text-slate-500">高使用率许可证</p>
            </div>
            <p className="text-3xl font-bold text-emerald-700 font-mono tabular-nums">{highUsage.length}</p>
            <p className="text-xs text-slate-500 mt-2">使用率超过 90%，考虑扩容</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-brand-600" />
              </div>
              <p className="text-sm text-slate-500">可优化授权数</p>
            </div>
            <p className="text-3xl font-bold text-brand-700 font-mono tabular-nums">{totalSuggestedSaving}</p>
            <p className="text-xs text-slate-500 mt-2">下次续期可缩减的授权总数</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            <h3 className="font-semibold text-slate-900">使用率排行榜</h3>
            <span className="text-xs text-slate-500">（从低到高排序，重点关注低使用率项）</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">排名</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">软件产品</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-48">使用率分布</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">使用率</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">已分配/总数</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">采购建议</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usageStats.map((item, idx) => (
                  <tr key={item.licenseId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                          idx < 3
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                            : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{item.productName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-700', getUsageColor(item.usageRate))}
                          style={{ width: `${item.usageRate}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={cn(
                          'text-sm font-bold font-mono tabular-nums',
                          item.usageRate >= 80
                            ? 'text-emerald-600'
                            : item.usageRate >= 50
                              ? 'text-sky-600'
                              : item.usageRate >= 30
                                ? 'text-amber-600'
                                : 'text-red-600',
                        )}
                      >
                        {item.usageRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-slate-600 font-mono tabular-nums">
                        {item.allocatedQuantity} / {item.totalQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.suggestedQuantity < item.totalQuantity ? (
                        <Badge variant="warning" className="flex items-center gap-1 justify-center mx-auto">
                          <Lightbulb className="w-3 h-3" />
                          缩减至 {item.suggestedQuantity}
                        </Badge>
                      ) : item.suggestedQuantity > item.totalQuantity ? (
                        <Badge variant="info" className="flex items-center gap-1 justify-center mx-auto">
                          <AlertTriangle className="w-3 h-3" />
                          增至 {item.suggestedQuantity}
                        </Badge>
                      ) : (
                        <Badge variant="success" className="flex items-center gap-1 justify-center mx-auto">
                          保持 {item.totalQuantity}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
