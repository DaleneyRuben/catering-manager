import { Router } from 'express';
import clientRoutes from './client.routes';

const router = Router();

router.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

router.use('/clients', clientRoutes);

export default router;
