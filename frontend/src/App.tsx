import React, { useState, useEffect } from 'react';
import { ScreenId, Thought, UserProfile, CategoryId } from './types';
import { INITIAL_THOUGHTS, INITIAL_USER } from './data/mockData';
import { api, BackendThought, getDeviceId } from './services/api';
import { syncEngine } from './services/syncEngine';
import { StatusBar } from './components/StatusBar';
import { HomeIndicator } from './components/HomeIndicator';
import { SidebarDrawer } from './components/SidebarDrawer';
import { saveAudioBlob, deleteAudioBlob } from './services/localAudioStore';
import {
  saveThoughtToFirestore,
  fetchUserThoughtsFromFirestore,
  deleteThoughtFromFirestore,
} from './services/firebaseDb';
import { getCurrentFirebaseUser, subscribeToAuthState } from './services/firebaseAuth';

import { SplashScreen } from './screens/SplashScreen';
import { Step1Screen } from './screens/Step1Screen';
import { Step2Screen } from './screens/Step2Screen';
import { Step3Screen } from './screens/Step3Screen';
import { AccountScreen } from './screens/AccountScreen';
import { LoginScreen } from './screens/LoginScreen';
import { MicrophoneScreen } from './screens/MicrophoneScreen';
import { RecordScreen } from './screens/RecordScreen';
import { SavedScreen } from './screens/SavedScreen';
import { CategoryScreen } from './screens/CategoryScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { NotesScreen } from './screens/NotesScreen';
import { NoteDetailScreen } from './screens/NoteDetailScreen';
import { ThoughtDetailScreen } from './screens/ThoughtDetailScreen';
import { TakeFurtherModal } from './screens/TakeFurtherModal';

import { ProPlanModal } from './screens/ProPlanModal';
import { ProfileScreen } from './screens/ProfileScreen';
import { AboutScreen } from './screens/AboutScreen';
import { HelpScreen } from './screens/HelpScreen';
import { PrivacyScreen } from './screens/PrivacyScreen';

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
    audioDuration: bt.audio_duration_seconds ? `00:${Math.round(bt.audio_duration_seconds).toString().padStart(2, '0')}` : '00:28',
    audioUrl: bt.audio_ref ? `/api/v1/thoughts/${bt.id}/audio` : undefined,
    version: bt.version,
    summary: bt.summary || undefined,
    tags: bt.tags || [],
    enrichment_status: bt.enrichment_status,
  };
}


