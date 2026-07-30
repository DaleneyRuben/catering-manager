import { Router } from 'express';
import subscriptionController from '../controllers/subscription.controller';
import { requireRole } from '../middleware/auth';
import validate from '../middleware/validate';
import { createSubscriptionSchema, updateSubscriptionSchema } from '../schemas/subscription.schema';
import { ROLES } from '../constants/roles.constants';

const router = Router({ mergeParams: true });

// nutritionist renews/reactivates an existing client through POST /appointments/:id/resolve-renewal
// instead, which creates the subscription server-side inside a transaction — she has no need for
// direct access to this route.
router.post(
  '/',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(createSubscriptionSchema),
  subscriptionController.create,
);
router.patch(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(updateSubscriptionSchema),
  subscriptionController.update,
);
router.delete(
  '/upcoming/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  subscriptionController.deleteUpcomingSubscription,
);

export default router;
