import { Router } from 'express';
import { store } from '../store';

const router = Router();

router.get('/', (_req, res) => {
  const employees = store.getEmployees();
  res.json({ success: true, data: employees });
});

export default router;
