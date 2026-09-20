import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChildProfile = {
  first_name: string;
  date_of_birth?: string;
  communication_level?: string;
  preferred_language?: string;
  gender?: string;
};

export type Activity = {
  id: string;
  name: string;
  description: string;
  category: string;
  time_minutes: number;
  setup_instructions: string;
  is_completed?: boolean;
};

export type DailyPlan = {
  id: string;
  mode: string;
  plan_date: string;
  activities: Activity[];
};

export type SnapshotData = {
  assessment_date: string;
  chronological_age_months: number;
  domain_scores: Record<string, string>;
  next_milestones: Record<string, string[]>;
};

export type SessionInfo = {
  id: string;
  activity_name: string;
  response: string;
  text_note: string | null;
  voice_note_url: string | null;
  ai_summary?: string | null;
  time: string;
};

export type HistoryData = {
  date: string;
  sessions: SessionInfo[];
  total_completed: number;
  independent_count: number;
};

interface AppState {
  child: ChildProfile | null;
  plan: DailyPlan | null;
  snapshot: SnapshotData | null;
  history: HistoryData[];
  
  setChild: (child: ChildProfile) => void;
  setPlan: (plan: DailyPlan) => void;
  setSnapshot: (snapshot: SnapshotData) => void;
  setHistory: (history: HistoryData[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      child: null,
      plan: null,
      snapshot: null,
      history: [],
      
      setChild: (child) => set({ child }),
      setPlan: (plan) => set({ plan }),
      setSnapshot: (snapshot) => set({ snapshot }),
      setHistory: (history) => set({ history }),
    }),
    {
      name: 'lumio-offline-storage', // The key in localStorage
    }
  )
);
