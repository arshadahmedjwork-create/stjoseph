/**
 * Supabase Client Initialization
 * 
 * This creates a Supabase client for frontend use.
 * Uses ANON key only - service role key is NEVER exposed to frontend.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Submit alumni memory via Edge Function
 * 
 * This function:
 * 1. Validates memory quality (tagMemory)
 * 2. Rejects low-signal submissions before storage
 * 3. Uploads media to Supabase Storage
 * 4. Inserts database record
 * 
 * @returns { status: 'accepted' | 'rejected', submissionId?, reason? }
 */
export async function submitAlumniMemory(
  formData: {
    fullName: string;
    institution: string;
    batchYear: string;
    rollNumber: string;
    dateOfBirth: string;
    email: string;
    phone?: string;
    consentGiven: boolean;
  },
  messageText: string,
  audioFile?: File,
  videoFile?: File
): Promise<{
  status: 'accepted' | 'rejected';
  submissionId?: string;
  reason?: string;
  tags?: string[];
  topTag?: string;
}> {
  const submissionId = crypto.randomUUID();
  
  // Build multipart form data
  const payload = new FormData();
  payload.append('submissionId', submissionId);
  payload.append('formData', JSON.stringify(formData));
  payload.append('messageText', messageText);
  
  if (audioFile) {
    payload.append('audioFile', audioFile);
  }
  
  if (videoFile) {
    payload.append('videoFile', videoFile);
  }
  
  // Call Edge Function using fetch to handle both 2xx and 422 responses
  const functionUrl = `${supabaseUrl}/functions/v1/submit-alumni-memory`;
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: payload,
  });
  
  const data = await response.json();
  
  // Handle rejection (422) as a valid response
  if (response.status === 422) {
    return data; // Contains { status: 'rejected', reason: '...' }
  }
  
  // Handle other errors
  if (!response.ok) {
    throw new Error(data.error || `Submission failed with status ${response.status}`);
  }
  
  return data;
}

/**
 * Get signed URLs for media files (Admin only)
 * 
 * @param paths - Array of storage paths (e.g., ['audio/uuid.webm', 'videos/uuid.mp4', 'images/uuid/0.jpg'])
 * @param expiresIn - Expiration time in seconds (default 600 = 10 minutes)
 * @returns Object mapping paths to signed URLs
 */
export async function getMediaSignedUrls(
  paths: string[],
  expiresIn: number = 600
): Promise<Record<string, string>> {
  const { data, error } = await supabase.functions.invoke('get-media-signed-url', {
    body: { paths, expiresIn },
  });
  
  if (error) {
    throw new Error(`Failed to get signed URLs: ${error.message}`);
  }
  
  return data.signedUrls;
}

/**
 * Fetch all submissions (Admin only)
 * Requires authenticated admin user
 */
export async function getSubmissions(filters?: {
  reviewStatus?: string;
  institution?: string;
  batchYear?: number;
  rejected?: boolean;
}) {
  let query = supabase
    .from('alumni_submissions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (filters?.reviewStatus) {
    query = query.eq('review_status', filters.reviewStatus);
  }
  
  if (filters?.institution) {
    query = query.eq('institution', filters.institution);
  }
  
  if (filters?.batchYear) {
    query = query.eq('batch_year', filters.batchYear);
  }
  
  if (filters?.rejected !== undefined) {
    query = query.eq('rejected', filters.rejected);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch submissions: ${error.message}`);
  }
  
  return data;
}

/**
 * Update submission review status (Admin only)
 */
export async function updateSubmissionStatus(
  submissionId: string,
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'flagged',
  adminNotes?: string
) {
  const { error } = await supabase
    .from('alumni_submissions')
    .update({
      review_status: reviewStatus,
      admin_notes: adminNotes,
    })
    .eq('id', submissionId)
    .select(); // Add select() to return updated row and properly trigger RLS
  
  if (error) {
    console.error('Update error:', error);
    throw new Error(`Failed to update submission: ${error.message}`);
  }
}
