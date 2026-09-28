import { api, BackendThought, getDeviceId } from './api';

export interface QueuedMutation {
  id: string; // client mutation identifier
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
  private queueKey = 'tc_offline_mutation_queue';
  private syncTimeKey = 'tc_last_sync_timestamp';
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private syncTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notify();
        this.syncPending();
      });
      window.addEventListener('offline', () => {
        this.notify();
      });

      // Periodic delta sync every 30 seconds when active
      this.syncTimer = setInterval(() => {
        if (navigator.onLine && !this.isSyncing) {
          this.syncPending();
        }
      }, 30000);
    }
  }

  public getStatus(): SyncEngineStatus {
    const queue = this.getQueue();
    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: this.isSyncing,
      pendingCount: queue.length,
      lastSyncedAt: localStorage.getItem(this.syncTimeKey),
    };
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private notify(reconciled?: BackendThought[]) {
    const status = this.getStatus();
    this.listeners.forEach((cb) => {
      try {
        cb(status, reconciled);
      } catch (err) {
        console.error('Sync listener error:', err);
      }
    });
  }

  public getQueue(): QueuedMutation[] {
    try {
      const raw = localStorage.getItem(this.queueKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: QueuedMutation[]) {
    localStorage.setItem(this.queueKey, JSON.stringify(queue));
  }

  public enqueue(
    thoughtId: string,
    type: 'create' | 'update' | 'delete',
    payload: any
  ): void {
    const queue = this.getQueue();
    const mutationId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `mut-${Date.now()}-${Math.random()}`;

    // Coalesce / deduplicate mutations for the same thought if possible
    const existingIndex = queue.findIndex((m) => m.thoughtId === thoughtId);
    if (existingIndex >= 0) {
      const existing = queue[existingIndex];
      if (type === 'delete') {
        // If it was created offline and deleted before syncing, remove completely
        if (existing.type === 'create') {
          queue.splice(existingIndex, 1);
          this.saveQueue(queue);
          this.notify();
          return;
        }
        // Otherwise overwrite with delete
        queue[existingIndex] = {
          id: mutationId,
          thoughtId,
          type: 'delete',
          payload: { is_deleted: true, base_version: payload.base_version || 1 },
          createdAt: Date.now(),
          retryCount: 0,
        };
      } else if (type === 'update') {
        if (existing.type === 'create') {
          // Merge into create payload
          queue[existingIndex].payload = { ...existing.payload, ...payload };
        } else {
          // Merge updates
          queue[existingIndex].payload = { ...existing.payload, ...payload };
        }
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

    this.saveQueue(queue);
    this.notify();

    // Trigger immediate sync if connected
    if (navigator.onLine) {
      this.syncPending();
    }
  }

  public async syncPending(): Promise<BackendThought[]> {
    if (this.isSyncing || !navigator.onLine) return [];

    const queue = this.getQueue();
    const lastSync = localStorage.getItem(this.syncTimeKey) || undefined;

    // Even if queue is empty, we can perform a pull sync if lastSync is set
    this.isSyncing = true;
    this.notify();

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
              type: m.payload.type,
              tags: m.payload.tags,
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

      // Clear the synced queue items
      this.saveQueue([]);
      localStorage.setItem(this.syncTimeKey, response.server_time);

      this.isSyncing = false;
      this.notify(response.updated_thoughts);
      return response.updated_thoughts;
    } catch (err) {
      console.warn('Sync pending failed, backing off:', err);
      // Increment retryCount for queued items
      const updatedQueue = this.getQueue().map((m) => ({
        ...m,
        retryCount: m.retryCount + 1,
      }));
      this.saveQueue(updatedQueue);
      this.isSyncing = false;
      this.notify();
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
