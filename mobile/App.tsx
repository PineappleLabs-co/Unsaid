import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ScreenId, Thought, UserProfile, CategoryId, BackendThought } from './src/types';
import { INITIAL_THOUGHTS, INITIAL_USER } from './src/data/mockData';
import { api } from './src/services/api';
import { storage } from './src/services/storage';
import { syncEngine } from './src/services/syncEngine';

import { SplashScreen } from './src/screens/SplashScreen';
import { Step1Screen } from './src/screens/Step1Screen';
import { Step2Screen } from './src/screens/Step2Screen';
import { Step3Screen } from './src/screens/Step3Screen';
import { AccountScreen } from './src/screens/AccountScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { MicrophoneScreen } from './src/screens/MicrophoneScreen';
import { RecordScreen } from './src/screens/RecordScreen';
import { SavedScreen } from './src/screens/SavedScreen';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { NoteDetailScreen } from './src/screens/NoteDetailScreen';
import { ThoughtDetailScreen } from './src/screens/ThoughtDetailScreen';
import { TakeFurtherModal } from './src/screens/TakeFurtherModal';
import { ProPlanModal } from './src/screens/ProPlanModal';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { HelpScreen } from './src/screens/HelpScreen';
import { PrivacyScreen } from './src/screens/PrivacyScreen';
import { SidebarDrawer } from './src/components/SidebarDrawer';

