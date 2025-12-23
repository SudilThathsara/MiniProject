import React, { useState } from 'react'
import { Heart, MessageCircle, Share2, Send } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const PostActions = ({ post }) => {
    const [likes, setLikes] = useState(post.likes_count || [])
    const [showMessageInput, setShowMessageInput] = useState(false)
    const [messageText, setMessageText] = useState('')
    const currentUser = useSelector((state) => state.user.value)
    const { getToken } = useAuth()
    const navigate = useNavigate()

    const handleLike = async () => {
        try {
            const { data } = await api.post(`/api/post/like`, { postId: post._id }, { 
                headers: { Authorization: `Bearer ${await getToken()}` } 
            })

            if (data.success) {
                setLikes(prev => {
                    if (prev.includes(currentUser._id)) {
                        return prev.filter(id => id !== currentUser._id)
                    } else {
                        return [...prev, currentUser._id]
                    }
                })
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleSendMessage = async () => {
        if (!messageText.trim()) {
            toast.error('Please enter a message')
            return
        }

        try {
            const { data } = await api.post('/api/message/send', {
                to_user_id: post.user._id,
                text: messageText
            }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })

            if (data.success) {
                toast.success('Message sent successfully!')
                setMessageText('')
                setShowMessageInput(false)
                // Navigate to messages page
                navigate(`/messages/${post.user._id}`)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const isConnected = currentUser?.connections.includes(post.user._id)
    const isOwner = currentUser._id === post.user._id

    return (
        <div className='flex items-center gap-4 text-gray-600 text-sm pt-2 border-t border-gray-300'>
            <div className='flex items-center gap-1'>
                <Heart 
                    className={`w-4 h-4 cursor-pointer ${likes.includes(currentUser._id) ? 'text-red-500 fill-red-500' : ''}`} 
                    onClick={handleLike}
                />
                <span>{likes.length}</span>
            </div>
            
            {/* Message Button - Only show if not the post owner and connected */}
            {!isOwner && (
                <div className='flex items-center gap-1 relative'>
                    <MessageCircle 
                        className="w-4 h-4 cursor-pointer" 
                        onClick={() => {
                            if (isConnected) {
                                setShowMessageInput(!showMessageInput)
                            } else {
                                toast.error('You need to connect with this user first')
                            }
                        }}
                    />
                    <span>Message</span>
                    
                    {/* Message Input Popup */}
                    {showMessageInput && (
                        <div className="absolute bottom-8 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 min-w-64">
                            <div className="flex items-center gap-2 mb-2">
                                <img 
                                    src={post.user.profile_picture} 
                                    alt="" 
                                    className="w-6 h-6 rounded-full" 
                                />
                                <span className="text-sm font-medium">Message {post.user.full_name}</span>
                            </div>
                            <textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Type your message..."
                                className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                                rows="3"
                            />
                            <div className="flex justify-between items-center mt-2">
                                <button
                                    onClick={() => setShowMessageInput(false)}
                                    className="text-gray-500 text-sm hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    className="flex items-center gap-1 bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600"
                                >
                                    <Send className="w-3 h-3" />
                                    Send
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            <div className='flex items-center gap-1'>
                <Share2 className="w-4 h-4"/>
                <span>Share</span>
            </div>
        </div>
    )
}

export default PostActions