import express from 'express';
import { upload } from '../configs/multer.js';
import { protect } from '../middlewares/auth.js';
import { 
    addPost, 
    getFeedPosts, 
    likePost, 
    deletePost, 
    addComment, 
    deleteComment,
    getDashboardStats  
} from '../controllers/postController.js';

const postRouter = express.Router();

postRouter.post('/add', upload.array('images', 4), protect, addPost);
postRouter.get('/feed', protect, getFeedPosts);
postRouter.post('/like', protect, likePost);
postRouter.delete('/:postId', protect, deletePost);
postRouter.post('/:postId/comments', protect, addComment);
postRouter.delete('/:postId/comments/:commentId', protect, deleteComment);
postRouter.get('/stats', protect, getDashboardStats); 

export default postRouter;