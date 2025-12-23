import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true,
    select: false
  },
  full_name: { 
    type: String, 
    required: true,
    trim: true
  },
  username: { 
    type: String, 
    unique: true,
    trim: true,
    lowercase: true
  },
  bio: { 
    type: String, 
    default: 'Hey there! I am using FindMate.' 
  },
  profile_picture: { 
    type: String, 
    default: '' 
  },
  cover_photo: { 
    type: String, 
    default: '' 
  },
  location: { 
    type: String, 
    default: '' 
  },
  faculty: {
    type: String,
    enum: ['Applied Sciences', 'Geomatics', 'Management', 'Social Sciences', 'Technology'],
    default: ''
  },
  // ADD ROLE FIELD
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
    default: 'user'
  },
  permissions: [{
    type: String,
    enum: ['users', 'posts', 'stories', 'messages', 'analytics']
  }],
  followers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  following: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  connections: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],

  resetPasswordToken: String,
  resetPasswordExpires: Date,

}, { 
  timestamps: true, 
  minimize: false 
});

const User = mongoose.model('User', userSchema);

export default User;