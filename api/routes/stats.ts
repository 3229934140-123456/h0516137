import { Router } from 'express';
import { statsService } from '../services/statsService';

const router = Router();

router.get('/overview', (_req, res) => {
  const stats = statsService.getOverview();
  res.json({ success: true, data: stats });
});

router.get('/expiring', (req, res) => {
  const days = parseInt(req.query.days as string) || 60;
  const expiring = statsService.getExpiring(days);
  res.json({ success: true, data: expiring });
});

router.get('/usage', (_req, res) => {
  const usage = statsService.getUsageStats();
  res.json({ success: true, data: usage });
});

export default router;
