import React, { useState, useEffect } from 'react';
import { AlumniSubmission, Institution, ReviewStatus } from '../../types';
import { supabase, getSubmissions, updateSubmissionStatus, getMediaSignedUrls } from '../../services/supabaseClient';
import { INSTITUTION_OPTIONS } from '../../constants';
import AdminNav from './components/AdminNav';
import Spinner from '../../components/Spinner';
import SubmissionDetailModal from './components/SubmissionDetailModal';

interface SubmissionsPageProps {
  onLogout: () => void;
}

const SubmissionsPage: React.FC<SubmissionsPageProps> = ({ onLogout }) => {
  const [submissions, setSubmissions] = useState<AlumniSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<AlumniSubmission | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterInstitution, setFilterInstitution] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSubmissions();
      const mappedData: AlumniSubmission[] = data.map((row: any) => ({
        id: row.id,
        createdAt: row.created_at,
        fullName: row.full_name,
        institution: row.institution as Institution,
        batchYear: row.batch_year,
        rollNumber: row.roll_number,
        dateOfBirth: row.date_of_birth,
        email: row.email,
        phone: row.phone,
        messageText: row.message_text,
        audioFileUrl: row.audio_path,
        videoFileUrl: row.video_path,
        imageFileUrls: [],
        consentGiven: row.consent_given,
        reviewStatus: row.review_status as ReviewStatus,
        adminNotes: row.admin_notes,
      }));
      setSubmissions(mappedData);
    } catch (err: any) {
      console.error('Failed to fetch submissions:', err);
      setError(err.message || 'Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSubmission = async (updatedSubmission: AlumniSubmission) => {
    try {
      await updateSubmissionStatus(
        updatedSubmission.id,
        updatedSubmission.reviewStatus,
        updatedSubmission.adminNotes
      );

      setSubmissions(prev =>
        prev.map(sub => sub.id === updatedSubmission.id ? updatedSubmission : sub)
      );
      setSelectedSubmission(null);
    } catch (err: any) {
      console.error('Failed to update submission:', err);
      alert(`Failed to update submission: ${err.message}`);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-submission`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Supabase-Auth': `Bearer ${token}`,
          },
          body: JSON.stringify({ submissionId, accessToken: token }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete submission');
      }

      setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
      alert('Submission deleted successfully');

    } catch (err: any) {
      console.error('Failed to delete submission:', err);
      alert(err.message);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (filterStatus && sub.reviewStatus !== filterStatus) return false;
    if (filterInstitution && sub.institution !== filterInstitution) return false;
    if (filterYear && sub.batchYear.toString() !== filterYear) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        sub.fullName.toLowerCase().includes(term) ||
        sub.email.toLowerCase().includes(term) ||
        sub.rollNumber.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="bg-slate-100 min-h-screen">
      <AdminNav onLogout={onLogout} />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">All Submissions</h1>
          <p className="mt-1 text-sm text-gray-600">
            Review and manage alumni memory submissions
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, email, roll number..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution
              </label>
              <select
                value={filterInstitution}
                onChange={(e) => setFilterInstitution(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Year
              </label>
              <input
                type="text"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                placeholder="e.g., 2010"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredSubmissions.length}</span> of{' '}
                <span className="font-medium">{submissions.length}</span> submissions
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Institution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Media
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.fullName}
                        </div>
                        <div className="text-sm text-gray-500">{submission.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {INSTITUTION_OPTIONS.find(o => o.value === submission.institution)?.label || submission.institution}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.batchYear}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${submission.reviewStatus === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : submission.reviewStatus === 'flagged'
                              ? 'bg-yellow-100 text-yellow-800'
                              : submission.reviewStatus === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {submission.reviewStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.audioFileUrl && '🎤 '}
                        {submission.videoFileUrl && '🎥 '}
                        {!submission.audioFileUrl && !submission.videoFileUrl && 'Text only'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDeleteSubmission(submission.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onSave={handleSaveSubmission}
        />
      )}
    </div>
  );
};

export default SubmissionsPage;
