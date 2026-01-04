import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../../../services/supabaseClient';

interface AdminNavProps {
  onLogout: () => void;
}

const AdminNav: React.FC<AdminNavProps> = ({ onLogout }) => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkRole();
  }, []);

  const checkRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    interface AdminProfile {
      role: 'admin' | 'super_admin' | 'reviewer';
    }

    if (user) {
      const { data } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const profile = data as AdminProfile | null;

      if (profile && profile.role === 'super_admin') {
        setIsSuperAdmin(true);
      }
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive
      ? 'bg-blue-700 text-white'
      : 'text-blue-100 hover:bg-blue-600 hover:text-white'
    }`;

  return (
    <nav className="bg-blue-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-1">
            <NavLink to="/admin/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/admin/submissions" className={navLinkClass}>
              Submissions
            </NavLink>
            {isSuperAdmin && (
              <NavLink to="/admin/admins" className={navLinkClass}>
                Manage Admins
              </NavLink>
            )}
            <NavLink to="/admin/export" className={navLinkClass}>
              Export
            </NavLink>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;
