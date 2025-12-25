import React, { useState } from 'react';
import AdminNav from './components/AdminNav';
import Spinner from '../../components/Spinner';
import { supabase } from '../../services/supabaseClient';

interface AdminsPageProps {
  onLogout: () => void;
}

interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin' | 'reviewer';
  first_login: boolean;
  created_at: string;
  last_login_at: string | null;
}

const AdminsPage: React.FC<AdminsPageProps> = ({ onLogout }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'super_admin' | 'reviewer'>('admin');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsCreating(true);

    try {
      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }

      // Call the create-admin Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ email, role }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.details?.includes('email_exists') || data.details?.includes('User already registered')) {
          throw new Error(`Email ${email} is already registered. Use a different email or delete the existing user first.`);
        }
        throw new Error(data.error || data.details || 'Failed to create admin');
      }

      // Check for partial success (207 = admin created but email failed)
      if (response.status === 207) {
        const tempPassword = data.temporary_password;
        setSuccess(
          `✅ Admin created successfully!\n\n` +
          `⚠️ Email delivery failed (domain verification required).\n\n` +
          `📧 Email: ${email}\n` +
          `🔑 Temporary Password: ${tempPassword}\n\n` +
          `Please manually share these credentials with the admin. ` +
          `They must change their password on first login.`
        );
      } else {
        setSuccess(
          `✅ Admin user created successfully!\n\n` +
          `Credentials have been sent to ${email}. ` +
          `The new admin must change their password on first login.`
        );
      }
      setEmail('');
      setRole('admin');
    } catch (err: any) {
      console.error('Failed to create admin:', err);
      setError(err.message || 'Failed to create admin user');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen">
      <AdminNav onLogout={onLogout} />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage administrator accounts
          </p>
        </div>

        {/* Create Admin Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Create New Admin
          </h2>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isCreating}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                disabled={isCreating}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
                <option value="reviewer">Reviewer</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                <strong>Super Admin:</strong> Full access including admin management. <br />
                <strong>Admin:</strong> Can review and manage submissions. <br />
                <strong>Reviewer:</strong> Can only review submissions (no admin creation).
              </p>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <Spinner />
                  <span className="ml-2">Creating Admin...</span>
                </>
              ) : (
                'Create Admin User'
              )}
            </button>
          </form>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📧 How it works
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• A secure temporary password will be generated automatically</li>
            <li>• Credentials will be sent to the admin's email via EmailJS</li>
            <li>• The new admin must change their password on first login</li>
            <li>• Make sure EmailJS is configured in Supabase secrets</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-1">
              Required Supabase Secrets:
            </h4>
            <code className="text-xs bg-white px-2 py-1 rounded text-blue-900 block mt-2">
              EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY
            </code>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminsPage;
