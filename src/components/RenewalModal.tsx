import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import type { License } from '../../shared/types';

interface RenewalModalProps {
  open: boolean;
  onClose: () => void;
  license: License | null;
  onSubmit: (data: { newExpiryDate: string; newQuantity: number; purchaseOrder: string; notes: string }) => Promise<void> | void;
  loading?: boolean;
}

export default function RenewalModal({ open, onClose, license, onSubmit, loading = false }: RenewalModalProps) {
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (open && license) {
      setNewExpiryDate(license.expiryDate);
      setNewQuantity(license.totalQuantity);
      setPurchaseOrder(license.purchaseOrder ?? '');
      setNotes('');
      setFormError('');
    }
  }, [open, license]);

  const handleSubmit = async () => {
    if (!newExpiryDate) {
      setFormError('请选择新到期日');
      return;
    }
    if (license && newQuantity < license.allocatedQuantity) {
      setFormError(`购买数量不能小于已分配数量 (${license.allocatedQuantity})`);
      return;
    }
    if (newQuantity < 1) {
      setFormError('购买数量必须大于0');
      return;
    }
    try {
      await onSubmit({ newExpiryDate, newQuantity, purchaseOrder, notes });
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  if (!license) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`续期 - ${license.productName}`}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>取消</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '提交中...' : '确认续期'}
          </Button>
        </div>
      }
    >
      {formError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{formError}</div>
      )}
      <div className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">当前许可证</p>
          <p className="text-sm font-medium text-slate-900">
            {license.productName} v{license.version}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            当前到期日：{license.expiryDate} · 数量：{license.allocatedQuantity} / {license.totalQuantity}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">新到期日 *</label>
            <input
              type="date"
              value={newExpiryDate}
              onChange={e => setNewExpiryDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              购买数量 *
              <span className="text-xs text-slate-400 ml-1">
                （最少 {license.allocatedQuantity}）
              </span>
            </label>
            <input
              type="number"
              min={license.allocatedQuantity}
              value={newQuantity}
              onChange={e => setNewQuantity(parseInt(e.target.value) || 1)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">采购单号</label>
            <input
              type="text"
              value={purchaseOrder}
              onChange={e => setPurchaseOrder(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono"
              placeholder="例如：PO-2024-0012"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">备注</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              placeholder="可选的备注信息"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
