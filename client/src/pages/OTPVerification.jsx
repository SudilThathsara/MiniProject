import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      toast.error('Email not found');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timer > 0 && !canResend) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, canResend]);

  const handleChange = (index, value) => {
    if (value.match(/^[0-9]?$/)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (pasteData.match(/^\d+$/)) {
      const newOtp = [...otp];
      pasteData.split('').forEach((digit, index) => {
        if (index < 6) newOtp[index] = digit;
      });
      setOtp(newOtp);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    
    try {
      const { data } = await api.post('/api/auth/verify-otp', {
        email,
        otp: otpString
      });
      
      if (data.success) {
        toast.success('OTP verified successfully!');
        navigate('/change-password', {
          state: { 
            resetToken: data.resetToken,
            email: email
          }
        });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error verifying OTP');
    }
    
    setLoading(false);
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setResendLoading(true);
    
    try {
      const { data } = await api.post('/api/auth/resend-otp', { email });
      
      if (data.success) {
        toast.success('New OTP sent to your email');
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error resending OTP');
    }
    
    setResendLoading(false);
  };

  const handleGoBack = () => {
    navigate('/forgot-password', { state: { email } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verify OTP</h1>
            <p className="text-gray-600 mt-2">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                  />
                ))}
              </div>
            </div>

            {/* Resend OTP */}
            <div className="text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendLoading}
                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${resendLoading ? 'animate-spin' : ''}`} />
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  Resend OTP in {timer} seconds
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Verify OTP'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to email entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;