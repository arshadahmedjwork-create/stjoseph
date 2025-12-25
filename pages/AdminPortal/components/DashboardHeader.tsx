import React from 'react';
import { INSTITUTION_OPTIONS } from '../../../constants';
import { DownloadIcon } from '../../../components/Icons';

interface DashboardHeaderProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    filterInstitution: string;
    onFilterInstitutionChange: (value: string) => void;
    filterYear: string;
    onFilterYearChange: (value: string) => void;
    onExportCSV: () => void;
    onExportPDF: () => void;
    isExporting: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    searchTerm,
    onSearchTermChange,
    filterInstitution,
    onFilterInstitutionChange,
    filterYear,
    onFilterYearChange,
    onExportCSV,
    onExportPDF,
    isExporting
}) => {
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                    type="text"
                    placeholder="Search by name, email, roll..."
                    value={searchTerm}
                    onChange={e => onSearchTermChange(e.target.value)}
                    className="lg:col-span-2 w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <select 
                    value={filterInstitution} 
                    onChange={e => onFilterInstitutionChange(e.target.value)} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                >
                    <option value="">All Institutions</option>
                    {INSTITUTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <input
                    type="number"
                    placeholder="Filter by Batch Year"
                    value={filterYear}
                    onChange={e => onFilterYearChange(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
            </div>
            <div className="flex justify-end space-x-3 mt-4">
                <button
                    onClick={onExportCSV}
                    disabled={isExporting}
                    className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <DownloadIcon className="h-5 w-5 mr-2 text-slate-500" />
                    Export CSV
                </button>
                <button
                    onClick={onExportPDF}
                    disabled={isExporting}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <DownloadIcon className="h-5 w-5 mr-2" />
                    Download PDF
                </button>
            </div>
        </div>
    );
};

export default DashboardHeader;
