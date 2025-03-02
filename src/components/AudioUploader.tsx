import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Text, Surface } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';

interface AudioUploaderProps {
  onFileSelect: (file: any) => void;
  selectedFile: any;
}

export default function AudioUploader({ onFileSelect, selectedFile }: AudioUploaderProps) {
  const [error, setError] = useState<string | null>(null);

  const pickDocument = async () => {
    try {
      setError(null);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validate file type
        const isAudioFile = file.mimeType && file.mimeType.startsWith('audio/');
        
        if (!isAudioFile) {
          setError('Please select an audio file (mp3, m4a, wav, etc.)');
          return;
        }
        
        // For web platform, ensure we have the necessary properties
        if (Platform.OS === 'web') {
          // Make sure we have a valid URI
          if (!file.uri) {
            setError('Could not access the selected file. Please try again.');
            return;
          }
          
          // Add file size if missing (common on web)
          if (!file.size && file.uri) {
            try {
              const response = await fetch(file.uri);
              const blob = await response.blob();
              file.size = blob.size;
            } catch (e) {
              console.warn('Could not determine file size:', e);
              // Continue anyway, not critical
              file.size = 0;
            }
          }
        }
        
        onFileSelect(file);
      }
    } catch (err) {
      console.error('Document picking error:', err);
      setError('Failed to select audio file. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Button
        mode="outlined"
        icon="file-upload"
        onPress={pickDocument}
        style={styles.button}
      >
        Select Audio File
      </Button>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {selectedFile && (
        <Surface style={styles.fileInfo}>
          <Text style={styles.fileName}>
            {selectedFile.name}
          </Text>
          <Text style={styles.fileDetails}>
            {selectedFile.size 
              ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` 
              : 'Size unknown'} 
            {selectedFile.mimeType ? ` • ${selectedFile.mimeType}` : ''}
          </Text>
        </Surface>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  button: {
    marginVertical: 10,
  },
  fileInfo: {
    padding: 12,
    elevation: 1,
    borderRadius: 8,
    marginTop: 10,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
  },
  fileDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  }
});