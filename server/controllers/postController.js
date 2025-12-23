import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { notifyNewPost } from "../utils/notificationHelper.js";

// Add Post
export const addPost = async (req, res) => {
    try {
        const userId = req.userId;
        const { 
            content, 
            post_type, 
            is_item_post,
            item_type,
            full_name,
            address,
            mobile_number,
            item_name,
            item_description
        } = req.body;
        const images = req.files;

        console.log('Creating post with data:', {
            is_item_post,
            item_type,
            item_name,
            full_name,
            mobile_number
        });

        let image_urls = [];

        if(images && images.length){
            image_urls = await Promise.all(
                images.map(async (image) => {
                    const fileBuffer = fs.readFileSync(image.path);
                    const response = await imagekit.upload({
                        file: fileBuffer,
                        fileName: image.originalname,
                        folder: "posts",
                    });

                    const url = imagekit.url({
                        path: response.filePath,
                        transformation: [
                            {quality: 'auto'},
                            { format: 'webp' },
                            { width: '1280' }
                        ]
                    });
                    return url;
                })
            );
        }

        const postData = {
            user: userId,
            content,
            image_urls,
            post_type,
            is_item_post: is_item_post === 'true',
            ...(is_item_post === 'true' && {
                item_type,
                full_name,
                address,
                mobile_number,
                item_name,
                item_description
            })
        };
        
        const post = await Post.create(postData);
        
        // Populate the post with user data before returning
        const populatedPost = await Post.findById(post._id).populate('user');
        
        // NOTIFY ALL USERS ABOUT NEW POST
        await notifyNewPost(post._id, userId);

        res.json({ 
            success: true, 
            message: is_item_post === 'true' ? "Item posted successfully" : "Post created successfully", 
            post: populatedPost 
        });
    } catch (error) {
        console.log('Error creating post:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get Posts - SHOW ALL POSTS TO ALL USERS
export const getFeedPosts = async (req, res) => {
    try {
        const userId = req.userId;
        
        // MODIFICATION: Get ALL posts instead of only from connections/following
        // For public feed: show all posts to all users
        const posts = await Post.find({})
            .populate('user', 'full_name username profile_picture faculty bio location')
            .sort({ createdAt: -1 })
            .limit(50); // Limit to prevent overwhelming responses

        res.json({ 
            success: true, 
            posts,
            message: 'Feed loaded successfully' 
        });
    } catch (error) {
        console.log('Error fetching feed posts:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}

// Like Post
export const likePost = async (req, res) => {
    try {
        const userId = req.userId;
        const { postId } = req.body;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found' 
            });
        }

        if(post.likes_count.includes(userId)){
            post.likes_count = post.likes_count.filter(user => user.toString() !== userId);
            await post.save();
            res.json({ 
                success: true, 
                message: 'Post unliked',
                likes_count: post.likes_count
            });
        } else {
            post.likes_count.push(userId);
            await post.save();
            res.json({ 
                success: true, 
                message: 'Post liked',
                likes_count: post.likes_count
            });
        }

    } catch (error) {
        console.log('Error liking post:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}

// Delete Post
export const deletePost = async (req, res) => {
    try {
        const userId = req.userId;
        const { postId } = req.params;

        console.log('Deleting post:', { userId, postId });

        // Find the post
        const post = await Post.findById(postId);
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Check if the user owns the post
        if (post.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own posts"
            });
        }

        // Delete the post
        await Post.findByIdAndDelete(postId);

        console.log('Post deleted successfully');

        res.json({
            success: true,
            message: "Post deleted successfully"
        });

    } catch (error) {
        console.log('Delete post error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Add comment to post
export const addComment = async (req, res) => {
    try {
        const userId = req.userId;
        const { postId } = req.params;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: "Comment text is required"
            });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Add comment
        post.comments.push({
            user: userId,
            text: text
        });

        await post.save();

        // Populate the comment with user data
        const updatedPost = await Post.findById(postId)
            .populate('user')
            .populate('comments.user', 'full_name username profile_picture');

        res.json({
            success: true,
            message: "Comment added successfully",
            post: updatedPost
        });

    } catch (error) {
        console.log('Add comment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Delete comment from post
export const deleteComment = async (req, res) => {
    try {
        const userId = req.userId;
        const { postId, commentId } = req.params;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Find the comment
        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found"
            });
        }

        // Check if user owns the comment or the post
        if (comment.user.toString() !== userId && post.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own comments or comments on your posts"
            });
        }

        // Remove the comment
        post.comments.pull(commentId);
        await post.save();

        res.json({
            success: true,
            message: "Comment deleted successfully"
        });

    } catch (error) {
        console.log('Delete comment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Get Dashboard Statistics
export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Get counts
        const totalUsers = await User.countDocuments();
        const totalPosts = await Post.countDocuments();
        const lostItems = await Post.countDocuments({ 
            is_item_post: true, 
            item_type: 'lost' 
        });
        const foundItems = await Post.countDocuments({ 
            is_item_post: true, 
            item_type: 'found' 
        });
        const regularPosts = await Post.countDocuments({ 
            is_item_post: false 
        });

        // Get most active user (user with most posts)
        const mostActiveUser = await Post.aggregate([
            {
                $group: {
                    _id: '$user',
                    postCount: { $sum: 1 }
                }
            },
            {
                $sort: { postCount: -1 }
            },
            {
                $limit: 1
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            {
                $unwind: '$userInfo'
            },
            {
                $project: {
                    user: {
                        _id: '$userInfo._id',
                        full_name: '$userInfo.full_name',
                        username: '$userInfo.username',
                        profile_picture: '$userInfo.profile_picture'
                    },
                    postCount: 1
                }
            }
        ]);

        // Get most active faculty (faculty with most users)
        const mostActiveFaculty = await User.aggregate([
            {
                $match: { faculty: { $ne: null, $ne: '' } }
            },
            {
                $group: {
                    _id: '$faculty',
                    userCount: { $sum: 1 }
                }
            },
            {
                $sort: { userCount: -1 }
            },
            {
                $limit: 1
            }
        ]);

        // Get recent lost items for quick view
        const recentLostItems = await Post.find({ 
            is_item_post: true, 
            item_type: 'lost' 
        })
        .populate('user', 'full_name profile_picture faculty')
        .sort({ createdAt: -1 })
        .limit(5);

        // Get recent found items for quick view
        const recentFoundItems = await Post.find({ 
            is_item_post: true, 
            item_type: 'found' 
        })
        .populate('user', 'full_name profile_picture faculty')
        .sort({ createdAt: -1 })
        .limit(5);

        const stats = {
            totalUsers,
            totalPosts,
            lostItems,
            foundItems,
            regularPosts,
            mostActiveUser: mostActiveUser[0] || null,
            mostActiveFaculty: mostActiveFaculty[0] || null,
            recentLostItems,
            recentFoundItems,
            resolutionRate: foundItems > 0 ? 
                ((foundItems / (lostItems + foundItems)) * 100).toFixed(1) + '%' : 
                '0%'
        };

        res.json({ 
            success: true, 
            stats 
        });
    } catch (error) {
        console.log('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}