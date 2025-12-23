import express from 'express';
import { 
    getNotificationsSSE,
    getNotifications,
    readNotification,
    readAllNotifications,
    getNotificationCounts,
    markNotificationsByTypeAsRead
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/auth.js';

const notificationRouter = express.Router();

notificationRouter.get('/sse/:userId', protect, getNotificationsSSE);
notificationRouter.get('/', protect, getNotifications);
notificationRouter.get('/counts', protect, getNotificationCounts);
notificationRouter.patch('/:notificationId/read', protect, readNotification);
notificationRouter.patch('/read-all', protect, readAllNotifications);
notificationRouter.patch('/read-by-type', protect, markNotificationsByTypeAsRead);

export default notificationRouter;