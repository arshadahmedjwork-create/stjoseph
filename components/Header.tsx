import React from 'react';
import logo from '../logo_stjm.png';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src={logo} alt="St. Joseph's Logo" className="h-12 w-12 sm:h-16 sm:w-16 object-contain" />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
              St. Joseph’s Educational Society
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Alumni Tribute Portal</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 
