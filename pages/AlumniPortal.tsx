
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './AlumniPortal/HomePage';
import SubmissionFormPage from './AlumniPortal/SubmissionFormPage';
import ThankYouPage from './AlumniPortal/ThankYouPage';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AlumniPortal: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/submit" element={<SubmissionFormPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default AlumniPortal;
