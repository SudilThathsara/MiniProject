import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar,
  Users,
  MessageSquare,
  Image as ImageIcon,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import moment from 'moment';

const AdminReports = () => {
  const { admin, getAdminToken } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: moment().format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
    itemType: 'all'
  });
  const [dailyReport, setDailyReport] = useState(null);
  const [itemsReport, setItemsReport] = useState(null);
  const [comprehensiveReport, setComprehensiveReport] = useState(null);

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    fetchDailyReport();
  }, [admin, navigate]);

  const fetchDailyReport = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      if (!token) {
        toast.error('Admin token not found. Please login again.');
        navigate('/admin/login');
        return;
      }

      const { data } = await api.get(`/api/admin/reports/daily?date=${filters.startDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        setDailyReport(data.report);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Daily report error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/admin/login');
      } else {
        toast.error('Failed to fetch daily report');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchItemsReport = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      if (!token) {
        toast.error('Admin token not found. Please login again.');
        navigate('/admin/login');
        return;
      }

      const queryParams = new URLSearchParams();
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.itemType !== 'all') queryParams.append('itemType', filters.itemType);

      const { data } = await api.get(`/api/admin/reports/items?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        setItemsReport(data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Items report error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/admin/login');
      } else {
        toast.error('Failed to fetch items report');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchComprehensiveReport = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      if (!token) {
        toast.error('Admin token not found. Please login again.');
        navigate('/admin/login');
        return;
      }

      const queryParams = new URLSearchParams();
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const { data } = await api.get(`/api/admin/reports/comprehensive?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        setComprehensiveReport(data.report);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Comprehensive report error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/admin/login');
      } else {
        toast.error('Failed to fetch comprehensive report');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'daily':
        fetchDailyReport();
        break;
      case 'items':
        fetchItemsReport();
        break;
      case 'comprehensive':
        fetchComprehensiveReport();
        break;
      default:
        break;
    }
  };

  const handleApplyFilters = () => {
    handleTabChange(activeTab);
  };

  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'items' && itemsReport) {
      filename = 'items-report';
      const headers = ['Type', 'Item Name', 'Description', 'Contact', 'Posted By', 'User Faculty', 'Location', 'Date'];
      const csvData = itemsReport.items.map(item => [
        item.item_type === 'lost' ? 'Lost' : 'Found',
        item.item_name,
        item.item_description,
        item.mobile_number,
        item.full_name,
        item.user?.faculty || 'N/A',
        item.address || 'N/A',
        moment(item.createdAt).format('YYYY-MM-DD HH:mm')
      ]);

      csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');
    } else if (activeTab === 'daily' && dailyReport) {
      filename = 'daily-report';
      const headers = ['Metric', 'Value'];
      const csvData = [
        ['New Users', dailyReport.summary.totalUsers],
        ['Total Posts', dailyReport.summary.totalPosts],
        ['Total Items', dailyReport.summary.totalItems],
        ['Lost Items', dailyReport.summary.lostItems],
        ['Found Items', dailyReport.summary.foundItems],
        ['Total Stories', dailyReport.summary.totalStories],
        ['Total Messages', dailyReport.summary.totalMessages]
      ];

      csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');
    }

    if (csvContent) {
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${moment().format('YYYY-MM-DD')}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } else {
      toast.error('No data to export');
    }
  };

  if (loading && !dailyReport && !itemsReport && !comprehensiveReport) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-3 border-purple-500 border-t-transparent animate-spin mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => handleTabChange('daily')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm ${
              activeTab === 'daily'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Daily Report
          </button>
          <button
            onClick={() => handleTabChange('items')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm ${
              activeTab === 'items'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Items Report
          </button>
          <button
            onClick={() => handleTabChange('comprehensive')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm ${
              activeTab === 'comprehensive'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Comprehensive Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="p-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="p-2 border border-gray-300 rounded-lg"
            />
          </div>
          {activeTab === 'items' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
              <select
                value={filters.itemType}
                onChange={(e) => setFilters({...filters, itemType: e.target.value})}
                className="p-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Items</option>
                <option value="lost">Lost Only</option>
                <option value="found">Found Only</option>
              </select>
            </div>
          )}
          <button
            onClick={handleApplyFilters}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Daily Report */}
      {activeTab === 'daily' && dailyReport && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Users</p>
                  <p className="text-2xl font-bold text-gray-900">{dailyReport.summary.totalUsers}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{dailyReport.summary.totalPosts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Lost & Found Items</p>
                  <p className="text-2xl font-bold text-gray-900">{dailyReport.summary.totalItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{dailyReport.summary.totalMessages}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Item Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Lost Items</span>
                  <span className="font-semibold text-red-600">{dailyReport.summary.lostItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Found Items</span>
                  <span className="font-semibold text-green-600">{dailyReport.summary.foundItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items with Contact</span>
                  <span className="font-semibold text-blue-600">{dailyReport.itemBreakdown?.withContact || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items with Images</span>
                  <span className="font-semibold text-purple-600">{dailyReport.itemBreakdown?.withImages || 0}</span>
                </div>
              </div>
            </div>

            {/* Faculty Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Faculty Distribution</h3>
              <div className="space-y-3">
                {dailyReport.facultyDistribution && dailyReport.facultyDistribution.length > 0 ? (
                  dailyReport.facultyDistribution.map((faculty, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-600">{faculty._id || 'Unknown'}</span>
                      <div className="flex gap-4">
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Total: {faculty.count}
                        </span>
                        <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                          Lost: {faculty.lost}
                        </span>
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                          Found: {faculty.found}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">No faculty data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Items Today</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faculty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyReport.recentItems && dailyReport.recentItems.length > 0 ? (
                    dailyReport.recentItems.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.item_type === 'lost' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.item_type === 'lost' ? 'Lost' : 'Found'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.item_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.mobile_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.user?.faculty || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {moment(item.createdAt).format('HH:mm')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No items found for today
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Items Report */}
      {activeTab === 'items' && itemsReport && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{itemsReport.stats?.total || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Lost Items</p>
                  <p className="text-2xl font-bold text-gray-900">{itemsReport.stats?.lost || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Found Items</p>
                  <p className="text-2xl font-bold text-gray-900">{itemsReport.stats?.found || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ImageIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">With Images</p>
                  <p className="text-2xl font-bold text-gray-900">{itemsReport.stats?.withImages || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posted By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faculty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {itemsReport.items && itemsReport.items.length > 0 ? (
                    itemsReport.items.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.item_type === 'lost' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.item_type === 'lost' ? 'Lost' : 'Found'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.item_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {item.item_description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.mobile_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.user?.faculty || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {moment(item.createdAt).format('MMM D, YYYY')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No items found for the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Report */}
      {activeTab === 'comprehensive' && comprehensiveReport && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{comprehensiveReport.overview?.totalUsers || 0}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{comprehensiveReport.overview?.totalPosts || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{comprehensiveReport.overview?.totalItems || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{comprehensiveReport.overview?.resolutionRate || '0%'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Most Active Faculty</span>
                  <span className="font-semibold text-indigo-600">{comprehensiveReport.insights?.mostActiveFaculty || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Most Common Item</span>
                  <span className="font-semibold text-indigo-600">{comprehensiveReport.insights?.mostCommonItem || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items with Contact Info</span>
                  <span className="font-semibold text-green-600">{comprehensiveReport.insights?.totalItemsWithContact || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items with Images</span>
                  <span className="font-semibold text-blue-600">{comprehensiveReport.insights?.totalItemsWithImages || 0}</span>
                </div>
              </div>
            </div>

            {/* Faculty Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Faculty Distribution</h3>
              <div className="space-y-3">
                {comprehensiveReport.facultyDistribution && comprehensiveReport.facultyDistribution.length > 0 ? (
                  comprehensiveReport.facultyDistribution.map((faculty, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-600">{faculty._id || 'Unknown'}</span>
                      <span className="font-semibold">{faculty.userCount} users</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">No faculty data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Popular Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Reports</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Found</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comprehensiveReport.popularItems && comprehensiveReport.popularItems.length > 0 ? (
                    comprehensiveReport.popularItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item._id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {item.lostCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {item.foundCount}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        No popular items data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!loading && !dailyReport && !itemsReport && !comprehensiveReport && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Data Available</h3>
          <p className="text-gray-500">There is no data available for the selected report type and filters.</p>
        </div>
      )}
    </div>
  );
};

export default AdminReports;