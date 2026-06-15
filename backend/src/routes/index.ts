import { Router } from 'express';
import authRoutes from './auth.routes';
import clientRoutes from './client.routes';
import menuRoutes from './menu.routes';
import planRoutes from './plan.routes';
import reportRoutes from './report.routes';
import subscriptionRoutes from './subscription.routes';
import userRoutes from './user.routes';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);

router.use('/clients', requireAuth, requireRole('admin', 'manager'), clientRoutes);
router.use('/menus', requireAuth, requireRole('admin', 'manager'), menuRoutes);
router.use(
  '/clients/:clientId/subscriptions',
  requireAuth,
  requireRole('admin', 'manager'),
  subscriptionRoutes,
);
router.use('/plans', requireAuth, requireRole('admin', 'manager'), planRoutes);
router.use('/reports', requireAuth, requireRole('admin', 'manager'), reportRoutes);
router.use('/users', requireAuth, requireRole('admin'), userRoutes);

export default router;
