// services/transcriptionService.ts
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { getOpenAIKey, getOpenAIUrl, getGeminiKey, getGeminiUrl } from '../utils/apiKeyManager';

// Define Segment type for transcription segments
export interface Segment {
  id: number;
  text: string;
  start: number;
  end: number;
  confidence: number;
}

// Define Transcription type if not already defined elsewhere
export interface Transcription {
  text: string;
  confidence: number;
  language: string;
  duration: number;
  segments?: Segment[];
}

// Define the proxy server URL
const PROXY_SERVER_URL = 'http://localhost:3001';

/**
 * Check if we're running on web platform
 */
const isWeb = Platform.OS === 'web';

/**
 * Helper function to safely check file info with platform compatibility
 */
async function safeGetFileInfo(fileUri: string) {
  if (isWeb) {
    // On web, we can't use FileSystem.getInfoAsync, so we'll return a dummy object
    return { exists: true, size: 1000000 }; // Assume file exists and has a reasonable size
  } else {
    return await FileSystem.getInfoAsync(fileUri);
  }
}

/**
 * Helper function to safely read file as base64 with platform compatibility
 */
async function safeReadAsBase64(fileUri: string) {
  if (isWeb) {
    // On web, we need to handle this differently
    // For uploaded files, the URI might already be a data URL or a blob URL
    if (fileUri.startsWith('data:')) {
      // It's already a data URL, extract the base64 part
      return fileUri.split(',')[1];
    } else {
      // For blob URLs or other web URIs, we need to fetch and convert
      try {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error converting web file to base64:', error);
        throw new Error('Could not read audio file on web platform');
      }
    }
  } else {
    // On native platforms, use FileSystem
    return await FileSystem.readAsStringAsync(fileUri, { 
      encoding: FileSystem.EncodingType.Base64 
    });
  }
}

/**
 * Transcribes audio using OpenAI's Whisper API
 * @param fileUri - URI to the audio file
 * @returns Promise with transcription result
 */
