import { Router } from 'express';
import subscriptionController from '../controllers/subscription.controller';
import validate from '../middleware/validate';
import { createSubscriptionSchema, updateSubscriptionSchema } from '../schemas/subscription.schema';

const router = Router({ mergeParams: true });

router.post('/', validate(createSubscriptionSchema), subscriptionController.create);
router.patch('/:id', validate(updateSubscriptionSchema), subscriptionController.update);

export default router;
