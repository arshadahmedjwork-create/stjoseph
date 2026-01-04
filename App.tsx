
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AlumniPortal from './pages/AlumniPortal';
import AdminPortal from './pages/AdminPortal';
import './App.css';
import { Toaster } from "@/components/ui/sonner";

const App: React.FC = () => {
  return (
    <div className="bg-background min-h-screen font-sans text-foreground antialiased">
      <HashRouter>
        <Routes>
          <Route path="/alumni/*" element={<AlumniPortal />} />
          <Route path="/admin/*" element={<AdminPortal />} />
          <Route path="/" element={<Navigate to="/alumni" />} />
        </Routes>
      </HashRouter>
      <Toaster />
    </div>
  );
};

export default App;
