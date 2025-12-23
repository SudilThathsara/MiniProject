import React, { useEffect, useRef, useState } from 'react'
import { SendHorizonal, ImageIcon, Trash2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { addMessage, fetchMessages, resetMessages, setMessages } from '../features/messages/messagesSlice'
import toast from 'react-hot-toast'
import Loading from '../components/Loading'
import { useNotifications } from '../context/NotificationContext'


const ChatBox = () => {
    const { messages } = useSelector((state) => state.messages)
    const { userId } = useParams()
    const { user: currentUser, getToken } = useAuth()
    const dispatch = useDispatch()
    const { notifications, markAsRead } = useNotifications()

    const [text, setText] = useState('')
    const [image, setImage] = useState(null)
    const [user, setUser] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef(null)
    const eventSourceRef = useRef(null)

    const connections = useSelector((state) => state.connections.connections)

    useEffect(() => {
        if (userId) {
            const clearUserMessageNotifications = async () => {
                const userMessageNotifications = notifications.filter(n => 
                    n.type === 'message' && 
                    n.from_user?._id === userId && 
                    !n.read
                );
                for (const notification of userMessageNotifications) {
                    await markAsRead(notification._id, 'message');
                }
            };
            
            clearUserMessageNotifications();
        }
    }, [userId, notifications])
    
    // Fetch user messages
    const fetchUserMessages = async () => {
        try {
            const token = await getToken()
            await dispatch(fetchMessages({ token, userId })).unwrap()
        } catch (error) {
            toast.error('Failed to fetch messages: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    // Setup SSE connection for real-time messages
    const setupSSE = () => {
        if (!currentUser?._id) return

        // Close existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
        }

        try {
            eventSourceRef.current = new EventSource(
                `http://localhost:4000/api/message/${currentUser._id}`
            )

            eventSourceRef.current.onopen = () => {
                console.log('SSE connection opened')
                setIsConnected(true)
            }

            eventSourceRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    
                    if (data.type === 'connected') {
                        console.log('SSE connected successfully')
                        return
                    }

                    if (data.type === 'new_message' && data.message) {
                        // Only add message if it's from the current chat user
                        if (data.message.from_user_id._id === userId || 
                            data.message.to_user_id._id === userId) {
                            dispatch(addMessage(data.message))
                        }
                    }
                } catch (error) {
                    console.error('Error parsing SSE message:', error)
                }
            }

            eventSourceRef.current.onerror = (error) => {
                console.error('SSE error:', error)
                setIsConnected(false)
                
                // Attempt reconnect after 3 seconds
                setTimeout(() => {
                    if (currentUser?._id) {
                        setupSSE()
                    }
                }, 3000)
            }

        } catch (error) {
            console.error('SSE setup error:', error)
        }
    }

    // Send message
    const sendMessage = async () => {
        try {
            if (!text && !image) {
                toast.error('Please enter a message or select an image')
                return
            }

            const token = await getToken()
            const formData = new FormData()
            formData.append('to_user_id', userId)
            formData.append('text', text)
            if (image) {
                formData.append('image', image)
            }

            const { data } = await api.post('/api/message/send', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            })

            if (data.success) {
                setText('')
                setImage(null)
                // Message will be added via SSE or we can add directly
                if (data.message) {
                    dispatch(addMessage(data.message))
                }
            } else {
                throw new Error(data.message)
            }
        } catch (error) {
            toast.error('Failed to send message: ' + error.message)
        }
    }

    // Delete message
    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message?')) {
            return
        }

        try {
            const { data } = await api.delete(`/api/message/${messageId}`, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })

            if (data.success) {
                toast.success('Message deleted successfully')
                // Remove message from local state
                dispatch(setMessages(messages.filter(msg => msg._id !== messageId)))
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (userId) {
            setLoading(true)
            fetchUserMessages()
            setupSSE()
        }

        return () => {
            dispatch(resetMessages())
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
                eventSourceRef.current = null
            }
            setIsConnected(false)
        }
    }, [userId])

    useEffect(() => {
        if (connections.length > 0 && userId) {
            const foundUser = connections.find(connection => connection._id === userId)
            setUser(foundUser)
        }
    }, [connections, userId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    if (loading) {
        return <Loading height="100vh" />
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="text-center">
                    <div className="text-gray-400 mb-4">
                        <ImageIcon size={64} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">User not found</h3>
                    <p className="text-gray-500">The user you're trying to message doesn't exist or you're not connected.</p>
                    <button 
                        onClick={() => window.history.back()}
                        className="mt-4 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className='flex flex-col h-screen'>
            {/* Connection Status */}
            <div className={`text-xs px-4 py-1 text-center ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
                {isConnected ? 'Connected' : 'Reconnecting...'}
            </div>

            {/* Chat Header */}
            <div className='flex items-center gap-2 p-4 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300'>
                <img 
                    src={user.profile_picture || '/default-avatar.png'} 
                    alt={user.full_name} 
                    className="size-10 rounded-full object-cover"
                />
                <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
            </div>

            {/* Messages */}
            <div className='p-4 md:px-10 h-full overflow-y-auto flex-1'>
                <div className='space-y-4 max-w-4xl mx-auto'>
                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <SendHorizonal size={48} className="mx-auto" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No messages yet</h3>
                            <p className="text-gray-500">Start a conversation by sending a message!</p>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div key={message._id || index} className={`flex flex-col ${
                                message.from_user_id._id === currentUser._id ? 'items-end' : 'items-start'
                            } group relative`}>
                                <div className={`p-3 text-sm max-w-sm rounded-lg shadow ${
                                    message.from_user_id._id === currentUser._id 
                                        ? 'bg-indigo-500 text-white rounded-br-none' 
                                        : 'bg-white text-slate-700 rounded-bl-none'
                                }`}>
                                    {message.message_type === 'image' && message.media_url && (
                                        <img 
                                            src={message.media_url} 
                                            className='w-full max-w-sm rounded-lg mb-2' 
                                            alt="Message attachment" 
                                        />
                                    )}
                                    {message.text && <p>{message.text}</p>}
                                    <div className={`text-xs mt-1 ${
                                        message.from_user_id._id === currentUser._id 
                                            ? 'text-indigo-200' 
                                            : 'text-gray-500'
                                    }`}>
                                        {new Date(message.createdAt).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </div>
                                </div>
                                
                                {/* Delete button for user's own messages */}
                                {message.from_user_id._id === currentUser._id && (
                                    <button
                                        onClick={() => handleDeleteMessage(message._id)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        title="Delete message"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Message Input */}
            <div className='px-4 pb-4'>
                <div className='flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full'>
                    <input 
                        type="text" 
                        className='flex-1 outline-none text-slate-700 bg-transparent' 
                        placeholder='Type a message...'
                        onKeyDown={e => e.key === 'Enter' && sendMessage()} 
                        onChange={(e) => setText(e.target.value)} 
                        value={text} 
                    />

                    <label htmlFor="image" className="cursor-pointer">
                        {image ? (
                            <img src={URL.createObjectURL(image)} alt="Preview" className='h-8 rounded'/>
                        ) : (
                            <ImageIcon className='size-6 text-gray-400 hover:text-gray-600'/>
                        )}
                        <input 
                            type="file" 
                            id='image' 
                            accept="image/*" 
                            hidden 
                            onChange={(e) => {
                                const file = e.target.files[0]
                                if (file) {
                                    setImage(file)
                                }
                            }}
                        />
                    </label>

                    <button 
                        onClick={sendMessage} 
                        disabled={!text && !image}
                        className={`p-2 rounded-full ${
                            text || image 
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-800 text-white cursor-pointer' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        } active:scale-95 transition`}
                    >
                        <SendHorizonal size={18}/>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ChatBox