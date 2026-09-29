export type ScreenId =
  | 'splash'
  | 'step1'
  | 'step2'
  | 'step3'
  | 'account'
  | 'login'
  | 'microphone'
  | 'record'
  | 'saved'
  | 'category'
  | 'history'
  | 'notes'
  | 'note-detail'
  | 'thought-detail'
  | 'profile'
  | 'about'
  | 'help'
  | 'privacy';

export type CategoryId =
  | 'Idea'
  | 'Study'
  | 'Work'
  | 'Personal'
  | 'Health'
  | 'Finance'
  | 'Creative'
  | 'Tech'
  | 'Others';

export interface StructuredPlan {
  summary: string;
  actionableSteps: string[];
  insights: string[];
  suggestedFeatures: string[];
}

export interface Thought {
  id: string;
  title: string;
  transcription: string;
  category: CategoryId;
  date: string;
  formattedTime: string;
  audioDuration: string;
  audioUrl?: string;
  localAudioUri?: string;
  version?: number;
  summary?: string;
  tags?: string[];
  enrichment_status?: 'pending' | 'processing' | 'complete' | 'partial' | 'failed' | 'disabled';
  structuredPlan?: StructuredPlan;
}

export interface UserProfile {
  name: string;
  email: string;
  plan: 'Free' | 'Pro';
  usedCreditsPercent: number;
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
