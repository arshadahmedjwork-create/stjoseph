
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AlumniPortal from './pages/AlumniPortal';
import AdminPortal from './pages/AdminPortal';

const App: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <HashRouter>
        <Routes>
          <Route path="/alumni/*" element={<AlumniPortal />} />
          <Route path="/admin/*" element={<AdminPortal />} />
          <Route path="/" element={<Navigate to="/alumni" />} />
        </Routes>
      </HashRouter>
    </div>
  );
};

export default App;
