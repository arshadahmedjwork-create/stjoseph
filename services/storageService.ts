import { AlumniSubmission, Institution, ReviewStatus } from '../types';

const STORAGE_KEY = 'alumni_portal_db_v1';

// Mock data to populate the DB initially so it doesn't look empty
const INITIAL_MOCK_DATA: AlumniSubmission[] = Array.from({ length: 5 }, (_, i) => ({
  id: `mock_${i + 1}`,
  createdAt: new Date(Date.now() - (i + 1) * 1000 * 60 * 60 * 24).toISOString(),
  fullName: `Alumni Sample ${i + 1}`,
  institution: Object.values(Institution)[i % 5],
  batchYear: 2010 - i,
  rollNumber: `SAMPLE-${100 + i}`,
  dateOfBirth: `1990-01-0${i + 1}`,
  email: `sample${i + 1}@example.com`,
  messageText: "This is a sample legacy submission to demonstrate the dashboard layout.",
  consentGiven: true,
  reviewStatus: ReviewStatus.Pending,
  imageFileUrls: [],
}));

// Helper to convert Blob/File to Base64
export const fileToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const storageService = {
  getAllSubmissions: (): AlumniSubmission[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Initialize with mock data if empty
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DATA));
        return INITIAL_MOCK_DATA;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error("Database read error", error);
      return [];
    }
  },

  saveSubmission: (submission: AlumniSubmission): void => {
    try {
      const current = storageService.getAllSubmissions();
      // Add new submission to the top of the list
      const updated = [submission, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Database write error", error);
      alert("Storage full! Please clear local data or upload smaller files.");
    }
  },

  updateSubmission: (updatedSubmission: AlumniSubmission): void => {
    const current = storageService.getAllSubmissions();
    const index = current.findIndex(s => s.id === updatedSubmission.id);
    if (index !== -1) {
      current[index] = updatedSubmission;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
  },

  // Simulates a "Server" delay
  simulateNetworkDelay: async (ms: number = 800) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
