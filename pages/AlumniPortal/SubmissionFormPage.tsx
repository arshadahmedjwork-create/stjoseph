import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { INSTITUTION_OPTIONS, BATCH_YEAR_OPTIONS } from '../../constants';
import { Institution } from '../../types';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { MicrophoneIcon, StopIcon, UploadIcon, TrashIcon } from '../../components/Icons';
import Spinner from '../../components/Spinner';
import AudioVisualizer from '../../components/AudioVisualizer';
import { submitAlumniMemory } from '../../services/supabaseClient';

interface FormData {
  fullName: string;
  institution: Institution | '';
  batchYear: string;
  rollNumber: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  messageText: string;
  consentGiven: boolean;
}

// Moved component outside to prevent re-creation on every render (fixes focus loss)
const FormSection: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
  <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children}
      </div>
  </div>
);

// Moved component outside to prevent re-creation on every render (fixes focus loss)
const FormField: React.FC<{label: string, name: string, children: React.ReactNode, required?: boolean, colSpan?: string}> = ({label, name, children, required, colSpan="md:col-span-1"}) => (
  <div className={colSpan}>
      <label htmlFor={name} className="block text-sm font-bold text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
  </div>
);

const SubmissionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { recordingStatus, audioURL, stream, recordingTime, error: audioError, startRecording, stopRecording, resetRecording } = useAudioRecorder();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Track all generated URLs to revoke them on unmount
  const previewUrlsRef = useRef<string[]>([]);

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    institution: '',
    batchYear: BATCH_YEAR_OPTIONS[0],
    rollNumber: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    messageText: '',
    consentGiven: false,
  });

  const isFormValid = useMemo(() => {
    return (
      formData.fullName &&
      formData.institution &&
      formData.batchYear &&
      formData.rollNumber &&
      formData.dateOfBirth &&
      /^\S+@\S+\.\S+$/.test(formData.email) &&
      formData.consentGiven &&
      (formData.messageText || audioURL || videoFile)
    );
  }, [formData, audioURL, videoFile]);

  // Cleanup all object URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Size check: 50MB for videos
      if (file.size > 50 * 1024 * 1024) {
        setSubmitError("Video file is too large. Maximum size is 50MB.");
        setTimeout(() => setSubmitError(null), 5000);
        return;
      }

      // Remove old preview if exists
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
        previewUrlsRef.current = previewUrlsRef.current.filter(url => url !== videoPreview);
      }

      const preview = URL.createObjectURL(file);
      previewUrlsRef.current.push(preview);

      setVideoFile(file);
      setVideoPreview(preview);
    }
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      previewUrlsRef.current = previewUrlsRef.current.filter(url => url !== videoPreview);
    }
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
        setSubmitError("Please fill all required fields and give consent.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare audio file if recorded
      let audioFileToSubmit: File | undefined = undefined;
      if (audioURL) {
        const audioBlob = await fetch(audioURL).then(r => r.blob());
        audioFileToSubmit = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      }

      // Submit to Supabase Edge Function
      const result = await submitAlumniMemory(
        {
          fullName: formData.fullName,
          institution: formData.institution,
          batchYear: formData.batchYear,
          rollNumber: formData.rollNumber,
          dateOfBirth: formData.dateOfBirth,
          email: formData.email,
          phone: formData.phone,
          consentGiven: formData.consentGiven,
        },
        formData.messageText,
        audioFileToSubmit,
        videoFile || undefined
      );

      if (result.status === 'rejected') {
        // Quality gate rejection - show friendly error message
        setSubmitError(
          `We need a bit more detail! ${result.reason} Please add more specific memories, stories, or reflections about your time at St. Joseph's.`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsSubmitting(false);
        return;
      }

      // Success!
      setIsSubmitting(false);
      navigate('/alumni/thank-you', { state: { batchYear: formData.batchYear } });

    } catch (err) {
      console.error("Submission failed", err);
      setSubmitError(
        err instanceof Error 
          ? `Submission failed: ${err.message}` 
          : "Failed to submit. Please check your internet connection and try again."
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsSubmitting(false);
    }
  };

  // Helper to format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Common input class with high visibility text and slightly darker border for better contrast
  const inputClass = "w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-900">Share Your Tribute</h2>
        <p className="text-gray-600 text-center mb-8">Fields marked with <span className="text-red-500">*</span> are required.</p>
        
        {submitError && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-5 rounded-lg shadow-md animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-bold text-red-800">Submission Issue</h3>
                <p className="mt-1 text-sm text-red-700 leading-relaxed">{submitError}</p>
              </div>
              <button 
                onClick={() => setSubmitError(null)}
                className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <FormSection title="1. Alumni Details">
            <FormField label="Full Name" name="fullName" required>
                <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleInputChange} className={inputClass} placeholder="e.g. John Doe" required />
            </FormField>
            <FormField label="Institution" name="institution" required>
                <select name="institution" id="institution" value={formData.institution} onChange={handleInputChange} className={inputClass} required>
                    <option value="" disabled>Select Institution</option>
                    {INSTITUTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </FormField>
            <FormField label="Batch / Year of Graduation" name="batchYear" required>
                <select name="batchYear" id="batchYear" value={formData.batchYear} onChange={handleInputChange} className={inputClass} required>
                    {BATCH_YEAR_OPTIONS.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
            </FormField>
            <FormField label="Roll Number" name="rollNumber" required>
                <input type="text" name="rollNumber" id="rollNumber" value={formData.rollNumber} onChange={handleInputChange} className={inputClass} placeholder="e.g. 2010-123" required />
            </FormField>
            <FormField label="Date of Birth" name="dateOfBirth" required colSpan="md:col-span-2">
                <input type="date" name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className={inputClass} required />
            </FormField>
          </FormSection>

          <FormSection title="2. Contact Information">
             <FormField label="Email Address" name="email" required>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} className={inputClass} placeholder="john@example.com" required />
            </FormField>
             <FormField label="Phone Number (Optional)" name="phone">
                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} className={inputClass} placeholder="+1 (555) 123-4567" />
            </FormField>
          </FormSection>

          <FormSection title="3. Your Tribute / Memory">
            <FormField label="Text Message" name="messageText" colSpan="md:col-span-2">
                <textarea name="messageText" id="messageText" value={formData.messageText} onChange={handleInputChange} rows={6} className={inputClass} placeholder="Share your stories, wishes, or reflections..."></textarea>
            </FormField>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Voice Note (Optional)
                <span className="block text-xs font-normal text-gray-500 mt-1">Record your memory using your device's microphone</span>
              </label>
              <div className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center space-y-4 transition-all duration-300 ${recordingStatus === 'recording' ? 'border-blue-500 bg-blue-50 shadow-lg' : audioURL ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}>
                
                {/* Visualizer Area */}
                {recordingStatus === 'recording' && (
                   <div className="w-full max-w-md h-20 mb-2">
                      <AudioVisualizer stream={stream} height={80} />
                   </div>
                )}

                {/* Timer Display */}
                {recordingStatus === 'recording' && (
                    <div className="text-2xl font-mono font-bold text-blue-600 tabular-nums">
                        {formatTime(recordingTime)}
                    </div>
                )}

                <div className="flex flex-col items-center space-y-3">
                  {recordingStatus === 'recording' ? (
                    <>
                      <div className="flex items-center space-x-2 text-red-600 animate-pulse">
                        <div className="h-3 w-3 bg-red-600 rounded-full"></div>
                        <span className="text-sm font-semibold">Recording in progress...</span>
                      </div>
                      <button type="button" onClick={stopRecording} className="flex items-center space-x-2 bg-red-600 text-white font-bold py-3 px-8 rounded-full hover:bg-red-700 shadow-lg transition-all hover:scale-105">
                        <StopIcon className="h-6 w-6" />
                        <span>Stop & Save Recording</span>
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={startRecording} disabled={recordingStatus === 'recording'} className="flex items-center space-x-2 bg-blue-600 text-white font-bold py-3 px-8 rounded-full disabled:bg-gray-400 hover:bg-blue-700 shadow-lg transition-all hover:scale-105 hover:shadow-xl">
                      <MicrophoneIcon className="h-6 w-6" />
                      <span>{audioURL ? ' Record New Voice Note' : ' Start Recording'}</span>
                    </button>
                  )}
                </div>

                {audioURL && recordingStatus !== 'recording' && (
                  <div className="w-full max-w-md mt-4">
                    <div className="p-4 bg-white rounded-lg border-2 border-green-300 shadow-md flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-700 flex items-center">
                          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Recording saved successfully
                        </span>
                        <button type="button" onClick={resetRecording} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors" title="Delete and record new">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <audio src={audioURL} controls className="w-full" />
                    </div>
                  </div>
                )}
                
                {recordingStatus === 'error' && (
                  <div className="w-full max-w-md p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium flex items-start">
                      <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>
                        <strong>Microphone access required:</strong> {audioError}<br/>
                        <span className="text-xs">Please allow microphone access in your browser settings and try again.</span>
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Video Upload (Optional)
                <span className="block text-xs font-normal text-gray-500 mt-1">MP4, WebM, or MOV up to 50MB</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-all bg-white hover:border-gray-400">
                  <div className="space-y-2 text-center">
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center items-center">
                      <label htmlFor="video-upload" className="relative cursor-pointer bg-white rounded-md font-semibold text-blue-600 hover:text-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-colors">
                        <span>📹 Choose a video file</span>
                        <input id="video-upload" name="video-upload" type="file" className="sr-only" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoChange} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                  </div>
              </div>
              {videoPreview && (
                <div className="mt-4">
                  <div className="relative group rounded-lg overflow-hidden shadow-lg border-2 border-green-300">
                    <video src={videoPreview} controls className="w-full max-h-64 bg-black" />
                    <div className="absolute top-3 right-3">
                      <button type="button" onClick={removeVideo} className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white transition-all transform hover:scale-110 shadow-xl">
                          <TrashIcon className="h-5 w-5"/>
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                      <p className="text-white text-sm font-semibold flex items-center">
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Video ready to submit
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </FormSection>

          <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="consentGiven"
                  name="consentGiven"
                  type="checkbox"
                  checked={formData.consentGiven}
                  onChange={handleInputChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="consentGiven" className="font-bold text-gray-700 cursor-pointer">
                  Consent and Agreement <span className="text-red-500">*</span>
                </label>
                <p className="text-gray-600">I agree that my message, audio, and video may be used in the 60-year commemorative book and other official St. Joseph's publications.</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full md:w-auto flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed transform active:scale-95"
            >
              {isSubmitting ? <><Spinner /> <span className="ml-2">Submitting...</span></> : 'Submit Tribute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmissionFormPage;