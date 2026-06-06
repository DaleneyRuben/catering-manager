import { Router } from 'express';
import reportController from '../controllers/report.controller';

const router = Router();

router.get('/active-clients/download', reportController.downloadActiveClients);
router.get('/menu-card/download', reportController.exportMenu);

export default router;