function mapBackendThought(bt: BackendThought): Thought {
  const d = new Date(bt.server_created_at || Date.now());
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const typeMap: Record<string, CategoryId> = {
    ideas: 'Idea',
    projects: 'Work',
    content: 'Creative',
    learning: 'Study',
    personal: 'Personal',
    health: 'Health',
    finance: 'Finance',
    tech: 'Tech',
    other: 'Others',
  };
  const cat = typeMap[bt.type?.toLowerCase()] || (bt.type as CategoryId) || 'Idea';

  return {
    id: bt.id,
    title: bt.title || 'New Captured Thought',
    transcription: bt.transcript || bt.raw_text || '',
    category: cat,
    date: dateStr,
    formattedTime: `${dateStr} , ${timeStr}`,
    audioDuration: bt.audio_duration_seconds
      ? `00:${Math.round(bt.audio_duration_seconds).toString().padStart(2, '0')}`
      : '00:28',
    audioUrl: bt.audio_ref ? `/thoughts/${bt.id}/audio` : undefined,
    version: bt.version,
    summary: bt.summary || undefined,
    tags: bt.tags || [],
    enrichment_status: bt.enrichment_status,
  };
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('splash');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isTakeFurtherOpen, setIsTakeFurtherOpen] = useState(false);

  // Persistent Thoughts State
  const [thoughts, setThoughts] = useState<Thought[]>(INITIAL_THOUGHTS);
  const [activeThought, setActiveThought] = useState<Thought>(INITIAL_THOUGHTS[0]);

  // Persistent User Profile State
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);

  // Initial Load from Storage & Backend API
  useEffect(() => {
    async function loadData() {
      const savedThoughts = await storage.getThoughts();
      if (savedThoughts && savedThoughts.length > 0) {
        setThoughts(savedThoughts);
        setActiveThought(savedThoughts[0]);
      }

      const savedUser = await storage.getUser();
      if (savedUser) {
        setUser(savedUser);
      }

      // Try fetching latest thoughts from backend
      api.listThoughts({ limit: 50 })
        .then((res) => {
          if (res.items && res.items.length > 0) {
            const mapped = res.items.map(mapBackendThought);
            setThoughts(mapped);
            setActiveThought(mapped[0]);
            storage.saveThoughts(mapped);
          }
        })
        .catch((e) => console.log('Offline / Local storage active for thoughts:', e.message || e));

      // Try fetching latest session quota
      api.getSession()
        .then((session) => {
          setUser((prev) => {
            const updated: UserProfile = {
              ...prev,
              plan: session.plan === 'pro' ? 'Pro' : 'Free',
              usedCreditsPercent: Math.min(
                100,
                Math.round(
                  (session.daily_enrichments_used /
                    ((session.daily_enrichments_used + session.daily_enrichments_remaining) || 2)) *
                    100
                )
              ),
            };
            storage.saveUser(updated);
            return updated;
          });
        })
        .catch((e) => console.log('Offline / Local session quota fallback:', e.message || e));
    }

    loadData();

    // Subscribe to background delta sync reconciliations
    const unsubscribeSync = syncEngine.subscribe((_status, reconciled) => {
      if (reconciled && reconciled.length > 0) {
        setThoughts((prev) => {
          const map = new Map<string, Thought>(prev.map((t) => [t.id, t]));
          for (const st of reconciled) {
            map.set(st.id, mapBackendThought(st));
          }
          const updated = Array.from(map.values());
          storage.saveThoughts(updated);
          return updated;
        });
      }
    });

    return () => {
      unsubscribeSync();
    };
  }, []);

  // Save thoughts whenever modified
  const updateThoughtsList = (newThoughts: Thought[]) => {
    setThoughts(newThoughts);
    storage.saveThoughts(newThoughts);
  };

  // Save user profile whenever modified
  const updateUserProfile = (newUser: UserProfile) => {
    setUser(newUser);
    storage.saveUser(newUser);
  };

  // Auth Handlers
  const handleGoogleLogin = async () => {
    const prevDeviceId = await storage.getDeviceId();
    const loginRes = await api.loginWithGoogle();
    const updatedUser: UserProfile = {
      name: loginRes.name || 'Google User',
      email: loginRes.email,
      plan: 'Free',
      usedCreditsPercent: 0,
    };
    updateUserProfile(updatedUser);

    await api.migrateSession(prevDeviceId).catch(() => {});
    await syncEngine.syncPending().catch(() => {});

    setCurrentScreen('notes');
  };

  const handleEmailLoginSuccess = async (userData: { email: string; name: string; token: string }) => {
    const prevDeviceId = await storage.getDeviceId();
    const updatedUser: UserProfile = {
      name: userData.name,
      email: userData.email,
      plan: 'Free',
      usedCreditsPercent: 0,
    };
    updateUserProfile(updatedUser);

    await api.migrateSession(prevDeviceId).catch(() => {});
    await syncEngine.syncPending().catch(() => {});

    setCurrentScreen('microphone');
  };

  const handleLogout = async () => {
    await api.logout();
    updateUserProfile(INITIAL_USER);
    setCurrentScreen('account');
  };

  const handleProUpgrade = (plan: 'Free' | 'Pro') => {
    const updatedUser: UserProfile = {
      ...user,
      plan,
      usedCreditsPercent: plan === 'Pro' ? 4 : user.usedCreditsPercent,
    };
    updateUserProfile(updatedUser);
    setIsProModalOpen(false);
  };

  // Recording Save Handler
  const handleFinishCapturing = async (
    thoughtText: string,
    localAudioUri?: string,
    durationSeconds?: number
  ) => {
    const thoughtId = `thought-${Date.now()}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newThought: Thought = {
      id: thoughtId,
      title: thoughtText.trim()
        ? thoughtText.trim().slice(0, 45) + (thoughtText.trim().length > 45 ? '...' : '')
        : 'Transcribing & Enriching...',
      transcription: thoughtText.trim() || 'Transcribing audio recording...',
      category: 'Idea',
      date: dateStr,
      formattedTime: `Today , ${timeStr}`,
      audioDuration: durationSeconds ? `00:${durationSeconds.toString().padStart(2, '0')}` : '00:28',
      localAudioUri,
      enrichment_status: 'processing',
      version: 1,
    };

    const updatedThoughts = [newThought, ...thoughts];
    updateThoughtsList(updatedThoughts);
    setActiveThought(newThought);
    setCurrentScreen('saved');

    // Enqueue offline sync mutation
    syncEngine.enqueue(thoughtId, 'create', {
      raw_text: newThought.transcription,
      capture_state: 'committed',
      send_to_ai: true,
      type: 'ideas',
    });

    // Upload & enrich with backend
    try {
      const created = await api.createThought({
        id: thoughtId,
        raw_text: newThought.transcription,
        capture_state: 'committed',
        send_to_ai: true,
      });

      let finalThought = created;

      if (localAudioUri) {
        try {
          const uploaded = await api.uploadAudio(thoughtId, localAudioUri, `recording-${Date.now()}.m4a`);
          if (uploaded) finalThought = uploaded;
        } catch (e) {
          console.log('Audio upload note:', e);
        }
      }

      const mapped = mapBackendThought(finalThought);
      mapped.localAudioUri = localAudioUri;
      setActiveThought(mapped);
      updateThoughtsList(thoughts.map((t) => (t.id === thoughtId ? mapped : t)));
    } catch (err) {
      console.log('Backend create fallback, cached locally:', err);
    }
  };

  // Category Selection
  const handleSelectCategory = (cat: CategoryId) => {
    const updated = { ...activeThought, category: cat };
    setActiveThought(updated);
    updateThoughtsList(thoughts.map((t) => (t.id === updated.id ? updated : t)));
    setCurrentScreen('thought-detail');

    syncEngine.enqueue(activeThought.id, 'update', {
      base_version: activeThought.version || 1,
      type: cat.toLowerCase(),
    });

    api.updateThought(activeThought.id, {
      base_version: activeThought.version || 1,
      type: cat.toLowerCase(),
    }).catch(() => {});
  };

  // AI Expansion Handler
  const handleGenerateAI = async (option: string) => {
    setIsTakeFurtherOpen(false);

    try {
      const expansion = await api.expandThought(activeThought.id, option as any);

      const modeHeader =
        option === 'plan'
          ? 'Project Execution Plan'
          : option === 'research'
          ? 'Domain & Market Research'
          : option === 'features'
          ? 'Feature Specifications'
          : 'Executive Summary';

      let appendedMarkdown = `\n\n---\n\n## ⚡ ${modeHeader}: ${expansion.title}\n\n**Summary:** ${expansion.summary}\n`;

      if (expansion.insights && expansion.insights.length > 0) {
        appendedMarkdown += `\n### 💡 Key Insights\n` + expansion.insights.map((ins) => `- ${ins}`).join('\n') + '\n';
      }

      if (expansion.actionable_steps && expansion.actionable_steps.length > 0) {
        appendedMarkdown += `\n### 📋 Actionable Milestones\n` + expansion.actionable_steps.map((step, idx) => `- [ ] Step ${idx + 1}: ${step}`).join('\n') + '\n';
      }

      if (expansion.suggested_features && expansion.suggested_features.length > 0) {
        appendedMarkdown += `\n### 🚀 Recommended Capabilities\n` + expansion.suggested_features.map((feat) => `- ${feat}`).join('\n') + '\n';
      }

      const updatedContent = (activeThought.transcription || '').trim() + appendedMarkdown;

      const fullyExpanded: Thought = {
        ...activeThought,
        title: activeThought.title || expansion.title,
        summary: expansion.summary,
        transcription: updatedContent,
        enrichment_status: 'complete',
        structuredPlan: {
          summary: expansion.summary,
          actionableSteps: expansion.actionable_steps,
          insights: expansion.insights,
          suggestedFeatures: expansion.suggested_features,
        },
      };

      setActiveThought(fullyExpanded);
      updateThoughtsList(thoughts.map((t) => (t.id === fullyExpanded.id ? fullyExpanded : t)));

      api.updateThought(activeThought.id, {
        base_version: activeThought.version || 1,
        transcript: updatedContent,
        raw_text: updatedContent,
      }).catch(() => {});

      syncEngine.enqueue(activeThought.id, 'update', {
        base_version: activeThought.version || 1,
        transcript: updatedContent,
        raw_text: updatedContent,
      });

      setCurrentScreen('note-detail');
    } catch (err) {
      console.log('AI expansion error:', err);
    }
  };

  // Create New Note
  const handleNewNote = () => {
    const noteId = `note-${Date.now()}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newNote: Thought = {
      id: noteId,
      title: 'New Note',
      transcription: '',
      category: 'Idea',
      date: dateStr,
      formattedTime: `Today , ${timeStr}`,
      audioDuration: '00:00',
      version: 1,
    };

    updateThoughtsList([newNote, ...thoughts]);
    setActiveThought(newNote);
    setCurrentScreen('note-detail');

    api.createThought({
      id: noteId,
      raw_text: '',
      capture_state: 'committed',
      send_to_ai: false,
    }).catch(() => {});
  };

  // Update Note
  const handleUpdateNote = (updated: Thought) => {
    setActiveThought(updated);
    updateThoughtsList(thoughts.map((t) => (t.id === updated.id ? updated : t)));

    api.updateThought(updated.id, {
      base_version: updated.version || 1,
      title: updated.title,
      transcript: updated.transcription,
      raw_text: updated.transcription,
    }).catch(() => {});

    syncEngine.enqueue(updated.id, 'update', {
      base_version: updated.version || 1,
      title: updated.title,
      transcript: updated.transcription,
      raw_text: updated.transcription,
    });
  };

  // Delete Thought
  const handleDeleteThought = (id: string) => {
    syncEngine.enqueue(id, 'delete', { base_version: 1 });
    api.deleteThought(id).catch(() => {});

    const remaining = thoughts.filter((t) => t.id !== id);
    updateThoughtsList(remaining);
    if (remaining.length > 0) {
      setActiveThought(remaining[0]);
      setCurrentScreen('notes');
    } else {
      setCurrentScreen('record');
    }
  };

  return (
    <View style={styles.appRoot}>
      <StatusBar style="light" />

      {/* Screen Router */}
      {currentScreen === 'splash' && (
        <SplashScreen onGetStarted={() => setCurrentScreen('step1')} />
      )}

      {currentScreen === 'step1' && (
        <Step1Screen onNext={() => setCurrentScreen('step2')} />
      )}

      {currentScreen === 'step2' && (
        <Step2Screen
          onNext={() => setCurrentScreen('step3')}
          onBack={() => setCurrentScreen('step1')}
        />
      )}

      {currentScreen === 'step3' && (
        <Step3Screen
          onNext={() => setCurrentScreen('account')}
          onBack={() => setCurrentScreen('step2')}
        />
      )}

      {currentScreen === 'account' && (
        <AccountScreen
          onGoogle={handleGoogleLogin}
          onEmail={() => setCurrentScreen('login')}
          onGuest={() => setCurrentScreen('microphone')}
        />
      )}

      {currentScreen === 'login' && (
        <LoginScreen
          onLoginSuccess={handleEmailLoginSuccess}
          onGoogle={handleGoogleLogin}
          onBack={() => setCurrentScreen('account')}
        />
      )}

      {currentScreen === 'microphone' && (
        <MicrophoneScreen
          onAllowMicrophone={() => setCurrentScreen('record')}
          onNext={() => setCurrentScreen('record')}
        />
      )}

      {currentScreen === 'record' && (
        <RecordScreen
          onMenuClick={() => setIsDrawerOpen(true)}
          onFinishCapturing={handleFinishCapturing}
        />
      )}

      {currentScreen === 'saved' && (
        <SavedScreen
          onMenuClick={() => setIsDrawerOpen(true)}
          onViewThought={() => setCurrentScreen('notes')}
          onCaptureAnother={() => setCurrentScreen('record')}
        />
      )}

      {currentScreen === 'category' && (
        <CategoryScreen
          onMenuClick={() => setIsDrawerOpen(true)}
          onSelectCategory={handleSelectCategory}
        />
      )}

      {(currentScreen === 'notes' || currentScreen === 'history') && (
        <NotesScreen
          notes={thoughts}
          onBackClick={() => setCurrentScreen('record')}
          onSelectNote={(note) => {
            setActiveThought(note);
            setCurrentScreen('note-detail');
          }}
          onNewNote={handleNewNote}
          onMicClick={() => setCurrentScreen('record')}
        />
      )}

      {currentScreen === 'note-detail' && (
        <NoteDetailScreen
          note={activeThought}
          onBack={() => setCurrentScreen('notes')}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteThought}
          onOpenTakeFurther={() => setIsTakeFurtherOpen(true)}
        />
      )}

      {currentScreen === 'thought-detail' && (
        <ThoughtDetailScreen
          thought={activeThought}
          onBack={() => setCurrentScreen('notes')}
          onTakeFurther={() => setIsTakeFurtherOpen(true)}
          onDelete={handleDeleteThought}
        />
      )}

      {currentScreen === 'profile' && (
        <ProfileScreen
          user={user}
          onBackClick={() => setCurrentScreen('record')}
          onUpgradePlan={() => setIsProModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === 'about' && (
        <AboutScreen onBackClick={() => setCurrentScreen('record')} />
      )}

      {currentScreen === 'help' && (
        <HelpScreen onBackClick={() => setCurrentScreen('record')} />
      )}

      {currentScreen === 'privacy' && (
        <PrivacyScreen
          onBackClick={() => setCurrentScreen('record')}
          onDeleteAllThoughts={() => {
            updateThoughtsList([]);
            setCurrentScreen('record');
          }}
        />
      )}

      {/* Slide-in Navigation Drawer */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={(scr) => setCurrentScreen(scr)}
        onOpenProPlan={() => setIsProModalOpen(true)}
      />

      {/* Modal: Take Thought Further */}
      <Modal visible={isTakeFurtherOpen} transparent animationType="slide">
        <TakeFurtherModal
          thought={activeThought}
          onBack={() => setIsTakeFurtherOpen(false)}
          onGenerateAI={handleGenerateAI}
        />
      </Modal>

      {/* Modal: Pro Plan Upgrade */}
      <Modal visible={isProModalOpen} transparent animationType="slide">
        <ProPlanModal
          onBackClick={() => setIsProModalOpen(false)}
          onContinue={handleProUpgrade}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: '#03070d',
  },
});
