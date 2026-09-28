// Frontend API Client for Thought Catcher Backend

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export function getDeviceId(): string {
  let deviceId = localStorage.getItem('tc_device_id');
  if (!deviceId) {
    deviceId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('tc_device_id', deviceId);
  }
  return deviceId;
}

export function getAuthToken(): string | null {
  return localStorage.getItem('tc_auth_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('tc_auth_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('tc_auth_token');
}

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Device-ID': getDeviceId(),
    ...customHeaders,
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: getHeaders(options.headers as Record<string, string>),
  });

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
}

export interface BackendThought {
  id: string;
  user_id?: string | null;
  device_id: string;
  raw_text?: string | null;
  capture_state: 'held' | 'committed';
  version: number;
  audio_ref?: string | null;
  audio_duration_seconds?: number | null;
  audio_retention: 'delete_after_transcription' | 'keep';
  transcript?: string | null;
  transcript_source: 'provisional' | 'server';
  title?: string | null;
  summary?: string | null;
  type: string;
  tags: string[];
  enrichment_status: 'pending' | 'processing' | 'complete' | 'partial' | 'failed' | 'disabled';
  enrichment_error?: any;
  send_to_ai: boolean;
  is_deleted: boolean;
  deleted_at?: string | null;
  client_created_at: string;
  server_created_at: string;
  updated_at: string;
}

export interface EnrichmentStatus {
  thought_id: string;
  enrichment_status: 'pending' | 'processing' | 'complete' | 'partial' | 'failed' | 'disabled';
  title?: string | null;
  summary?: string | null;
  type?: string | null;
  tags: string[];
  error?: any;
  is_partial: boolean;
}

export interface SearchResult {
  thought_id: string;
  match_type: string;
  score: number;
  thought: BackendThought;
}

export interface SearchResponse {
  query: string;
  mode: string;
  total_matches: number;
  results: SearchResult[];
}

export interface DeviceSession {
  device_id: string;
  user_id?: string | null;
  tier: 'free' | 'pro';
  daily_enrichments_used: number;
  daily_enrichments_remaining: number;
  weekly_enrichments_used: number;
  weekly_enrichments_remaining: number;
  plan: 'free' | 'pro';
}

export const api = {
  // Session & Auth
  async getSession(): Promise<DeviceSession> {
    return request<DeviceSession>('/auth/session');
  },

  async loginWithEmail(email: string, _password?: string): Promise<{ token: string; user_id: string; email: string }> {
    const userId = `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    setAuthToken(userId);
    localStorage.setItem('tc_user_email', email);
    localStorage.setItem('tc_user_name', email.split('@')[0]);
    return { token: userId, user_id: userId, email };
  },

  async loginWithGoogle(): Promise<{ token: string; user_id: string; email: string; name?: string }> {
    const { signInWithGoogleReal } = await import('./firebaseAuth');
    const authRes = await signInWithGoogleReal();
    setAuthToken(authRes.token);
    localStorage.setItem('tc_user_email', authRes.email);
    localStorage.setItem('tc_user_name', authRes.displayName);
    return { token: authRes.token, user_id: authRes.user_id, email: authRes.email, name: authRes.displayName };
  },

  async logout(): Promise<void> {
    const { signOutFirebase } = await import('./firebaseAuth');
    await signOutFirebase().catch(() => {});
    clearAuthToken();
    localStorage.removeItem('tc_user_email');
    localStorage.removeItem('tc_user_name');
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
    const id = payload.id || (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `thought-${Date.now()}`);
    return request<BackendThought>('/thoughts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        raw_text: payload.raw_text || '',
        capture_state: payload.capture_state || 'committed',
        send_to_ai: payload.send_to_ai ?? true,
        audio_retention: payload.audio_retention || 'delete_after_transcription',
      }),
    });
  },

  async uploadAudio(thoughtId: string, audioBlob: Blob, filename = 'recording.webm'): Promise<BackendThought> {
    const formData = new FormData();
    formData.append('file', audioBlob, filename);

    const url = `${BASE_URL}/thoughts/${thoughtId}/audio`;
    const headers = getHeaders();
    // Do not set Content-Type header so browser automatically sets multipart/form-data boundary
    delete headers['Content-Type'];

    const response = await fetch(url, {
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

  async listThoughts(params: { cursor?: string; limit?: number; type?: string } = {}): Promise<{ items: BackendThought[]; next_cursor?: string; total_count: number }> {
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

  async expandThought(thoughtId: string, mode: 'plan' | 'research' | 'features' | 'summary' = 'plan'): Promise<{
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
