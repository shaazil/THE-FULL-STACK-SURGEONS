import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Transcription } from '../types';

interface TranscriptionViewProps {
  transcription: Transcription;
}

export default function TranscriptionView({ transcription }: TranscriptionViewProps) {
  return (
    <View style={styles.container}>
      <Surface style={styles.transcriptionContainer}>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.transcriptionText}>
            {transcription.text}
          </Text>
        </ScrollView>
      </Surface>
      
      {transcription.confidence !== undefined && (
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Confidence:</Text>
          <Text style={styles.confidenceValue}>
            {(transcription.confidence * 100).toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  transcriptionContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    maxHeight: 200,
  },
  scrollView: {
    maxHeight: 180,
  },
  transcriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  confidenceContainer: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});