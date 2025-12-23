import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Trash2, Image, MessageCircle, Heart } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import moment from 'moment';

const AdminPosts = () => {
  const { admin } = useAdmin();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    fetchPosts();
  }, [admin, navigate]);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await api.get('/api/admin/posts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(postId);
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await api.delete(`/api/admin/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        toast.success('Post deleted successfully');
        setPosts(posts.filter(post => post._id !== postId));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete post');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await api.delete(`/api/admin/posts/${postId}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        toast.success('Comment deleted successfully');
        fetchPosts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  const filteredPosts = posts.filter(post =>
    post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-3 border-purple-500 border-t-transparent animate-spin mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Posts ({posts.length})</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search posts..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={post.user?.profile_picture || '/default-avatar.png'}
                    alt={post.user?.full_name}
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {post.user?.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{post.user?.username} • {moment(post.createdAt).fromNow()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePost(post._id)}
                  disabled={deleteLoading === post._id}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                >
                  {deleteLoading === post._id ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              {post.content && (
                <p className="text-gray-800 mb-4 whitespace-pre-line">{post.content}</p>
              )}

              {post.image_urls && post.image_urls.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {post.image_urls.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      className={`rounded-lg ${post.image_urls.length === 1 ? 'col-span-2' : ''}`}
                      alt="Post content"
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{post.likes_count?.length || 0} likes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments?.length || 0} comments</span>
                </div>
              </div>

              {post.comments && post.comments.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Comments:</h4>
                  <div className="space-y-2">
                    {post.comments.map((comment) => (
                      <div key={comment._id} className="flex items-start justify-between bg-gray-50 rounded-lg p-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            User ID: {comment.user}
                          </div>
                          <p className="text-sm text-gray-700">{comment.text}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            {moment(comment.createdAt).fromNow()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(post._id, comment._id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
            No posts found
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPosts;