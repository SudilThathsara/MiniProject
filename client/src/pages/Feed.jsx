import React, { useEffect, useState } from 'react'
import Loading from '../components/Loading'
import StoriesBar from '../components/StoriesBar'
import PostCard from '../components/PostCard'
import RightSidebar from '../components/RightSidebar'
import { useAuth } from '../context/AuthContext';
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useNotifications } from '../context/NotificationContext'

const Feed = () => {
    const [feeds, setFeeds] = useState([])
    const [loading, setLoading] = useState(true)
    const { getToken } = useAuth()
    const { notificationCounts, refreshCounts, notifications, markAsRead } = useNotifications()

    const fetchFeeds = async () => {
        try {
            setLoading(true)
            const { data } = await api.get('/api/post/feed', { 
                headers: { Authorization: `Bearer ${await getToken()}` } 
            })

            if (data.success) {
                setFeeds(data.posts)
                
                // Mark all post notifications as read when feed loads
                const postNotifications = notifications.filter(n => n.type === 'post' && !n.read);
                for (const notification of postNotifications) {
                    await markAsRead(notification._id, 'post');
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
        setLoading(false)
    }

    const handlePostDelete = (postId) => {
        setFeeds(prev => prev.filter(post => post._id !== postId))
        toast.success('Post deleted successfully')
    }

    useEffect(() => {
        fetchFeeds()
        refreshCounts()
    }, [])

    return !loading ? (
        <div className='h-screen flex'>
            
            {/* Main Content Center - Hide Scrollbar */}
            <div className='flex-[2] overflow-y-auto no-scrollbar'>
                <div className='max-w-2xl mx-auto px-4 py-10'>
                    <StoriesBar />
                    <div className='space-y-6 pt-6'>
                        {feeds.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl shadow-sm p-8">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">No posts yet</h3>
                                <p className="text-gray-500 mb-4">
                                    Be the first to share something with the community!
                                </p>
                            </div>
                        ) : (
                            feeds.map((post) => (
                                <PostCard 
                                    key={post._id} 
                                    post={post} 
                                    onDelete={handlePostDelete}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
            
            {/* Right Sidebar - Custom Scrollbar */}
            <div className='flex-1 max-w-80 hidden xl:block'>
                <div className='sticky top-0 h-screen overflow-y-auto py-10 px-4 pr-6 custom-scrollbar'>
                    <RightSidebar />
                </div>
            </div>
        </div>
    ) : <Loading />
}

export default Feed