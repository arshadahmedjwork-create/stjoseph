import React, { useState, useEffect } from 'react';
import { getSubmissions, supabase } from '../../services/supabaseClient';
import { INSTITUTION_OPTIONS } from '../../constants';
import AdminNav from './components/AdminNav';
import Spinner from '../../components/Spinner';

interface ExportPageProps {
  onLogout: () => void;
}

const ExportPage: React.FC<ExportPageProps> = ({ onLogout }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterInstitution, setFilterInstitution] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');
  
  // Stats
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await getSubmissions();
      setTotalSubmissions(data.length);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setSuccess(null);

    try {
      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }

      // Build query params
      const params = new URLSearchParams();
      if (filterStatus) params.append('reviewStatus', filterStatus);
      if (filterInstitution) params.append('institution', filterInstitution);
      if (filterYear) params.append('batchYear', filterYear);

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-submissions?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Download the ZIP file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `alumni-submissions-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setSuccess('Export completed successfully! Check your downloads folder.');
    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err.message || 'Failed to export submissions');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen">
      <AdminNav onLogout={onLogout} />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Export Submissions</h1>
          <p className="mt-1 text-sm text-gray-600">
            Download submissions as a ZIP file with CSV and media files
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Submissions</p>
              {isLoadingStats ? (
                <div className="mt-1">
                  <Spinner />
                </div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{totalSubmissions}</p>
              )}
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Filter Options</h2>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Review Status
              </label>
              <select
                id="status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                disabled={isExporting}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>

            <div>
              <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                Institution
              </label>
              <select
                id="institution"
                value={filterInstitution}
                onChange={(e) => setFilterInstitution(e.target.value)}
                disabled={isExporting}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">All Institutions</option>
                {INSTITUTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                Batch Year
              </label>
              <input
                type="text"
                id="year"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                disabled={isExporting}
                placeholder="e.g., 2010"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Spinner />
                  <span className="ml-2">Exporting...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                  Export as ZIP
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📦 What's included in the export
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <strong>submissions.csv</strong> - All submission data in CSV format</li>
            <li>• <strong>submission-[id]/</strong> - Folders for each submission containing:</li>
            <li className="ml-6">- message.txt - The memory text</li>
            <li className="ml-6">- audio.webm - Audio recording (if available)</li>
            <li className="ml-6">- video.mp4 - Video recording (if available)</li>
            <li className="mt-3">• All media files are downloaded from Supabase Storage</li>
            <li>• Files are streamed directly to ZIP without temp storage</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default ExportPage;
