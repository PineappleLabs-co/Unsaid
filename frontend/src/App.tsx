import React, { useState, useEffect } from 'react';
import { ScreenId, Thought, UserProfile, CategoryId } from './types';
import { INITIAL_THOUGHTS, INITIAL_USER } from './data/mockData';
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

  useEffect(() => {
    localStorage.setItem('unsaid_thoughts', JSON.stringify(thoughts));
  }, [thoughts]);

  useEffect(() => {
    localStorage.setItem('unsaid_user', JSON.stringify(user));
  }, [user]);

  // Handle Recording Save
  const handleFinishCapturing = (transcriptionText: string) => {
    const newThought: Thought = {
      id: `thought-${Date.now()}`,
      title: 'New Captured Thought',
      transcription: transcriptionText,
      category: 'Idea',
      date: 'Sep 30, 2026',
      formattedTime: 'Today , 9:45',
      audioDuration: '00:28',
    };
    setThoughts([newThought, ...thoughts]);
    setActiveThought(newThought);
    setCurrentScreen('saved');
  };

  // Handle Category Select
  const handleSelectCategory = (cat: CategoryId) => {
    const updated = { ...activeThought, category: cat };
    setActiveThought(updated);
    setThoughts((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setCurrentScreen('thought-detail');
  };

  // Handle AI Expansion
  const handleGenerateAI = (option: string) => {
    setIsTakeFurtherOpen(false);
    const updated: Thought = {
      ...activeThought,
      title:
        option === 'plan'
          ? 'Project Plan & Execution Strategy'
          : option === 'research'
          ? 'Research Insights & Market Context'
          : option === 'features'
          ? 'Suggested App Features'
          : 'Structured Summary & Key Takeaways',
    };
    setActiveThought(updated);
    setThoughts((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setCurrentScreen('thought-detail');
  };

  // Delete Thought
  const handleDeleteThought = (id: string) => {
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
              onGoogle={() => setCurrentScreen('microphone')}
              onEmail={() => setCurrentScreen('login')}
              onGuest={() => setCurrentScreen('microphone')}
            />
          )}

          {currentScreen === 'login' && (
            <LoginScreen onLoginSuccess={() => setCurrentScreen('microphone')} />
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
              onLogout={() => {
                setUser(INITIAL_USER);
                setCurrentScreen('account');
              }}
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
                onContinue={(plan) => {
                  setUser({ ...user, plan });
                  setIsProModalOpen(false);
                }}
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
