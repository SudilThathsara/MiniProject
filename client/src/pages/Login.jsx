import React, { useState } from 'react';
import { assets } from '../assets/assets';
import { Star, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className='min-h-screen flex flex-col md:flex-row'>
      <img src={assets.bgImage} alt="" className='absolute top-0 left-0 -z-1 w-full h-full object-cover'/>
      
      <div className='flex-1 flex flex-col items-start justify-between p-6 md:p-10 lg:pl-40'>
        <img src={assets.logo} alt="" className='h-12 object-contain'/>
        <div>
          <div className='flex items-center gap-3 mb-4 max-md:mt-10'>
            <img src={assets.group_users} alt="" className='h-8 md:h-10'/>
            <div>
              <div className='flex'>
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className='size-4 md:size-4.5 text-transparent fill-amber-500'/>
                ))}
              </div>
              <p>Used by university Student</p>
            </div>
          </div>
          <h1 className='text-3xl md:text-6xl md:pb-2 font-bold bg-gradient-to-r from-indigo-950 to-indigo-800 bg-clip-text text-transparent'>
            Lost Something? Let Us Help You Get It Back
          </h1>
          <p className='text-xl md:text-3xl text-indigo-900 max-w-72 md:max-w-md'>
            Connect with global community on FindBack.
          </p>
        </div>
        <span className='md:h-10'></span>
      </div>
      
      <div className='flex-1 flex items-center justify-center p-6 sm:p-10'>
        <div className='w-full max-w-md'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>Sign In</h2>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Email
              </label>
              <input
                type='email'
                name='email'
                required
                className='w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition'
                placeholder='Enter your email'
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name='password'
                  required
                  className='w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition pr-12'
                  placeholder='Enter your password'
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Add Forgot Password Link */}
            <div className="text-right">
              <Link 
                to="/forgot-password" 
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Forgot your password?
              </Link>
            </div>
            
            <button
              type='submit'
              disabled={loading}
              className='w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <p className='mt-4 text-center text-gray-600'>
            Don't have an account?{' '}
            <Link to='/register' className='text-indigo-600 hover:text-indigo-700 font-medium'>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;