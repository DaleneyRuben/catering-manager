import { Router } from 'express';
import userController from '../controllers/user.controller';
import validate from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';

const router = Router();

router.get('/', userController.getAll);
router.get('/:id/logins', userController.getLogins);
router.post('/', validate(createUserSchema), userController.create);
router.patch('/:id', validate(updateUserSchema), userController.update);
router.delete('/:id', userController.remove);

export default router;
