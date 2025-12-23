import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';

// Store SSE connections
const notificationConnections = new Map();

// Initialize SSE for notifications
export const initNotificationSSE = (req, res) => {
    const userId = req.userId;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Send initial connection event
    res.write('data: {"type": "connected"}\n\n');

    // Store the connection
    notificationConnections.set(userId, res);

    // Handle client disconnect
    req.on('close', () => {
        console.log('Notification client disconnected:', userId);
        notificationConnections.delete(userId);
    });

    // Handle client errors
    req.on('error', (err) => {
        console.log('Notification SSE connection error:', err);
        notificationConnections.delete(userId);
    });
};

// Send notification to user
export const sendNotificationSSE = (userId, notification) => {
    const connection = notificationConnections.get(userId);
    if (connection) {
        try {
            connection.write(`data: ${JSON.stringify({
                type: 'new_notification',
                notification
            })}\n\n`);
        } catch (error) {
            console.log('Error sending SSE notification:', error);
            notificationConnections.delete(userId);
        }
    }
};

// Create notification
export const createNotification = async (data) => {
    try {
        const notification = await Notification.create(data);
        
        // Populate user data
        const populatedNotification = await Notification.findById(notification._id)
            .populate('user', 'full_name username profile_picture')
            .populate('from_user', 'full_name username profile_picture')
            .populate('post')
            .populate('message');
            
        // Send SSE notification
        sendNotificationSSE(data.user, populatedNotification);
        
        return populatedNotification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Create notification for new post
export const notifyNewPost = async (postId, userId) => {
    try {
        const post = await Post.findById(postId).populate('user');
        if (!post) return;

        // Get all users to notify (all users except the post owner)
        const users = await User.find({ _id: { $ne: userId } }).select('_id');
        
        const notifications = users.map(user => ({
            user: user._id,
            type: 'post',
            from_user: userId,
            post: postId,
            text: `${post.user.full_name} published a new post`,
            metadata: {
                post_type: post.post_type,
                is_item_post: post.is_item_post,
                item_type: post.item_type,
                item_name: post.item_name
            }
        }));

        // Create notifications in batch
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
            
            // Send SSE to all users
            notifications.forEach(notification => {
                sendNotificationSSE(notification.user, {
                    ...notification,
                    _id: 'temp-id',
                    createdAt: new Date()
                });
            });
        }
    } catch (error) {
        console.error('Error notifying new post:', error);
    }
};

// Create notification for new message
export const notifyNewMessage = async (messageId, fromUserId, toUserId) => {
    try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const fromUser = await User.findById(fromUserId);
        if (!fromUser) return;

        const notification = await createNotification({
            user: toUserId,
            type: 'message',
            from_user: fromUserId,
            message: messageId,
            text: `${fromUser.full_name} sent you a message`,
            metadata: {
                message_type: message.message_type,
                preview: message.text?.substring(0, 50) || 'New media message'
            }
        });

        return notification;
    } catch (error) {
        console.error('Error notifying new message:', error);
    }
};

// Create notification for new connection request
export const notifyConnectionRequest = async (connectionId, fromUserId, toUserId) => {
    try {
        const fromUser = await User.findById(fromUserId);
        if (!fromUser) return;

        const notification = await createNotification({
            user: toUserId,
            type: 'connection',
            from_user: fromUserId,
            connection: connectionId,
            text: `${fromUser.full_name} wants to connect with you`,
            metadata: {
                status: 'pending'
            }
        });

        return notification;
    } catch (error) {
        console.error('Error notifying connection request:', error);
    }
};

// Get user notifications
export const getUserNotifications = async (userId, limit = 20) => {
    try {
        const notifications = await Notification.find({ user: userId })
            .populate('from_user', 'full_name username profile_picture')
            .populate('post')
            .populate('message')
            .sort({ createdAt: -1 })
            .limit(limit);

        // Count unread notifications
        const unreadCount = await Notification.countDocuments({ 
            user: userId, 
            read: false 
        });

        return { notifications, unreadCount };
    } catch (error) {
        console.error('Error getting user notifications:', error);
        throw error;
    }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId, userId) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { 
                _id: notificationId, 
                user: userId 
            },
            { read: true },
            { new: true }
        );

        return notification;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId) => {
    try {
        await Notification.updateMany(
            { user: userId, read: false },
            { read: true }
        );

        return true;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};