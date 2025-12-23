import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sendEmail from '../configs/nodemailer.js';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { generateToken } from '../configs/jwt.js';

export const register = async (req, res) => {
  try {
    const { email, password, full_name, username, faculty } = req.body;

    // Validation
    if (!email || !password || !full_name || !username || !faculty) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required including faculty selection'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with default role
    const user = await User.create({
      email,
      password: hashedPassword,
      full_name,
      username,
      faculty,
      profile_picture: '',
      cover_photo: '',
      bio: 'Hey there! I am using FindMate.',
      location: '',
      role: 'user',
      permissions: [],
      followers: [],
      following: [],
      connections: []
    });

    // Generate token
    const token = generateToken(user._id);

    // Return user data without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      full_name: user.full_name,
      username: user.username,
      faculty: user.faculty,
      profile_picture: user.profile_picture,
      cover_photo: user.cover_photo,
      bio: user.bio,
      location: user.location,
      role: user.role,
      permissions: user.permissions,
      followers: user.followers,
      following: user.following,
      connections: user.connections,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    // Return user data without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      full_name: user.full_name,
      username: user.username,
      faculty: user.faculty,
      profile_picture: user.profile_picture,
      cover_photo: user.cover_photo,
      bio: user.bio,
      location: user.location,
      role: user.role,
      permissions: user.permissions,
      followers: user.followers,
      following: user.following,
      connections: user.connections,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      token,
      user: userResponse,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        faculty: user.faculty,
        profile_picture: user.profile_picture,
        cover_photo: user.cover_photo,
        bio: user.bio,
        location: user.location,
        role: user.role,
        permissions: user.permissions,
        followers: user.followers,
        following: user.following,
        connections: user.connections,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Generate OTP
export const generateOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, an OTP has been sent'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Create new OTP
    const otpRecord = await OTP.create({
      email: email.toLowerCase(),
      otp: otp,
      type: 'password_reset'
    });

    // Email content
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Password Reset OTP</h2>
        <p>You requested a password reset for your FindMate account.</p>
        <p>Your OTP is:</p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 32px; letter-spacing: 8px;">${otp}</h1>
        </div>
        <p>This OTP will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          For security reasons, do not share this OTP with anyone.
        </p>
      </div>
    `;

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Your FindMate Password Reset OTP',
      body: emailBody
    });

    res.json({
      success: true,
      message: 'If an account with that email exists, an OTP has been sent',
      otpId: otpRecord._id 
    });

  } catch (error) {
    console.error('Generate OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating OTP'
    });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp, otpId } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp: otp,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      // Increment attempts
      await OTP.updateOne(
        { email: email.toLowerCase() },
        { $inc: { attempts: 1 } }
      );

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    // Generate reset token (valid for 10 minutes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save token to user
    const user = await User.findOne({ email: email.toLowerCase() });
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken: resetToken,
      userId: user._id
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP'
    });
  }
};

// Reset Password with token
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Delete used OTPs for this user
    await OTP.deleteMany({ email: user.email });

    // Send confirmation email
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Password Reset Successful</h2>
        <p>Your FindMate password has been successfully reset.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          For security reasons, if you suspect any unauthorized activity, 
          please contact our support team.
        </p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Your FindMate Password Has Been Reset',
      body: emailBody
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, an OTP has been sent'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Create new OTP
    const otpRecord = await OTP.create({
      email: email.toLowerCase(),
      otp: otp,
      type: 'password_reset'
    });

    // Email content
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Password Reset OTP (Resent)</h2>
        <p>Your new OTP for password reset is:</p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 32px; letter-spacing: 8px;">${otp}</h1>
        </div>
        <p>This OTP will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          For security reasons, do not share this OTP with anyone.
        </p>
      </div>
    `;

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Your FindMate Password Reset OTP (Resent)',
      body: emailBody
    });

    res.json({
      success: true,
      message: 'New OTP has been sent',
      otpId: otpRecord._id
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending OTP'
    });
  }
};