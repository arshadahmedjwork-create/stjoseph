
import React from 'react';
import { AlumniSubmission } from '../../../types';
import { INSTITUTION_OPTIONS } from '../../../constants';
import { EyeIcon, DocumentTextIcon, MicrophoneIcon, ImageIcon } from '../../../components/Icons';

interface SubmissionsTableProps {
    submissions: AlumniSubmission[];
    onSort: (key: keyof AlumniSubmission) => void;
    sortConfig: { key: keyof AlumniSubmission; direction: 'asc' | 'desc' } | null;
    onViewDetails: (submission: AlumniSubmission) => void;
}

const SubmissionsTable: React.FC<SubmissionsTableProps> = ({ submissions, onSort, sortConfig, onViewDetails }) => {
    
    const getSortIndicator = (key: keyof AlumniSubmission) => {
        if (!sortConfig || sortConfig.key !== key) return <span className="text-slate-300 text-[10px] ml-1">↕</span>;
        return <span className="text-indigo-600 ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    const TableHeader: React.FC<{ sortKey: keyof AlumniSubmission, children: React.ReactNode, className?: string }> = ({ sortKey, children, className = "text-left" }) => (
        <th 
            scope="col" 
            className={`px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 transition-colors group ${className}`}
            onClick={() => onSort(sortKey)}
        >
            <div className={`flex items-center ${className === 'text-center' ? 'justify-center' : 'justify-start'}`}>
                <span className="group-hover:text-slate-700">{children}</span>
                {getSortIndicator(sortKey)}
            </div>
        </th>
    );

    const getStatusChip = (status: string) => {
        const baseClasses = "px-3 py-1 inline-flex text-xs leading-4 font-bold rounded-full border";
        switch (status) {
            case 'approved': return `${baseClasses} bg-green-50 text-green-700 border-green-200`;
            case 'flagged': return `${baseClasses} bg-red-50 text-red-700 border-red-200`;
            default: return `${baseClasses} bg-yellow-50 text-yellow-700 border-yellow-200`;
        }
    }
    
    return (
        <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
                <tr>
                    <TableHeader sortKey="fullName">Full Name</TableHeader>
                    <TableHeader sortKey="institution">Institution</TableHeader>
                    <TableHeader sortKey="batchYear" className="text-center">Batch</TableHeader>
                    <TableHeader sortKey="createdAt">Submitted On</TableHeader>
                    <TableHeader sortKey="reviewStatus">Status</TableHeader>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Content
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Actions
                    </th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {submissions.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-500">
                            <p className="text-base font-medium">No submissions found.</p>
                            <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
                        </td>
                    </tr>
                ) : (
                    submissions.map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-slate-900">{sub.fullName}</div>
                                <div className="text-xs text-slate-500">{sub.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{INSTITUTION_OPTIONS.find(i => i.value === sub.institution)?.label}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">{sub.batchYear}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(sub.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getStatusChip(sub.reviewStatus)}>
                                    {sub.reviewStatus.charAt(0).toUpperCase() + sub.reviewStatus.slice(1)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-3">
                                    {sub.messageText ? (
                                        <span className="text-slate-400 hover:text-indigo-600 transition-colors" title="Has Text Message">
                                            <DocumentTextIcon className="h-5 w-5" />
                                        </span>
                                    ) : <span className="w-5"></span>}
                                    {sub.audioFileUrl ? (
                                        <span className="text-slate-400 hover:text-pink-600 transition-colors" title="Has Voice Note">
                                            <MicrophoneIcon className="h-5 w-5" />
                                        </span>
                                    ) : <span className="w-5"></span>}
                                    {sub.imageFileUrls && sub.imageFileUrls.length > 0 ? (
                                        <span className="text-slate-400 hover:text-blue-600 transition-colors flex items-center" title={`${sub.imageFileUrls.length} Images`}>
                                            <ImageIcon className="h-5 w-5" />
                                            <span className="text-[10px] ml-0.5 font-bold">{sub.imageFileUrls.length}</span>
                                        </span>
                                    ) : <span className="w-5"></span>}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <button
                                    onClick={() => onViewDetails(sub)}
                                    className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                                    aria-label={`View details for ${sub.fullName}`}
                                >
                                    <EyeIcon className="h-5 w-5" />
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
};

export default SubmissionsTable;
