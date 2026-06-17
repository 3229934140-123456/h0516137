import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import { useStore } from '@/store';
import {
  UserPlus,
  Check,
  X,
  Search,
  Plus,
  Users,
  BarChart3,
  UserX,
  AlertCircle,
} from 'lucide-react';
import { formatDate, getUsageColor, cn } from '@/lib/utils';
import type { RequestStatus } from '../../shared/types';
import { REQUEST_STATUS_LABELS } from '../../shared/types';

export default function AllocationList() {
  const { licenses, allocations, employees, createAllocation, updateAllocationStatus, deleteAllocation, fetchAll } = useStore();

  const [tab, setTab] = useState<'requests' | 'usage'>('requests');
  const [search, setSearch] = useState('');
  const [showApply, setShowApply] = useState(false);
  const [applyLicenseId, setApplyLicenseId] = useState('');
  const [applyEmployeeId, setApplyEmployeeId] = useState('');
  const [applyError, setApplyError] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [rejectId, setRejectId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const pendingCount = allocations.filter(a => a.status === 'pending').length;

  const filteredAllocations = useMemo(() => {
    return allocations
      .filter(a => {
        if (!search) return true;
        const emp = employees.find(e => e.id === a.employeeId);
        const lic = licenses.find(l => l.id === a.licenseId);
        return (
          emp?.name.toLowerCase().includes(search.toLowerCase()) ||
          lic?.productName.toLowerCase().includes(search.toLowerCase())
        );
      })
      .sort((a, b) => {
        const order: Record<RequestStatus, number> = { pending: 0, approved: 1, rejected: 2 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
      });
  }, [allocations, employees, licenses, search]);

  const usageList = useMemo(() => {
    return licenses
      .map(lic => {
        const rate = lic.totalQuantity > 0 ? Math.round((lic.allocatedQuantity / lic.totalQuantity) * 100) : 0;
        return {
          ...lic,
          usageRate: rate,
          remaining: lic.totalQuantity - lic.allocatedQuantity,
        };
      })
      .sort((a, b) => a.usageRate - b.usageRate);
  }, [licenses]);

  const handleApply = async () => {
    if (!applyLicenseId || !applyEmployeeId) {
      setApplyError('请选择许可证和员工');
      return;
    }
    try {
      await createAllocation({ licenseId: applyLicenseId, employeeId: applyEmployeeId });
      setShowApply(false);
      setApplyLicenseId('');
      setApplyEmployeeId('');
      setApplyError('');
    } catch (err) {
      setApplyError((err as Error).message);
    }
  };

  const showToast = (type: 'error' | 'success', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (id: string) => {
    try {
      await updateAllocationStatus(id, 'approved');
      showToast('success', '授权已批准');
    } catch (err) {
      showToast('error', (err as Error).message);
    }
  };

  const handleOpenReject = (id: string) => {
    setRejectId(id);
    setRejectReason('');
    setShowReject(true);
  };

  const handleConfirmReject = async () => {
    await updateAllocationStatus(rejectId, 'rejected', rejectReason);
    setShowReject(false);
    setRejectId('');
    setRejectReason('');
  };

  const handleRevoke = async (id: string) => {
    if (confirm('确定回收此授权？')) {
      await deleteAllocation(id);
    }
  };

  return (
    <Layout
      title="授权分配"
      subtitle={`${pendingCount} 条待审批申请`}
      actions={
        <Button size="sm" onClick={() => setShowApply(true)}>
          <Plus className="w-4 h-4" />
          新建申请
        </Button>
      }
    >
      <div className="space-y-4">
        {toast && (
          <div
            className={cn(
              'px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-fade-in',
              toast.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700',
            )}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Check className="w-4 h-4 flex-shrink-0" />
            )}
            {toast.message}
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm inline-flex">
          <button
            onClick={() => setTab('requests')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
              tab === 'requests' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <UserPlus className="w-4 h-4" />
            申请列表
            {pendingCount > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 rounded-full text-xs font-bold',
                tab === 'requests' ? 'bg-white/20' : 'bg-red-100 text-red-600'
              )}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('usage')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
              tab === 'usage' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <BarChart3 className="w-4 h-4" />
            使用率统计
          </button>
        </div>

        {tab === 'requests' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜索员工姓名或软件名称..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">员工</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">申请软件</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">申请时间</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">备注</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAllocations.map(a => {
                    const emp = employees.find(e => e.id === a.employeeId);
                    const lic = licenses.find(l => l.id === a.licenseId);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-semibold">
                              {emp?.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{emp?.name}</p>
                              <p className="text-xs text-slate-500">{emp?.department} · {emp?.jobTitle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{lic?.productName}</p>
                            <p className="text-xs text-slate-500">v{lic?.version}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{formatDate(a.requestDate)}</td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={
                              a.status === 'approved' ? 'success' : a.status === 'pending' ? 'warning' : 'danger'
                            }
                          >
                            {REQUEST_STATUS_LABELS[a.status]}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-500 max-w-xs truncate">
                          {a.rejectReason || '-'}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {a.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(a.id)}
                                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  title="批准"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenReject(a.id)}
                                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                  title="拒绝"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {a.status === 'approved' && (
                              <button
                                onClick={() => handleRevoke(a.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="回收授权"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAllocations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-slate-400 text-sm">
                        暂无申请记录
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'usage' && (
          <div className="grid grid-cols-2 gap-4">
            {usageList.map(lic => (
              <div key={lic.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{lic.productName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{lic.vendor} · v{lic.version}</p>
                  </div>
                  <Badge variant={lic.remaining > 0 ? 'success' : 'danger'}>
                    {lic.remaining > 0 ? `剩余 ${lic.remaining}` : '已用完'}
                  </Badge>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{lic.usageRate}</span>
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {lic.allocatedQuantity} / {lic.totalQuantity} 已分配
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', getUsageColor(lic.usageRate))}
                    style={{ width: `${lic.usageRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">已分配给 {allocations.filter(a => a.licenseId === lic.id && a.status === 'approved').length} 名员工</span>
                  {lic.usageRate < 50 && (
                    <span className="text-amber-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      使用率偏低
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showApply}
        onClose={() => {
          setShowApply(false);
          setApplyError('');
          setApplyLicenseId('');
          setApplyEmployeeId('');
        }}
        title="新建授权申请"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowApply(false)}>取消</Button>
            <Button onClick={handleApply}>提交申请</Button>
          </div>
        }
      >
        {applyError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {applyError}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">选择许可证 *</label>
            <select
              value={applyLicenseId}
              onChange={e => setApplyLicenseId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
            >
              <option value="">请选择软件许可证</option>
              {licenses.map(lic => (
                <option key={lic.id} value={lic.id}>
                  {lic.productName} (剩余 {lic.totalQuantity - lic.allocatedQuantity}/{lic.totalQuantity})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">选择员工 *</label>
            <select
              value={applyEmployeeId}
              onChange={e => setApplyEmployeeId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
            >
              <option value="">请选择申请员工</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.department} / {emp.jobTitle}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        open={showReject}
        onClose={() => setShowReject(false)}
        title="拒绝申请"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowReject(false)}>取消</Button>
            <Button variant="danger" onClick={handleConfirmReject}>确认拒绝</Button>
          </div>
        }
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">拒绝原因</label>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={3}
            placeholder="请输入拒绝原因..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          />
        </div>
      </Modal>
    </Layout>
  );
}
