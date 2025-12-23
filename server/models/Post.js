import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: { type: String, ref: 'User', required: true },
  text: { type: String, required: true },
  likes: [{ type: String, ref: 'User' }]
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  user: { type: String, ref: 'User', required: true },
  content: { type: String },
  image_urls: [{ type: String }],
  post_type: { type: String, enum: ['text', 'image', 'text_with_image'], required: true },
  likes_count: [{ type: String, ref: 'User' }],
  comments: [commentSchema],
  
  is_item_post: { type: Boolean, default: false },
  item_type: { type: String, enum: ['lost', 'found'] },
  full_name: { type: String },
  address: { type: String },
  mobile_number: { type: String },
  item_name: { type: String },
  item_description: { type: String }
}, { 
  timestamps: true, 
  minimize: false 
});

postSchema.index({ is_item_post: 1, createdAt: -1 });
postSchema.index({ item_type: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;