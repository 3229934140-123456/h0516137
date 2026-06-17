import { Router } from 'express';
import { licenseService } from '../services/licenseService';
import type { License } from '../../shared/types';

const router = Router();

router.get('/', (_req, res) => {
  const licenses = licenseService.getAll();
  res.json({ success: true, data: licenses });
});

router.get('/:id', (req, res) => {
  const license = licenseService.getById(req.params.id);
  if (!license) {
    res.status(404).json({ success: false, error: '许可证不存在' });
    return;
  }
  res.json({ success: true, data: license });
});

router.post('/', (req, res) => {
  try {
    const data = req.body as Omit<License, 'id' | 'createdAt' | 'updatedAt' | 'allocatedQuantity'>;
    if (!data.productName || !data.totalQuantity || !data.expiryDate || !data.licenseType) {
      res.status(400).json({ success: false, error: '缺少必填字段' });
      return;
    }
    const license = licenseService.create(data);
    res.json({ success: true, data: license });
  } catch (err) {
    res.status(500).json({ success: false, error: '创建失败' });
  }
});

router.put('/:id', (req, res) => {
  const license = licenseService.update(req.params.id, req.body);
  if (!license) {
    res.status(404).json({ success: false, error: '许可证不存在' });
    return;
  }
  res.json({ success: true, data: license });
});

router.delete('/:id', (req, res) => {
  const deleted = licenseService.remove(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, error: '许可证不存在' });
    return;
  }
  res.json({ success: true });
});

router.post('/batch-import', (req, res) => {
  try {
    const { data } = req.body as { data: Omit<License, 'id' | 'createdAt' | 'updatedAt' | 'allocatedQuantity'>[] };
    if (!Array.isArray(data)) {
      res.status(400).json({ success: false, error: '数据格式错误' });
      return;
    }
    const result = licenseService.batchImport(data);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: '批量导入失败' });
  }
});

router.get('/:id/renewals', (req, res) => {
  const records = licenseService.getRenewalRecords(req.params.id);
  res.json({ success: true, data: records });
});

router.post('/:id/renew', (req, res) => {
  const { newExpiryDate, newQuantity, purchaseOrder, notes } = req.body as {
    newExpiryDate: string;
    newQuantity: number;
    purchaseOrder?: string;
    notes?: string;
  };

  if (!newExpiryDate || !newQuantity) {
    res.status(400).json({ success: false, error: '缺少必填字段：新到期日和购买数量' });
    return;
  }

  const result = licenseService.renewLicense(req.params.id, {
    newExpiryDate,
    newQuantity,
    purchaseOrder,
    notes,
  });

  if (!result) {
    res.status(404).json({ success: false, error: '许可证不存在' });
    return;
  }
  if ('error' in result) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }
  res.json({ success: true, data: result });
});

export default router;
