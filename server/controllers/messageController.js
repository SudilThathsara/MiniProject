import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js";
import { notifyNewMessage } from '../utils/notificationHelper.js';
import User from "../models/User.js";

// Store SSE connections
const connections = new Map();

// SSE Controller
export const sseController = (req, res) => {
    const { userId } = req.params;
    console.log('New client connected:', userId);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Send initial connection event
    res.write('data: {"type": "connected"}\n\n');

    // Store the connection
    connections.set(userId, res);

    // Handle client disconnect
    req.on('close', () => {
        console.log('Client disconnected:', userId);
        connections.delete(userId);
    });

    // Handle client errors
    req.on('error', (err) => {
        console.log('SSE connection error:', err);
        connections.delete(userId);
    });
};

// Send message to specific user via SSE
const sendSSEMessage = (userId, message) => {
    const connection = connections.get(userId);
    if (connection) {
        try {
            connection.write(`data: ${JSON.stringify(message)}\n\n`);
        } catch (error) {
            console.log('Error sending SSE message:', error);
            connections.delete(userId);
        }
    }
};

// Send Message
export const sendMessage = async (req, res) => {
    try {
        const userId = req.userId;
        const { to_user_id, text } = req.body;
        const image = req.file;

        // Validate input
        if (!to_user_id) {
            return res.status(400).json({ 
                success: false, 
                message: "Recipient ID is required" 
            });
        }

        if (!text && !image) {
            return res.status(400).json({ 
                success: false, 
                message: "Message text or image is required" 
            });
        }

        let media_url = '';
        let message_type = image ? 'image' : 'text';

        // Handle image upload
        if (message_type === 'image') {
            const fileBuffer = fs.readFileSync(image.path);
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: image.originalname,
            });
            media_url = response.url;
        }

        // Create message
        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            text: text || '',
            message_type,
            media_url,
            seen: false
        });

        // Populate user data for response
        const populatedMessage = await Message.findById(message._id)
            .populate('from_user_id', 'full_name username profile_picture')
            .populate('to_user_id', 'full_name username profile_picture');
        
        await notifyNewMessage(message._id, userId, to_user_id);
            
        // Send SSE to recipient
        sendSSEMessage(to_user_id, {
            type: 'new_message',
            message: populatedMessage
        });

        res.json({ 
            success: true, 
            message: populatedMessage 
        });

    } catch (error) {
        console.log('Send message error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Get Chat Messages
export const getChatMessages = async (req, res) => {
    try {
        const userId = req.userId;
        const { to_user_id } = req.body;

        if (!to_user_id) {
            return res.status(400).json({
                success: false,
                message: "Recipient ID is required"
            });
        }

        const messages = await Message.find({
            $or: [
                { from_user_id: userId, to_user_id: to_user_id },
                { from_user_id: to_user_id, to_user_id: userId },
            ]
        })
        .populate('from_user_id', 'full_name username profile_picture')
        .populate('to_user_id', 'full_name username profile_picture')
        .sort({ createdAt: 1 });

        // Mark messages as seen
        await Message.updateMany(
            { 
                from_user_id: to_user_id, 
                to_user_id: userId,
                seen: false 
            }, 
            { seen: true }
        );

        res.json({ 
            success: true, 
            messages 
        });
    } catch (error) {
        console.log('Get chat messages error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Message
export const deleteMessage = async (req, res) => {
    try {
        const userId = req.userId;
        const { messageId } = req.params;

        // Find the message
        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        // Check if the user is the sender of the message
        if (message.from_user_id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own messages"
            });
        }

        // Delete the message
        await Message.findByIdAndDelete(messageId);

        res.json({
            success: true,
            message: "Message deleted successfully"
        });

    } catch (error) {
        console.log('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Conversation
export const deleteConversation = async (req, res) => {
    try {
        const userId = req.userId;
        const { to_user_id } = req.params;

        // Delete all messages between the two users
        await Message.deleteMany({
            $or: [
                { from_user_id: userId, to_user_id: to_user_id },
                { from_user_id: to_user_id, to_user_id: userId }
            ]
        });

        res.json({
            success: true,
            message: "Conversation deleted successfully"
        });

    } catch (error) {
        console.log('Delete conversation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};