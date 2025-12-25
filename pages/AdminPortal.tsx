
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './AdminPortal/LoginPage';
import DashboardPage from './AdminPortal/DashboardPage';
import SubmissionsPage from './AdminPortal/SubmissionsPage';
import AdminsPage from './AdminPortal/AdminsPage';
import ExportPage from './AdminPortal/ExportPage';
import { supabase } from '../services/supabaseClient';

const AdminPortal: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Verify admin profile exists
        supabase
          .from('admin_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            setIsAuthenticated(!error && !!data);
            setLoading(false);
          });
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/*" element={<Navigate to="/admin/login" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage onLogout={handleLogout} />} />
      <Route path="/submissions" element={<SubmissionsPage onLogout={handleLogout} />} />
      <Route path="/admins" element={<AdminsPage onLogout={handleLogout} />} />
      <Route path="/export" element={<ExportPage onLogout={handleLogout} />} />
      <Route path="/*" element={<Navigate to="/admin/dashboard" />} />
    </Routes>
  );
};

export default AdminPortal;
