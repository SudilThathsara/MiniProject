import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import Loading from '../components/Loading'
import UserProfileInfo from '../components/UserProfileInfo'
import PostCard from '../components/PostCard'
import moment from 'moment'
import ProfileModal from '../components/ProfileModal'
import { useAuth } from '../context/AuthContext';
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useSelector, useDispatch } from 'react-redux'
import { MessageCircle, UserPlus, Check } from 'lucide-react'

const Profile = () => {
  const currentUser = useSelector((state) => state.user.value)
  const { getToken } = useAuth()
  const { profileId } = useParams()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [activeTab, setActiveTab] = useState('posts')
  const [showEdit, setShowEdit] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [connectionPending, setConnectionPending] = useState(false)
  const dispatch = useDispatch()

  const fetchUser = async (profileId) => {
    const token = await getToken()
    try {
      const { data } = await api.post(`/api/user/profiles`, {profileId}, {
        headers: {Authorization: `Bearer ${token}`}
      })
      if(data.success){
        setUser(data.profile)
        setPosts(data.posts)
        
        // Check connection status
        setIsConnected(currentUser?.connections.includes(data.profile._id))
        setIsFollowing(currentUser?.following.includes(data.profile._id))
        
        // Check if connection request is pending
        checkConnectionStatus(data.profile._id, token)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const checkConnectionStatus = async (targetUserId, token) => {
    try {
      
      const { data } = await api.get('/api/user/connections', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (data.success) {
        const pendingConnections = data.pendingConnections || []
        setConnectionPending(pendingConnections.some(conn => conn._id === targetUserId))
      }
    } catch (error) {
      console.log('Error checking connection status:', error)
    }
  }

  const handleFollow = async () => {
    try {
      const token = await getToken()
      const { data } = await api.post('/api/user/follow', {id: user._id}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (data.success) {
        toast.success(data.message)
        setIsFollowing(!isFollowing)
        // Update user data
        fetchUser(user._id)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleUnfollow = async () => {
    try {
      const token = await getToken()
      const { data } = await api.post('/api/user/unfollow', {id: user._id}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (data.success) {
        toast.success(data.message)
        setIsFollowing(false)
        // Update user data
        fetchUser(user._id)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleConnectionRequest = async () => {
    try {
      const token = await getToken()
      const { data } = await api.post('/api/user/connect', {id: user._id}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (data.success) {
        toast.success(data.message)
        setConnectionPending(true)
        // Refresh connection status
        checkConnectionStatus(user._id, token)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAcceptConnection = async () => {
    try {
      const token = await getToken()
      const { data } = await api.post('/api/user/accept', {id: user._id}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (data.success) {
        toast.success(data.message)
        setIsConnected(true)
        setConnectionPending(false)
        // Refresh user data
        fetchUser(user._id)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleSendMessage = () => {
    if (isConnected) {
      window.location.href = `/messages/${user._id}`
    } else {
      toast.error('You need to connect with this user first to send messages')
    }
  }

  useEffect(() => {
    if (profileId) {
      fetchUser(profileId)
    } else {
      fetchUser(currentUser._id)
    }
  }, [profileId, currentUser])

  // Check if this is the current user's profile or another user's profile
  const isOwnProfile = !profileId || profileId === currentUser._id

  return user ? (
    <div className='relative h-full overflow-y-scroll bg-gray-50 p-6'>
      <div className='max-w-3xl mx-auto'>
        {/* Profile Card */}
        <div className='bg-white rounded-2xl shadow overflow-hidden'>
          {/* Cover Photo */}
          <div className='h-40 md:h-56 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 relative'>
            {user.cover_photo && (
              <img src={user.cover_photo} alt='' className='w-full h-full object-cover'/>
            )}
            
            {/* Connection Status Badge */}
            {!isOwnProfile && (
              <div className="absolute top-4 right-4 flex gap-2">
                {isConnected && (
                  <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                    Connected
                  </span>
                )}
                {connectionPending && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-medium">
                    Request Pending
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* User Info */}
          <UserProfileInfo user={user} posts={posts} profileId={profileId} setShowEdit={setShowEdit}/>
          
          {/* Action Buttons for Other Users' Profiles */}
          {!isOwnProfile && (
            <div className="px-6 pb-6 border-t border-gray-200 pt-4">
              <div className="flex flex-wrap gap-3">
                {/* Message Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!isConnected}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    isConnected
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 cursor-pointer'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  {isConnected ? 'Send Message' : 'Connect to Message'}
                </button>

                {/* Follow/Unfollow Button */}
                {isFollowing ? (
                  <button
                    onClick={handleUnfollow}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Following
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </button>
                )}

                {/* Connection Request Button */}
                {!isConnected && !connectionPending && (
                  <button
                    onClick={handleConnectionRequest}
                    className="flex items-center gap-2 px-4 py-2 border border-indigo-500 text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Connect
                  </button>
                )}

                {/* Accept Connection Button (if they sent you a request) */}
                {connectionPending && !isConnected && (
                  <button
                    onClick={handleAcceptConnection}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Accept Request
                  </button>
                )}
              </div>

              {/* Connection Status Info */}
              <div className="mt-4 text-sm text-gray-600">
                {!isConnected && !connectionPending && (
                  <p>Connect with {user.full_name} to start messaging and see their full activity.</p>
                )}
                {connectionPending && (
                  <p>Your connection request is pending. You'll be able to message once {user.full_name} accepts.</p>
                )}
                {isConnected && (
                  <p>You're connected with {user.full_name}. You can message them and see their full activity.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className='mt-6'>
          <div className='bg-white rounded-xl shadow p-1 flex max-w-md mx-auto'>
            {["posts", "media", "likes"].map((tab) => (
              <button 
                onClick={() => setActiveTab(tab)} 
                key={tab} 
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Posts */}
          {activeTab === 'posts' && (
            <div className='mt-6 flex flex-col items-center gap-6'>
              {posts.length === 0 ? (
                <div className="text-center py-12 w-full bg-white rounded-lg shadow">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {isOwnProfile ? 'You have no posts yet' : `${user.full_name} has no posts yet`}
                  </h3>
                  <p className="text-gray-500">
                    {isOwnProfile 
                      ? 'Share your thoughts and experiences with your connections.' 
                      : `When ${user.full_name} creates posts, you'll see them here.`
                    }
                  </p>
                  {isOwnProfile && (
                    <Link 
                      to="/create-post"
                      className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition"
                    >
                      Create Your First Post
                    </Link>
                  )}
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard 
                    key={post._id} 
                    post={post} 
                    onDelete={(postId) => {
                      setPosts(posts.filter(p => p._id !== postId))
                    }}
                  />
                ))
              )}
            </div>
          )}

          {/* Media */}
          {activeTab === 'media' && (
            <div className='mt-6'>
              {posts.filter((post) => post.image_urls && post.image_urls.length > 0).length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {isOwnProfile ? 'You have no media yet' : `${user.full_name} has no media yet`}
                  </h3>
                  <p className="text-gray-500">
                    {isOwnProfile 
                      ? 'Photos and videos you share in your posts will appear here.' 
                      : `When ${user.full_name} shares media, you'll see it here.`
                    }
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {posts
                    .filter((post) => post.image_urls && post.image_urls.length > 0)
                    .map((post) => (
                      <div key={post._id} className="space-y-2">
                        {post.image_urls.map((image, index) => (
                          <Link 
                            target='_blank' 
                            to={image} 
                            key={index} 
                            className='block group relative rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow'
                          >
                            <img 
                              src={image} 
                              className='w-full h-48 object-cover group-hover:scale-105 transition duration-300' 
                              alt="" 
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition duration-300"></div>
                            <p className='absolute bottom-2 right-2 text-xs text-white bg-black bg-opacity-60 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition duration-300'>
                              Posted {moment(post.createdAt).fromNow()}
                            </p>
                          </Link>
                        ))}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          )}

          {/* Likes - You can implement this similarly */}
          {activeTab === 'likes' && (
            <div className="mt-6 text-center py-12 bg-white rounded-lg shadow">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {isOwnProfile ? 'Your liked posts' : `${user.full_name}'s liked posts`}
              </h3>
              <p className="text-gray-500">
                {isOwnProfile 
                  ? 'Posts you have liked will appear here.' 
                  : `Posts that ${user.full_name} has liked will appear here.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Profile Modal */}
      {showEdit && <ProfileModal setShowEdit={setShowEdit}/>}
    </div>
  ) : (
    <Loading />
  )
}

export default Profile