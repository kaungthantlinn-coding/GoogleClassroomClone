import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { User } from '../types/course';
import { Eye, EyeOff } from 'lucide-react';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { register, isLoading, error: authError } = useAuthStore(state => ({
    register: state.register,
    isLoading: state.isLoading,
    error: state.error
  }));

  // Update local error state when auth store error changes
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      // Use the auth store register method
      await register(name, email, password, role);
      
      // If no error, redirect to home page
      if (!authError) {
        navigate('/');
      }
    } catch (err: any) {
      // Handle any unexpected errors
      setError(err.message || 'An error occurred during signup. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
        <div>
          <div className="flex justify-center">
            <img
              src="https://www.gstatic.com/classroom/logo_square_48.svg"
              alt="Classroom Logo"
              className="h-16 w-16 animate-pulse"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Classroom to start learning
          </p>
          <p className="text-center text-sm text-gray-500 mt-1">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[#1a73e8] hover:text-[#1557b0] transition-colors duration-200">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm relative animate-fadeIn" role="alert">
              <div className="flex">
                <div className="py-1">
                  <svg className="w-6 h-6 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <span className="block sm:inline font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:z-10 sm:text-sm transition-colors duration-200"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-gray-500" />
                  ) : (
                    <Eye size={20} className="text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:z-10 sm:text-sm transition-colors duration-200"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} className="text-gray-500" />
                  ) : (
                    <Eye size={20} className="text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">I am a</label>
              <div className="flex space-x-4">
                <div
                  onClick={() => setRole('teacher')}
                  className={`flex-1 cursor-pointer rounded-md border ${role === 'teacher' ? 'border-[#1a73e8] bg-blue-50' : 'border-gray-300'} p-3 flex items-center justify-center transition-all duration-200 hover:bg-blue-50`}
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full ${role === 'teacher' ? 'bg-[#1a73e8]' : 'bg-gray-200'} flex items-center justify-center mb-2 transition-colors duration-200`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                    </div>
                    <span className={`text-sm font-medium ${role === 'teacher' ? 'text-[#1a73e8]' : 'text-gray-700'}`}>Teacher</span>
                  </div>
                </div>
                <div
                  onClick={() => setRole('student')}
                  className={`flex-1 cursor-pointer rounded-md border ${role === 'student' ? 'border-[#4caf50] bg-green-50' : 'border-gray-300'} p-3 flex items-center justify-center transition-all duration-200 hover:bg-green-50`}
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full ${role === 'student' ? 'bg-[#4caf50]' : 'bg-gray-200'} flex items-center justify-center mb-2 transition-colors duration-200`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className={`text-sm font-medium ${role === 'student' ? 'text-[#4caf50]' : 'text-gray-700'}`}>Student</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-400'
                  : role === 'teacher'
                    ? 'bg-[#1a73e8] hover:bg-[#1557b0] hover:shadow-md focus:ring-[#1a73e8]'
                    : 'bg-[#4caf50] hover:bg-[#3d8b40] hover:shadow-md focus:ring-[#4caf50]'
              } focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : 'Create Account'}
            </button>
          </div>

          <div className="mt-6">
            <p className="text-xs text-center text-gray-500">
              By creating an account, you agree to our{' '}
              <a href="#" className="font-medium text-[#1a73e8] hover:text-[#1557b0] transition-colors duration-200">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="font-medium text-[#1a73e8] hover:text-[#1557b0] transition-colors duration-200">
                Privacy Policy
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;