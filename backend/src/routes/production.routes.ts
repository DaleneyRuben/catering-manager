import { Router } from 'express';
import productionController from '../controllers/production.controller';

const router = Router();

router.get('/', productionController.getGroups);

export default router;
