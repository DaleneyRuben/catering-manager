import { Router } from 'express';
import menuController from '../controllers/menu.controller';
import validate from '../middleware/validate';
import { upsertMenuSchema } from '../schemas/menu.schema';

const router = Router();

router.get('/', menuController.getAll);
router.get('/:date', menuController.getByDate);
router.put('/', validate(upsertMenuSchema), menuController.upsert);

export default router;
