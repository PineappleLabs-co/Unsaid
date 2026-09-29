import { Thought, UserProfile } from '../types';

export const INITIAL_USER: UserProfile = {
  name: 'Blaze67',
  email: 'Blaze67@example.com',
  plan: 'Free',
  usedCreditsPercent: 50,
};

export const INITIAL_THOUGHTS: Thought[] = [
  {
    id: 'thought-1',
    title: 'Improve onboarding flow',
    transcription:
      'Complete the project proposal for the client. Include the research, UI mockups and timeline. Also check the budget and confirm with the team tomorrow.',
    category: 'Idea',
    date: 'Sep 30, 2026',
    formattedTime: 'Today , 9:45',
    audioDuration: '00:28',
    structuredPlan: {
      summary: 'Complete client project proposal with research, UI mockups, timeline and budget verification.',
      actionableSteps: [
        'Finalize market research section',
        'Export mobile app UI mockups',
        'Prepare 4-week execution timeline',
        'Review budget with finance team tomorrow morning',
      ],
      insights: [
        'Clients prioritize clear timelines over lengthy documentation.',
        'Visual mockups increase proposal approval rate by 40%.',
      ],
      suggestedFeatures: [
        'Interactive prototype link in proposal PDF',
        'Budget breakdown sheet attachment',
      ],
    },
  },
  {
    id: 'thought-2',
    title: 'Need to finish this project',
    transcription:
      'Wrap up the final code review, check responsive views on all mobile screen sizes, verify touch targets, and prepare deployment pipeline.',
    category: 'Work',
    date: 'Sep 30, 2026',
    formattedTime: 'Sep 30 , 11:30 AM',
    audioDuration: '00:45',
  },
  {
    id: 'thought-3',
    title: 'Gym routine optimization',
    transcription:
      'Switch workout split to Push Pull Legs 4 days a week. Focus on progressive overload for bench press and squat.',
    category: 'Personal',
    date: 'Sep 30, 2026',
    formattedTime: 'Sep 30 , 14:00 PM',
    audioDuration: '00:15',
  },
  {
    id: 'thought-4',
    title: 'AI feature for documentation',
    transcription:
      'Explore automatic speech transcription to markdown summary conversion. Support voice tag categorization.',
    category: 'Tech',
    date: 'Sep 30, 2026',
    formattedTime: 'Sep 30 , 18:45 AM',
    audioDuration: '00:32',
  },
  {
    id: 'thought-5',
    title: 'Improve onboarding flow',
    transcription:
      'Add step-by-step visual onboarding highlighting voice recording capabilities.',
    category: 'Idea',
    date: 'August 1, 2026',
    formattedTime: 'Aug 1 , 9:45 AM',
    audioDuration: '00:20',
  },
  {
    id: 'thought-6',
    title: 'Need to finish this project',
    transcription:
      'Initial concept discussion and task breakdown for UNSAID thought catcher.',
    category: 'Work',
    date: 'August 1, 2026',
    formattedTime: 'Aug 1 , 11:30 AM',
    audioDuration: '00:50',
  },
];
