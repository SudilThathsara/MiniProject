import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useNavigate } from 'react-router-dom';
import { Image, Trash2, Play, Type } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import moment from 'moment';

const AdminStories = () => {
  const { admin } = useAdmin();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    fetchStories();
  }, [admin, navigate]);

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await api.get('/api/admin/stories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setStories(data.stories);
      }
    } catch (error) {
      toast.error('Failed to fetch stories');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(storyId);
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await api.delete(`/api/admin/stories/${storyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        toast.success('Story deleted successfully');
        setStories(stories.filter(story => story._id !== storyId));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete story');
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-3 border-purple-500 border-t-transparent animate-spin mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Stories ({stories.length})</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <div key={story._id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative">
                {story.media_type === 'text' ? (
                  <div 
                    className="h-48 flex items-center justify-center text-white text-lg font-medium p-4 text-center"
                    style={{ backgroundColor: story.background_color || '#4f46e5' }}
                  >
                    <Type className="w-8 h-8 mr-2" />
                    {story.content}
                  </div>
                ) : story.media_type === 'image' ? (
                  <div className="h-48 relative">
                    <img
                      src={story.media_url}
                      alt="Story content"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <Image className="w-8 h-8 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="h-48 relative">
                    <video
                      src={story.media_url}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => handleDeleteStory(story._id)}
                  disabled={deleteLoading === story._id}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading === story._id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <img
                    className="h-8 w-8 rounded-full"
                    src={story.user?.profile_picture || '/default-avatar.png'}
                    alt={story.user?.full_name}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {story.user?.full_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      @{story.user?.username}
                    </div>
                  </div>
                </div>

                {story.content && story.media_type !== 'text' && (
                  <p className="text-sm text-gray-700 mb-2 truncate">
                    {story.content}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="capitalize">{story.media_type}</span>
                  <span>{moment(story.createdAt).fromNow()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {stories.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
            No stories found
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStories;