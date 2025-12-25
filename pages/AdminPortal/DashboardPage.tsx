import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { AlumniSubmission, Institution, ReviewStatus } from '../../types';
import { INSTITUTION_OPTIONS } from '../../constants';
import SubmissionDetailModal from './components/SubmissionDetailModal';
import SubmissionsTable from './components/SubmissionsTable';
import DashboardHeader from './components/DashboardHeader';
import Pagination from './components/Pagination';
import StatsCards from './components/StatsCards';
import { getSubmissions, updateSubmissionStatus } from '../../services/supabaseClient';
import Spinner from '../../components/Spinner';
import AdminNav from './components/AdminNav';

const ITEMS_PER_PAGE = 10;

interface DashboardPageProps {
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const [submissions, setSubmissions] = useState<AlumniSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterInstitution, setFilterInstitution] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof AlumniSubmission; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });
  const [isExporting, setIsExporting] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<AlumniSubmission | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Load data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getSubmissions();
        // Map database format to frontend format
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
    fetchData();
  }, []);

  const stats = useMemo(() => {
    return {
      total: submissions.length,
      pending: submissions.filter(s => s.reviewStatus === ReviewStatus.Pending).length,
      approved: submissions.filter(s => s.reviewStatus === ReviewStatus.Approved).length,
      flagged: submissions.filter(s => s.reviewStatus === ReviewStatus.Flagged).length,
    };
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;
    if (filterInstitution) {
      filtered = filtered.filter(s => s.institution === filterInstitution);
    }
    if (filterYear) {
      filtered = filtered.filter(s => s.batchYear.toString() === filterYear);
    }
    if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(s => 
            s.fullName.toLowerCase().includes(lowercasedTerm) ||
            s.email.toLowerCase().includes(lowercasedTerm) ||
            s.rollNumber.toLowerCase().includes(lowercasedTerm)
        );
    }
    return filtered;
  }, [submissions, filterInstitution, filterYear, searchTerm]);
  
  const sortedSubmissions = useMemo(() => {
    let sortableItems = [...filteredSubmissions];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // Safe property access
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
  
        // Handle undefined/null values for sorting
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1; // Push nulls to bottom
        if (valB === undefined || valB === null) return -1;

        // Handle arrays (like imageFileUrls) by length
        if (Array.isArray(valA) && Array.isArray(valB)) {
             return sortConfig.direction === 'asc' ? valA.length - valB.length : valB.length - valA.length;
        }
        if (Array.isArray(valA)) return 1;
        if (Array.isArray(valB)) return -1;

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredSubmissions, sortConfig]);

  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedSubmissions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedSubmissions, currentPage]);

  const totalPages = Math.ceil(sortedSubmissions.length / ITEMS_PER_PAGE);

  const requestSort = (key: keyof AlumniSubmission) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSaveSubmission = async (updatedSubmission: AlumniSubmission) => {
    try {
      // Update in Supabase
      await updateSubmissionStatus(
        updatedSubmission.id,
        updatedSubmission.reviewStatus,
        updatedSubmission.adminNotes
      );
      
      // Update local state
      setSubmissions(prev => 
        prev.map(sub => sub.id === updatedSubmission.id ? updatedSubmission : sub)
      );
      setSelectedSubmission(null);
    } catch (err: any) {
      console.error('Failed to update submission:', err);
      alert(`Failed to update submission: ${err.message}`);
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    // Use setTimeout to allow UI update before heavy operation
    setTimeout(() => {
        const headers = [
          'ID', 'Created At', 'Full Name', 'Institution', 'Batch Year', 'Roll Number',
          'Date of Birth', 'Email', 'Phone', 'Message Text', 'Has Audio', 'Image Count',
          'Consent Given', 'Review Status', 'Admin Notes'
        ];
        const institutionLabels = INSTITUTION_OPTIONS.reduce((acc, opt) => {
            (acc as any)[opt.value] = opt.label;
            return acc;
        }, {} as Record<Institution, string>);

        const rows = sortedSubmissions.map(sub => [
          sub.id,
          new Date(sub.createdAt).toLocaleString(),
          `"${sub.fullName.replace(/"/g, '""')}"`,
          institutionLabels[sub.institution] || sub.institution,
          sub.batchYear,
          sub.rollNumber,
          sub.dateOfBirth,
          sub.email,
          sub.phone || '',
          `"${sub.messageText?.replace(/"/g, '""').replace(/\n/g, ' ') || ''}"`,
          sub.audioFileUrl ? 'Yes' : 'No',
          sub.imageFileUrls?.length || 0,
          sub.consentGiven ? 'Yes' : 'No',
          sub.reviewStatus,
          `"${sub.adminNotes?.replace(/"/g, '""') || ''}"`
        ].join(','));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `alumni-submissions-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExporting(false);
    }, 50);
  };

  const handleExportPDF = () => {
      setIsExporting(true);
      setTimeout(() => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const institutionLabels = INSTITUTION_OPTIONS.reduce((acc, opt) => {
            (acc as any)[opt.value] = opt.label;
            return acc;
        }, {} as Record<Institution, string>);

        doc.setFontSize(18);
        doc.text("St. Joseph's Alumni Submissions", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Report generated on: ${new Date().toLocaleDateString()}`, 14, 29);

        autoTable(doc, {
            startY: 35,
            head: [['Full Name', 'Institution', 'Batch Year', 'Submitted On', 'Status', 'Content', 'Admin Notes']],
            body: sortedSubmissions.map(sub => {
                const content = [];
                if (sub.messageText) content.push('Text');
                if (sub.audioFileUrl) content.push('Audio');
                if (sub.imageFileUrls?.length) content.push(`${sub.imageFileUrls.length} Image(s)`);
                return [
                    sub.fullName,
                    institutionLabels[sub.institution] || sub.institution,
                    sub.batchYear,
                    new Date(sub.createdAt).toLocaleDateString(),
                    sub.reviewStatus,
                    content.join(', ') || 'N/A',
                    sub.adminNotes || ''
                ]
            }),
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] }, // Tailwind blue-600
        });
        
        const pageCount = (doc as any).internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Page ${String(i)} of ${String(pageCount)}`, doc.internal.pageSize.width - 28, doc.internal.pageSize.height - 10);
        }

        doc.save(`alumni-submissions-${new Date().toISOString().split('T')[0]}.pdf`);
        setIsExporting(false);
    }, 50);
  };

  return (
    <div className="bg-slate-100 min-h-screen font-sans">
      <AdminNav onLogout={onLogout} />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        ) : (
          <>
            <StatsCards stats={stats} />

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <DashboardHeader
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    filterInstitution={filterInstitution}
                    onFilterInstitutionChange={setFilterInstitution}
                    filterYear={filterYear}
                    onFilterYearChange={setFilterYear}
                    onExportCSV={handleExportCSV}
                    onExportPDF={handleExportPDF}
                    isExporting={isExporting}
                />
                
                <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200">
                    <SubmissionsTable 
                        submissions={paginatedSubmissions}
                        onSort={requestSort}
                        sortConfig={sortConfig}
                        onViewDetails={setSelectedSubmission}
                    />
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
          </>
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

export default DashboardPage;