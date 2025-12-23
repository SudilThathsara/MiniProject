import User from '../models/User.js';
import Post from '../models/Post.js';
import Story from '../models/Story.js';
import Message from '../models/Message.js';
import Connection from '../models/Connection.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalStories = await Story.countDocuments();
    const totalMessages = await Message.countDocuments();
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const activeUsers = await User.countDocuments({
      $or: [
        { createdAt: { $gte: sevenDaysAgo } },
        { 
          _id: { 
            $in: await Post.distinct('user', { 
              createdAt: { $gte: sevenDaysAgo } 
            }) 
          } 
        }
      ]
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPosts,
        totalStories,
        totalMessages,
        newUsers,
        activeUsers
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userId === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await Post.deleteMany({ user: userId });
    await Story.deleteMany({ user: userId });
    await Message.deleteMany({ 
      $or: [
        { from_user_id: userId },
        { to_user_id: userId }
      ]
    });
    await Connection.deleteMany({
      $or: [
        { from_user_id: userId },
        { to_user_id: userId }
      ]
    });

    await User.updateMany(
      { followers: userId },
      { $pull: { followers: userId } }
    );
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );
    await User.updateMany(
      { connections: userId },
      { $pull: { connections: userId } }
    );

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate('user', 'full_name username profile_picture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Get all posts error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await Post.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    post.comments = post.comments.filter(
      comment => comment._id.toString() !== commentId
    );

    await post.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllStories = async (req, res) => {
  try {
    const stories = await Story.find()
      .populate('user', 'full_name username profile_picture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      stories
    });
  } catch (error) {
    console.error('Get all stories error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    await Story.findByIdAndDelete(storyId);

    res.json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, permissions } = req.body;

    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can update user roles'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    user.permissions = permissions || [];
    
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: {
        _id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can view all admins'
      });
    }

    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      admins
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Generate Lost/Found Items Report
export const generateItemsReport = async (req, res) => {
  try {
    const { startDate, endDate, itemType } = req.query;
    
    let filter = { is_item_post: true };
    
    if (itemType && itemType !== 'all') {
      filter.item_type = itemType;
    }
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const items = await Post.find(filter)
      .populate('user', 'full_name username email faculty')
      .sort({ createdAt: -1 });

    const stats = {
      total: items.length,
      lost: items.filter(item => item.item_type === 'lost').length,
      found: items.filter(item => item.item_type === 'found').length,
      withImages: items.filter(item => item.image_urls && item.image_urls.length > 0).length,
      today: items.filter(item => {
        const today = new Date();
        const itemDate = new Date(item.createdAt);
        return itemDate.toDateString() === today.toDateString();
      }).length,
      thisWeek: items.filter(item => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(item.createdAt) >= oneWeekAgo;
      }).length
    };

    res.json({
      success: true,
      items,
      stats,
      reportPeriod: {
        startDate: startDate || 'Beginning',
        endDate: endDate || 'Now'
      }
    });
  } catch (error) {
    console.error('Generate items report error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Generate Daily Overall Reports
export const generateDailyReports = async (req, res) => {
  try {
    const { date } = req.query;
    
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get daily stats
    const dailyUsers = await User.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const dailyPosts = await Post.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const dailyItems = await Post.countDocuments({
      is_item_post: true,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const dailyStories = await Story.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const dailyMessages = await Message.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // Get item breakdown
    const lostItems = await Post.countDocuments({
      is_item_post: true,
      item_type: 'lost',
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const foundItems = await Post.countDocuments({
      is_item_post: true,
      item_type: 'found',
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // Get faculty-wise distribution for items
    const facultyItems = await Post.aggregate([
      {
        $match: {
          is_item_post: true,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      {
        $unwind: '$userData'
      },
      {
        $group: {
          _id: '$userData.faculty',
          count: { $sum: 1 },
          lost: {
            $sum: { $cond: [{ $eq: ['$item_type', 'lost'] }, 1, 0] }
          },
          found: {
            $sum: { $cond: [{ $eq: ['$item_type', 'found'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get recent items for the day
    const recentItems = await Post.find({
      is_item_post: true,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
    .populate('user', 'full_name username faculty')
    .sort({ createdAt: -1 })
    .limit(20);

    const report = {
      date: targetDate.toDateString(),
      summary: {
        totalUsers: dailyUsers,
        totalPosts: dailyPosts,
        totalItems: dailyItems,
        totalStories: dailyStories,
        totalMessages: dailyMessages,
        lostItems,
        foundItems
      },
      facultyDistribution: facultyItems,
      recentItems,
      itemBreakdown: {
        lost: lostItems,
        found: foundItems,
        withContact: await Post.countDocuments({
          is_item_post: true,
          mobile_number: { $exists: true, $ne: '' },
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }),
        withImages: await Post.countDocuments({
          is_item_post: true,
          image_urls: { $exists: true, $ne: [] },
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        })
      }
    };

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Generate daily reports error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Generate Comprehensive Report
export const generateComprehensiveReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Overall statistics
    const totalUsers = await User.countDocuments(dateFilter);
    const totalPosts = await Post.countDocuments(dateFilter);
    const totalItems = await Post.countDocuments({ ...dateFilter, is_item_post: true });
    const totalStories = await Story.countDocuments(dateFilter);
    const totalMessages = await Message.countDocuments(dateFilter);

    // Item statistics
    const lostItems = await Post.countDocuments({ 
      ...dateFilter, 
      is_item_post: true, 
      item_type: 'lost' 
    });
    
    const foundItems = await Post.countDocuments({ 
      ...dateFilter, 
      is_item_post: true, 
      item_type: 'found' 
    });

    // Faculty distribution
    const facultyDistribution = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$faculty',
          userCount: { $sum: 1 }
        }
      },
      { $sort: { userCount: -1 } }
    ]);

    // Popular items
    const popularItems = await Post.aggregate([
      {
        $match: { ...dateFilter, is_item_post: true }
      },
      {
        $group: {
          _id: '$item_name',
          count: { $sum: 1 },
          lostCount: {
            $sum: { $cond: [{ $eq: ['$item_type', 'lost'] }, 1, 0] }
          },
          foundCount: {
            $sum: { $cond: [{ $eq: ['$item_type', 'found'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Daily activity
    const dailyActivity = await Post.aggregate([
      {
        $match: { ...dateFilter, is_item_post: true }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          lost: {
            $sum: { $cond: [{ $eq: ['$item_type', 'lost'] }, 1, 0] }
          },
          found: {
            $sum: { $cond: [{ $eq: ['$item_type', 'found'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const comprehensiveReport = {
      period: {
        startDate: startDate || 'Beginning',
        endDate: endDate || 'Now'
      },
      overview: {
        totalUsers,
        totalPosts,
        totalItems,
        totalStories,
        totalMessages,
        lostItems,
        foundItems,
        resolutionRate: foundItems > 0 ? ((foundItems / (lostItems + foundItems)) * 100).toFixed(2) + '%' : '0%'
      },
      facultyDistribution,
      popularItems,
      dailyActivity,
      insights: {
        mostActiveFaculty: facultyDistribution[0]?._id || 'N/A',
        mostCommonItem: popularItems[0]?._id || 'N/A',
        totalItemsWithContact: await Post.countDocuments({
          ...dateFilter,
          is_item_post: true,
          mobile_number: { $exists: true, $ne: '' }
        }),
        totalItemsWithImages: await Post.countDocuments({
          ...dateFilter,
          is_item_post: true,
          image_urls: { $exists: true, $ne: [] }
        })
      }
    };

    res.json({
      success: true,
      report: comprehensiveReport
    });
  } catch (error) {
    console.error('Generate comprehensive report error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};