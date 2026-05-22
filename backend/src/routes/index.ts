import { Router } from 'express';
import clientRoutes from './client.routes';
import planRoutes from './plan.routes';

const router = Router();

router.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

router.use('/clients', clientRoutes);
router.use('/plans', planRoutes);

export default router;