export async function transcribeAudioWithWhisper(fileUri: string): Promise<Transcription> {
  try {
    const apiKey = await getOpenAIKey();
    const baseUrl = await getOpenAIUrl();
    const OPENAI_API_ENDPOINT = `${baseUrl}/audio/transcriptions`;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured. Please set in .env file or secure storage.');
    }
    
    // For web platform, we need to handle CORS differently
    if (isWeb) {
      console.log('[transcriptionService] Using web-specific approach for Whisper API');
      
      // Check if we have a valid API key before proceeding
      if (apiKey.startsWith('sk-')) {
        console.log('[transcriptionService] Valid OpenAI API key format detected');
      } else {
        console.warn('[transcriptionService] Invalid OpenAI API key format');
        throw new Error('Invalid OpenAI API key format. API keys should start with "sk-"');
      }
      
      // Get file info safely
      const fileInfo = await safeGetFileInfo(fileUri);
      
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }
      
      try {
        // Create a FormData object to send the file
        const formData = new FormData();
        
        // Determine file extension and MIME type
        const extension = fileUri.split('.').pop()?.toLowerCase() || 'm4a';
        const mimeType = getMimeType(extension);
        
        // For web, we need to fetch the blob first
        const response = await fetch(fileUri);
        const blob = await response.blob();
        
        // Create a File object from the blob
        const file = new File([blob], `audio.${extension}`, { type: mimeType });
        
        // Add the file to FormData
        formData.append('file', file);
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');
        
        console.log('[transcriptionService] Sending request to OpenAI Whisper API');
        
        // Make the API request
        const whisperResponse = await axios.post(OPENAI_API_ENDPOINT, formData, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 seconds timeout
        });
        
        console.log('[transcriptionService] Received response from Whisper API:', whisperResponse.data);
        
        // Process the response
        return {
          text: whisperResponse.data.text || '',
          confidence: whisperResponse.data.confidence || 0.9,
          language: whisperResponse.data.language || 'en',
          duration: calculateAudioDuration(blob.size),
          segments: whisperResponse.data.segments || generateBasicSegments(whisperResponse.data.text, calculateAudioDuration(blob.size))
        };
      } catch (apiError) {
        console.error('[transcriptionService] Whisper API error:', apiError);
        throw new Error(`Whisper API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
      }
    } else {
      // Native platform implementation
      // Create a FormData object to send the file
      const formData = new FormData();
      
      // Get file info safely
      const fileInfo = await safeGetFileInfo(fileUri);
      
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }
      
      // Determine file extension and MIME type
      const extension = fileUri.split('.').pop()?.toLowerCase() || 'm4a';
      const mimeType = getMimeType(extension);
      
      // Create a file blob
      let fileBlob;
      
      if (isWeb && fileUri.startsWith('blob:')) {
        // On web with blob URL, fetch the blob directly
        const response = await fetch(fileUri);
        const blob = await response.blob();
        fileBlob = new File([blob], `audio.${extension}`, { type: mimeType });
      } else {
        // Standard approach for native or data URIs
        fileBlob = {
          uri: fileUri,
          type: mimeType,
          name: `audio.${extension}`
        };
      }
      
      // @ts-ignore - Type issues with FormData in React Native
      formData.append('file', fileBlob);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      
      // Make the API request
      const response = await axios.post(OPENAI_API_ENDPOINT, formData, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout
      });
      
      // Process the response
      return {
        text: response.data.text || '',
        confidence: response.data.confidence || 0.9, // Whisper API doesn't always provide confidence scores
        language: response.data.language || 'en',
        duration: calculateAudioDuration(fileInfo.size),
        segments: response.data.segments || generateBasicSegments(response.data.text, calculateAudioDuration(fileInfo.size))
      };
    }
  } catch (error) {
    console.error('Whisper transcription service error:', error);
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error?.message || error.message;
      
      if (statusCode === 401) {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      } else {
        throw new Error(`Whisper API error (${statusCode}): ${errorMessage}`);
      }
    }
    
    throw new Error(`Failed to transcribe audio with Whisper: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Transcribes audio using Google's Gemini API
 * @param fileUri - URI to the audio file
 * @returns Promise with transcription result
 */
export async function transcribeAudioWithGemini(fileUri: string): Promise<Transcription> {
  try {
    const apiKey = await getGeminiKey();
    const baseUrl = await getGeminiUrl();
    
    if (!apiKey) {
      throw new Error('Gemini API key not configured. Please set in .env file or secure storage.');
    }
    
    // Get file info safely
    const fileInfo = await safeGetFileInfo(fileUri);
    
    if (!fileInfo.exists) {
      throw new Error('Audio file does not exist');
    }
    
    // Convert file to base64 safely
    const base64Audio = await safeReadAsBase64(fileUri);
    
    // Determine file extension and MIME type
    const extension = fileUri.split('.').pop()?.toLowerCase() || 'm4a';
    const mimeType = getMimeType(extension);
    
    // For web platform, we need to handle CORS differently
    if (isWeb) {
      console.log('[transcriptionService] Using web-specific approach for Gemini API');
      
      // For Gemini on web, we need to use a proxy server or backend API to handle CORS
      // Construct the API endpoint
      const GEMINI_API_ENDPOINT = `${baseUrl}/models/gemini-pro:transcribeContent`;
      
      try {
        // Create a FormData object for the request
        const formData = new FormData();
        
        // For web, we need to fetch the blob first
        const response = await fetch(fileUri);
        const blob = await response.blob();
        
        // Create a File object from the blob
        const file = new File([blob], `audio.${extension}`, { type: mimeType });
        
        // Add the file to FormData
        formData.append('file', file);
        formData.append('language', 'en');
        
        console.log('[transcriptionService] Sending request to Gemini API');
        
        // Make the API request
        const geminiResponse = await axios.post(GEMINI_API_ENDPOINT, {
          contents: [{
            parts: [{
              inline_data: {
                mime_type: mimeType,
                data: base64Audio
              }
            }]
          }],
          generationConfig: {
            maxOutputTokens: 2048,
          }
        }, {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          timeout: 30000,
        });
        
        console.log('[transcriptionService] Received response from Gemini API:', geminiResponse.data);
        
        // Extract the transcription text from response
        const text = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        return {
          text: text,
          confidence: 0.85, // Default confidence for Gemini
          language: 'en',
          duration: calculateAudioDuration(blob.size),
          segments: generateBasicSegments(text, calculateAudioDuration(blob.size))
        };
      } catch (apiError) {
        console.error('[transcriptionService] Gemini API error:', apiError);
        throw new Error(`Gemini API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
      }
    }
    
    // For Gemini, we'll use their speech recognition API endpoint
    // Note: Actual endpoint might differ based on Gemini's API structure
    const GEMINI_API_ENDPOINT = `${baseUrl}/models/gemini-pro:transcribeContent`;
    
    const response = await axios.post(GEMINI_API_ENDPOINT, {
      contents: [{
        parts: [{
          inline_data: {
            mime_type: mimeType,
            data: base64Audio
          }
        }]
      }],
      generationConfig: {
        maxOutputTokens: 2048,
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      timeout: 30000,
    });
    
    // Extract the transcription text from response
    // Note: This will need to be adjusted based on actual Gemini API response structure
    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return {
      text: text,
      confidence: 0.85, // Default confidence for Gemini
      language: 'en',
      duration: calculateAudioDuration(fileInfo.size),
      segments: generateBasicSegments(text, calculateAudioDuration(fileInfo.size))
    };
  } catch (error) {
    console.error('Gemini transcription service error:', error);
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error?.message || error.message;
      
      if (statusCode === 401 || statusCode === 403) {
        throw new Error('Invalid Gemini API key. Please check your configuration.');
      } else {
        throw new Error(`Gemini API error (${statusCode}): ${errorMessage}`);
      }
    }
    
    throw new Error(`Failed to transcribe audio with Gemini: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Main transcription function that tries OpenAI first, then falls back to Gemini
 * @param fileUri - URI to the audio file
 * @returns Promise with transcription result
 */
export async function transcribeAudio(fileUri: string): Promise<Transcription> {
  console.log('[transcriptionService] Starting transcription for file:', fileUri);
  
  if (!fileUri) {
    throw new Error('No audio file provided for transcription');
  }
  
  // For web platform, we need special handling
  if (isWeb) {
    console.log('[transcriptionService] Web platform detected, using web-specific transcription flow');
    
    try {
      // Get file info safely
      const fileInfo = await safeGetFileInfo(fileUri);
      
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }
      
      // For web, we need to fetch the blob first
      const response = await fetch(fileUri);
      const blob = await response.blob();
      
      // Try to get API keys
      const openAIKey = await getOpenAIKey().catch(err => {
        console.warn('[transcriptionService] Failed to get OpenAI API key:', err);
        return null;
      });
      
      const geminiKey = await getGeminiKey().catch(err => {
        console.warn('[transcriptionService] Failed to get Gemini API key:', err);
        return null;
      });
      
      // Check if we have valid API keys
      if (!openAIKey && !geminiKey) {
        throw new Error('No valid API keys found. Please configure your API keys in the settings.');
      }
      
      // Try Whisper first via proxy server
      if (openAIKey) {
        try {
          console.log('[transcriptionService] Attempting Whisper transcription via proxy server');
          
          // Create a FormData object to send the file
          const formData = new FormData();
          
          // Determine file extension and MIME type
          const extension = fileUri.split('.').pop()?.toLowerCase() || 'm4a';
          const mimeType = getMimeType(extension);
          
          // Create a File object from the blob
          const file = new File([blob], `audio.${extension}`, { type: mimeType });
          
          // Add the file to FormData
          formData.append('file', file);
          
          console.log('[transcriptionService] Sending request to proxy server with file:', file.name, file.size, 'bytes');
          
          // Send to proxy server
          const whisperResponse = await axios.post(`${PROXY_SERVER_URL}/api/whisper`, formData, {
            headers: {
              'x-api-key': openAIKey
            },
            timeout: 60000 // 60 seconds timeout
          });
          
          console.log('[transcriptionService] Received response from Whisper API via proxy:', whisperResponse.data);
          
          // Process the response
          return {
            text: whisperResponse.data.text || '',
            confidence: whisperResponse.data.confidence || 0.9,
            language: whisperResponse.data.language || 'en',
            duration: calculateAudioDuration(blob.size),
            segments: whisperResponse.data.segments || generateBasicSegments(whisperResponse.data.text, calculateAudioDuration(blob.size))
          };
        } catch (whisperError) {
          console.warn('[transcriptionService] Whisper transcription via proxy failed:', whisperError);
          
          // If Whisper fails, try Gemini
          if (!geminiKey) {
            throw whisperError; // Re-throw if we don't have a Gemini key
          }
        }
      }
      
      // Try Gemini as fallback via proxy server
      if (geminiKey) {
        try {
          console.log('[transcriptionService] Attempting Gemini transcription via proxy server');
          
          // Convert to base64 for processing
          const base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const dataUrl = reader.result as string;
              const base64 = dataUrl.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          
          // Determine file extension and MIME type
          const extension = fileUri.split('.').pop()?.toLowerCase() || 'm4a';
          const mimeType = getMimeType(extension);
          
          // Send to proxy server
          const geminiResponse = await axios.post(`${PROXY_SERVER_URL}/api/gemini`, {
            contents: [{
              parts: [{
                inline_data: {
                  mime_type: mimeType,
                  data: base64Audio
                }
              }]
            }],
            generationConfig: {
              maxOutputTokens: 2048,
            }
          }, {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': geminiKey
            },
            timeout: 60000 // 60 seconds timeout
          });
          
          console.log('[transcriptionService] Received response from Gemini API via proxy:', geminiResponse.data);
          
          // Extract the transcription text from response
          const text = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          return {
            text: text,
            confidence: 0.85, // Default confidence for Gemini
            language: 'en',
            duration: calculateAudioDuration(blob.size),
            segments: generateBasicSegments(text, calculateAudioDuration(blob.size))
          };
        } catch (geminiError) {
          console.error('[transcriptionService] Gemini transcription via proxy failed:', geminiError);
          throw geminiError;
        }
      }
      
      // If we get here, we have no working API
      throw new Error(
        'Transcription on web platforms requires a running proxy server. ' +
        'Please start the proxy server with "npm start" in the proxy-server directory, ' +
        'or use the mobile app for direct API access.'
      );
    } catch (error) {
      console.error('[transcriptionService] Web transcription error:', error);
      throw error;
    }
  } else {
    // Native platform flow
    try {
      // Try Whisper first
      console.log('[transcriptionService] Attempting Whisper transcription on native');
      return await transcribeAudioWithWhisper(fileUri);
    } catch (whisperError) {
      console.warn('[transcriptionService] Whisper transcription failed on native, trying Gemini as fallback:', whisperError);
      
      // Check if we hit a rate limit with Whisper
      const isRateLimit = whisperError instanceof Error && 
                          (whisperError.message.includes('429') || 
                           whisperError.message.includes('rate limit'));
      
      if (isRateLimit) {
        console.log('[transcriptionService] Whisper rate limit detected, waiting before trying Gemini');
        // Wait a moment before trying the fallback
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      try {
        // Try Gemini as fallback
        console.log('[transcriptionService] Attempting Gemini transcription on native');
        return await transcribeAudioWithGemini(fileUri);
      } catch (geminiError) {
        console.error('[transcriptionService] Both transcription services failed on native');
        console.error('[transcriptionService] Whisper error:', whisperError);
        console.error('[transcriptionService] Gemini error:', geminiError);
        
        // Throw a comprehensive error
        throw new Error(
          'Transcription failed with both services. ' +
          'Please check your API keys and internet connection. ' +
          `Whisper error: ${whisperError instanceof Error ? whisperError.message : String(whisperError)}. ` +
          `Gemini error: ${geminiError instanceof Error ? geminiError.message : String(geminiError)}`
        );
      }
    }
  }
}

/**
 * Estimate audio duration based on file size (rough approximation)
 * Assumes 16kHz mono audio at ~16Kbps
 */
function calculateAudioDuration(fileSize: number): number {
  // Rough estimate: ~2KB per second for compressed audio
  return fileSize / 2000;
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'm4a': 'audio/m4a',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'mpeg': 'audio/mpeg',
    'mp4': 'audio/mp4',
    'webm': 'audio/webm',
  };
  
  return mimeTypes[extension] || 'audio/m4a';
}

/**
 * Generate basic segments from text when API doesn't provide them
 */
function generateBasicSegments(text: string, totalDuration: number): Segment[] {
  // Split text into sentences (simple approach)
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  // Create segments with evenly distributed timing
  const segmentDuration = totalDuration / sentences.length;
  
  return sentences.map((sentence, index) => {
    const start = index * segmentDuration;
    const end = (index + 1) * segmentDuration;
    
    return {
      id: index,
      text: sentence.trim(),
      start,
      end,
      confidence: 0.85 // Default confidence
    };
  });
}