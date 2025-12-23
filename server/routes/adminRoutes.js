import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  getAllPosts,
  deletePost,
  deleteComment,
  getAllStories,
  deleteStory,
  updateUserRole,
  getAllAdmins,
  generateItemsReport,
  generateDailyReports,
  generateComprehensiveReport
} from '../controllers/adminController.js';
import { protect, requireRole, requirePermission } from '../middlewares/auth.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../configs/jwt.js';
import User from '../models/User.js';

const adminRouter = express.Router();

// Admin login endpoint
adminRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Admin login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user with admin role
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      role: { $in: ['admin', 'super_admin'] }
    }).select('+password');

    if (!user) {
      console.log('Admin not found or not authorized:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials or insufficient permissions'
      });
    }

    console.log('Admin found:', user.email, 'Role:', user.role);

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for admin:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }
    // Generate token
    const token = generateToken(user._id);

    // Return admin data without password
    const adminResponse = {
      _id: user._id,
      email: user.email,
      full_name: user.full_name,
      username: user.username,
      profile_picture: user.profile_picture,
      role: user.role,
      permissions: user.permissions,
      createdAt: user.createdAt
    };

    console.log('Admin login successful:', adminResponse.email);

    res.json({
      success: true,
      token,
      admin: adminResponse,
      message: 'Admin login successful'
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during admin login'
    });
  }
});

// Admin verification endpoint
adminRouter.get('/verify', protect, requireRole(['admin', 'super_admin']), (req, res) => {
  try {
    const adminResponse = {
      _id: req.user._id,
      email: req.user.email,
      full_name: req.user.full_name,
      username: req.user.username,
      profile_picture: req.user.profile_picture,
      role: req.user.role,
      permissions: req.user.permissions,
      createdAt: req.user.createdAt
    };

    res.json({
      success: true,
      admin: adminResponse
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// All other admin routes require authentication and admin role
adminRouter.use(protect);
adminRouter.use(requireRole(['admin', 'super_admin']));

// Dashboard stats
adminRouter.get('/dashboard', getDashboardStats);

// User management
adminRouter.get('/users', requirePermission('users'), getAllUsers);
adminRouter.delete('/users/:userId', requirePermission('users'), deleteUser);

// Post management
adminRouter.get('/posts', requirePermission('posts'), getAllPosts);
adminRouter.delete('/posts/:postId', requirePermission('posts'), deletePost);
adminRouter.delete('/posts/:postId/comments/:commentId', requirePermission('posts'), deleteComment);

// Story management
adminRouter.get('/stories', requirePermission('stories'), getAllStories);
adminRouter.delete('/stories/:storyId', requirePermission('stories'), deleteStory);

// Reports - FIXED: Make sure these routes are after the protect middleware
adminRouter.get('/reports/items', generateItemsReport);
adminRouter.get('/reports/daily', generateDailyReports);
adminRouter.get('/reports/comprehensive', generateComprehensiveReport);

// Admin management (super admin only)
adminRouter.get('/admins', requireRole(['super_admin']), getAllAdmins);
adminRouter.patch('/users/:userId/role', requireRole(['super_admin']), updateUserRole);

export default adminRouter;