import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, IconButton } from 'react-native-paper';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onDelete: (id: string) => void;
}

export default function NoteCard({ note, onPress, onDelete }: NoteCardProps) {
  // Format date for display
  const date = new Date(note.date);
  const formattedDate = date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {note.title}
            </Text>
            <IconButton
              icon="delete"
              size={20}
              onPress={() => onDelete(note.id)}
              style={styles.deleteButton}
            />
          </View>
          
          <Text style={styles.date}>{formattedDate}</Text>
          
          <Text style={styles.content} numberOfLines={2} ellipsizeMode="tail">
            {note.content}
          </Text>
          
          {note.tags && note.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {note.tags.slice(0, 3).map((tag, index) => (
                <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                  {tag}
                </Chip>
              ))}
              {note.tags.length > 3 && (
                <Chip style={styles.tag} textStyle={styles.tagText}>
                  +{note.tags.length - 3}
                </Chip>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  deleteButton: {
    margin: -8,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  content: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#e0f2fa',
  },
  tagText: {
    color: '#0077CC',
    fontSize: 12,
  },
});