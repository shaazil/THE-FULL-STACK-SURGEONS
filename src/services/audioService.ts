import { getAuth } from 'firebase/auth';
import { Note, UserProfile } from '../types';
import { getSupabaseClient } from '../firebase/supabaseConfig';
import { transcribeAudio as transcribeWithService } from './transcriptionService';

const NOTES_TABLE = 'notes';
const USERS_TABLE = 'users';
const PAGE_SIZE = 20;

/**
 * Get current user ID from Firebase Auth
 */
function getCurrentUserId(): string | null {
  const auth = getAuth();
  return auth.currentUser?.uid || null;
}

/**
 * Upload audio file to storage and return the URL
 * @param audioUri Local URI of the audio file to upload
 * @returns Promise with the uploaded file URL
 */
export async function uploadAudio(audioUri: string): Promise<string> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Get initialized Supabase client
    const supabase = await getSupabaseClient();
    
    // Generate a unique file name
    const fileName = `${userId}/${Date.now()}.m4a`;
    
    // Read the file as blob
    const response = await fetch(audioUri);
    const blob = await response.blob();
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('audio_recordings')
      .upload(fileName, blob, {
        contentType: 'audio/m4a',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('audio_recordings')
      .getPublicUrl(fileName);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading audio to Supabase storage:', error);
    throw new Error(`Failed to upload audio: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Save a new note with transcription to Supabase
 */
export async function saveNote(note: Note): Promise<string> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Get initialized Supabase client
    const supabase = await getSupabaseClient();
    
    // Add user ID, timestamps and ensure required fields
    const noteWithMetadata = {
      ...note,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      title: note.title || 'Untitled Note',
      content: note.content || '',
      date: note.date || new Date().toISOString(),
    };
    
    // Add note to Supabase
    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .insert(noteWithMetadata)
      .select()
      .single();
      
    if (error) throw error;
    
    return data.id;
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
    
    // Get initialized Supabase client
    const supabase = await getSupabaseClient();
    
    // Get the note first to verify ownership
    const { data: existingNote, error: fetchError } = await supabase
      .from(NOTES_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    if (!existingNote) throw new Error('Note not found');
    if (existingNote.user_id !== userId) throw new Error('Not authorized to update this note');
    
    // Update the note with new data
    const { error: updateError } = await supabase
      .from(NOTES_TABLE)
      .update({
        ...noteData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating note in Supabase:', error);
    throw new Error(`Failed to update note: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get paginated notes from Supabase
 */
export async function getNotes(
  page: number = 0,
  limitCount: number = PAGE_SIZE
): Promise<{notes: Note[], hasMore: boolean}> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Get initialized Supabase client
    const supabase = await getSupabaseClient();
    
    // Calculate offset for pagination
    const offset = page * limitCount;
    
    // Query notes from Supabase
    const { data, error, count } = await supabase
      .from(NOTES_TABLE)
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitCount - 1);
      
    if (error) throw error;
    
    // Map to Note objects
    const notes = data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      content: item.content,
      transcription: item.transcription,
      procedureType: item.procedure_type,
      tags: item.tags,
      audioUrl: item.audio_url,
      date: item.date,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    } as Note));
    
    return {
      notes,
      hasMore: count ? offset + limitCount < count : false
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
    
    // Get initialized Supabase client
    const supabase = await getSupabaseClient();
    
    // Query note from Supabase
    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    if (!data) throw new Error('Note not found');
    
    // Verify ownership
    if (data.user_id !== userId) {
      throw new Error('Not authorized to access this note');
    }
    
    // Map to Note object
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      content: data.content,
      transcription: data.transcription,
      procedureType: data.procedure_type,
      tags: data.tags,
      audioUrl: data.audio_url,
      date: data.date,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } as Note;
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
    
    // Get initialized Supabase client
    const supabase = await getSupabaseClient();
    
    // Get the note first to verify ownership
    const { data: existingNote, error: fetchError } = await supabase
      .from(NOTES_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    if (!existingNote) throw new Error('Note not found');
    if (existingNote.user_id !== userId) throw new Error('Not authorized to delete this note');
    
    // Delete the note
    const { error: deleteError } = await supabase
      .from(NOTES_TABLE)
      .delete()
      .eq('id', id);
      
    if (deleteError) throw deleteError;
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
    
    // Get initialized Supabase client
    const supabase = await getSupabaseClient();
    
    if (!keyword.trim()) {
      // Return all notes if no keyword
      const { data, error } = await supabase
        .from(NOTES_TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        content: item.content,
        transcription: item.transcription,
        procedureType: item.procedure_type,
        tags: item.tags,
        audioUrl: item.audio_url,
        date: item.date,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      } as Note));
    }
    
    // Perform full-text search with Supabase
    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%,transcription.ilike.%${keyword}%,procedure_type.ilike.%${keyword}%`)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      content: item.content,
      transcription: item.transcription,
      procedureType: item.procedure_type,
      tags: item.tags,
      audioUrl: item.audio_url,
      date: item.date,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    } as Note));
  } catch (error) {
    console.error('Error searching notes in Supabase:', error);
    throw new Error(`Failed to search notes: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Transcribe audio without saving to storage
 * Uses the transcriptionService to transcribe audio
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
  try {
    console.log('[audioService] Starting transcription for audio:', audioUri);
    
    // Use the transcription service to transcribe the audio
    const transcriptionResult = await transcribeWithService(audioUri);
    
    // Return the transcription text
    return transcriptionResult.text;
  } catch (error) {
    console.error('[audioService] Error transcribing audio:', error);
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Save or update user profile
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Get initialized Supabase client
    const supabase = await getSupabaseClient();
    
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .eq('id', userId)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError; // PGRST116 = not found
    
    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from(USERS_TABLE)
        .update({
          ...profile,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (updateError) throw updateError;
    } else {
      // Insert new profile
      const { error: insertError } = await supabase
        .from(USERS_TABLE)
        .insert({
          id: userId,
          ...profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error saving user profile to Supabase:', error);
    throw new Error(`Failed to save profile: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      return null;
    }
    
    // Get initialized Supabase client
    const supabase = await getSupabaseClient();
    
    // Query user profile from Supabase
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return {
      uid: data.id,
      displayName: data.display_name,
      email: data.email,
      photoURL: data.photo_url,
      preferences: data.preferences,
      specialty: data.specialty
    } as UserProfile;
  } catch (error) {
    console.error('Error getting user profile from Supabase:', error);
    throw new Error(`Failed to get profile: ${error instanceof Error ? error.message : String(error)}`);
  }
}