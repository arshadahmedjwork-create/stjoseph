
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AlumniSubmission, ReviewStatus } from '../../../types';
import { INSTITUTION_OPTIONS } from '../../../constants';
import { XIcon } from '../../../components/Icons';
import { supabase } from '../../../services/supabaseClient';

interface SubmissionDetailModalProps {
    submission: AlumniSubmission;
    onClose: () => void;
    onSave: (submission: AlumniSubmission) => void;
}

// Moved outside to prevent re-creation on render
const DetailItem: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-slate-500">{label}</dt>
        <dd className="mt-1 text-sm text-slate-900">{value}</dd>
    </div>
);

const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({ submission, onClose, onSave }) => {
    const [adminNotes, setAdminNotes] = useState(submission.adminNotes || '');
    const [reviewStatus, setReviewStatus] = useState(submission.reviewStatus);
    const [audioSignedUrl, setAudioSignedUrl] = useState<string | null>(null);
    const [videoSignedUrl, setVideoSignedUrl] = useState<string | null>(null);
    const [isLoadingMedia, setIsLoadingMedia] = useState(false);

    useEffect(() => {
        // Add/remove class to body to prevent scrolling when modal is open
        document.body.classList.add('overflow-hidden');

        // Load signed URLs for audio and video
        loadMediaSignedUrls();

        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, []);

    const loadMediaSignedUrls = async () => {
        const paths: string[] = [];

        if (submission.audioFileUrl) {
            paths.push(submission.audioFileUrl);
        }
        if (submission.videoFileUrl) {
            paths.push(submission.videoFileUrl);
        }

        if (paths.length === 0) return;

        setIsLoadingMedia(true);

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;

            if (!token) {
                console.error('No auth token available');
                return;
            }

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-media-signed-url`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ paths, expiresIn: 3600 }), // 1 hour expiry
                }
            );

            if (!response.ok) {
                throw new Error('Failed to get signed URLs');
            }

            const data = await response.json();

            if (submission.audioFileUrl && data.signedUrls[submission.audioFileUrl]) {
                setAudioSignedUrl(data.signedUrls[submission.audioFileUrl]);
            }

            if (submission.videoFileUrl && data.signedUrls[submission.videoFileUrl]) {
                setVideoSignedUrl(data.signedUrls[submission.videoFileUrl]);
            }

        } catch (error) {
            console.error('Failed to load media signed URLs:', error);
        } finally {
            setIsLoadingMedia(false);
        }
    };

    const handleSave = () => {
        onSave({ ...submission, adminNotes, reviewStatus });
    };

    const handleDownload = async () => {
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;

            if (!token) {
                alert('Not authenticated');
                return;
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const url = `${supabaseUrl}/functions/v1/export-single-submission?id=${submission.id}`;

            console.log('Fetching submission data...');

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                // Try to parse error as JSON if possible
                try {
                    const errorJson = JSON.parse(errorText);
                    console.error('Download failed:', errorJson);
                    throw new Error(errorJson.error || errorJson.details || errorText);
                } catch (e) {
                    console.error('Download failed (text):', errorText);
                    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
                }
            }

            // Handle ZIP download
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;

            // Try to get filename from header or construct fallback
            const contentDisposition = response.headers.get('content-disposition');
            let filename = `${submission.rollNumber}_${submission.fullName}.zip`;

            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) {
                    filename = match[1];
                }
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            // alert('Download started!');

            toast.success('ZIP file downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            toast.error(`Failed to download submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const institutionLabel = INSTITUTION_OPTIONS.find(opt => opt.value === submission.institution)?.label || submission.institution;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
                    <h2 id="modal-title" className="text-xl font-bold text-slate-800">Submission Details</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleDownload}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            title="Download as ZIP"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download ZIP</span>
                        </button>
                        <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                        <DetailItem label="Full Name" value={submission.fullName} />
                        <DetailItem label="Email" value={<a href={`mailto:${submission.email}`} className="text-indigo-600 hover:underline">{submission.email}</a>} />
                        <DetailItem label="Roll Number" value={submission.rollNumber} />
                        <DetailItem label="Institution" value={institutionLabel} />
                        <DetailItem label="Batch Year" value={submission.batchYear} />
                        <DetailItem label="Submitted On" value={new Date(submission.createdAt).toLocaleString()} />
                    </div>

                    {submission.messageText && (
                        <div>
                            <h3 className="text-base font-semibold text-slate-700 mb-2">Message</h3>
                            <blockquote className="p-4 bg-slate-50 border-l-4 border-slate-300 text-slate-600 rounded-r-md">
                                {submission.messageText}
                            </blockquote>
                        </div>
                    )}

                    {submission.audioFileUrl && (
                        <div>
                            <h3 className="text-base font-semibold text-slate-700 mb-2">🎵 Voice Note</h3>
                            {isLoadingMedia ? (
                                <div className="flex items-center justify-center p-4 bg-slate-50 rounded-lg">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    <span className="ml-3 text-slate-600">Loading audio...</span>
                                </div>
                            ) : audioSignedUrl ? (
                                <audio controls src={audioSignedUrl} className="w-full" preload="metadata">
                                    Your browser does not support the audio element.
                                </audio>
                            ) : (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                    Failed to load audio file
                                </div>
                            )}
                        </div>
                    )}

                    {submission.videoFileUrl && (
                        <div>
                            <h3 className="text-base font-semibold text-slate-700 mb-2">🎥 Video Message</h3>
                            {isLoadingMedia ? (
                                <div className="flex items-center justify-center p-4 bg-slate-50 rounded-lg">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    <span className="ml-3 text-slate-600">Loading video...</span>
                                </div>
                            ) : videoSignedUrl ? (
                                <video controls src={videoSignedUrl} className="w-full rounded-lg max-h-96" preload="metadata">
                                    Your browser does not support the video element.
                                </video>
                            ) : (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                    Failed to load video file
                                </div>
                            )}
                        </div>
                    )}

                    {submission.imageFileUrls && submission.imageFileUrls.length > 0 && (
                        <div>
                            <h3 className="text-base font-semibold text-slate-700 mb-2">Images</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {submission.imageFileUrls.map((url, index) => (
                                    <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                        <img src={url} alt={`submission ${index + 1}`} className="rounded-lg object-cover h-40 w-full hover:opacity-80 transition-opacity" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-slate-200 pt-6 space-y-4">
                        <div>
                            <label htmlFor="reviewStatus" className="block text-base font-semibold text-slate-700 mb-2">Review Status</label>
                            <select
                                id="reviewStatus"
                                value={reviewStatus}
                                onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
                                className="w-full sm:w-1/2 px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                            >
                                {Object.values(ReviewStatus).map(status => (
                                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="adminNotes" className="block text-base font-semibold text-slate-700 mb-2">Admin Notes</label>
                            <textarea
                                id="adminNotes"
                                rows={4}
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                                placeholder="Add internal notes here..."
                            />
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default SubmissionDetailModal;
