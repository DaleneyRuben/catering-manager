import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller';

const router = Router();

router.get('/', dashboardController.getSummary);
router.get('/sessions', dashboardController.getSessions);

export default router;
