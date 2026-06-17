import Modal from './Modal';
import Badge from './Badge';
import { Clock, ArrowRight, Key, FileText, Hash, Calendar, Package, Building2, Tag } from 'lucide-react';
import { formatDate, getExpiryStatus } from '@/lib/utils';
import { LICENSE_TYPE_LABELS } from '../../shared/types';
import type { License, RenewalRecord } from '../../shared/types';

interface LicenseDetailModalProps {
  open: boolean;
  onClose: () => void;
  license: License | null;
  renewalRecords: RenewalRecord[];
}

export default function LicenseDetailModal({ open, onClose, license, renewalRecords }: LicenseDetailModalProps) {
  if (!license) return null;

  const status = getExpiryStatus(license.expiryDate);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="许可证详情"
      size="lg"
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {license.productName}
              <span className="text-sm font-normal text-slate-500 ml-2">v{license.version}</span>
            </h3>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              {license.vendor}
            </p>
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
            {status.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <Tag className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500">授权方式</p>
              <p className="text-sm font-medium text-slate-900">{LICENSE_TYPE_LABELS[license.licenseType]}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <Package className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500">数量</p>
              <p className="text-sm font-medium text-slate-900 font-mono">
                {license.allocatedQuantity} / {license.totalQuantity}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500">到期日</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(license.expiryDate)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500">采购单号</p>
              <p className="text-sm font-medium text-slate-900 font-mono">{license.purchaseOrder || '-'}</p>
            </div>
          </div>
          {license.licenseKey && (
            <div className="col-span-2 flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Key className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">授权密钥</p>
                <p className="text-sm font-medium text-slate-900 font-mono break-all">{license.licenseKey}</p>
              </div>
            </div>
          )}
          {license.notes && (
            <div className="col-span-2 flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Hash className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">备注</p>
                <p className="text-sm text-slate-700">{license.notes}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            续期历史
          </h4>
          {renewalRecords.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg">
              暂无续期记录
            </div>
          ) : (
            <div className="relative">
              {renewalRecords.map((record, index) => (
                <div key={record.id} className="relative pl-8 pb-6 last:pb-0">
                  {index < renewalRecords.length - 1 && (
                    <div className="absolute left-2.5 top-4 bottom-0 w-0.5 bg-slate-200" />
                  )}
                  <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-brand-100 border-2 border-brand-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(record.renewedAt)}
                      </span>
                      {record.purchaseOrder && (
                        <Badge variant="slate" className="font-mono text-xs">
                          {record.purchaseOrder}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">到期日</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600 font-mono">{formatDate(record.oldExpiryDate)}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-xs font-medium text-emerald-600 font-mono">{formatDate(record.newExpiryDate)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">数量</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600 font-mono">{record.oldQuantity}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-xs font-medium text-brand-600 font-mono">{record.newQuantity}</span>
                        </div>
                      </div>
                    </div>
                    {record.notes && (
                      <p className="text-xs text-slate-500 border-t border-slate-100 pt-2 mt-2">
                        {record.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
