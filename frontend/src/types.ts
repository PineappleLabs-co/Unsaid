export type ScreenId =
  | 'splash'
  | 'step1'
  | 'step2'
  | 'step3'
  | 'account'
  | 'login'
  | 'microphone'
  | 'record'
  | 'pause'
  | 'capturing'
  | 'saved'
  | 'category'
  | 'history'
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

export interface Thought {
  id: string;
  title: string;
  transcription: string;
  category: CategoryId;
  date: string;
  formattedTime: string;
  audioDuration: string;
  structuredPlan?: {
    summary: string;
    actionableSteps: string[];
    insights: string[];
    suggestedFeatures: string[];
  };
}

export interface UserProfile {
  name: string;
  email: string;
  plan: 'Free' | 'Pro';
  usedCreditsPercent: number;
}
