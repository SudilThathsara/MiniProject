import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import api from '../api/axios';

const NotificationBell = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const bellRef = useRef(null);
    const { 
        notificationCounts, 
        notifications, 
        loading, 
        markAsRead, 
        markAllAsRead,
        fetchNotifications 
    } = useNotifications();
    const navigate = useNavigate();

    // Calculate dropdown position
    const [dropdownPosition, setDropdownPosition] = useState({ top: '100%', right: 0 });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                bellRef.current && !bellRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update dropdown position when it opens
    useEffect(() => {
        if (showDropdown && bellRef.current) {
            const bellRect = bellRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            const spaceBelow = viewportHeight - bellRect.bottom;
            const dropdownHeight = 384; 
            
            if (spaceBelow < dropdownHeight) {
                setDropdownPosition({
                    top: `auto`,
                    bottom: `${bellRect.height + 8}px`,
                    right: 0
                });
            } else {
                setDropdownPosition({
                    top: `${bellRect.height + 8}px`,
                    bottom: 'auto',
                    right: 0
                });
            }
        }
    }, [showDropdown]);

    const handleNotificationClick = async (notification) => {
        // Mark as read
        await markAsRead(notification._id);
        
        // Navigate based on notification type
        switch (notification.type) {
            case 'post':
                navigate('/');
                break;
            case 'message':
                if (notification.from_user) {
                    navigate(`/messages/${notification.from_user._id}`);
                }
                break;
            case 'connection':
                navigate('/connections');
                break;
            default:
                break;
        }
        
        setShowDropdown(false);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'post':
                return '📝';
            case 'message':
                return '💬';
            case 'connection':
                return '🤝';
            default:
                return '🔔';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'post':
                return 'bg-blue-100 text-blue-800';
            case 'message':
                return 'bg-green-100 text-green-800';
            case 'connection':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="relative" ref={bellRef}>
            {/* Notification Bell Button */}
            <button
                ref={bellRef}
                onClick={() => {
                    setShowDropdown(!showDropdown);
                    if (!showDropdown) {
                        fetchNotifications();
                    }
                }}
                className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
            >
                <Bell className="w-5 h-5" />
                
                {/* Notification Badge */}
                {notificationCounts.total > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center">
                        <span className="relative flex h-5 w-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-red-500 text-xs text-white font-bold">
                                {notificationCounts.total > 9 ? '9+' : notificationCounts.total}
                            </span>
                        </span>
                    </span>
                )}
            </button>

            {/* Dropdown Menu - Match sidebar width (w-64 = 256px) */}
            {showDropdown && (
                <div 
                    ref={dropdownRef}
                    className="fixed xl:absolute w-60 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden"
                    style={{
                        top: dropdownPosition.top,
                        bottom: dropdownPosition.bottom,
                        right: dropdownPosition.right,
                        ...(window.innerWidth < 1280 ? {
                            right: '0.5rem',
                            left: '0.5rem',
                            margin: '0 auto',
                            width: 'calc(100vw - 1rem)',
                            maxWidth: '400px'
                        } : {})
                    }}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {notificationCounts.total > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                        <Check className="w-3 h-3 mr-1 inline" />
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowDropdown(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto max-h-64">
                        {loading ? (
                            <div className="p-4 text-center">
                                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No notifications yet</p>
                                <p className="text-xs text-gray-400 mt-1">New notifications will appear here</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {/* Icon */}
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)} flex-shrink-0`}>
                                                <span className="text-xs">{getNotificationIcon(notification.type)}</span>
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-medium text-gray-900 truncate">
                                                        {notification.from_user?.full_name || 'System'}
                                                    </p>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${getNotificationColor(notification.type)} flex-shrink-0 ml-1`}>
                                                        {notification.type}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-0.5 truncate">
                                                    {notification.text}
                                                </p>
                                                {notification.metadata?.preview && (
                                                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                        "{notification.metadata.preview.slice(0, 30)}..."
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {moment(notification.createdAt).fromNow()}
                                                </p>
                                            </div>
                                            
                                            {/* Unread indicator */}
                                            {!notification.read && (
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-2 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={() => {
                                navigate('/connections');
                                setShowDropdown(false);
                            }}
                            className="w-full text-center text-xs text-indigo-600 hover:text-indigo-800 font-medium py-1"
                        >
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;