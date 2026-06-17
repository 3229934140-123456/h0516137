import { Router } from 'express';
import { allocationService } from '../services/allocationService';
import type { RequestStatus } from '../../shared/types';

const router = Router();

router.get('/', (_req, res) => {
  const allocations = allocationService.getAll();
  res.json({ success: true, data: allocations });
});

router.post('/', (req, res) => {
  const { licenseId, employeeId } = req.body as { licenseId: string; employeeId: string };
  if (!licenseId || !employeeId) {
    res.status(400).json({ success: false, error: '缺少必填字段' });
    return;
  }
  const result = allocationService.create({ licenseId, employeeId });
  if ('error' in result) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }
  res.json({ success: true, data: result });
});

router.put('/:id/status', (req, res) => {
  const { status, rejectReason } = req.body as { status: RequestStatus; rejectReason?: string };
  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    res.status(400).json({ success: false, error: '状态值无效' });
    return;
  }
  const allocation = allocationService.updateStatus(req.params.id, status, rejectReason);
  if (!allocation) {
    res.status(404).json({ success: false, error: '申请记录不存在' });
    return;
  }
  res.json({ success: true, data: allocation });
});

router.delete('/:id', (req, res) => {
  const deleted = allocationService.remove(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, error: '申请记录不存在' });
    return;
  }
  res.json({ success: true });
});

export default router;
