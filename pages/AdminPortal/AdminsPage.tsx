import React, { useState, useEffect } from 'react';
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
}

const AdminsPage: React.FC<AdminsPageProps> = ({ onLogout }) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'super_admin' | 'reviewer'>('admin');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    checkPermissionAndFetch();
  }, []);

  const checkPermissionAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('admin_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const profile = data as { role: string } | null;

    if (!profile || profile.role !== 'super_admin') {
      setError("Access Denied: Only Super Admins can access this page.");
    } else {
      setIsSuperAdmin(true);
      fetchAdmins();
    }
  };

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-admins`,
        {
          method: 'POST', // Use POST or GET depending on how we set it up, typically standard Fetch is GET but we can use POST for consistency if body needed. GET is fine.
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Supabase-Auth': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch admins');
      }

      setAdmins(data.admins as AdminUser[]);
    } catch (err: any) {
      setError('Failed to fetch admins: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsCreating(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Supabase-Auth': `Bearer ${token}`, // Fallback for stripped header
          },
          body: JSON.stringify({
            email: newEmail,
            role: newRole,
            accessToken: token
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create admin');
      }

      setSuccess(`Admin created successfully! Temporary password sent to ${newEmail}`);
      setShowCreateModal(false);
      setNewEmail('');
      fetchAdmins(); // Refresh list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAdmin = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Supabase-Auth': `Bearer ${token}`,
          },
          body: JSON.stringify({ userId, accessToken: token }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete');
      }

      setSuccess('Admin deleted successfully');
      fetchAdmins();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-admin-role`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Supabase-Auth': `Bearer ${token}`,
          },
          body: JSON.stringify({ userId, newRole, accessToken: token }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      setSuccess('Role updated successfully');
      fetchAdmins();
    } catch (err: any) {
      setError(err.message);
    }
  };


  if (!isSuperAdmin && error) {
    return <div className="p-8 text-center text-red-600 font-bold">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminNav onLogout={onLogout} />
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Manage Admins</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Create New Admin
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto py-6 sm:px-6 lg:px-8">

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded relative">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-8"><Spinner /></div>
        ) : (
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {admins.map((admin) => (
                        <tr key={admin.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{admin.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              className="text-sm text-gray-900 border-none bg-transparent focus:ring-0"
                              value={admin.role}
                              onChange={(e) => handleUpdateRole(admin.id, e.target.value)}
                            >
                              <option value="admin">Admin</option>
                              <option value="super_admin">Super Admin</option>
                              <option value="reviewer">Reviewer</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{new Date(admin.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {admin.first_login ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Pending First Login
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleDeleteAdmin(admin.id)} className="text-red-600 hover:text-red-900">
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleCreateAdmin}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Create New Admin</h3>
                        <div className="mt-2 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={newRole} onChange={e => setNewRole(e.target.value as any)}>
                              <option value="admin">Admin</option>
                              <option value="super_admin">Super Admin</option>
                              <option value="reviewer">Reviewer</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button type="submit" disabled={isCreating} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                      {isCreating ? 'Creating...' : 'Create'}
                    </button>
                    <button type="button" onClick={() => setShowCreateModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminsPage;
