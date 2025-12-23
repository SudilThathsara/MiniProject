import React, { useRef, useEffect } from 'react'
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Feed from './pages/Feed'
import Messages from './pages/Messages'
import ChatBox from './pages/ChatBox'
import Connections from './pages/Connections'
import Discover from './pages/Discover'
import Profile from './pages/Profile'
import CreatePost from './pages/CreatePost'
import Layout from './pages/Layout'
import toast, {Toaster} from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from './context/AuthContext'
import { fetchUser } from './features/user/userSlice'
import { fetchConnections } from './features/connections/connectionsSlice'
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPosts from './pages/admin/AdminPosts';
import AdminStories from './pages/admin/AdminStories';
import AdminAdmins from './pages/admin/AdminAdmins';
import { useAdmin } from './context/AdminContext';
import AdminReports from './pages/admin/AdminReports';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const App = () => {
  const { admin, loading: adminLoading } = useAdmin();
  const { user: authUser, loading: authLoading } = useAuth()
  const { pathname } = useLocation()
  const pathnameRef = useRef(pathname)
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user.value)

  useEffect(() => {
    if (authUser && !user) {
      dispatch(fetchUser())
      dispatch(fetchConnections())
    }
  }, [authUser, user, dispatch])

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-3 border-purple-500 border-t-transparent animate-spin mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <>
      <Toaster />
      <Routes>
        {/* Admin Routes */}
        <Route 
          path="/admin/login" 
          element={
            admin ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <AdminLogin />
            )
          } 
        />

        {/* Admin Dashboard as Layout Wrapper */}
        <Route 
          path="/admin/*" 
          element={
            admin ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        >
          {/* Nested admin routes */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<div></div>} /> {/* Empty for dashboard content */}
          <Route path="users" element={<AdminUsers />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="stories" element={<AdminStories />} />
          <Route path="reports" element={<AdminReports />} />
          <Route 
            path="admins" 
            element={
              admin && admin.role === 'super_admin' ? (
                <AdminAdmins />
              ) : (
                <Navigate to="/admin/dashboard" replace />
              )
            } 
          />
        </Route>

        {/* Regular User Routes */}
        <Route 
          path='/login' 
          element={
            authUser ? (
              <Navigate to='/' replace />
            ) : (
              <Login />
            )
          } 
        />

        <Route 
          path='/register' 
          element={
            authUser ? (
              <Navigate to='/' replace />
            ) : (
              <Register />
            )
          } 
        />

        <Route 
          path='/forgot-password' 
          element={
            authUser ? (
              <Navigate to='/' replace />
            ) : (
              <ForgotPassword />
            )
          } 
        />

        <Route 
          path='/reset-password/:token' 
          element={
            authUser ? (
              <Navigate to='/' replace />
            ) : (
              <ResetPassword />
            )
          } 
        />

        {/* Main App Layout */}
        <Route 
          path='/' 
          element={
            authUser ? (
              <Layout />
            ) : (
              <Navigate to='/login' replace />
            )
          }
        >
          <Route index element={<Feed />} />
          <Route path='messages' element={<Messages />} />
          <Route path='messages/:userId' element={<ChatBox />} />
          <Route path='connections' element={<Connections />} />
          <Route path='discover' element={<Discover />} />
          <Route path='profile' element={<Profile />} />
          <Route path='profile/:profileId' element={<Profile />} />
          <Route path='create-post' element={<CreatePost />} />
        </Route>

        {/* Fallback Routes */}
        <Route 
          path="*" 
          element={
            isAdminRoute ? (
              <Navigate to="/admin/login" replace />
            ) : authUser ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </>
  )
}

export default App