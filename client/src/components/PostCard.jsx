import React, { useState } from 'react'
import { BadgeCheck, MoreVertical, MapPin, Phone, User, Trash2 } from 'lucide-react'
import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux';
import PostActions from './PostActions'
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PostCard = ({ post, onDelete }) => {
  const postWithHashtags = post.content ? post.content.replace(/(#\w+)/g, '<span class="text-indigo-600">$1</span>') : ''
  const [showMenu, setShowMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const currentUser = useSelector((state) => state.user.value)
  const { getToken } = useAuth()
  const navigate = useNavigate()

  const isOwner = currentUser._id === post.user._id

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setDeleting(true)
    try {
      const token = await getToken()
      const { data } = await api.delete(`/api/post/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        toast.success('Post deleted successfully')
        if (onDelete) {
          onDelete(postId)
        }
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Delete post error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete post')
    }
    setDeleting(false)
    setShowMenu(false)
  }

  return (
    <div className='bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl relative'>
      {/* User Info */}
      <div className='flex items-center justify-between'>
        <div 
          onClick={() => navigate('/profile/' + post.user._id)} 
          className='inline-flex items-center gap-3 cursor-pointer flex-1'
        >
          <img src={post.user.profile_picture} alt="" className='w-10 h-10 rounded-full shadow'/>
          <div className="flex-1">
            <div className='flex items-center space-x-1'>
              <span className="font-semibold">{post.user.full_name}</span>
              <BadgeCheck className='w-4 h-4 text-blue-500'/>
            </div>
            <div className='text-gray-500 text-sm'>
              @{post.user.username} • {moment(post.createdAt).fromNow()}
            </div>
          </div>
        </div>

        {/* More options menu - Only show for post owner */}
        {isOwner && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              disabled={deleting}
              className="p-1 rounded-full hover:bg-gray-100 transition disabled:opacity-50"
            >
              {deleting ? (
                <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <MoreVertical className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {showMenu && !deleting && (
              <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg py-2 z-10 min-w-32">
                <button
                  onClick={() => handleDeletePost(post._id)}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Post Badge */}
      {post.is_item_post && (
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          post.item_type === 'lost' 
            ? 'bg-red-100 text-red-800 border border-red-200' 
            : 'bg-green-100 text-green-800 border border-green-200'
        }`}>
          {post.item_type === 'lost' ? ' Lost Item' : 'Found Item'}
        </div>
      )}

      {/* Item Details */}
      {post.is_item_post && (
        <div className='bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-200'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <User className='w-4 h-4 text-gray-600' />
                <div>
                  <label className='text-sm font-medium text-gray-600'>Posted by:</label>
                  <p className='font-semibold'>{post.full_name}</p>
                </div>
              </div>
              
              <div className='flex items-center gap-2'>
                <Phone className='w-4 h-4 text-gray-600' />
                <div>
                  <label className='text-sm font-medium text-gray-600'>Contact:</label>
                  <p className='font-semibold text-indigo-600'>{post.mobile_number}</p>
                </div>
              </div>
            </div>

            <div className='space-y-3'>
              {post.address && (
                <div className='flex items-center gap-2'>
                  <MapPin className='w-4 h-4 text-gray-600' />
                  <div>
                    <label className='text-sm font-medium text-gray-600'>Location:</label>
                    <p className='text-gray-800'>{post.address}</p>
                  </div>
                </div>
              )}
              
              <div>
                <label className='text-sm font-medium text-gray-600'>Item:</label>
                <p className='font-semibold text-lg text-gray-900'>{post.item_name}</p>
              </div>
            </div>
          </div>
          
          <div>
            <label className='text-sm font-medium text-gray-600'>Description:</label>
            <p className='text-gray-800 whitespace-pre-line mt-1 bg-white p-3 rounded border'>{post.item_description}</p>
          </div>
        </div>
      )}

      {/* Regular Content */}
      {post.content && !post.is_item_post && (
        <div 
          className='text-gray-800 text-sm whitespace-pre-line' 
          dangerouslySetInnerHTML={{ __html: postWithHashtags }} 
        />
      )}

      {/* Images */}
      {post.image_urls && post.image_urls.length > 0 && (
        <div className={`grid gap-2 ${post.image_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.image_urls.map((img, index) => (
            <img 
              src={img} 
              key={index} 
              className={`w-full object-cover rounded-lg ${post.image_urls.length === 1 ? 'h-96' : 'h-48'}`} 
              alt="" 
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <PostActions post={post} />
    </div>
  )
}

export default PostCard