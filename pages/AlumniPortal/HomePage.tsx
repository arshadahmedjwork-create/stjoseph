
import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../logo_stjm.png';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      {/* Admin Portal Button */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Admin Portal
        </button>
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl md:text-5xl">
          60 Years of St. Joseph’s – Share Your Story
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          To commemorate our 60th milestone, we are releasing a heritage book to capture the history, memories, and stories of our incredible community. Your contribution is invaluable.
        </p>
        <div className="mt-8">
          <button
            onClick={() => navigate('/alumni/submit')}
            className="inline-block bg-blue-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-lg"
          >
            Share Your Memory
          </button>
        </div>
      </div>
      <div className="mt-16 md:mt-24 max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="prose lg:prose-lg text-gray-700">
            <h3>A Legacy of Excellence</h3>
            <p>
                Since its inception, St. Joseph's has been a beacon of knowledge, character, and community. As we celebrate our 60th year, we reflect on the generations of students, faculty, and staff who have shaped our legacy.
            </p>
            <h3>How Your Story Helps</h3>
            <p>
                Every message, photo, and voice note you share will be carefully curated for our 60-year commemorative book and preserved in a long-term digital archive. This project is a tribute to you—our alumni—who carry the spirit of St. Joseph's across the globe.
            </p>
        </div>
        <div className="flex justify-center items-center">
            <img 
                src={logo} 
                alt="St. Joseph's Logo" 
                className="w-full max-w-md h-auto object-contain"
            />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
