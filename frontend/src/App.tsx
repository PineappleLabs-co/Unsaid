import React, { useState, useEffect } from 'react';
import { ScreenId, Thought, UserProfile, CategoryId } from './types';
import { INITIAL_THOUGHTS, INITIAL_USER } from './data/mockData';
import { api, BackendThought, getDeviceId } from './services/api';
import { syncEngine } from './services/syncEngine';
import { StatusBar } from './components/StatusBar';
import { HomeIndicator } from './components/HomeIndicator';
import { SidebarDrawer } from './components/SidebarDrawer';
import { DesktopToolbar } from './components/DesktopToolbar';

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
  const [deviceFrame, setDeviceFrame] = useState<'iphone15' | 'iphonese' | 'fullscreen'>('iphone15');

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

    return () => unsubscribeSync();
  }, []);

  useEffect(() => {
    localStorage.setItem('unsaid_thoughts', JSON.stringify(thoughts));
  }, [thoughts]);

  useEffect(() => {
    localStorage.setItem('unsaid_user', JSON.stringify(user));
  }, [user]);

  // Auth & Session Migration Handlers
  const handleGoogleLogin = async () => {
    try {
      const prevDeviceId = getDeviceId();
      const loginRes = await api.loginWithGoogle();
      setUser({
        name: 'Google User',
        email: loginRes.email,
        plan: 'Free',
        usedCreditsPercent: 0,
      });

      // Migrate anonymous data to new user account
      await api.migrateSession(prevDeviceId).catch((err) => console.warn('Migration error:', err));
      
      // Sync pending offline changes
      await syncEngine.syncPending().catch(() => {});

      // Refresh thoughts and session
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
      console.warn('Google login failed:', err);
      setCurrentScreen('microphone');
    }
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

    const newThought: Thought = {
      id: thoughtUuid,
      title: 'Transcribing & Enriching...',
      transcription: transcriptionText,
      category: 'Idea',
      date: dateStr,
      formattedTime: `Today , ${timeStr}`,
      audioDuration: durationSeconds ? `00:${durationSeconds.toString().padStart(2, '0')}` : '00:28',
      enrichment_status: 'processing',
      version: 1,
    };

    setThoughts((prev) => [newThought, ...prev]);
    setActiveThought(newThought);
    setCurrentScreen('saved');

    // Add to offline sync mutation queue
    syncEngine.enqueue(thoughtUuid, 'create', {
      raw_text: transcriptionText,
      capture_state: 'committed',
      send_to_ai: true,
      type: 'ideas',
    });

    try {
      const created = await api.createThought({
        id: thoughtUuid,
        raw_text: transcriptionText,
        capture_state: 'committed',
        send_to_ai: true,
      });

      if (audioBlob) {
        await api.uploadAudio(thoughtUuid, audioBlob, `audio-${Date.now()}.webm`).catch((e) => console.warn('Audio upload warning:', e));
      }

      const mapped = mapBackendThought(created);
      setActiveThought(mapped);
      setThoughts((prev) => prev.map((t) => (t.id === thoughtUuid ? mapped : t)));
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
      setActiveThought(mapped);
      setThoughts((prev) => prev.map((t) => (t.id === mapped.id ? mapped : t)));
    }).catch((e) => console.warn('Category update warning:', e));
  };

  // Handle AI Expansion via Multi-Agent Groq Engine
  const handleGenerateAI = async (option: string) => {
    setIsTakeFurtherOpen(false);
    const provisionalTitle =
      option === 'plan'
        ? 'Generating Project Execution Plan...'
        : option === 'research'
        ? 'Generating Deep Research Insights...'
        : option === 'features'
        ? 'Architecting Feature Specifications...'
        : 'Synthesizing Executive Summary...';

    const updatedProvisional: Thought = {
      ...activeThought,
      title: provisionalTitle,
      enrichment_status: 'processing',
    };
    setActiveThought(updatedProvisional);
    setThoughts((prev) => prev.map((t) => (t.id === updatedProvisional.id ? updatedProvisional : t)));
    setCurrentScreen('thought-detail');

    try {
      const expansion = await api.expandThought(activeThought.id, option as any);
      const fullyExpanded: Thought = {
        ...activeThought,
        title: expansion.title,
        summary: expansion.summary,
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
    } catch (err) {
      console.warn('Expansion failed, keeping provisional:', err);
    }
  };

  // Delete Thought
  const handleDeleteThought = (id: string) => {
    syncEngine.enqueue(id, 'delete', { base_version: 1 });
    api.deleteThought(id).catch((e) => console.warn('Delete warning:', e));
    const remaining = thoughts.filter((t) => t.id !== id);
    setThoughts(remaining);
    if (remaining.length > 0) {
      setActiveThought(remaining[0]);
      setCurrentScreen('history');
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
      {/* Desktop Toolbar for phone frame & viewport testing */}
      <DesktopToolbar
        currentFrame={deviceFrame}
        setFrame={setDeviceFrame}
        resetApp={handleResetApp}
      />

      {/* Main Mobile Device Container */}
      <div
        className={`mobile-screen ${deviceFrame !== 'fullscreen' ? 'frame-mode' : ''}`}
        style={
          deviceFrame === 'iphonese'
            ? { maxWidth: '375px', maxHeight: '667px' }
            : deviceFrame === 'iphone15'
            ? { maxWidth: '393px', maxHeight: '852px' }
            : { maxWidth: '100%', maxHeight: '100%' }
        }
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
              onViewThought={() => setCurrentScreen('category')}
              onCaptureAnother={() => setCurrentScreen('record')}
            />
          )}

          {currentScreen === 'category' && (
            <CategoryScreen
              onMenuClick={() => setIsDrawerOpen(true)}
              onSelectCategory={handleSelectCategory}
            />
          )}

          {currentScreen === 'history' && (
            <HistoryScreen
              thoughts={thoughts}
              onBackClick={() => setCurrentScreen('record')}
              onSelectThought={(thought) => {
                setActiveThought(thought);
                setCurrentScreen('thought-detail');
              }}
            />
          )}

          {currentScreen === 'thought-detail' && (
            <ThoughtDetailScreen
              thought={activeThought}
              onBack={() => setCurrentScreen('history')}
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