export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('splash');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isTakeFurtherOpen, setIsTakeFurtherOpen] = useState(false);

  // Persistent Thoughts State
  const [thoughts, setThoughts] = useState<Thought[]>(() => {
    const saved = localStorage.getItem('unsaid_thoughts');
    return saved ? JSON.parse(saved) : INITIAL_THOUGHTS;
  });

  const [activeThought, setActiveThought] = useState<Thought>(thoughts[0] || INITIAL_THOUGHTS[0]);

  // Persistent User Profile State
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('unsaid_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  // Sync initial thoughts and quota from backend API
  useEffect(() => {
    api.listThoughts({ limit: 50 })
      .then((res) => {
        if (res.items && res.items.length > 0) {
          const mapped = res.items.map(mapBackendThought);
          setThoughts(mapped);
          setActiveThought(mapped[0]);
        }
      })
      .catch((err) => console.log('Offline/Local mode fallback for thoughts:', err));

    api.getSession()
      .then((session) => {
        setUser((prev) => ({
          ...prev,
          plan: session.plan === 'pro' ? 'Pro' : 'Free',
          usedCreditsPercent: Math.min(100, Math.round((session.daily_enrichments_used / ((session.daily_enrichments_used + session.daily_enrichments_remaining) || 2)) * 100)),
        }));
      })
      .catch((err) => console.log('Offline/Local mode fallback for session:', err));

    // Subscribe to background delta sync reconciliations
    const unsubscribeSync = syncEngine.subscribe((_status, reconciled) => {
      if (reconciled && reconciled.length > 0) {
        setThoughts((prev) => {
          const map = new Map<string, Thought>(prev.map((t) => [t.id, t]));
          for (const st of reconciled) {
            map.set(st.id, mapBackendThought(st));
          }
          return Array.from(map.values());
        });
      }
    });

    // Subscribe to Firebase Auth State for persistent user identification & Firestore sync
    const unsubscribeAuth = subscribeToAuthState(async (fbUser) => {
      if (fbUser) {
        setUser((prev) => ({
          ...prev,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
          email: fbUser.email || prev.email,
        }));

        try {
          const userFirestoreThoughts = await fetchUserThoughtsFromFirestore(fbUser.uid);
          if (userFirestoreThoughts.length > 0) {
            setThoughts((prev) => {
              const map = new Map<string, Thought>(prev.map((t) => [t.id, t]));
              for (const uft of userFirestoreThoughts) {
                map.set(uft.id, uft);
              }
              return Array.from(map.values());
            });
          }
        } catch (e) {
          console.warn('Firestore initial thoughts sync:', e);
        }
      }
    });

    return () => {
      unsubscribeSync();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('unsaid_thoughts', JSON.stringify(thoughts));
  }, [thoughts]);

  useEffect(() => {
    localStorage.setItem('unsaid_user', JSON.stringify(user));
  }, [user]);

  // Auth & Session Migration Handlers
  const handleGoogleLogin = async () => {
    const prevDeviceId = getDeviceId();
    const loginRes = await api.loginWithGoogle();
    setUser({
      name: loginRes.name || 'Google User',
      email: loginRes.email,
      plan: 'Free',
      usedCreditsPercent: 0,
    });

    // Migrate anonymous data to new user account
    await api.migrateSession(prevDeviceId).catch((err) => console.warn('Migration error:', err));
    
    // Sync pending offline changes
    await syncEngine.syncPending().catch(() => {});

    // Fetch and sync user thoughts from Firestore
    try {
      const firestoreThoughts = await fetchUserThoughtsFromFirestore(loginRes.user_id);
      if (firestoreThoughts.length > 0) {
        setThoughts((prev) => {
          const map = new Map<string, Thought>(prev.map((t) => [t.id, t]));
          for (const ft of firestoreThoughts) {
            map.set(ft.id, ft);
          }
          return Array.from(map.values());
        });
      }
    } catch (e) {
      console.warn('Firestore sync on login:', e);
    }

    // Refresh thoughts and session from backend API
    const list = await api.listThoughts({ limit: 50 }).catch(() => ({ items: [] }));
    if (list.items && list.items.length > 0) {
      const mapped = list.items.map(mapBackendThought);
      setThoughts(mapped);
      setActiveThought(mapped[0]);
    }
    const session = await api.getSession().catch(() => null);
    if (session) {
      setUser((prev) => ({
        ...prev,
        plan: session.plan === 'pro' ? 'Pro' : 'Free',
        usedCreditsPercent: Math.min(100, Math.round((session.daily_enrichments_used / ((session.daily_enrichments_used + session.daily_enrichments_remaining) || 2)) * 100)),
      }));
    }

    setCurrentScreen('notes');
  };

  const handleEmailLoginSuccess = async (userData: { email: string; name: string; token: string }) => {
    try {
      const prevDeviceId = getDeviceId();
      setUser({
        name: userData.name,
        email: userData.email,
        plan: 'Free',
        usedCreditsPercent: 0,
      });

      // Migrate anonymous data to authenticated user
      await api.migrateSession(prevDeviceId).catch((err) => console.warn('Migration note:', err));
      await syncEngine.syncPending().catch(() => {});

      // Refresh thoughts and quota
      const list = await api.listThoughts({ limit: 50 });
      if (list.items && list.items.length > 0) {
        const mapped = list.items.map(mapBackendThought);
        setThoughts(mapped);
        setActiveThought(mapped[0]);
      }
      const session = await api.getSession();
      setUser((prev) => ({
        ...prev,
        plan: session.plan === 'pro' ? 'Pro' : 'Free',
        usedCreditsPercent: Math.min(100, Math.round((session.daily_enrichments_used / ((session.daily_enrichments_used + session.daily_enrichments_remaining) || 2)) * 100)),
      }));

      setCurrentScreen('microphone');
    } catch (err) {
      console.warn('Email login post-migration warning:', err);
      setCurrentScreen('microphone');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(INITIAL_USER);
    setCurrentScreen('account');
  };

  const handleProUpgrade = (plan: 'Free' | 'Pro') => {
    setUser((prev) => ({
      ...prev,
      plan,
      usedCreditsPercent: plan === 'Pro' ? 4 : prev.usedCreditsPercent,
    }));
    setIsProModalOpen(false);
  };

  // Handle Recording Save with live backend API call & Groq AI enrichment
  const handleFinishCapturing = async (transcriptionText: string, audioBlob?: Blob, durationSeconds?: number) => {
    const thoughtUuid = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `thought-${Date.now()}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Create object URL from audio blob immediately so playback works with the exact spoken recording
    const localAudioUrl = audioBlob ? URL.createObjectURL(audioBlob) : undefined;
    const initialText = transcriptionText.trim() || 'Transcribing audio recording...';

    const newThought: Thought = {
      id: thoughtUuid,
      title: transcriptionText.trim() ? (transcriptionText.trim().slice(0, 45) + (transcriptionText.trim().length > 45 ? '...' : '')) : 'Transcribing & Enriching...',
      transcription: initialText,
      category: 'Idea',
      date: dateStr,
      formattedTime: `Today , ${timeStr}`,
      audioDuration: durationSeconds ? `00:${durationSeconds.toString().padStart(2, '0')}` : '00:28',
      audioUrl: localAudioUrl,
      enrichment_status: 'processing',
      version: 1,
    };

    setThoughts((prev) => [newThought, ...prev]);
    setActiveThought(newThought);
    setCurrentScreen('saved');

    // 1. Save voice recording strictly to local IndexedDB (zero database footprint)
    if (audioBlob) {
      saveAudioBlob(thoughtUuid, audioBlob).catch((e) => console.warn('Local voice save notice:', e));
    }

    // 2. If authenticated, persist note document to Firestore under /users/{uid}/thoughts
    const currentFbUser = getCurrentFirebaseUser();
    if (currentFbUser) {
      saveThoughtToFirestore(currentFbUser.uid, newThought).catch((e) => console.warn('Firestore initial create:', e));
    }

    // Add to offline sync mutation queue
    syncEngine.enqueue(thoughtUuid, 'create', {
      raw_text: initialText,
      capture_state: 'committed',
      send_to_ai: true,
      type: 'ideas',
    });

    try {
      const created = await api.createThought({
        id: thoughtUuid,
        raw_text: initialText,
        capture_state: 'committed',
        send_to_ai: true,
      });

      let finalThought = created;

      // Upload the spoken audio recording to the backend for Whisper STT
      if (audioBlob) {
        try {
          const uploaded = await api.uploadAudio(thoughtUuid, audioBlob, `audio-${Date.now()}.webm`);
          if (uploaded) {
            finalThought = uploaded;
          }
        } catch (e) {
          console.warn('Audio upload warning:', e);
        }
      }

      const mapped = mapBackendThought(finalThought);
      if (localAudioUrl) {
        mapped.audioUrl = localAudioUrl;
      }
      setActiveThought(mapped);
      setThoughts((prev) => prev.map((t) => (t.id === thoughtUuid ? mapped : t)));

      // Sync completed transcript/tags to Firestore
      if (currentFbUser) {
        saveThoughtToFirestore(currentFbUser.uid, mapped).catch((e) => console.warn('Firestore mapped sync:', e));
      }
    } catch (err) {
      console.warn('Backend create failed, cached locally and queued for delta sync:', err);
    }
  };


  // Handle Category Select
  const handleSelectCategory = (cat: CategoryId) => {
    const updated = { ...activeThought, category: cat };
    setActiveThought(updated);
    setThoughts((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setCurrentScreen('thought-detail');

    syncEngine.enqueue(activeThought.id, 'update', {
      base_version: activeThought.version || 1,
      type: cat.toLowerCase(),
    });

    api.updateThought(activeThought.id, {
      base_version: activeThought.version || 1,
      type: cat.toLowerCase(),
    }).then((res) => {
      const mapped = mapBackendThought(res);
      if (updated.audioUrl) {
        mapped.audioUrl = updated.audioUrl;
      }
      setActiveThought(mapped);
      setThoughts((prev) => prev.map((t) => (t.id === mapped.id ? mapped : t)));
    }).catch((e) => console.warn('Category update warning:', e));
  };


  // Handle AI Expansion via LangGraph Engine — Appends directly into the active Note document (§2.4)
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
        appendedMarkdown += `\n### 📋 Actionable Milestones\n` + expansion.actionable_steps.map((step, idx) => `- [ ] **Step ${idx + 1}:** ${step}`).join('\n') + '\n';
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
      setThoughts((prev) => prev.map((t) => (t.id === fullyExpanded.id ? fullyExpanded : t)));

      // Persist appended content to backend & offline sync queue
      api.updateThought(activeThought.id, {
        base_version: activeThought.version || 1,
        transcript: updatedContent,
        raw_text: updatedContent,
      }).catch((e) => console.warn('Note append sync notice:', e));

      syncEngine.enqueue(activeThought.id, 'update', {
        base_version: activeThought.version || 1,
        transcript: updatedContent,
        raw_text: updatedContent,
      });

      // Sync expanded note directly to Firestore
      const currentFbUser = getCurrentFirebaseUser();
      if (currentFbUser) {
        saveThoughtToFirestore(currentFbUser.uid, fullyExpanded).catch(() => {});
      }

      setCurrentScreen('note-detail');
    } catch (err) {
      console.warn('Expansion failed, keeping note unchanged:', err);
    }
  };

  // Create New Blank Note
  const handleNewNote = () => {
    const noteId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `note-${Date.now()}`;
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

    setThoughts((prev) => [newNote, ...prev]);
    setActiveThought(newNote);
    setCurrentScreen('note-detail');

    const currentFbUser = getCurrentFirebaseUser();
    if (currentFbUser) {
      saveThoughtToFirestore(currentFbUser.uid, newNote).catch(() => {});
    }

    api.createThought({
      id: noteId,
      raw_text: '',
      capture_state: 'committed',
      send_to_ai: false,
    }).catch(() => {});
  };

  // Update Note from Document View
  const handleUpdateNote = (updated: Thought) => {
    setActiveThought(updated);
    setThoughts((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

    // Sync updated document to Firestore
    const currentFbUser = getCurrentFirebaseUser();
    if (currentFbUser) {
      saveThoughtToFirestore(currentFbUser.uid, updated).catch((e) => console.warn('Firestore update sync:', e));
    }

    api.updateThought(updated.id, {
      base_version: updated.version || 1,
      title: updated.title,
      transcript: updated.transcription,
      raw_text: updated.transcription,
    }).catch((e) => console.warn('Note save notice:', e));

    syncEngine.enqueue(updated.id, 'update', {
      base_version: updated.version || 1,
      title: updated.title,
      transcript: updated.transcription,
      raw_text: updated.transcription,
    });
  };

  // Delete Thought / Note
  const handleDeleteThought = (id: string) => {
    // Delete local voice recording from IndexedDB
    deleteAudioBlob(id).catch(() => {});

    // Delete document from Firestore
    const currentFbUser = getCurrentFirebaseUser();
    if (currentFbUser) {
      deleteThoughtFromFirestore(currentFbUser.uid, id).catch(() => {});
    }

    syncEngine.enqueue(id, 'delete', { base_version: 1 });
    api.deleteThought(id).catch((e) => console.warn('Delete warning:', e));
    const remaining = thoughts.filter((t) => t.id !== id);
    setThoughts(remaining);
    if (remaining.length > 0) {
      setActiveThought(remaining[0]);
      setCurrentScreen('notes');
    } else {
      setCurrentScreen('record');
    }
  };

  // Reset App State
  const handleResetApp = () => {
    localStorage.clear();
    setThoughts(INITIAL_THOUGHTS);
    setUser(INITIAL_USER);
    setActiveThought(INITIAL_THOUGHTS[0]);
    setCurrentScreen('splash');
  };

  return (
    <div className="app-viewport-wrapper cosmic-bg">
      {/* Main Mobile Device Container */}
      <div
        className="mobile-screen frame-mode"
        style={{ maxWidth: '393px', maxHeight: '852px' }}
      >
        <StatusBar />

        {/* Dynamic Screen Navigation Router */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
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
                setThoughts([]);
                setCurrentScreen('record');
              }}
            />
          )}

          {/* Modal Overlay: Take Thought Further */}
          {isTakeFurtherOpen && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 80, background: '#03070d' }}>
              <TakeFurtherModal
                thought={activeThought}
                onBack={() => setIsTakeFurtherOpen(false)}
                onGenerateAI={handleGenerateAI}
              />
            </div>
          )}

          {/* Modal Overlay: Pro Plan Subscription */}
          {isProModalOpen && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 85, background: '#03070d' }}>
              <ProPlanModal
                onBackClick={() => setIsProModalOpen(false)}
                onContinue={handleProUpgrade}
              />
            </div>
          )}
        </div>

        {/* Sidebar Navigation Drawer */}
        <SidebarDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onNavigate={(scr) => setCurrentScreen(scr)}
          onOpenProPlan={() => setIsProModalOpen(true)}
        />

        <HomeIndicator />
      </div>
    </div>
  );
};
