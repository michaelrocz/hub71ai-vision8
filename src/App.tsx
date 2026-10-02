import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getSimulationResponse, 
  type SimulationResponse,
  ABU_DHABI_POIS
} from './lib/openai';
import { useRehearsal } from './context/RehearsalContext';
import FrictionEngine from './components/FrictionEngine';
import RehearsalGuide from './components/RehearsalGuide';
import ParallelLogo from './components/ParallelLogo';
import { ABU_DHABI_AREAS, findAbuDhabiArea } from './lib/abuDhabiAreas';
import { 
  Sun, 
  Moon, 
  Activity, 
  Briefcase, 
  Users, 
  MessageSquare, 
  ArrowRight,
  ArrowLeft,
  MoreHorizontal,
} from 'lucide-react';

const MapLibreExperience = lazy(() => import('./components/MapLibreExperience'));

const speakWithSiriVoice = (text: string) => {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  
  const voices = window.speechSynthesis.getVoices();
  const preferredVoices = ['Samantha', 'Google US English', 'Aria', 'Zira', 'Daniel'];
  
  let selectedVoice = null;
  for (const pref of preferredVoices) {
    selectedVoice = voices.find(v => v.name.includes(pref));
    if (selectedVoice) break;
  }
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang === 'en-US') || voices[0];
  }
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  
  window.speechSynthesis.speak(utterance);
};

type TimeOfDay = 'morning' | 'noon' | 'night';

