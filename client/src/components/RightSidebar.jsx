import React, { useEffect, useState } from 'react';
import { Users, FileText, MapPin, TrendingUp, User, Award, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import moment from 'moment';
import { assets } from '../assets/assets';
import RecentMessages from './RecentMessages';

const RightSidebar = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { getToken } = useAuth();

    const fetchStats = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/api/post/stats', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            
            if (data.success) {
                setStats(data.stats);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('Failed to load dashboard stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 300000);
        return () => clearInterval(interval);
    }, []);

    const StatCard = ({ icon: Icon, label, value, color, loading }) => (
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500">{label}</p>
                    {loading ? (
                        <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mt-1"></div>
                    ) : (
                        <p className="text-lg font-bold text-gray-800">{value}</p>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className='space-y-6'>
            {/* Sponsored Section */}
            <div className='bg-white text-xs p-4 rounded-lg shadow-sm border border-gray-200'>
                <h3 className='text-slate-800 font-semibold text-sm mb-2'>Notice</h3>
                <img 
                    src={assets.sponsored_img} 
                    className='w-full h-32 rounded-md object-cover mb-2'
                    alt="Sponsored content" 
                />
                <p className='text-slate-600 text-xs'>Notice Board</p>
                <p className='text-slate-400 text-xs mt-1'>
                    Boost your marketing efficiency with a results-driven, user-friendly platform.
                </p>
            </div>

            {/* Dashboard Statistics */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
                <div className="p-4 border-b border-gray-100">
                    <h3 className='text-slate-800 font-semibold text-sm flex items-center gap-2'>
                        <TrendingUp className="w-4 h-4" />
                        FindBack Dashboard
                    </h3>
                    <p className='text-xs text-gray-500 mt-1'>Platform statistics and insights</p>
                </div>

                <div className="p-4 space-y-4">
                    {/* Overall Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard
                            icon={Users}
                            label="Total Users"
                            value={stats?.totalUsers || 0}
                            color="bg-blue-500"
                            loading={loading}
                        />
                        <StatCard
                            icon={FileText}
                            label="Total Posts"
                            value={stats?.totalPosts || 0}
                            color="bg-green-500"
                            loading={loading}
                        />
                    </div>

                    {/* Item Posts Breakdown */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Lost & Found Items
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span className="text-xs text-gray-600">Lost Items</span>
                                </div>
                                {loading ? (
                                    <div className="h-3 w-6 bg-gray-200 rounded animate-pulse"></div>
                                ) : (
                                    <span className="font-semibold text-red-600 text-sm">{stats?.lostItems || 0}</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="text-xs text-gray-600">Found Items</span>
                                </div>
                                {loading ? (
                                    <div className="h-3 w-6 bg-gray-200 rounded animate-pulse"></div>
                                ) : (
                                    <span className="font-semibold text-green-600 text-sm">{stats?.foundItems || 0}</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span className="text-xs text-gray-600">Regular Posts</span>
                                </div>
                                {loading ? (
                                    <div className="h-3 w-6 bg-gray-200 rounded animate-pulse"></div>
                                ) : (
                                    <span className="font-semibold text-blue-600 text-sm">{stats?.regularPosts || 0}</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <span className="text-xs font-medium text-gray-700">Resolution Rate</span>
                                {loading ? (
                                    <div className="h-3 w-8 bg-gray-200 rounded animate-pulse"></div>
                                ) : (
                                    <span className="font-semibold text-purple-600 text-xs">{stats?.resolutionRate || '0%'}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Most Active User */}
                    {stats?.mostActiveUser && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                            <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                                <Award className="w-3 h-3 text-blue-500" />
                                Most Active User
                            </h4>
                            <div className="flex items-center gap-2">
                                <img 
                                    src={stats.mostActiveUser.user.profile_picture || '/default-avatar.png'} 
                                    alt={stats.mostActiveUser.user.full_name}
                                    className="w-8 h-8 rounded-full border-2 border-white shadow"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-xs truncate">
                                        {stats.mostActiveUser.user.full_name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        @{stats.mostActiveUser.user.username}
                                    </p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <FileText className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-600">
                                            {stats.mostActiveUser.postCount} posts
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Most Active Faculty */}
                    {stats?.mostActiveFaculty && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                            <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-green-500" />
                                Most Active Faculty
                            </h4>
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">
                                        {stats.mostActiveFaculty._id}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {stats.mostActiveFaculty.userCount} active users
                                    </p>
                                </div>
                                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                                    Top Faculty
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Activity */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-medium text-gray-700 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Recent Activity
                        </h4>
                        
                        {/* Recent Lost Items */}
                        {stats?.recentLostItems && stats.recentLostItems.length > 0 && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-red-500" />
                                    <span className="text-xs font-medium text-gray-600">Recent Lost Items</span>
                                </div>
                                <div className="space-y-1">
                                    {stats.recentLostItems.slice(0, 2).map((item, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded hover:bg-red-100 transition-colors">
                                            <img 
                                                src={item.user?.profile_picture || '/default-avatar.png'} 
                                                alt=""
                                                className="w-5 h-5 rounded-full"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-800 truncate">
                                                    {item.item_name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {moment(item.createdAt).fromNow()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Found Items */}
                        {stats?.recentFoundItems && stats.recentFoundItems.length > 0 && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    <span className="text-xs font-medium text-gray-600">Recent Found Items</span>
                                </div>
                                <div className="space-y-1">
                                    {stats.recentFoundItems.slice(0, 2).map((item, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded hover:bg-green-100 transition-colors">
                                            <img 
                                                src={item.user?.profile_picture || '/default-avatar.png'} 
                                                alt=""
                                                className="w-5 h-5 rounded-full"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-800 truncate">
                                                    {item.item_name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {moment(item.createdAt).fromNow()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Messages */}
            <div className='bg-white p-4 rounded-lg shadow-sm text-xs text-slate-800 border border-gray-200'>
                <h3 className='font-semibold text-slate-800 text-sm mb-3'>Recent Messages</h3>
                <div className='space-y-2 max-h-48 overflow-y-auto custom-scrollbar'>
                    <RecentMessages />
                </div>
            </div>
        </div>
    );
};

export default RightSidebar;