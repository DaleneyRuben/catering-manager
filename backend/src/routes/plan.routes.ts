import { Router } from 'express';
import planController from '../controllers/plan.controller';
import validate from '../middleware/validate';
import { createPlanSchema, updatePlanSchema } from '../schemas/plan.schema';

const router = Router();

router.get('/', planController.getAll);
router.get('/client-counts', planController.getClientCounts);
router.get('/:id', planController.getById);
router.post('/', validate(createPlanSchema), planController.create);
router.patch('/:id', validate(updatePlanSchema), planController.update);
router.delete('/:id', planController.remove);

export default router;
