import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface UserProfile {
  name: string;
  role: string;
  track: 'residential' | 'business';
  worries: string[];
}

export interface CommuteSession {
  completed: boolean;
  district: string;
  origin: string;
  mode: 'foot' | 'ac_transit';
  destination: string;
  distanceKm: number;
  durationMins: number;
  heatWarning: boolean;
  apparentTemp: number;
  weatherIsLive: boolean;
  isRealRouting: boolean;
  routingSource: string;
}

export interface NegotiationOutcome {
  completed: boolean;
  district: string;
  personaType: 'landlord' | 'adgm_officer';
  counterpartName: string;
  confidenceScore: number;
  missedQuestions: string[];
  warnings: string[];
  tips: string[];
  finalAgreementReached: boolean;
  responseSource: 'AI coach' | 'demo scenario';
}

export interface RehearsalState {
  profile: UserProfile;
  selectedNeighborhood: string;
  commute: CommuteSession;
  negotiation: NegotiationOutcome;
  setProfile: (profile: Partial<UserProfile>) => void;
  setSelectedNeighborhood: (neighborhood: string) => void;
  setCommuteSession: (commute: Partial<CommuteSession>) => void;
  setNegotiationOutcome: (negotiation: Partial<NegotiationOutcome>) => void;
  resetRehearsal: () => void;
}

const defaultProfile: UserProfile = {
  name: '',
  role: '',
  track: 'residential',
  worries: []
};

const defaultCommute: CommuteSession = {
  completed: false,
  district: '',
  origin: '',
  mode: 'foot',
  destination: 'Not rehearsed yet',
  distanceKm: 0,
  durationMins: 0,
  heatWarning: false,
  apparentTemp: 0,
  weatherIsLive: false,
  isRealRouting: false,
  routingSource: 'Awaiting your commute rehearsal'
};

const defaultNegotiation: NegotiationOutcome = {
  completed: false,
  district: '',
  personaType: 'landlord',
  counterpartName: 'Mr. Rashed (Property Owner)',
  confidenceScore: 0,
  missedQuestions: [],
  warnings: [],
  tips: [],
  finalAgreementReached: false,
  responseSource: 'demo scenario'
};

const RehearsalContext = createContext<RehearsalState | undefined>(undefined);

function readStored<T extends object>(key: string, fallback: T): T {
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? { ...fallback, ...(JSON.parse(saved) as Partial<T>) } : fallback;
  } catch {
    return fallback;
  }
}

export function RehearsalProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(() => {
    const stored = readStored('parallel_profile', defaultProfile);
    return {
      ...stored,
      name: stored.name === 'Priya' ? '' : stored.name,
      role: stored.role === 'Senior Tech Lead & Founder' ? '' : stored.role,
    };
  });

  const [selectedNeighborhood, setSelectedNeighborhoodState] = useState<string>(() => {
    return sessionStorage.getItem('parallel_neighborhood') || 'Yas Island';
  });

  const [commute, setCommuteState] = useState<CommuteSession>(() => readStored('parallel_commute', defaultCommute));

  const [negotiation, setNegotiationState] = useState<NegotiationOutcome>(() => readStored('parallel_negotiation', defaultNegotiation));

  useEffect(() => {
    sessionStorage.setItem('parallel_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    sessionStorage.setItem('parallel_neighborhood', selectedNeighborhood);
  }, [selectedNeighborhood]);

  useEffect(() => {
    sessionStorage.setItem('parallel_commute', JSON.stringify(commute));
  }, [commute]);

  useEffect(() => {
    sessionStorage.setItem('parallel_negotiation', JSON.stringify(negotiation));
  }, [negotiation]);

  const setProfile = (updates: Partial<UserProfile>) => {
    setProfileState(prev => ({ ...prev, ...updates }));
  };

  const setSelectedNeighborhood = (neighborhood: string) => {
    setSelectedNeighborhoodState(neighborhood);
  };

  const setCommuteSession = (updates: Partial<CommuteSession>) => {
    setCommuteState(prev => ({ ...prev, ...updates }));
  };

  const setNegotiationOutcome = (updates: Partial<NegotiationOutcome>) => {
    setNegotiationState(prev => ({ ...prev, ...updates }));
  };

  const resetRehearsal = () => {
    setProfileState(defaultProfile);
    setSelectedNeighborhoodState('Yas Island');
    setCommuteState(defaultCommute);
    setNegotiationState(defaultNegotiation);
    sessionStorage.removeItem('parallel_profile');
    sessionStorage.removeItem('parallel_neighborhood');
    sessionStorage.removeItem('parallel_commute');
    sessionStorage.removeItem('parallel_negotiation');
  };

  return (
    <RehearsalContext.Provider
      value={{
        profile,
        selectedNeighborhood,
        commute,
        negotiation,
        setProfile,
        setSelectedNeighborhood,
        setCommuteSession,
        setNegotiationOutcome,
        resetRehearsal
      }}
    >
      {children}
    </RehearsalContext.Provider>
  );
}

export function useRehearsal() {
  const context = useContext(RehearsalContext);
  if (!context) {
    throw new Error('useRehearsal must be used within a RehearsalProvider');
  }
  return context;
}
