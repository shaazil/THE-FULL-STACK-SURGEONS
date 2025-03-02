import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Button, Card, Text, ActivityIndicator, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabsParamList, AppStackParamList } from '../navigation';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import AudioUploader from '../components/AudioUploader';
import TranscriptionView from '../components/TranscriptionView';
import { uploadAudio } from '../services/audioService';
import { transcribeAudio } from '../services/transcriptionService';
import { generateMedicalNotes } from '../services/geminiService';
import { saveNote } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { Note,Transcription,GeminiResponse,AudioUploadResult } from '../types';

// Fix the composite navigation type
type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>;


export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const [audioFile, setAudioFile] = useState<any>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [notes, setNotes] = useState<GeminiResponse | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAudioSelect = (file: any) => {
    setAudioFile(file);
    setTranscription(null);
    setNotes(null);
  };

  const handleTranscribe = async () => {
    if (!audioFile) {
      Alert.alert('Error', 'Please select an audio file first');
      return;
    }

    try {
      setLoading('Transcribing audio...');
      
      // Get the file URI
      const fileUri = audioFile.uri;
      
      if (!fileUri) {
        throw new Error('Invalid audio file. Please select another file.');
      }
      
      // Upload the file to storage (only if needed)
      let uploadedUri = fileUri;
      
      // Only upload to Firebase if we're not on web or if explicitly required
      if (Platform.OS !== 'web') {
        try {
          uploadedUri = await uploadAudio(audioFile);
          console.log('Audio uploaded to:', uploadedUri);
        } catch (uploadError) {
          console.warn('Upload failed, proceeding with local URI:', uploadError);
          // Continue with local URI if upload fails
        }
      }
      
      // Get transcription
      const result = await transcribeAudio(uploadedUri);
      
      if (!result || !result.text) {
        throw new Error('Transcription failed. No text was generated.');
      }
      
      setTranscription(result);
      setLoading(null);
    } catch (error) {
      console.error('Transcription error:', error);
      setLoading(null);
      Alert.alert('Error', `Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleGenerateNotes = async () => {
    if (!transcription) {
      Alert.alert("Error", "Please transcribe the audio first");
      return;
    }
  
    try {
      setLoading("Generating medical notes...");
      
      const result = await generateMedicalNotes(transcription.text);
      console.log("Generated notes:", result);
      
      // Extract the content from the Gemini response
      const generatedContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const procedureType = result.procedureType || '';
      
      if (!generatedContent) {
        throw new Error("Invalid notes generated");
      }
  
      // Create a compatible object before setting state
      const compatibleResult: GeminiResponse = {
        candidates: result.candidates,
        title: result.title,
        content: generatedContent,
        procedureType: procedureType,
        tags: result.tags || [] // Ensure tags is always an array
      };
  
      setNotes(compatibleResult);
      setLoading(null);
    } catch (error) {
      console.error(error);
      setLoading(null);
      Alert.alert("Error", "Failed to generate notes. Please try again.");
    }
  };

  const handleSaveNotes = async () => {
    if (!notes || !transcription) {
      Alert.alert('Error', 'Please generate notes first');
      return;
    }

    try {
      setLoading('Saving notes...');
      
      // Create a simplified note object matching our Supabase schema
      const newNote: Note = {
        id: Date.now().toString(), // This will be overwritten by Supabase
        title: notes.title || "Medical Notes",
        content: notes.content || "",
        transcription: transcription.text,
        createdAt: new Date().toISOString(),
        procedureType: notes.procedureType || "",
        tags: notes.tags || [],
        userId: user?.uid || 'anonymous'
      };
      
      await saveNote(newNote);
      setLoading(null);
      
      Alert.alert(
        'Success', 
        'Notes saved successfully!',
        [
          { 
            text: 'View in History', 
            onPress: () => navigation.navigate('History')
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
      
      // Reset state
      setAudioFile(null);
      setTranscription(null);
      setNotes(null);
      
    } catch (error) {
      console.error(error);
      setLoading(null);
      Alert.alert('Error', 'Failed to save notes. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Title title="Upload Audio" subtitle="Select a medical procedure recording" />
          <Card.Content>
            <AudioUploader onFileSelect={handleAudioSelect} selectedFile={audioFile} />
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="contained" 
              onPress={handleTranscribe}
              disabled={!audioFile || loading !== null}
            >
              Transcribe Audio
            </Button>
          </Card.Actions>
        </Card>

        {loading && (
          <Card style={styles.card}>
            <Card.Content style={styles.loadingContainer}>
              <ActivityIndicator animating={true} size="large" />
              <Text style={styles.loadingText}>{loading}</Text>
            </Card.Content>
          </Card>
        )}

        {transcription && (
          <Card style={styles.card}>
            <Card.Title title="Transcription" subtitle="Raw transcribed text" />
            <Card.Content>
              <TranscriptionView transcription={transcription} />
            </Card.Content>
            <Card.Actions>
              <Button 
                mode="contained" 
                onPress={handleGenerateNotes}
                disabled={loading !== null}
              >
                Generate Notes
              </Button>
            </Card.Actions>
          </Card>
        )}

        {notes && (
          <Card style={styles.card}>
            <Card.Title 
              title={notes.title || 'Medical Notes'} 
              subtitle={notes.procedureType || 'Procedure Notes'} 
            />
            <Card.Content>
              <Text style={styles.notesContent}>{notes.content}</Text>
              
              {notes.tags && notes.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  <Divider style={styles.divider} />
                  <Text style={styles.tagsTitle}>Tags:</Text>
                  <View style={styles.tagsList}>
                    {notes.tags.map((tag: string, index: number) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card.Content>
            <Card.Actions>
              <Button 
                mode="contained" 
                onPress={handleSaveNotes}
                disabled={loading !== null}
              >
                Save Notes
              </Button>
            </Card.Actions>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  notesContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  divider: {
    marginVertical: 16,
  },
  tagsContainer: {
    marginTop: 16,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e0f2fa',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  tagText: {
    color: '#0077CC',
    fontSize: 14,
  },
});