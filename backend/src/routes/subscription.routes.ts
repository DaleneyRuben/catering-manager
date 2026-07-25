import { Router } from 'express';
import subscriptionController from '../controllers/subscription.controller';
import { requireRole } from '../middleware/auth';
import validate from '../middleware/validate';
import { createSubscriptionSchema, updateSubscriptionSchema } from '../schemas/subscription.schema';
import { ROLES } from '../constants/roles.constants';

const router = Router({ mergeParams: true });

// nutritionist needs this to renew/reactivate an existing client from Evaluaciones
router.post(
  '/',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.NUTRITIONIST),
  validate(createSubscriptionSchema),
  subscriptionController.create,
);
router.patch(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(updateSubscriptionSchema),
  subscriptionController.update,
);

export default router;
