import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { transcribeAudio } from './transcriptionService';
import { Transcription } from '../types';

// Check if we're running on web platform
const isWeb = Platform.OS === 'web';

// Configuration for recording
const RECORDING_OPTIONS = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.MEDIUM,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  }
};

let recording: Audio.Recording | null = null;
let tempUri: string | null = null;

// Web-specific variables
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let webAudioBlob: Blob | null = null;

/**
 * Safely delete a file with platform compatibility
 */
async function safeDeleteFile(uri: string): Promise<void> {
  if (!isWeb) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
  // On web, we don't need to do anything as the blob URL will be garbage collected
}

/**
 * Starts a new audio recording
 * @returns Promise that resolves when recording starts
 */
export async function startRecording(): Promise<void> {
  try {
    // Clean up any previous recordings
    if (recording || mediaRecorder) {
      await stopRecording();
    }
    
    if (isWeb) {
      // Web implementation using MediaRecorder API
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      audioChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.start();
      console.log('Web recording started');
    } else {
      // Native implementation using Expo Audio
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Permission to access microphone was denied');
      }
      
      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      
      // Create a new recording
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(RECORDING_OPTIONS);
      await newRecording.startAsync();
      
      recording = newRecording;
      console.log('Native recording started');
    }
  } catch (error) {
    console.error('Failed to start recording', error);
    throw new Error(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Stops the current recording
 * @returns Promise that resolves with the recording URI
 */
export async function stopRecording(): Promise<string | null> {
  try {
    if (isWeb) {
      // Web implementation
      if (!mediaRecorder) {
        console.warn('No active web recording to stop');
        return null;
      }
      
      return new Promise((resolve, reject) => {
        mediaRecorder!.onstop = () => {
          try {
            webAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const uri = URL.createObjectURL(webAudioBlob);
            tempUri = uri;
            console.log('Web recording stopped and saved to', uri);
            resolve(uri);
          } catch (error) {
            reject(error);
          }
        };
        
        mediaRecorder!.stop();
        
        // Clean up the media stream
        const tracks = mediaRecorder!.stream.getTracks();
        tracks.forEach(track => track.stop());
        mediaRecorder = null;
      });
    } else {
      // Native implementation
      if (!recording) {
        console.warn('No active native recording to stop');
        return null;
      }
      
      // Stop the recording
      await recording.stopAndUnloadAsync();
      
      // Get the recording URI
      const uri = recording.getURI();
      
      // Save the URI for transcription
      tempUri = uri;
      
      // Clean up recording object
      recording = null;
      
      console.log('Native recording stopped and saved to', uri);
      return uri;
    }
  } catch (error) {
    console.error('Failed to stop recording', error);
    throw new Error(`Failed to stop recording: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Records audio and transcribes it in one function
 * @returns Promise with transcription result
 */
export async function recordAndTranscribe(): Promise<Transcription> {
  try {
    // Step 1: Start recording
    await startRecording();
    
    // Step 2: Wait for user to finish speaking (this would be controlled by your UI)
    // For simplicity, we'll just wait a fixed amount of time in this example
    // In a real app, you'd have a button to stop recording when the user is done
    
    // Step 3: Stop recording
    const audioUri = await stopRecording();
    
    if (!audioUri) {
      throw new Error('Failed to get audio URI');
    }
    
    // Step 4: Transcribe the audio
    const transcription = await transcribeAudio(audioUri);
    
    // Step 5: Clean up the temporary file
    await cleanupTempFile();
    
    return transcription;
  } catch (error) {
    console.error('Record and transcribe error:', error);
    throw new Error(`Failed to record and transcribe: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Clean up temporary recording file
 */
export async function cleanupTempFile(): Promise<void> {
  try {
    if (tempUri) {
      if (isWeb) {
        // For web, revoke the blob URL
        URL.revokeObjectURL(tempUri);
        webAudioBlob = null;
      } else {
        // For native, delete the file
        await safeDeleteFile(tempUri);
      }
      console.log('Temporary audio file cleaned up');
      tempUri = null;
    }
  } catch (error) {
    console.error('Failed to clean up temporary file', error);
    // Non-fatal error, just log it
  }
}

/**
 * Transcribes an existing audio file without storing it
 * @param uri URI of the audio file to transcribe
 * @returns Promise with transcription result
 */
export async function transcribeExistingAudio(uri: string): Promise<Transcription> {
  try {
    // Transcribe the audio
    const transcription = await transcribeAudio(uri);
    return transcription;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`);
  }
}