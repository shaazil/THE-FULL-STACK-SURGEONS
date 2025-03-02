import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Appbar, Searchbar, Card, Text, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { getNotes, searchNotes, deleteNote } from '../services/storageService';
import { Note } from '../types';

type HistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'History'>;

export default function HistoryScreen() {
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async (resetPagination = true) => {
    try {
      setLoading(true);
      if (resetPagination) {
        setPage(1);
      }
      
      const { notes: loadedNotes, hasMore: moreAvailable } = await getNotes(resetPagination ? 1 : page);
      
      if (resetPagination) {
        setNotes(loadedNotes);
        setFilteredNotes(loadedNotes);
      } else {
        setNotes(prev => [...prev, ...loadedNotes]);
        setFilteredNotes(prev => [...prev, ...loadedNotes]);
      }
      
      setHasMore(moreAvailable);
      setLoading(false);
    } catch (error) {
      console.error('Error loading notes:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load notes. Please try again.');
    }
  };

  const loadMoreNotes = async () => {
    if (!hasMore || loadingMore || loading) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      await loadNotes(false);
      setLoadingMore(false);
    } catch (error) {
      console.error('Error loading more notes:', error);
      setLoadingMore(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredNotes(notes);
      return;
    }
    
    try {
      const results = await searchNotes(query);
      setFilteredNotes(results);
    } catch (error) {
      console.error('Error searching notes:', error);
      Alert.alert('Error', 'Failed to search notes. Please try again.');
    }
  };

  const handleDeleteNote = (id: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(id);
              // Refresh the notes list
              loadNotes();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderNoteItem = ({ item }: { item: Note }) => {
    // Format date for display
    const date = new Date(item.createdAt || Date.now());
    const formattedDate = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
      >
        <Card style={styles.noteCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.noteTitle} numberOfLines={1} ellipsizeMode="tail">
                {item.title || 'Untitled Note'}
              </Text>
              <IconButton
                icon="delete"
                size={20}
                onPress={() => handleDeleteNote(item.id)}
                style={styles.deleteButton}
              />
            </View>
            
            <Text style={styles.noteDate}>{formattedDate}</Text>
            
            {item.procedureType && (
              <Chip style={styles.procedureChip}>
                {item.procedureType}
              </Chip>
            )}
            
            <Text style={styles.noteContent} numberOfLines={2} ellipsizeMode="tail">
              {item.content || item.transcription || 'No content'}
            </Text>
            
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {item.tags.slice(0, 3).map((tag, index) => (
                  <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                    {tag}
                  </Chip>
                ))}
                {item.tags.length > 3 && (
                  <Chip style={styles.tag} textStyle={styles.tagText}>
                    +{item.tags.length - 3}
                  </Chip>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Note History" />
        <Appbar.Action icon="refresh" onPress={() => loadNotes()} />
      </Appbar.Header>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search notes"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {loading && !loadingMore ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : filteredNotes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No matching notes found' : 'No notes saved yet'}
          </Text>
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={styles.clearSearchText}>Clear search</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.createNoteText}>Create your first note</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesList}
          onEndReached={!searchQuery ? loadMoreNotes : null}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  clearSearchText: {
    color: '#0077CC',
    marginTop: 10,
    fontSize: 16,
  },
  createNoteText: {
    color: '#0077CC',
    marginTop: 10,
    fontSize: 16,
  },
  notesList: {
    padding: 16,
  },
  noteCard: {
    marginBottom: 12,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  deleteButton: {
    margin: -8,
  },
  noteDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  procedureChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    backgroundColor: '#e8f0fe',
  },
  noteContent: {
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
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
});