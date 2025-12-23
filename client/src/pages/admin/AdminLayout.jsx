import React from 'react';
import AdminDashboard from './AdminDashboard';

const AdminLayout = ({ children }) => {
  return (
    <AdminDashboard>
      {children}
    </AdminDashboard>
  );
};

export default AdminLayout;