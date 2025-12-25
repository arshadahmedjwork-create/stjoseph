import React from 'react';
import { NavLink } from 'react-router-dom';

interface AdminNavProps {
  onLogout: () => void;
}

const AdminNav: React.FC<AdminNavProps> = ({ onLogout }) => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
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
            <NavLink to="/admin/admins" className={navLinkClass}>
              Admins
            </NavLink>
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
