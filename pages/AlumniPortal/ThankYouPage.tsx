
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { generateFunFact } from '../../services/geminiService';
import { CheckCircleIcon, SparklesIcon } from '../../components/Icons';
import Spinner from '../../components/Spinner';

const ThankYouPage: React.FC = () => {
  const location = useLocation();
  const batchYear = location.state?.batchYear;
  const [funFact, setFunFact] = useState<string>('');
  const [isLoadingFact, setIsLoadingFact] = useState<boolean>(false);

  useEffect(() => {
    if (batchYear) {
      setIsLoadingFact(true);
      generateFunFact(parseInt(batchYear, 10))
        .then(fact => setFunFact(fact))
        .catch(err => console.error(err))
        .finally(() => setIsLoadingFact(false));
    }
  }, [batchYear]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="max-w-2xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-2xl text-center">
        <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto" />
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mt-6">
          Thank You!
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Your memory has been successfully submitted. Thank you for being part of 60 years of St. Joseph’s history and for sharing your story with us.
        </p>
        
        {batchYear && (
          <div className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 text-blue-500 mr-4 flex-shrink-0" />
              <div>
                <h4 className="text-lg font-bold text-gray-800 text-left">A Blast from Your Past!</h4>
                {isLoadingFact ? (
                  <div className="flex justify-center items-center mt-2">
                    <Spinner />
                  </div>
                ) : (
                  <p className="text-gray-700 mt-1 text-left">{funFact}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-10">
          <Link
            to="/alumni"
            className="inline-block bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
