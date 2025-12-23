import mongoose from 'mongoose';

//new
const adminSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true,
    select: false
  },
  name: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'super_admin'], 
    default: 'admin' 
  },
  permissions: [{
    type: String,
    enum: ['users', 'posts', 'stories', 'messages', 'analytics']
  }]
}, { 
  timestamps: true 
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;