import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface Note {
  id: string
  content: string
  source: 'text' | 'voice' | 'image'
  createdAt: string
  updatedAt: string
}

interface NoteState {
  notes: Note[]
  isLoading: boolean
  error: string | null
  loadNotes: () => Promise<void>
  addNote: (content: string, source?: 'text' | 'voice' | 'image') => Promise<void>
  updateNote: (id: string, content: string) => Promise<void>
  deleteNote: (id: string) => Promise<void>
}

const NOTES_STORAGE_KEY = '@cobrain_notes'

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  isLoading: false,
  error: null,

  loadNotes: async () => {
    set({ isLoading: true, error: null })
    try {
      const stored = await AsyncStorage.getItem(NOTES_STORAGE_KEY)
      const notes = stored ? JSON.parse(stored) : []
      // Sort by createdAt descending (newest first)
      notes.sort(
        (a: Note, b: Note) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      set({ notes, isLoading: false })
    } catch (error) {
      console.error('Failed to load notes:', error)
      set({ error: 'Failed to load notes', isLoading: false })
    }
  },

  addNote: async (content: string, source: 'text' | 'voice' | 'image' = 'text') => {
    const newNote: Note = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      content,
      source,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const { notes } = get()
    const updatedNotes = [newNote, ...notes]

    try {
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes))
      set({ notes: updatedNotes })
    } catch (error) {
      console.error('Failed to save note:', error)
      throw error
    }
  },

  updateNote: async (id: string, content: string) => {
    const { notes } = get()
    const updatedNotes = notes.map((note) =>
      note.id === id
        ? { ...note, content, updatedAt: new Date().toISOString() }
        : note
    )

    try {
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes))
      set({ notes: updatedNotes })
    } catch (error) {
      console.error('Failed to update note:', error)
      throw error
    }
  },

  deleteNote: async (id: string) => {
    const { notes } = get()
    const updatedNotes = notes.filter((note) => note.id !== id)

    try {
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes))
      set({ notes: updatedNotes })
    } catch (error) {
      console.error('Failed to delete note:', error)
      throw error
    }
  },
}))
