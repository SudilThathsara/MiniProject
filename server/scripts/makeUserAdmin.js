/*import mongoose from 'mongoose';
import 'dotenv/config';

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

const makeUserAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const userEmail = 'dkstdimbulvitiya@std.appsc.sab.ac.lk';

    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('User not found:', userEmail);
      process.exit(1);
    }

    // Update user to super admin with all permissions
    user.role = 'super_admin';
    user.permissions = ['users', 'posts', 'stories', 'messages', 'analytics'];
    
    await user.save();

    console.log('User successfully made super admin!');
    console.log('Email:', user.email);
    console.log('Name:', user.full_name);
    console.log('Role:', user.role);
    console.log('Permissions:', user.permissions.join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

makeUserAdmin(); */