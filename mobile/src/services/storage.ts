import AsyncStorage from '@react-native-async-storage/async-storage';
import { Thought, UserProfile } from '../types';

const KEYS = {
  THOUGHTS: 'unsaid_thoughts',
  USER: 'unsaid_user',
  DEVICE_ID: 'tc_device_id',
  AUTH_TOKEN: 'tc_auth_token',
  USER_EMAIL: 'tc_user_email',
  USER_NAME: 'tc_user_name',
  MUTATION_QUEUE: 'tc_offline_mutation_queue',
  LAST_SYNC: 'tc_last_sync_timestamp',
};

export const storage = {
  async getDeviceId(): Promise<string> {
    try {
      let id = await AsyncStorage.getItem(KEYS.DEVICE_ID);
      if (!id) {
        id = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        await AsyncStorage.setItem(KEYS.DEVICE_ID, id);
      }
      return id;
    } catch {
      return `dev-${Date.now()}`;
    }
  },

  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  },

  async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
    } catch (e) {
      console.warn('Storage setAuthToken error:', e);
    }
  },

  async clearAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(KEYS.USER_EMAIL);
      await AsyncStorage.removeItem(KEYS.USER_NAME);
    } catch (e) {
      console.warn('Storage clearAuthToken error:', e);
    }
  },

  async getThoughts(): Promise<Thought[] | null> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.THOUGHTS);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async saveThoughts(thoughts: Thought[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.THOUGHTS, JSON.stringify(thoughts));
    } catch (e) {
      console.warn('Storage saveThoughts error:', e);
    }
  },

  async getUser(): Promise<UserProfile | null> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async saveUser(user: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.warn('Storage saveUser error:', e);
    }
  },

  async getMutationQueue(): Promise<any[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.MUTATION_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async saveMutationQueue(queue: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.MUTATION_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.warn('Storage saveMutationQueue error:', e);
    }
  },

  async getLastSync(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.LAST_SYNC);
    } catch {
      return null;
    }
  },

  async setLastSync(timestamp: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.LAST_SYNC, timestamp);
    } catch (e) {
      console.warn('Storage setLastSync error:', e);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.warn('Storage clearAll error:', e);
    }
  },
};
