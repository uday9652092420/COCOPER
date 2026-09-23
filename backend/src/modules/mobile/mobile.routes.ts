import express from 'express';
import { requireModulePermission } from '../../middleware/modulePermission.js';
import {
	checkoutMobileAttendanceHandler,
	createMobileAttendanceHandler,
	getMobileBootstrapHandler,
	listMobileAttendanceHandler,
} from './mobile.controller.js';

const router = express.Router();

router.get('/bootstrap', getMobileBootstrapHandler);
router.get('/labour-attendance', requireModulePermission('mobile-app', 'labour-attendance'), listMobileAttendanceHandler);
router.post('/labour-attendance', requireModulePermission('mobile-app', 'labour-attendance'), createMobileAttendanceHandler);
router.patch('/labour-attendance/:id/checkout', requireModulePermission('mobile-app', 'labour-attendance'), checkoutMobileAttendanceHandler);

export default router;