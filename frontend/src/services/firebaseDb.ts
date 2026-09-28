import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
import { app } from './firebaseAuth';
import { Thought } from '../types';

export const db: Firestore = getFirestore(app);

export interface FirestoreThoughtPayload {
  id: string;
  title: string;
  transcription: string;
  category: string;
  date: string;
  formattedTime: string;
  audioDuration?: string;
  summary?: string;
  tags?: string[];
  enrichment_status?: string;
  version?: number;
  updated_at: string;
  // NOTE: Voice audio binary is explicitly NOT stored in Firestore per user privacy specification
}

/**
 * Persists a thought strictly containing text transcripts and metadata into Firestore under:
 * /users/{userId}/thoughts/{thoughtId}
 */
export async function saveThoughtToFirestore(
  userId: string,
  thought: Thought
): Promise<void> {
  if (!userId || !thought.id) return;

  try {
    const thoughtRef = doc(db, 'users', userId, 'thoughts', thought.id);
    const payload: FirestoreThoughtPayload = {
      id: thought.id,
      title: thought.title,
      transcription: thought.transcription || '',
      category: thought.category,
      date: thought.date,
      formattedTime: thought.formattedTime,
      audioDuration: thought.audioDuration,
      summary: thought.summary,
      tags: thought.tags || [],
      enrichment_status: thought.enrichment_status,
      version: thought.version || 1,
      updated_at: new Date().toISOString(),
    };

    await setDoc(thoughtRef, payload, { merge: true });
  } catch (err) {
    console.warn(`Firestore save error for user ${userId} thought ${thought.id}:`, err);
  }
}

/**
 * Loads all thoughts for a user from Firestore
 */
export async function fetchUserThoughtsFromFirestore(
  userId: string
): Promise<Thought[]> {
  if (!userId) return [];

  try {
    const colRef = collection(db, 'users', userId, 'thoughts');
    const snapshot = await getDocs(colRef);
    const results: Thought[] = [];

    snapshot.forEach((d) => {
      const data = d.data() as FirestoreThoughtPayload;
      results.push({
        id: data.id,
        title: data.title || 'Untitled Note',
        transcription: data.transcription || '',
        category: (data.category as any) || 'Idea',
        date: data.date,
        formattedTime: data.formattedTime,
        audioDuration: data.audioDuration || '00:28',
        summary: data.summary,
        tags: data.tags || [],
        enrichment_status: data.enrichment_status as any,
        version: data.version,
      });
    });

    return results;
  } catch (err) {
    console.warn(`Firestore fetch error for user ${userId}:`, err);
    return [];
  }
}

/**
 * Deletes a thought from Firestore for a user
 */
export async function deleteThoughtFromFirestore(
  userId: string,
  thoughtId: string
): Promise<void> {
  if (!userId || !thoughtId) return;

  try {
    const thoughtRef = doc(db, 'users', userId, 'thoughts', thoughtId);
    await deleteDoc(thoughtRef);
  } catch (err) {
    console.warn(`Firestore delete error for thought ${thoughtId}:`, err);
  }
}
