import { useState, useMemo, useEffect, ChangeEvent, DragEvent } from 'react';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import RenewalModal from '@/components/RenewalModal';
import LicenseDetailModal from '@/components/LicenseDetailModal';
import { useStore } from '@/store';
import {
  Plus,
  Search,
  Upload,
  Pencil,
  Trash2,
  Filter,
  Download,
  X,
  FileUp,
  CheckCircle2,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  getExpiryStatus,
  formatDate,
  getUsageColor,
  cn,
} from '@/lib/utils';
import type { License, LicenseType, RenewalRecord } from '../../shared/types';
import { LICENSE_TYPE_LABELS } from '../../shared/types';

const emptyForm: Omit<License, 'id' | 'createdAt' | 'updatedAt' | 'allocatedQuantity'> = {
  productName: '',
  version: '',
  vendor: '',
  totalQuantity: 1,
  purchaseDate: new Date().toISOString().split('T')[0],
  expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  licenseType: 'per-seat',
  licenseKey: '',
  purchaseOrder: '',
  notes: '',
};

export default function LicenseList() {
  const { licenses, fetchLicenses, fetchAllocations, createLicense, updateLicense, deleteLicense, batchImportLicenses, renewLicense, fetchRenewalRecords } = useStore();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<LicenseType | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showRenewal, setShowRenewal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [renewalRecords, setRenewalRecords] = useState<RenewalRecord[]>([]);

  const [importData, setImportData] = useState<Omit<License, 'id' | 'createdAt' | 'updatedAt' | 'allocatedQuantity'>[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; updated: number; failed: number } | null>(null);

  const filteredLicenses = useMemo(() => {
    return licenses.filter(lic => {
      const matchSearch =
        !search ||
        lic.productName.toLowerCase().includes(search.toLowerCase()) ||
        lic.vendor.toLowerCase().includes(search.toLowerCase()) ||
        lic.purchaseOrder?.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'all' || lic.licenseType === filterType;
      return matchSearch && matchType;
    });
  }, [licenses, search, filterType]);

  useEffect(() => {
    fetchLicenses();
    fetchAllocations();
  }, [fetchLicenses, fetchAllocations]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const handleOpenEdit = (lic: License) => {
    setEditingId(lic.id);
    setFormData({
      productName: lic.productName,
      version: lic.version,
      vendor: lic.vendor,
      totalQuantity: lic.totalQuantity,
      purchaseDate: lic.purchaseDate,
      expiryDate: lic.expiryDate,
      licenseType: lic.licenseType,
      licenseKey: lic.licenseKey ?? '',
      purchaseOrder: lic.purchaseOrder ?? '',
      notes: lic.notes ?? '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.productName.trim()) {
      setFormError('请输入产品名称');
      return;
    }
    if (formData.totalQuantity < 1) {
      setFormError('购买数量必须大于0');
      return;
    }
    try {
      if (editingId) {
        await updateLicense(editingId, formData);
      } else {
        await createLicense(formData);
      }
      setShowForm(false);
      await fetchLicenses();
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除此许可证？相关分配记录也将被清除。')) {
      await deleteLicense(id);
    }
  };

  const handleOpenRenewal = (lic: License) => {
    setSelectedLicense(lic);
    setShowRenewal(true);
  };

  const handleRenewalSubmit = async (data: { newExpiryDate: string; newQuantity: number; purchaseOrder: string; notes: string }) => {
    if (!selectedLicense) return;
    setRenewalLoading(true);
    try {
      await renewLicense(selectedLicense.id, data);
      setShowRenewal(false);
      setSelectedLicense(null);
    } finally {
      setRenewalLoading(false);
    }
  };

  const handleOpenDetail = async (lic: License) => {
    setSelectedLicense(lic);
    setRenewalRecords([]);
    setShowDetail(true);
    fetchRenewalRecords(lic.id).then(records => {
      setRenewalRecords(records);
    });
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const result: Omit<License, 'id' | 'createdAt' | 'updatedAt' | 'allocatedQuantity'>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx]?.trim() ?? '';
      });

      const typeMap: Record<string, LicenseType> = {
        '按座位': 'per-seat',
        '按设备': 'per-device',
        '企业授权': 'enterprise',
        'per-seat': 'per-seat',
        'per-device': 'per-device',
        'enterprise': 'enterprise',
      };

      result.push({
        productName: row['产品名称'] || row['productName'] || '',
        version: row['版本'] || row['version'] || '',
        vendor: row['供应商'] || row['vendor'] || '',
        totalQuantity: parseInt(row['购买数量'] || row['totalQuantity']) || 1,
        purchaseDate: row['购买日期'] || row['purchaseDate'] || new Date().toISOString().split('T')[0],
        expiryDate: row['到期日期'] || row['expiryDate'] || new Date().toISOString().split('T')[0],
        licenseType: typeMap[row['授权方式'] || row['licenseType']] || 'per-seat',
        licenseKey: row['授权密钥'] || row['licenseKey'] || '',
        purchaseOrder: row['采购单号'] || row['purchaseOrder'] || '',
        notes: row['备注'] || row['notes'] || '',
      });
    }
    return result.filter(r => r.productName);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setImportData(parsed);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setImportData(parsed);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = ['产品名称', '版本', '供应商', '购买数量', '购买日期', '到期日期', '授权方式', '授权密钥', '采购单号', '备注'];
    const sample = ['Adobe Photoshop', '2024', 'Adobe', '10', '2024-01-01', '2025-01-01', '按座位', 'ADB-PS-001', 'PO-2024-001', '设计团队使用'];
    const csv = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '许可证导入模板.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (importData.length === 0) return;
    const result = await batchImportLicenses(importData);
    setShowImport(false);
    setImportData([]);
    setImportResult(result);
  };

  return (
    <Layout
      title="许可证管理"
      subtitle={`共 ${licenses.length} 条许可证记录`}
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4" />
            批量导入
          </Button>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" />
            新增许可证
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索产品名称、供应商、采购单号..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as LicenseType | 'all')}
              className="h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
            >
              <option value="all">全部授权方式</option>
              <option value="per-seat">按座位</option>
              <option value="per-device">按设备</option>
              <option value="enterprise">企业授权</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">产品信息</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">供应商</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">授权方式</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">数量</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">使用率</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">到期状态</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">采购单号</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLicenses.map(lic => {
                  const usageRate = lic.totalQuantity > 0 ? Math.round((lic.allocatedQuantity / lic.totalQuantity) * 100) : 0;
                  const status = getExpiryStatus(lic.expiryDate);
                  return (
                    <tr key={lic.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{lic.productName}</p>
                          <p className="text-xs text-slate-500">v{lic.version}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{lic.vendor}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="slate">{LICENSE_TYPE_LABELS[lic.licenseType]}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-mono tabular-nums text-slate-900">
                          {lic.allocatedQuantity} / {lic.totalQuantity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-500', getUsageColor(usageRate))}
                              style={{ width: `${usageRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono tabular-nums text-slate-600 w-10">{usageRate}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
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
                          <span className="text-xs text-slate-400">{formatDate(lic.expiryDate)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 font-mono">{lic.purchaseOrder || '-'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetail(lic)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand-600 transition-colors"
                            title="详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenRenewal(lic)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                            title="续期"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(lic)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand-600 transition-colors"
                            title="编辑"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lic.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredLicenses.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-slate-400 text-sm">
                      暂无匹配的许可证记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? '编辑许可证' : '新增许可证'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editingId ? '保存修改' : '确认新增'}</Button>
          </div>
        }
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{formError}</div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">产品名称 *</label>
            <input
              type="text"
              value={formData.productName}
              onChange={e => setFormData({ ...formData, productName: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="例如：Adobe Creative Cloud"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">版本</label>
            <input
              type="text"
              value={formData.version}
              onChange={e => setFormData({ ...formData, version: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="例如：2024"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">供应商</label>
            <input
              type="text"
              value={formData.vendor}
              onChange={e => setFormData({ ...formData, vendor: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="例如：Adobe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">授权方式 *</label>
            <select
              value={formData.licenseType}
              onChange={e => setFormData({ ...formData, licenseType: e.target.value as LicenseType })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
            >
              <option value="per-seat">按座位</option>
              <option value="per-device">按设备</option>
              <option value="enterprise">企业授权</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">购买数量 *</label>
            <input
              type="number"
              min={1}
              value={formData.totalQuantity}
              onChange={e => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) || 1 })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">授权密钥</label>
            <input
              type="text"
              value={formData.licenseKey}
              onChange={e => setFormData({ ...formData, licenseKey: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono"
              placeholder="产品序列号/激活码"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">购买日期</label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">到期日期 *</label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">采购单号</label>
            <input
              type="text"
              value={formData.purchaseOrder}
              onChange={e => setFormData({ ...formData, purchaseOrder: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono"
              placeholder="例如：PO-2024-0012"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">备注</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              placeholder="可选的备注信息"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={showImport}
        onClose={() => {
          setShowImport(false);
          setImportData([]);
        }}
        title="批量导入许可证"
        size="lg"
        footer={
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4" />
              下载导入模板
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => { setShowImport(false); setImportData([]); }}>取消</Button>
              <Button onClick={handleImport} disabled={importData.length === 0}>
                <FileUp className="w-4 h-4" />
                确认导入 ({importData.length})
              </Button>
            </div>
          </div>
        }
      >
        {importData.length === 0 ? (
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-10 text-center transition-colors',
              dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-slate-400',
            )}
            onDragOver={e => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-700 font-medium mb-1">拖放CSV文件到此处</p>
            <p className="text-xs text-slate-500 mb-4">或点击下方按钮选择文件</p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-brand-700 transition-colors">
              <Upload className="w-4 h-4" />
              选择文件
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-slate-700">已解析 <strong className="text-emerald-600">{importData.length}</strong> 条记录，预览如下：</span>
            </div>
            <div className="max-h-80 overflow-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-slate-600">产品名称</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-600">版本</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-600">供应商</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-600">数量</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-600">授权方式</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-600">到期日期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-slate-800">{row.productName}</td>
                      <td className="px-3 py-2 text-slate-500">{row.version}</td>
                      <td className="px-3 py-2 text-slate-500">{row.vendor}</td>
                      <td className="px-3 py-2 text-slate-500 font-mono">{row.totalQuantity}</td>
                      <td className="px-3 py-2 text-slate-500">{LICENSE_TYPE_LABELS[row.licenseType]}</td>
                      <td className="px-3 py-2 text-slate-500 font-mono">{row.expiryDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end mt-3">
              <button
                onClick={() => setImportData([])}
                className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                清除重新选择
              </button>
            </div>
          </div>
        )}
      </Modal>

      <RenewalModal
        open={showRenewal}
        onClose={() => {
          setShowRenewal(false);
          setSelectedLicense(null);
        }}
        license={selectedLicense}
        onSubmit={handleRenewalSubmit}
        loading={renewalLoading}
      />

      <LicenseDetailModal
        open={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedLicense(null);
          setRenewalRecords([]);
        }}
        license={selectedLicense}
        renewalRecords={renewalRecords}
      />

      {importResult && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-80">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                导入完成
              </h4>
              <button
                onClick={() => setImportResult(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  新增
                </span>
                <span className="font-medium text-emerald-600 font-mono">{importResult.added} 条</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-sky-500" />
                  更新
                </span>
                <span className="font-medium text-sky-600 font-mono">{importResult.updated} 条</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  失败
                </span>
                <span className="font-medium text-red-600 font-mono">{importResult.failed} 条</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
