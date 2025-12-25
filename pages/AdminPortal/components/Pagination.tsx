import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../../components/Icons';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    
    return (
        <div className="flex items-center justify-between mt-6 px-1">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Previous
            </button>
            <span className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
            </span>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
                <ChevronRightIcon className="h-5 w-5 ml-1" />
            </button>
        </div>
    );
};

export default Pagination;
