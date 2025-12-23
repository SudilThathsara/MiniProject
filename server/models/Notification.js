import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: { 
        type: String, 
        ref: 'User', 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['post', 'message', 'connection', 'like', 'comment'], 
        required: true 
    },
    from_user: { 
        type: String, 
        ref: 'User' 
    },
    post: { 
        type: String, 
        ref: 'Post' 
    },
    message: { 
        type: String, 
        ref: 'Message' 
    },
    connection: { 
        type: String, 
        ref: 'Connection' 
    },
    text: { 
        type: String 
    },
    read: { 
        type: Boolean, 
        default: false 
    },
    metadata: { 
        type: mongoose.Schema.Types.Mixed 
    }
}, { 
    timestamps: true 
});

// Index for faster queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;