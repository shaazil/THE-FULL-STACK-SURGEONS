import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Share, ActivityIndicator } from 'react-native';
import { Appbar, Text, Card, Chip, Button } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { getNoteById } from '../services/storageService'; // Import your service function
import { Note } from '../types';

type NoteDetailRouteProp = RouteProp<RootStackParamList, 'NoteDetail'>;
type NoteDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NoteDetail'>;

export default function NoteDetailScreen() {
  const navigation = useNavigation<NoteDetailNavigationProp>();
  const route = useRoute<NoteDetailRouteProp>();
  const { noteId } = route.params;
  
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscription, setShowTranscription] = useState(false);
  
  useEffect(() => {
    const loadNote = async () => {
      try {
        const loadedNote = await getNoteById(noteId);
        setNote(loadedNote);
        setLoading(false);
      } catch (error) {
        console.error('Error loading note:', error);
        setLoading(false);
      }
    };
    
    loadNote();
  }, [noteId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!note) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>Note not found</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }
  
  // Format date for display
  const date = new Date(note.date || note.createdAt || Date.now());
  const formattedDate = date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit' 
  });

  const handleShare = async () => {
    try {
      await Share.share({
        title: note.title,
        message: `${note.title}\n\n${note.content}\n\nDate: ${formattedDate}${note.procedureType ? `\nProcedure: ${note.procedureType}` : ''}`
      });
    } catch (error) {
      console.error('Error sharing note:', error);
    }
  };
  
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Note Details" />
        <Appbar.Action icon="share" onPress={handleShare} />
      </Appbar.Header>
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text style={styles.title}>{note.title}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
            
            {note.procedureType && (
              <Chip style={styles.procedureChip}>
                {note.procedureType}
              </Chip>
            )}
          </Card.Content>
        </Card>
        
        <Card style={styles.contentCard}>
          <Card.Content>
            <Text style={styles.contentText}>{note.content}</Text>
          </Card.Content>
        </Card>
        
        {note.tags && note.tags.length > 0 && (
          <Card style={styles.tagsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {note.tags.map((tag, index) => (
                  <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                    {tag}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}
        
        <Button 
          mode="outlined" 
          onPress={() => setShowTranscription(!showTranscription)}
          style={styles.transcriptionButton}
        >
          {showTranscription ? 'Hide Transcription' : 'Show Original Transcription'}
        </Button>
        
        {showTranscription && (
          <Card style={styles.transcriptionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Original Transcription</Text>
              <Text style={styles.transcriptionText}>{note.transcription}</Text>
            </Card.Content>
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
  loadingContainer: {  // Add this new style
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  procedureChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fa',
  },
  contentCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
  },
  tagsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#e0f2fa',
  },
  tagText: {
    color: '#0077CC',
  },
  transcriptionButton: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  transcriptionCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#f8f8f8',
  },
  transcriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
  },
});