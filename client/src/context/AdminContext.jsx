import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const savedAdmin = localStorage.getItem('admin');
      
      if (token && savedAdmin) {
        try {
          // Set the token for this request
          const { data } = await api.get('/api/admin/verify', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (data.success) {
            const adminData = data.admin;
            setAdmin(adminData);
            localStorage.setItem('admin', JSON.stringify(adminData));
          } else {
            logout();
          }
        } catch (error) {
          console.error('Error verifying admin token:', error);
          logout();
        }
      }
    } catch (error) {
      console.error('Admin auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/admin/login', { email, password });
      
      if (data.success && data.admin) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('admin', JSON.stringify(data.admin));
        setAdmin(data.admin);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Admin login failed. Please check your credentials.';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    setAdmin(null);
  };

  const getAdminToken = () => {
    return localStorage.getItem('adminToken');
  };

  const value = {
    admin,
    login,
    logout,
    getAdminToken,
    loading
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};