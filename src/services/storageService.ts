import { Note, UserProfile } from '../types';
import { getAuth } from 'firebase/auth';
import { supabase } from '../firebase/supabaseConfig';
import { getSupabaseUrl, getSupabaseKey } from '../utils/apiKeyManager';

const NOTES_TABLE = 'notes';
const PAGE_SIZE = 20;

/**
 * Get current user ID from Firebase Auth
 * @returns User ID or null if not authenticated
 */
function getCurrentUserId(): string | null {
  const auth = getAuth();
  return auth.currentUser?.uid || null;
}

/**
 * Save a new note to Supabase
 */
export async function saveNote(note: Note): Promise<string> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Add user ID, timestamps and ensure required fields
    const noteWithMetadata = {
      userId,
      title: note.title || 'Untitled Note',
      content: note.content || '',
      transcription: note.transcription || '',
      procedureType: note.procedureType || '',
      createdAt: new Date().toISOString(),
      tags: Array.isArray(note.tags) ? note.tags : []
    };
    
    // Add note to Supabase
    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .insert(noteWithMetadata)
      .select();
    
    if (error) throw error;
    
    return data?.[0]?.id || '';
  } catch (error) {
    console.error('Error saving note to Supabase:', error);
    throw new Error(`Failed to save note: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Update an existing note in Supabase
 */
export async function updateNote(id: string, noteData: Partial<Note>): Promise<void> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Verify ownership
    const { data: existingNote, error: fetchError } = await supabase
      .from(NOTES_TABLE)
      .select('userId')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    if (!existingNote) throw new Error('Note not found');
    if (existingNote.userId !== userId) throw new Error('Not authorized to update this note');
    
    // Update the note with new data
    const { error } = await supabase
      .from(NOTES_TABLE)
      .update({
        ...noteData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating note in Supabase:', error);
    throw new Error(`Failed to update note: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get paginated notes from Supabase
 */
export async function getNotes(
  page: number = 1,
  limitCount: number = PAGE_SIZE
): Promise<{notes: Note[], hasMore: boolean}> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Calculate offset for pagination
    const offset = (page - 1) * limitCount;
    
    // Create query for user's notes ordered by creation date
    const { data, error, count } = await supabase
      .from(NOTES_TABLE)
      .select('*', { count: 'exact' })
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limitCount - 1);
    
    if (error) throw error;
    
    // Type the data as Note[]
    const notes = (data || []) as Note[];
    
    return {
      notes,
      hasMore: (count || 0) > offset + limitCount
    };
  } catch (error) {
    console.error('Error getting notes from Supabase:', error);
    throw new Error(`Failed to fetch notes: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get a specific note by ID from Supabase
 */
export async function getNoteById(id: string): Promise<Note> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Note not found');
    
    // Verify ownership
    if (data.userId !== userId) {
      throw new Error('Not authorized to access this note');
    }
    
    return data as Note;
  } catch (error) {
    console.error('Error getting note by ID from Supabase:', error);
    throw new Error(`Failed to fetch note: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Delete a note by ID from Supabase
 */
export async function deleteNote(id: string): Promise<void> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Verify ownership
    const { data: existingNote, error: fetchError } = await supabase
      .from(NOTES_TABLE)
      .select('userId')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    if (!existingNote) throw new Error('Note not found');
    if (existingNote.userId !== userId) throw new Error('Not authorized to delete this note');
    
    // Delete the note
    const { error } = await supabase
      .from(NOTES_TABLE)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting note from Supabase:', error);
    throw new Error(`Failed to delete note: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Search notes with text-based filtering
 */
export async function searchNotes(keyword: string): Promise<Note[]> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // If empty search, return recent notes
    if (!keyword.trim()) {
      const { data, error } = await supabase
        .from(NOTES_TABLE)
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(PAGE_SIZE);
      
      if (error) throw error;
      return (data || []) as Note[];
    }
    
    // Full text search using ilike for multiple columns
    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .select('*')
      .eq('userId', userId)
      .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%,transcription.ilike.%${keyword}%,procedureType.ilike.%${keyword}%`)
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Note[];
  } catch (error) {
    console.error('Error searching notes in Supabase:', error);
    throw new Error(`Failed to search notes: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get user profile from Firebase auth with additional flexibility for profile storage options
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return null;
    }
    
    // Try to get additional profile data from Supabase if needed
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.uid)
        .single();
        
      if (!error && data) {
        // If we found extended profile data, merge it with Firebase auth data
        return {
          uid: user.uid,
          email: user.email || data.email || '',
          displayName: user.displayName || data.display_name || '',
          photoURL: user.photoURL || data.photo_url || '',
          preferences: data.preferences || {},
          specialty: data.specialty || ''
        } as UserProfile;
      }
    } catch (err) {
      // Silently fail and return just Firebase auth data
      console.log('No extended profile found in Supabase');
    }
    
    // Return basic profile from Firebase auth
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
    } as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error(`Failed to get profile: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Initialize Supabase client with dynamic configs if needed
export async function initializeSupabaseWithSecureConfig() {
  try {
    // Use apiKeyManager to get Supabase URL and key
    const url = await getSupabaseUrl();
    const key = await getSupabaseKey();
    
    // This is just for verification - the actual initialization should happen in supabaseConfig.ts
    if (!url || !key) {
      console.warn('Supabase credentials not properly configured');
    }
  } catch (error) {
    console.error('Failed to initialize Supabase with secure configs:', error);
  }
}