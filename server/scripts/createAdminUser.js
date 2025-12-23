import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// User Schema 
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  full_name: { type: String, required: true },
  username: { type: String, unique: true },
  bio: { type: String, default: 'Hey there! I am using PingUp.' },
  profile_picture: { type: String, default: '' },
  cover_photo: { type: String, default: '' },
  location: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin', 'super_admin'], default: 'user' },
  permissions: [{ type: String }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true, minimize: false });

const User = mongoose.model('User', UserSchema);

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminEmail = 'dkstdimbulvitiya@std.appsc.sab.ac.lk';
    const adminPassword = 'admin123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user already exists. Updating...');
      
      // Update existing user to super admin
      existingAdmin.role = 'super_admin';
      existingAdmin.permissions = ['users', 'posts', 'stories', 'messages', 'analytics'];
      existingAdmin.full_name = 'Admin User';
      
      // Update password
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      existingAdmin.password = hashedPassword;
      
      await existingAdmin.save();
      console.log('Existing user updated to super admin!');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      const adminUser = new User({
        email: adminEmail,
        password: hashedPassword,
        full_name: 'Admin User',
        username: 'admin_user',
        bio: 'System Administrator',
        role: 'super_admin',
        permissions: ['users', 'posts', 'stories', 'messages', 'analytics']
      });

      await adminUser.save();
      console.log('New admin user created successfully!');
    }

    // Verify the admin user
    const admin = await User.findOne({ email: adminEmail });
    console.log('\nAdmin User Details:');
    console.log('Email:', admin.email);
    console.log('Name:', admin.full_name);
    console.log('Username:', admin.username);
    console.log('Role:', admin.role);
    console.log('Permissions:', admin.permissions?.join(', '));
    console.log('User ID:', admin._id);
    
    console.log('\nAdmin setup completed!');
    console.log('Login credentials:');
    console.log('Email: dkstdimbulvitiya@std.appsc.sab.ac.lk');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createAdminUser();