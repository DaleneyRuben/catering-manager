import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller';

const router = Router();

router.get('/', dashboardController.getSummary);

export default router;
