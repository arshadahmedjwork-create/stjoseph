
import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

import ChangePasswordModal from './components/ChangePasswordModal';

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      interface AdminProfile {
        id: string;
        role: 'admin' | 'super_admin' | 'reviewer';
        first_login: boolean;
      }

      // ... inside handleLogin
      // Verify user is an admin
      const { data, error: profileError } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      const adminProfile = data as AdminProfile | null;

      if (profileError) {
        console.error('Admin profile lookup error:', profileError);
        await supabase.auth.signOut();
        throw new Error(`Access denied. ${profileError.message}`);
      }

      if (!adminProfile) {
        await supabase.auth.signOut();
        throw new Error('Access denied. Not an admin user.');
      }

      // Check for first login
      if (adminProfile.first_login) {
        setTempUserId(authData.user.id);
        setShowPasswordModal(true);
        return; // Stop here, wait for password change
      }

      // Success
      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#/admin/reset-password',
      });

      if (error) throw error;

      setResetSuccess('Password reset link sent! Check your email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setShowPasswordModal(false);
    onLoginSuccess();
  };

  const handlePasswordChangeCancel = async () => {
    setShowPasswordModal(false);
    await supabase.auth.signOut();
    setTempUserId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

      {showPasswordModal && tempUserId && (
        <ChangePasswordModal
          userId={tempUserId}
          onSuccess={handlePasswordChangeSuccess}
          onCancel={handlePasswordChangeCancel}
        />
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img className="mx-auto h-20 w-auto rounded-full" src="https://picsum.photos/80/80" alt="Logo" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isResetMode ? 'Reset Password' : 'Admin Portal Sign-in'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">

          {isResetMode ? (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {resetSuccess && (
                <div className="rounded-md bg-green-50 p-4">
                  <p className="text-sm text-green-800">{resetSuccess}</p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>
                <div className="text-right mt-1">
                  <button
                    type="button"
                    onClick={() => setIsResetMode(true)}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
