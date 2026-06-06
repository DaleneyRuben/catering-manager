import { Router } from 'express';
import clientRoutes from './client.routes';
import menuRoutes from './menu.routes';
import planRoutes from './plan.routes';
import reportRoutes from './report.routes';
import subscriptionRoutes from './subscription.routes';

const router = Router();

router.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

router.use('/clients', clientRoutes);
router.use('/menus', menuRoutes);
router.use('/clients/:clientId/subscriptions', subscriptionRoutes);
router.use('/plans', planRoutes);
router.use('/reports', reportRoutes);

export default router;
