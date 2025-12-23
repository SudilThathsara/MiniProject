import Notification from '../models/Notification.js';
import { 
    getUserNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    initNotificationSSE 
} from '../utils/notificationHelper.js';

// Get notifications SSE endpoint
export const getNotificationsSSE = (req, res) => {
    initNotificationSSE(req, res);
};

// Get user notifications
export const getNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 20 } = req.query;

        const result = await getUserNotifications(userId, parseInt(limit));

        res.json({
            success: true,
            notifications: result.notifications,
            unreadCount: result.unreadCount
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Mark notification as read
export const readNotification = async (req, res) => {
    try {
        const userId = req.userId;
        const { notificationId } = req.params;

        const notification = await markNotificationAsRead(notificationId, userId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Read notification error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Mark all notifications as read
export const readAllNotifications = async (req, res) => {
    try {
        const userId = req.userId;

        await markAllNotificationsAsRead(userId);

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Read all notifications error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get notification counts for tabs
export const getNotificationCounts = async (req, res) => {
    try {
        const userId = req.userId;

        const counts = {
            feed: await getUnreadCountByType(userId, 'post'),
            messages: await getUnreadCountByType(userId, 'message'),
            connections: await getUnreadCountByType(userId, 'connection'),
            total: await getTotalUnreadCount(userId)
        };

        res.json({
            success: true,
            counts
        });
    } catch (error) {
        console.error('Get notification counts error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Helper function to get unread count by type
const getUnreadCountByType = async (userId, type) => {
    return await Notification.countDocuments({ 
        user: userId, 
        type, 
        read: false 
    });
};

// Helper function to get total unread count
const getTotalUnreadCount = async (userId) => {
    return await Notification.countDocuments({ 
        user: userId, 
        read: false 
    });
};

// Mark all notifications of a specific type as read
export const markNotificationsByTypeAsRead = async (req, res) => {
    try {
        const userId = req.userId;
        const { type } = req.body;

        if (!type) {
            return res.status(400).json({
                success: false,
                message: 'Notification type is required'
            });
        }

        await Notification.updateMany(
            { 
                user: userId, 
                type: type,
                read: false 
            },
            { read: true }
        );

        res.json({
            success: true,
            message: `${type} notifications marked as read`
        });
    } catch (error) {
        console.error('Mark notifications by type error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};