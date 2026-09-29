import {
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
  setAudioModeAsync,
  createAudioPlayer,
  AudioModule,
  RecordingPresets,
} from 'expo-audio';
import type { AudioPlayer, AudioRecorder } from 'expo-audio';

class AudioService {
  private recorder: AudioRecorder | null = null;
  private player: AudioPlayer | null = null;
  private isRecording = false;

  async requestPermission(): Promise<boolean> {
    try {
      const response = await requestRecordingPermissionsAsync();
      return response.granted;
    } catch (err) {
      console.warn('Microphone permission request error:', err);
      return false;
    }
  }

  async checkPermission(): Promise<boolean> {
    try {
      const response = await getRecordingPermissionsAsync();
      return response.granted;
    } catch {
      return false;
    }
  }

  async startRecording(): Promise<void> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted');
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      if (this.recorder) {
        try {
          await this.recorder.stop();
        } catch {}
        this.recorder = null;
      }

      const recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
      await recorder.prepareToRecordAsync();
      recorder.record();
      this.recorder = recorder;
      this.isRecording = true;
    } catch (err) {
      this.isRecording = false;
      this.recorder = null;
      console.warn('AudioService startRecording error:', err);
      throw err;
    }
  }

  async pauseRecording(): Promise<void> {
    try {
      if (this.recorder && this.isRecording) {
        this.recorder.pause();
      }
    } catch (err) {
      console.warn('AudioService pauseRecording error:', err);
    }
  }

  async resumeRecording(): Promise<void> {
    try {
      if (this.recorder) {
        this.recorder.record();
      }
    } catch (err) {
      console.warn('AudioService resumeRecording error:', err);
    }
  }

  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recorder) return null;
      await this.recorder.stop();
      const uri = this.recorder.uri;
      this.recorder = null;
      this.isRecording = false;
      return uri || null;
    } catch (err) {
      console.warn('AudioService stopRecording error:', err);
      this.recorder = null;
      this.isRecording = false;
      return null;
    }
  }

  async cancelRecording(): Promise<void> {
    try {
      if (this.recorder) {
        await this.recorder.stop();
        this.recorder = null;
      }
      this.isRecording = false;
    } catch (err) {
      console.warn('AudioService cancelRecording error:', err);
    }
  }

  async playSound(
    uri: string,
    onStatusUpdate?: (status: { isPlaying: boolean; positionMillis: number; durationMillis: number; didJustFinish: boolean }) => void
  ): Promise<AudioPlayer | null> {
    try {
      await this.stopSound();

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      const player = createAudioPlayer(uri);
      this.player = player;

      player.addListener('playbackStatusUpdate', (status) => {
        const isPlaying = status.playing;
        const positionMillis = Math.round(status.currentTime * 1000);
        const durationMillis = Math.round(status.duration * 1000);
        const didJustFinish = !status.playing && status.currentTime >= status.duration && status.duration > 0;

        onStatusUpdate?.({
          isPlaying,
          positionMillis,
          durationMillis,
          didJustFinish,
        });
      });

      player.play();
      return player;
    } catch (err) {
      console.warn('AudioService playSound error:', err);
      return null;
    }
  }

  async pauseSound(): Promise<void> {
    try {
      if (this.player) {
        this.player.pause();
      }
    } catch (err) {
      console.warn('AudioService pauseSound error:', err);
    }
  }

  async resumeSound(): Promise<void> {
    try {
      if (this.player) {
        this.player.play();
      }
    } catch (err) {
      console.warn('AudioService resumeSound error:', err);
    }
  }

  async stopSound(): Promise<void> {
    try {
      if (this.player) {
        this.player.pause();
        this.player.remove();
        this.player = null;
      }
    } catch (err) {
      console.warn('AudioService stopSound error:', err);
      this.player = null;
    }
  }
}

export const audioService = new AudioService();
