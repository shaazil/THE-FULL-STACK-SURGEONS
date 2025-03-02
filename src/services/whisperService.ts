import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { Transcription } from '../types';
import { getOpenAIKey, getOpenAIUrl } from '../utils/apiKeyManager';

/**
 * Transcribes audio using OpenAI's Whisper API without cloud storage
 * @param fileUri - Local URI to the audio file
 * @returns Promise with transcription result
 */
export async function transcribeAudio(fileUri: string): Promise<Transcription> {
  try {
    // Get API key and URL from centralized apiKeyManager
    const apiKey = await getOpenAIKey();
    const baseUrl = await getOpenAIUrl();
    const apiEndpoint = `${baseUrl}/audio/transcriptions`;
    const model = 'whisper-1';
    const timeout = 60000;

    // Get file info to ensure it exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('Audio file does not exist');
    }

    // Create FormData to send audio file
    const formData = new FormData();
    
    // Add the audio file
    formData.append('file', {
      uri: fileUri,
      name: 'audio.m4a',
      type: 'audio/m4a',
    } as any);
    
    // Add model parameter
    formData.append('model', model);
    
    // Optional: Add language parameter if you know the language
    formData.append('language', 'en');
    
    // Optional: Add response_format for JSON
    formData.append('response_format', 'json');
    
    // Call the Whisper API
    const response = await axios({
      method: 'POST',
      url: apiEndpoint,
      data: formData,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'multipart/form-data',
      },
      timeout: timeout,
    });
    
    // Process Whisper API response
    return {
      text: response.data.text || '',
      confidence: 0.9, // Whisper doesn't provide confidence scores
      language: response.data.language || 'en',
      duration: 0, // Whisper doesn't provide duration
    };
  } catch (error) {
    console.error('Whisper transcription error:', error);
    
    // In development mode, fallback to mock
    if (__DEV__) {
      return await developmentMockTranscription(fileUri);
    }
    
    // In production, throw the error
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error?.message || error.message;
      
      if (statusCode === 401) {
        throw new Error(`Authentication failed: Invalid API key`);
      } else {
        throw new Error(`Whisper API error (${statusCode}): ${errorMessage}`);
      }
    }
    
    throw new Error(`Transcription failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Development mock for transcription
 */
async function developmentMockTranscription(fileUri: string): Promise<Transcription> {
  console.log('Using development mock transcription for:', fileUri);
  
  return new Promise((resolve) => {
    // Create a hash-like value from the fileUri to consistently return the same
    // transcription for the same file
    let hashValue = 0;
    for (let i = 0; i < fileUri.length; i++) {
      hashValue = (hashValue + fileUri.charCodeAt(i)) % 5;
    }
    
    // Realistic medical transcriptions
    const transcriptions = [
      {
        text: "Patient is a 45-year-old female presenting with lower back pain that began approximately three weeks ago. Pain is described as dull and constant, rated 6 out of 10. Pain radiates down the left leg. Patient reports no trauma or previous back injuries. Physical examination reveals tenderness in the lumbar region with positive straight leg raising test on the left. Neurological examination shows decreased sensation in L5 distribution. Recommending MRI of the lumbar spine to rule out disc herniation. Prescribing NSAIDs for pain management and referring to physical therapy.",
        confidence: 0.93,
        language: "en",
        duration: 98.4
      },
      {
        text: "Performing laparoscopic cholecystectomy on a 62-year-old male with symptomatic gallstones. Patient has a history of hypertension controlled with lisinopril. Pre-operative labs within normal limits. Using four-port technique with camera port at umbilicus. Gallbladder appears mildly inflamed but no evidence of acute cholecystitis. Critical view of safety achieved with clear identification of cystic duct and cystic artery. Both structures clipped and divided. Gallbladder dissected from liver bed using electrocautery. Specimen removed in retrieval bag through umbilical port. All ports closed with absorbable sutures. Patient tolerated procedure well with minimal blood loss.",
        confidence: 0.89,
        language: "en",
        duration: 155.2
      },
      {
        text: "Conducting physical examination on a 7-year-old male presenting with three-day history of fever, cough, and nasal congestion. Temperature 101.2°F. Throat appears erythematous with tonsillar enlargement. No exudate visible. Cervical lymphadenopathy noted. Lungs clear to auscultation bilaterally. Tympanic membranes appear normal. Assessment: Likely viral upper respiratory infection. Plan: Symptomatic management with acetaminophen for fever, adequate hydration, and rest. Return if symptoms worsen or fail to improve within 5-7 days.",
        confidence: 0.95,
        language: "en",
        duration: 82.7
      },
      {
        text: "Reviewing MRI results with patient who presented with progressive right knee pain over 6 months. Images show medial meniscus tear with mild degenerative changes. Discussing treatment options including physical therapy versus arthroscopic intervention. Patient elects to try conservative management first. Prescribing anti-inflammatory medication and referring to orthopedic physical therapy. Will reassess in 6 weeks and consider surgical intervention if no improvement.",
        confidence: 0.91,
        language: "en",
        duration: 75.3
      },
      {
        text: "Emergency department evaluation of 58-year-old male with sudden onset chest pain radiating to left arm. Pain described as pressure-like, 8/10 severity. Associated with diaphoresis and mild shortness of breath. EKG shows ST elevation in leads II, III, and aVF. Troponin elevated at 0.8 ng/mL. Administering aspirin 325mg, clopidogrel 600mg loading dose, and heparin bolus. Activating cardiac catheterization lab for primary PCI. Cardiology team arriving within 10 minutes for emergent intervention.",
        confidence: 0.87,
        language: "en", 
        duration: 112.8
      }
    ];
    
    // Simulate processing time based on file size
    setTimeout(() => {
      resolve(transcriptions[hashValue]);
    }, 1500 + (hashValue * 500));
  });
}