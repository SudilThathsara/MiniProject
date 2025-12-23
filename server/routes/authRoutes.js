import express from 'express';
import { 
  register, 
  login, 
  getCurrentUser,
  generateOTP,
  verifyOTP,
  resetPassword,
  resendOTP
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', protect, getCurrentUser);

// OTP-based password reset routes
authRouter.post('/generate-otp', generateOTP);
authRouter.post('/verify-otp', verifyOTP);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/resend-otp', resendOTP);

export default authRouter;