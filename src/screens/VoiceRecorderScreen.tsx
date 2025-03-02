import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { startRecording, stopRecording, cleanupTempFile } from '../services/audioRecorderService';
import { transcribeAudio } from '../services/transcriptionService';
import { generateMedicalNotes } from '../services/geminiService';
import { saveNote } from '../services/storageService';
import { Note } from '../types';

export default function VoiceRecorderScreen({ navigation }: any) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [procedureType, setProcedureType] = useState('');
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTempFile().catch(console.error);
    };
  }, []);
  
  const handleStartRecording = async () => {
    try {
      // Reset states
      setTranscription('');
      setGeneratedNotes('');
      setProcedureType('');
      
      // Start recording
      await startRecording();
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', `Failed to start recording: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      setIsTranscribing(true);
      
      // Stop recording and get the URI
      const audioUri = await stopRecording();
      
      if (!audioUri) {
        throw new Error('No audio recorded');
      }
      
      // Transcribe the audio
      const result = await transcribeAudio(audioUri);
      setTranscription(result.text);
      
      // If transcription is successful, generate medical notes
      if (result.text) {
        setIsTranscribing(false);
        setIsGeneratingNotes(true);
        
        const notesResult = await generateMedicalNotes(result.text);
        setGeneratedNotes(notesResult.candidates?.[0]?.content?.parts?.[0]?.text || '');
        setProcedureType(notesResult.procedureType || '');
        
        setIsGeneratingNotes(false);
      } else {
        setIsTranscribing(false);
        Alert.alert('Warning', 'No text was transcribed. Please try recording again.');
      }
      
      // Clean up the temporary file
      await cleanupTempFile();
    } catch (error) {
      setIsRecording(false);
      setIsTranscribing(false);
      setIsGeneratingNotes(false);
      Alert.alert('Error', `Recording failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const handleSaveNote = async () => {
    try {
      if (!transcription || !generatedNotes) {
        Alert.alert('Error', 'Nothing to save. Please record and transcribe first.');
        return;
      }
      
      // Create a new note
      const newNote: Partial<Note> = {
        title: `Note - ${new Date().toLocaleDateString()}`,
        content: generatedNotes,
        transcription: transcription,
        procedureType: procedureType,
        tags: [],
        date: new Date().toISOString(),
      };
      
      // Save the note
      const noteId = await saveNote(newNote as Note);
      
      Alert.alert('Success', 'Note saved successfully!', [
        { 
          text: 'View Note', 
          onPress: () => navigation.navigate('NoteDetail', { noteId }) 
        },
        { text: 'OK' }
      ]);
      
      // Reset states
      setTranscription('');
      setGeneratedNotes('');
      setProcedureType('');
    } catch (error) {
      Alert.alert('Error', `Failed to save note: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Recorder</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {isTranscribing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Transcribing audio...</Text>
          </View>
        ) : isGeneratingNotes ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Generating medical notes...</Text>
          </View>
        ) : (
          <>
            {transcription ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Transcription</Text>
                <Text style={styles.transcriptionText}>{transcription}</Text>
              </View>
            ) : null}
            
            {generatedNotes ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Medical Notes</Text>
                <Text style={styles.notesText}>{generatedNotes}</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.recordButton, isRecording ? styles.recordingActive : null]} 
          onPress={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isTranscribing || isGeneratingNotes}
        >
          <Ionicons 
            name={isRecording ? "stop" : "mic"} 
            size={32} 
            color="white" 
          />
        </TouchableOpacity>
        
        {(transcription && generatedNotes) ? (
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSaveNote}
            disabled={isTranscribing || isGeneratingNotes}
          >
            <Ionicons name="save-outline" size={24} color="white" />
            <Text style={styles.saveButtonText}>Save Note</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  transcriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  recordingActive: {
    backgroundColor: '#cc0000',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4caf50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginLeft: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  saveButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
  },
});