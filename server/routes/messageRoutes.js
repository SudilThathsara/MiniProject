import express from 'express';
import { getChatMessages, sendMessage, sseController, deleteMessage, deleteConversation } from '../controllers/messageController.js';
import { protect } from '../middlewares/auth.js';
import { upload } from '../configs/multer.js';

const messageRouter = express.Router();

messageRouter.get('/:userId', sseController);
messageRouter.post('/send', upload.single('image'), protect, sendMessage);
messageRouter.post('/get', protect, getChatMessages);
messageRouter.delete('/:messageId', protect, deleteMessage);
messageRouter.delete('/conversation/:to_user_id', protect, deleteConversation);

export default messageRouter;