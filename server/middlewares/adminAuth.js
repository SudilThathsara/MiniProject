import { verifyToken } from '../configs/jwt.js';
import Admin from '../models/Admin.js';

// Hardcoded admin email - ONLY this email can access admin panel
const ADMIN_EMAIL = 'dkstdimbulvitiya@std.appsc.sab.ac.lk';

export const requireAdmin = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const decoded = verifyToken(token);
    
    // Verify admin exists and is the specific allowed admin
    const admin = await Admin.findById(decoded.userId);
    if (!admin || admin.email !== ADMIN_EMAIL) {
      return res.status(401).json({
        success: false,
        message: 'Admin access denied. Unauthorized user.'
      });
    }

    req.admin = admin;
    req.adminId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Admin access required'
    });
  }
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin.permissions.includes(permission) && req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};