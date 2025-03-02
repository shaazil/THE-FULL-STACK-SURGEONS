// // types.ts
// export interface Transcription {
//     text: string;
//     confidence?: number;
//   }
  
//   export interface GeminiResponse {
//     title: string;
//     content: string;
//     procedureType: string;
//     tags: string[];
//   }
  
//   export interface Note {
//     id: string;
//     title: string;
//     content: string;
//     transcription: string;
//     date?: string; // Keep for backward compatibility
//     createdAt?: string; // Add this for Firebase
//     procedureType: string;
//     tags: string[];
//     userId?: string;
//     audioFileUrl?: string;
//     audioFileName?: string;
//     updatedAt?: string;
//     duration?: string;
//   }
  
  export interface AudioUploadResult {
    fileUri: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    storagePath?: string;
  }

  // types.ts

// Transcription result
export interface Transcription {
  text: string;
  confidence?: number;
  language?: string;
  duration?: number;
  wordTimestamps?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}

// Gemini API response structure
export interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
  procedureType: string;
  title?: string;  // Add this
  content?: string; // Add this
  tags?: string[];  // Add this
}

// Structure for storing notes
export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  transcription: string;
  procedureType?: string;
  createdAt: string;
  tags?: string[];
  [key: string]: any; // For any additional fields
}

// User profile
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface AudioFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}