import { Platform } from 'react-native';
import { storage } from './storage';
import { BackendThought, DeviceSession, EnrichmentStatus, SearchResponse } from '../types';

// Default to 10.0.2.2 on Android emulator, or localhost on iOS/web
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api/v1' : 'http://localhost:8000/api/v1';
export let BASE_URL = DEFAULT_HOST;

export function setApiBaseUrl(url: string) {
  BASE_URL = url;
}

async function getHeaders(customHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const deviceId = await storage.getDeviceId();
  const token = await storage.getAuthToken();

  const headers: Record<string, string> = {
    'X-Device-ID': deviceId,
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = await getHeaders((options.headers as Record<string, string>) || {});

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      let errBody: any;
      try {
        errBody = await response.json();
      } catch {
        errBody = { message: response.statusText };
      }
      const message = errBody?.error?.message || errBody?.detail || `API Error: ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  } catch (err: any) {
    clearTimeout(timeout);
    throw err;
  }
}

export const api = {
  // Session & Auth
  async getSession(): Promise<DeviceSession> {
    return request<DeviceSession>('/auth/session');
  },

  async loginWithEmail(email: string, _password?: string): Promise<{ token: string; user_id: string; email: string }> {
    const userId = `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    await storage.setAuthToken(userId);
    return { token: userId, user_id: userId, email };
  },

  async loginWithGoogle(): Promise<{ token: string; user_id: string; email: string; name?: string }> {
    const mockGoogleId = `google_usr_${Date.now()}`;
    await storage.setAuthToken(mockGoogleId);
    return {
      token: mockGoogleId,
      user_id: mockGoogleId,
      email: 'user@gmail.com',
      name: 'Google User',
    };
  },

  async logout(): Promise<void> {
    await storage.clearAuthToken();
  },

  async migrateSession(deviceId: string): Promise<any> {
    return request('/auth/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId }),
    });
  },

  // Cross-Device Sync
  async syncData(payload: {
    last_sync_timestamp?: string;
    client_changes: Array<{
      id: string;
      create_data?: any;
      update_data?: any;
    }>;
  }): Promise<{
    server_time: string;
    updated_thoughts: BackendThought[];
    conflicts: any[];
    has_more: boolean;
    next_sync_token: string;
  }> {
    return request('/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  // Thoughts
  async createThought(payload: {
    id?: string;
    raw_text?: string;
    capture_state?: 'held' | 'committed';
    send_to_ai?: boolean;
    audio_retention?: 'delete_after_transcription' | 'keep';
    type?: string;
    tags?: string[];
  }): Promise<BackendThought> {
    const id = payload.id || `thought-${Date.now()}`;
    return request<BackendThought>('/thoughts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        raw_text: payload.raw_text || '',
        capture_state: payload.capture_state || 'committed',
        send_to_ai: payload.send_to_ai ?? true,
        audio_retention: payload.audio_retention || 'delete_after_transcription',
        type: payload.type || 'ideas',
        tags: payload.tags || [],
      }),
    });
  },

  async uploadAudio(thoughtId: string, fileUri: string, filename = 'recording.m4a'): Promise<BackendThought> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: 'audio/m4a',
    } as any);

    const headers = await getHeaders();
    delete headers['Content-Type'];

    const response = await fetch(`${BASE_URL}/thoughts/${thoughtId}/audio`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || errBody?.detail || 'Audio upload failed');
    }

    return response.json();
  },

  async listThoughts(params: { cursor?: string; limit?: number; type?: string } = {}): Promise<{
    items: BackendThought[];
    next_cursor?: string;
    total_count: number;
  }> {
    const query = new URLSearchParams();
    if (params.cursor) query.set('cursor', params.cursor);
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.type) query.set('type', params.type);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/thoughts${qs}`);
  },

  async getThought(id: string): Promise<BackendThought> {
    return request<BackendThought>(`/thoughts/${id}`);
  },

  async updateThought(id: string, updates: { base_version: number; [key: string]: any }): Promise<BackendThought> {
    return request<BackendThought>(`/thoughts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  },

  async deleteThought(id: string): Promise<BackendThought> {
    return request<BackendThought>(`/thoughts/${id}`, {
      method: 'DELETE',
    });
  },

  async restoreThought(id: string): Promise<BackendThought> {
    return request<BackendThought>(`/thoughts/${id}/restore`, {
      method: 'POST',
    });
  },

  // AI Enrichment
  async getEnrichmentStatus(thoughtId: string): Promise<EnrichmentStatus> {
    return request<EnrichmentStatus>(`/enrichment/${thoughtId}/status`);
  },

  async retryEnrichment(thoughtId: string): Promise<BackendThought> {
    return request<BackendThought>(`/enrichment/${thoughtId}/retry`, {
      method: 'POST',
    });
  },

  async expandThought(
    thoughtId: string,
    mode: 'plan' | 'research' | 'features' | 'summary' = 'plan'
  ): Promise<{
    thought_id: string;
    mode: string;
    title: string;
    summary: string;
    actionable_steps: string[];
    insights: string[];
    suggested_features: string[];
  }> {
    return request(`/enrichment/${thoughtId}/expand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
  },

  // Search
  async searchThoughts(q: string): Promise<SearchResponse> {
    return request<SearchResponse>(`/search?q=${encodeURIComponent(q)}`);
  },

  // Privacy
  async exportData(): Promise<any> {
    return request('/privacy/export');
  },

  async deleteAccount(): Promise<any> {
    return request('/privacy/delete-account', {
      method: 'POST',
    });
  },

  async restoreAccount(): Promise<any> {
    return request('/privacy/restore-account', {
      method: 'POST',
    });
  },
};
