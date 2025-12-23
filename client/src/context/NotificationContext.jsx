import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user, getToken } = useAuth();
    const [notificationCounts, setNotificationCounts] = useState({
        feed: 0,
        messages: 0,
        connections: 0,
        total: 0
    });
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [eventSource, setEventSource] = useState(null);

    // Fetch notification counts
    const fetchNotificationCounts = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get('/api/notifications/counts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (data.success) {
                setNotificationCounts(data.counts);
            }
        } catch (error) {
            console.error('Error fetching notification counts:', error);
        }
    };

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const { data } = await api.get('/api/notifications?limit=20', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (data.success) {
                setNotifications(data.notifications);
                setNotificationCounts(prev => ({
                    ...prev,
                    total: data.unreadCount
                }));
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId, type) => {
        try {
            const token = await getToken();
            const { data } = await api.patch(`/api/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (data.success) {
                // Update local state - remove notification from list if read
                setNotifications(prev => 
                    prev.filter(notif => notif._id !== notificationId)
                );
                
                // Update counts - decrement the specific type count
                setNotificationCounts(prev => ({
                    ...prev,
                    [type]: Math.max(0, prev[type] - 1),
                    total: Math.max(0, prev.total - 1)
                }));
                
                return true;
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
        return false;
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const token = await getToken();
            const { data } = await api.patch('/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (data.success) {
                // Clear all notifications
                setNotifications([]);
                setNotificationCounts({
                    feed: 0,
                    messages: 0,
                    connections: 0,
                    total: 0
                });
                toast.success('All notifications marked as read');
                return true;
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
        return false;
    };

    // Setup SSE connection for real-time notifications
    useEffect(() => {
        if (!user) return;

        const setupSSE = () => {
            try {
                // Close existing connection
                if (eventSource) {
                    eventSource.close();
                }

                const newEventSource = new EventSource(
                    `http://localhost:4000/api/notifications/sse/${user._id}`
                );

                newEventSource.onopen = () => {
                    console.log('Notification SSE connection opened');
                };

                newEventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        
                        if (data.type === 'connected') {
                            console.log('Notification SSE connected successfully');
                            return;
                        }

                        if (data.type === 'new_notification' && data.notification) {
                            // Add new notification to list
                            setNotifications(prev => [data.notification, ...prev]);
                            
                            // Update counts
                            setNotificationCounts(prev => ({
                                ...prev,
                                [data.notification.type]: prev[data.notification.type] + 1,
                                total: prev.total + 1
                            }));

                            // Show toast notification
                            showNotificationToast(data.notification);
                        }
                    } catch (error) {
                        console.error('Error parsing SSE notification:', error);
                    }
                };

                newEventSource.onerror = (error) => {
                    console.error('Notification SSE error:', error);
                    
                    // Attempt reconnect after 3 seconds
                    setTimeout(() => {
                        if (user) {
                            setupSSE();
                        }
                    }, 3000);
                };

                setEventSource(newEventSource);
            } catch (error) {
                console.error('SSE setup error:', error);
            }
        };

        setupSSE();

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [user]);

    // Show toast notification
    const showNotificationToast = (notification) => {
        const getNotificationMessage = () => {
            switch (notification.type) {
                case 'post':
                    return `${notification.from_user?.full_name || 'Someone'} posted something new`;
                case 'message':
                    return `New message from ${notification.from_user?.full_name || 'Someone'}`;
                case 'connection':
                    return `${notification.from_user?.full_name || 'Someone'} wants to connect`;
                default:
                    return 'New notification';
            }
        };

        toast.custom((t) => (
            <div className={`max-w-md w-full bg-white shadow-lg rounded-lg flex border border-gray-300 ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
                <div className='flex-1 p-4'>
                    <div className='flex items-start'>
                        <img 
                            src={notification.from_user?.profile_picture || '/default-avatar.png'} 
                            alt="" 
                            className='h-10 w-10 rounded-full flex-shrink-0 mt-0.5'
                        />
                        <div className='ml-3 flex-1'>
                            <p className="text-sm font-medium text-gray-900">
                                {getNotificationMessage()}
                            </p>
                            <p className="text-sm text-gray-500">
                                {notification.text}
                            </p>
                        </div>
                    </div>
                </div>
                <div className='flex border-l border-gray-200'>
                    <button 
                        onClick={() => {
                            // Mark as read and dismiss toast
                            markAsRead(notification._id, notification.type);
                            toast.dismiss(t.id);
                        }}
                        className='p-4 text-indigo-600 font-semibold hover:bg-gray-50'
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        ));
    };

    // Initialize notifications on user login
    useEffect(() => {
        if (user) {
            fetchNotificationCounts();
            fetchNotifications();
        }
    }, [user]);

    const value = {
        notificationCounts,
        notifications,
        loading,
        fetchNotificationCounts,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        refreshCounts: fetchNotificationCounts
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};