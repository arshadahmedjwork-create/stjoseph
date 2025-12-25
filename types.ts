
export enum Institution {
  SJCBA = 'SJCBA',
  SJPUC = 'SJPUC',
  SJIT = 'SJIT',
  Other = 'Other',
}

export enum ReviewStatus {
  Pending = 'pending',
  Approved = 'approved',
  Flagged = 'flagged',
}

export interface AlumniSubmission {
  id: string;
  createdAt: string;
  fullName: string;
  institution: Institution;
  batchYear: number;
  rollNumber: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
  messageText?: string;
  audioFileUrl?: string;
  videoFileUrl?: string;
  imageFileUrls?: string[];
  consentGiven: boolean;
  reviewStatus: ReviewStatus;
  adminNotes?: string;
}
