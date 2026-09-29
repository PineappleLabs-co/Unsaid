import { api } from './api';
import { storage } from './storage';
import { BackendThought } from '../types';

export interface QueuedMutation {
  id: string;
  thoughtId: string;
  type: 'create' | 'update' | 'delete';
  payload: any;
  createdAt: number;
  retryCount: number;
}

export interface SyncEngineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
}

type SyncListener = (status: SyncEngineStatus, reconciledThoughts?: BackendThought[]) => void;

class SyncEngine {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private syncTimer: any = null;

  constructor() {
    // Start periodic background pulse check every 30 seconds
    this.syncTimer = setInterval(() => {
      if (!this.isSyncing) {
        this.syncPending().catch(() => {});
      }
    }, 30000);
  }

  public async getStatus(): Promise<SyncEngineStatus> {
    const queue = await storage.getMutationQueue();
    const lastSync = await storage.getLastSync();
    return {
      isOnline: true,
      isSyncing: this.isSyncing,
      pendingCount: queue.length,
      lastSyncedAt: lastSync,
    };
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.getStatus().then((status) => listener(status));
    return () => this.listeners.delete(listener);
  }

  private async notify(reconciled?: BackendThought[]) {
    const status = await this.getStatus();
    this.listeners.forEach((cb) => {
      try {
        cb(status, reconciled);
      } catch (err) {
        console.error('Sync listener error:', err);
      }
    });
  }

  public async enqueue(
    thoughtId: string,
    type: 'create' | 'update' | 'delete',
    payload: any
  ): Promise<void> {
    const queue: QueuedMutation[] = await storage.getMutationQueue();
    const mutationId = `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const existingIndex = queue.findIndex((m) => m.thoughtId === thoughtId);
    if (existingIndex >= 0) {
      const existing = queue[existingIndex];
      if (type === 'delete') {
        if (existing.type === 'create') {
          queue.splice(existingIndex, 1);
          await storage.saveMutationQueue(queue);
          await this.notify();
          return;
        }
        queue[existingIndex] = {
          id: mutationId,
          thoughtId,
          type: 'delete',
          payload: { is_deleted: true, base_version: payload.base_version || 1 },
          createdAt: Date.now(),
          retryCount: 0,
        };
      } else if (type === 'update') {
        queue[existingIndex].payload = { ...existing.payload, ...payload };
      }
    } else {
      queue.push({
        id: mutationId,
        thoughtId,
        type,
        payload,
        createdAt: Date.now(),
        retryCount: 0,
      });
    }

    await storage.saveMutationQueue(queue);
    await this.notify();

    // Trigger sync immediately in background
    this.syncPending().catch(() => {});
  }

  public async syncPending(): Promise<BackendThought[]> {
    if (this.isSyncing) return [];

    const queue: QueuedMutation[] = await storage.getMutationQueue();
    const lastSync = await storage.getLastSync() || undefined;

    this.isSyncing = true;
    await this.notify();

    try {
      const client_changes = queue.map((m) => {
        if (m.type === 'create') {
          return {
            id: m.thoughtId,
            create_data: {
              id: m.thoughtId,
              raw_text: m.payload.raw_text || '',
              capture_state: m.payload.capture_state || 'committed',
              send_to_ai: m.payload.send_to_ai ?? true,
              audio_retention: m.payload.audio_retention || 'delete_after_transcription',
              type: m.payload.type || 'ideas',
              tags: m.payload.tags || [],
            },
          };
        } else if (m.type === 'update') {
          return {
            id: m.thoughtId,
            update_data: {
              base_version: m.payload.base_version || 1,
              title: m.payload.title,
              raw_text: m.payload.raw_text,
              type: m.payload.type,
              tags: m.payload.tags,
              capture_state: m.payload.capture_state,
              is_deleted: false,
            },
          };
        } else {
          return {
            id: m.thoughtId,
            update_data: {
              base_version: m.payload.base_version || 1,
              is_deleted: true,
            },
          };
        }
      });

      const response = await api.syncData({
        last_sync_timestamp: lastSync,
        client_changes,
      });

      await storage.saveMutationQueue([]);
      await storage.setLastSync(response.server_time);

      this.isSyncing = false;
      await this.notify(response.updated_thoughts);
      return response.updated_thoughts;
    } catch (err) {
      console.log('Mobile sync notice (offline/local fallback):', err);
      const updatedQueue = queue.map((m) => ({
        ...m,
        retryCount: m.retryCount + 1,
      }));
      await storage.saveMutationQueue(updatedQueue);
      this.isSyncing = false;
      await this.notify();
      return [];
    }
  }

  public destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }
}

export const syncEngine = new SyncEngine();