export default function App() {
  const navigate = useNavigate();
  const { profile, selectedNeighborhood, setProfile, setSelectedNeighborhood, setCommuteSession } = useRehearsal();

  const [trackMode, setTrackMode] = useState<'residential' | 'business'>(profile.track || 'residential');
  const [showCoach, setShowCoach] = useState(false);
  const [showNavigationMenu, setShowNavigationMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiState, setAiState] = useState<SimulationResponse | null>(() => {
    const startingPlace = findAbuDhabiArea(selectedNeighborhood) || ABU_DHABI_AREAS[0];
    return {
      voiceReply: '',
      responseSource: 'demo scenario',
      mapAction: { latitude: startingPlace.latitude, longitude: startingPlace.longitude, zoom: startingPlace.zoom },
      poiMarkers: ABU_DHABI_POIS,
    };
  });
  const [loading, setLoading] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('noon');
  
  const [liveWeather, setLiveWeather] = useState<{
    temp: string;
    humidity: string;
    apparentTemp: number;
    isLive: boolean;
    sourceLabel: string;
    updateTime: string;
  }>({
    temp: '--',
    humidity: '--',
    apparentTemp: 0,
    isLive: false,
    sourceLabel: 'Connecting to Open-Meteo...',
    updateTime: '--'
  });

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const aiRequestRef = useRef<(text?: string) => void>(() => undefined);
  const conversationRef = useRef<Array<{ role: 'user' | 'assistant'; text: string }>>([]);

  useEffect(() => {
    let mounted = true;
    const refreshWeather = async () => {
      try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=24.4965&longitude=54.6036&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day&timezone=Asia%2FDubai');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!mounted || !data.current) return;

        const timeStr = data.current.time ? data.current.time.split('T')[1] : '';
        const tempVal = Number(data.current.temperature_2m).toFixed(1);
        const rhVal = Math.round(Number(data.current.relative_humidity_2m)).toString();
        const atVal = Number(data.current.apparent_temperature ?? data.current.temperature_2m);
        setLiveWeather({
          temp: tempVal,
          humidity: rhVal,
          apparentTemp: atVal,
          isLive: true,
          sourceLabel: `Open-Meteo • ${timeStr || 'now'} GST`,
          updateTime: timeStr
        });
        setTimeOfDay(data.current.is_day === 1 ? 'noon' : 'night');
      } catch (err) {
        if (!mounted) return;
        console.warn('Open-Meteo refresh failed:', err);
        setLiveWeather(current => current.isLive
          ? { ...current, sourceLabel: 'Open-Meteo • last reading (refresh failed)' }
          : {
              temp: '31.0',
              humidity: '75',
              apparentTemp: 37.2,
              isLive: false,
              sourceLabel: 'illustrative estimate',
              updateTime: '--'
            }
        );
      }
    };

    void refreshWeather();
    const refreshId = window.setInterval(() => void refreshWeather(), 10 * 60 * 1000);
    return () => {
      mounted = false;
      window.clearInterval(refreshId);
    };
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      const text = Array.from(event.results as ArrayLike<any>)
        .map((result: any) => result[0]?.transcript || '')
        .join(' ')
        .trim();
      transcriptRef.current = text;
      setTranscript(text);
    };
    recognition.onend = () => {
      setIsListening(false);
      const text = transcriptRef.current.trim();
      if (text) aiRequestRef.current(text);
    };

    recognitionRef.current = recognition;
    setSpeechSupported(true);
    return () => {
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // Speech recognition may not have started before the component unmounts.
      }
      recognitionRef.current = null;
    };
  }, []);

  const toggleListen = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      transcriptRef.current = '';
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.warn('Voice input could not start:', error);
        setIsListening(false);
      }
    }
  };

  const handleAiRequest = async (overrideText?: string, forceTransit: boolean = false) => {
    const textToProcess = overrideText || transcript;
    if (!textToProcess.trim()) return;

    const mentionsRoute = /clinic|hospital|walk|direction|bus|transit|commute|nearby/i.test(textToProcess);
    const asksForDirectWalk = /direct walk|walking route|on foot/i.test(textToProcess);
    const shouldUseTransit = forceTransit || (!asksForDirectWalk && mentionsRoute && liveWeather.apparentTemp >= 32);
    const historyWithRequest = [...conversationRef.current, { role: 'user' as const, text: textToProcess }];
    conversationRef.current = historyWithRequest;
    
    if (overrideText) setTranscript(overrideText);
    setIsListening(false);
    setLoading(true);

    try {
      const response = await getSimulationResponse(
        historyWithRequest,
        trackMode, 
        shouldUseTransit,
        { apparentTemp: liveWeather.apparentTemp, isLive: liveWeather.isLive },
        { neighborhood: selectedNeighborhood, priorities: profile.worries }
      );
      setAiState(response);
      conversationRef.current = [...historyWithRequest, { role: 'assistant', text: response.voiceReply }];
      speakWithSiriVoice(response.voiceReply);

      // Record commute session to RehearsalContext
      if (response.routeDetails) {
        setCommuteSession({
          completed: true,
          mode: response.routeDetails.routeType,
          destination: 'Medeor Medical Clinic',
          distanceKm: response.routeDetails.distanceKm,
          durationMins: response.routeDetails.durationMins,
          heatWarning: liveWeather.apparentTemp >= 32,
          apparentTemp: liveWeather.apparentTemp,
          weatherIsLive: liveWeather.isLive,
          isRealRouting: response.routeDetails.isLive,
          routingSource: response.routeDetails.source
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  aiRequestRef.current = (text) => { void handleAiRequest(text); };

  const focusArea = (areaId: string) => {
    const area = ABU_DHABI_AREAS.find((candidate) => candidate.id === areaId);
    if (!area) return;
    setTrackMode(area.track);
    setProfile({ track: area.track });
    setSelectedNeighborhood(area.name);
    const nearbyPois = ABU_DHABI_POIS.filter((poi) =>
      Math.abs(poi.latitude - area.latitude) < 0.07 && Math.abs(poi.longitude - area.longitude) < 0.07,
    );
    setAiState({
      voiceReply: '',
      responseSource: 'demo scenario',
      mapAction: { latitude: area.latitude, longitude: area.longitude, zoom: area.zoom },
      poiMarkers: nearbyPois,
    });
  };

  const switchTrack = (track: 'residential' | 'business') => {
    const area = ABU_DHABI_AREAS.find((candidate) => candidate.track === track);
    if (area) focusArea(area.id);
    setShowNavigationMenu(false);
  };

  const activeArea = findAbuDhabiArea(selectedNeighborhood) || ABU_DHABI_AREAS[0];
  const sortedRoutePlaces = aiState?.routeDetails && aiState.mapAction
    ? [...(aiState.poiMarkers || ABU_DHABI_POIS)].sort((first, second) => {
        const target = aiState.mapAction!;
        const firstDistance = Math.hypot(first.latitude - target.latitude, first.longitude - target.longitude);
        const secondDistance = Math.hypot(second.latitude - target.latitude, second.longitude - target.longitude);
        return firstDistance - secondDistance;
      })
    : [];
  const routeNearbyPlaces = sortedRoutePlaces
    .filter((poi) => poi.type !== 'home' && poi.type !== 'business' && poi.type !== 'bank' && poi.type !== 'school')
    .filter((poi) => aiState?.mapAction && Math.hypot(poi.latitude - aiState.mapAction.latitude, poi.longitude - aiState.mapAction.longitude) < 0.045)
    .slice(0, 3);
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-sand-900 font-sans">

      <Suspense fallback={<div className="absolute inset-0 z-0 grid place-items-center bg-[#102326] text-sm text-white/70">Preparing the Abu Dhabi 3D map…</div>}>
        <MapLibreExperience
          area={activeArea}
          state={aiState}
          route={aiState?.routeDetails}
          nearbyPlaces={routeNearbyPlaces}
          temperature={liveWeather.temp}
          apparentTemperature={liveWeather.apparentTemp}
        />
      </Suspense>

      <RehearsalGuide
        name={profile.name}
        track={trackMode}
        neighborhood={selectedNeighborhood}
        priority={profile.worries.find((worry) => worry.startsWith('I want my guide to know:'))?.replace('I want my guide to know:', '').trim() || profile.worries[0] || ''}
        listening={isListening}
        speechSupported={speechSupported}
        loading={loading}
        recentResponse={aiState?.voiceReply || ''}
        responseSource={aiState?.responseSource === 'AI coach' ? 'AI LOCAL GUIDE' : aiState?.voiceReply ? 'ILLUSTRATIVE MVP RESPONSE' : undefined}
        routeSummary={aiState?.routeDetails ? `${aiState.routeDetails.distanceKm} km · ${aiState.routeDetails.durationMins} min` : undefined}
        businessInsight={aiState?.investmentMetrics ? `${aiState.investmentMetrics.entityType} example · ${aiState.investmentMetrics.corporateTaxRate}` : undefined}
        onListen={toggleListen}
        onAsk={(prompt) => { void handleAiRequest(prompt); }}
        onCoach={() => setShowCoach(true)}
        onTimeChange={setTimeOfDay}
        onLocationChange={focusArea}
      />

      {/* Compact journey header: one primary action, with secondary actions grouped in the menu. */}
      <div className="absolute left-4 right-4 top-4 z-40 flex items-center justify-between pointer-events-auto sm:left-7 sm:right-7 sm:top-6">
        <div className="flex items-center gap-3">
          <ParallelLogo size="compact" />
          <div className="rounded-full border border-white/15 bg-[#071821]/75 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[.14em] text-white/80 shadow-lg backdrop-blur-xl">
            Step 03 <span className="px-1 text-white/35">/</span> 05 <span className="ml-1.5 hidden text-white/50 sm:inline">Arrival rehearsal</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/compare')}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gold to-amber-300 px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-xl transition hover:from-amber-300 hover:to-gold sm:px-4"
          >
            <span className="hidden sm:inline">Felt comparison</span><span className="sm:hidden">Compare</span><ArrowRight size={14} />
          </button>
          <div className="relative">
            <button onClick={() => setShowNavigationMenu((open) => !open)} aria-label="Open journey menu" aria-expanded={showNavigationMenu} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#071821]/80 text-white shadow-lg backdrop-blur-xl transition hover:bg-white/15"><MoreHorizontal size={20} /></button>
            {showNavigationMenu && <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-white/15 bg-[#0b1d25]/95 p-2 text-sm text-white shadow-[0_20px_60px_rgba(0,0,0,.48)] backdrop-blur-2xl">
              <div className="border-b border-white/10 px-3 py-2.5 text-xs text-white/55">Rehearsal for <span className="font-semibold text-white">{profile.name || 'your move'}</span></div>
              <button onClick={() => switchTrack('residential')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/[.08]"><Users size={16} className="text-[#ddc38e]" /> Family & home</button>
              <button onClick={() => switchTrack('business')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/[.08]"><Briefcase size={16} className="text-[#8fd0c8]" /> Business & setup</button>
              <button onClick={() => { setShowCoach(true); setShowNavigationMenu(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/[.08]"><MessageSquare size={16} className="text-[#e3c785]" /> Practice with a coach</button>
              <div className="my-1 border-t border-white/10" />
              <button onClick={() => navigate('/futures')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-white/75 hover:bg-white/[.08]"><ArrowLeft size={15} /> Choose another place</button>
              <button onClick={() => navigate('/')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-white/75 hover:bg-white/[.08]"><ArrowLeft size={15} /> Edit your profile</button>
            </div>}
          </div>
        </div>
      </div>

      {/* Keep the secondary menu clear of the weather summary. */}
      {!showNavigationMenu && <div className="absolute top-20 right-8 z-20 bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl rounded-full px-5 py-2.5 flex items-center gap-4 pointer-events-auto">
        <div className="flex items-center gap-1.5 text-amber-500 font-bold text-base">
          {timeOfDay === 'night' ? <Moon size={18} /> : <Sun size={18} />} 
          {liveWeather.temp}°C
        </div>
        <div className="flex items-center gap-3 text-slate-500 font-medium text-xs border-l border-slate-200 pl-4">
          <span>RH {liveWeather.humidity}%</span>
          {liveWeather.isLive ? (
            <span className="text-emerald-600 flex items-center gap-1 font-bold text-[11px]">
              <Activity size={12} className="text-emerald-500 animate-pulse" />
              {liveWeather.sourceLabel}
            </span>
          ) : (
            <span className="text-amber-600 flex items-center gap-1 font-bold text-[11px]">
              illustrative estimate
            </span>
          )}
        </div>
      </div>}

      {/* Friction & Negotiation Rehearsal Modal */}
      {showCoach && (
        <FrictionEngine 
          initialMode={trackMode === 'business' ? 'investment' : 'landlord'} 
          onClose={() => setShowCoach(false)}
        />
      )}

    </div>
  );
}
