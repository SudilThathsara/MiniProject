import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Image, 
  MessageSquare, 
  UserPlus, 
  Activity,
  LogOut,
  Menu,
  X,
  Shield,
  BarChart3
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    
    // Only fetch dashboard stats if we're on the dashboard page
    if (location.pathname === '/admin/dashboard') {
      fetchDashboardStats();
    } else {
      setLoading(false);
    }
  }, [admin, navigate, location]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await api.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/admin/dashboard', 
      icon: Activity,
      permission: null
    },
    { 
      name: 'Users', 
      path: '/admin/users', 
      icon: Users,
      permission: 'users'
    },
    { 
      name: 'Posts', 
      path: '/admin/posts', 
      icon: FileText,
      permission: 'posts'
    },
    { 
      name: 'Stories', 
      path: '/admin/stories', 
      icon: Image,
      permission: 'stories'
    },
    { 
      name: 'Reports', 
      path: '/admin/reports', 
      icon: BarChart3, 
      permission: 'posts'
    },
    { 
      name: 'Admin Management', 
      path: '/admin/admins', 
      icon: Shield,
      permission: null,
      superAdmin: true
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  // Check if admin has specific permission
  const hasPermission = (permission) => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;
    if (admin.role === 'admin') return admin.permissions?.includes(permission);
    return false;
  };

  // Get current page title based on route
  const getPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.name : 'Dashboard';
  };

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-indigo-900 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition duration-300 ease-in-out`}>
        <div className="flex items-center justify-between h-16 px-4 bg-black">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="mt-8">
          {menuItems.map((item) => {
            if (item.superAdmin && admin.role !== 'super_admin') return null;
            if (item.permission && !hasPermission(item.permission)) return null;
            
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center px-6 py-3 transition ${
                  isActive 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon size={20} className="mr-3" />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-white font-medium">{admin.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{admin.role}</p>
              {admin.role === 'admin' && (
                <p className="text-xs text-gray-400">
                  Permissions: {admin.permissions?.join(', ')}
                </p>
              )}
            </div>
            <Shield className="text-green-400" size={16} />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded transition"
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Shield size={16} />
                <span className="capitalize">{admin.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {/* Render the child component based on route */}
          <Outlet />
          
          {/* Show dashboard content only when on dashboard route and no child component */}
          {location.pathname === '/admin/dashboard' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {admin.full_name}!
                </h1>
                <p className="text-gray-600">
                  {admin.role === 'super_admin' 
                    ? 'You have full administrative access.' 
                    : 'Here\'s what\'s happening with your platform.'
                  }
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : stats && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Users</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <FileText className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Posts</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Image className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Stories</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalStories}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <MessageSquare className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Messages</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        {hasPermission('users') && (
                          <button
                            onClick={() => navigate('/admin/users')}
                            className="w-full flex items-center p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Users className="w-5 h-5 text-gray-600 mr-3" />
                            <span>Manage Users</span>
                          </button>
                        )}
                        {hasPermission('posts') && (
                          <button
                            onClick={() => navigate('/admin/posts')}
                            className="w-full flex items-center p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                          >
                            <FileText className="w-5 h-5 text-gray-600 mr-3" />
                            <span>Manage Posts</span>
                          </button>
                        )}
                        {hasPermission('stories') && (
                          <button
                            onClick={() => navigate('/admin/stories')}
                            className="w-full flex items-center p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Image className="w-5 h-5 text-gray-600 mr-3" />
                            <span>Manage Stories</span>
                          </button>
                        )}
                        {hasPermission('posts') && (
                          <button
                            onClick={() => navigate('/admin/reports')}
                            className="w-full flex items-center p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                          >
                            <BarChart3 className="w-5 h-5 text-gray-600 mr-3" />
                            <span>View Reports</span>
                          </button>
                        )}
                        {admin.role === 'super_admin' && (
                          <button
                            onClick={() => navigate('/admin/admins')}
                            className="w-full flex items-center p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Shield className="w-5 h-5 text-gray-600 mr-3" />
                            <span>Manage Admins</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <UserPlus className="w-5 h-5 text-green-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium">{stats.newUsers} new users</p>
                            <p className="text-xs text-gray-500">Last 7 days</p>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Activity className="w-5 h-5 text-blue-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium">{stats.activeUsers} active users</p>
                            <p className="text-xs text-gray-500">Last 7 days</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;