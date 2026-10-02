import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
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
import 'leaflet/dist/leaflet.css';

const DistrictExperience = lazy(() => import('./components/DistrictExperience'));

// --- Custom Premium Icons ---
const createIcon = (color: string, iconHtml: string) => L.divIcon({
  className: 'bg-transparent',
  html: `<div class="w-10 h-10 rounded-full flex items-center justify-center shadow-2xl border-2 border-white text-white" style="background-color: ${color};">${iconHtml}</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const icons = {
  home: createIcon('#D4AF37', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>'),
  hospital: createIcon('#ef4444', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>'),
  bus: createIcon('#3b82f6', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M2 12h19.6"></path><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path><circle cx="7" cy="18" r="2"></circle><circle cx="17" cy="18" r="2"></circle></svg>'),
  shop: createIcon('#10b981', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>'),
  business: createIcon('#8b5cf6', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>'),
  bank: createIcon('#f59e0b', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" x2="21" y1="22" y2="22"></line><line x1="6" x2="6" y1="18" y2="11"></line><line x1="10" x2="10" y1="18" y2="11"></line><line x1="14" x2="14" y1="18" y2="11"></line><line x1="18" x2="18" y1="18" y2="11"></line><polygon points="12 2 20 7 4 7"></polygon></svg>'),
  school: createIcon('#06b6d4', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>')
};

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

function MapUpdater({ state, isTransitRoute }: { state: SimulationResponse | null, isTransitRoute: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (state?.mapAction) {
      map.flyTo([state.mapAction.latitude, state.mapAction.longitude], state.mapAction.zoom, { duration: 2.5 });
    }
  }, [state, map]);

  return (
    <>
      {state?.route && (
        <Polyline 
          positions={state.route.map(r => [r.latitude, r.longitude])} 
          color={isTransitRoute ? "#38bdf8" : "#D4AF37"} 
          weight={6} 
          dashArray={isTransitRoute ? "6, 10" : "10, 15"} 
          className="animate-pulse"
        />
      )}
      {state?.mapAction && (
        <Marker
          position={[state.mapAction.latitude, state.mapAction.longitude]}
          icon={state.route ? icons.hospital : state.investmentMetrics ? icons.business : icons.home}
        >
          <Popup>
            <div className="text-slate-900">
              <p className="font-bold text-sm">Focus Coordinates</p>
              <p className="text-[11px] text-amber-700 font-semibold">Active Rehearsal Target</p>
            </div>
          </Popup>
        </Marker>
      )}
      {(state?.poiMarkers || ABU_DHABI_POIS).map((poi, i) => (
        <Marker key={i} position={[poi.latitude, poi.longitude]} icon={icons[poi.type as keyof typeof icons] || icons.home}>
          <Popup className="font-sans">
            <div className="text-slate-900">
              <p className="font-bold text-sm">{poi.name}</p>
              {poi.source && (
                <p className="text-[11px] text-slate-500 mt-0.5">Source: {poi.source}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

type TimeOfDay = 'morning' | 'noon' | 'night';

export default function App() {
  const navigate = useNavigate();
  const { profile, selectedNeighborhood, commute, setProfile, setSelectedNeighborhood, setCommuteSession } = useRehearsal();

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
  const [isTransitActive, setIsTransitActive] = useState(commute.completed && commute.mode === 'ac_transit');
  
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
        setIsTransitActive(response.routeDetails.routeType === 'ac_transit');
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
    setIsTransitActive(false);
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
  const routeDestinationPoi = sortedRoutePlaces.find((poi) => poi.type === 'hospital' || poi.type === 'business');
  const routeDestination = routeDestinationPoi?.name.replace(/ \(.*\)$/, '') || (aiState?.routeDetails ? 'Selected Abu Dhabi destination' : undefined);
  const routeNearbyPlaces = sortedRoutePlaces
    .filter((poi) => poi.type !== 'home' && poi.type !== 'business' && poi.type !== 'bank' && poi.type !== 'school')
    .filter((poi) => aiState?.mapAction && Math.hypot(poi.latitude - aiState.mapAction.latitude, poi.longitude - aiState.mapAction.longitude) < 0.045)
    .slice(0, 3);
  const districtFocus: [number, number] = aiState?.mapAction
    ? [Math.max(-3.5, Math.min(3.5, (aiState.mapAction.longitude - activeArea.longitude) * 35)), Math.max(-3.5, Math.min(3.5, (activeArea.latitude - aiState.mapAction.latitude) * 35))]
    : [0, 0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-sand-900 font-sans">
      
      {/* Map Layer */}
      <div className={"absolute inset-0 z-0 transition-opacity duration-1000 " + (timeOfDay === 'night' ? 'opacity-50' : 'opacity-100')}>
        <MapContainer 
          center={[findAbuDhabiArea(selectedNeighborhood)?.latitude || ABU_DHABI_AREAS[0].latitude, findAbuDhabiArea(selectedNeighborhood)?.longitude || ABU_DHABI_AREAS[0].longitude]}
          zoom={14} 
          zoomControl={false} 
          attributionControl={true}
          className="w-full h-full"
        >
          <TileLayer 
            attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
          />
          <MapUpdater state={aiState} isTransitRoute={isTransitActive} />
        </MapContainer>
      </div>

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

      <Suspense fallback={null}>
        <DistrictExperience
          area={activeArea}
          focus={districtFocus}
          destination={routeDestination}
          destinationSource={routeDestinationPoi?.source}
          route={aiState?.routeDetails}
          nearbyPlaces={routeNearbyPlaces}
          temperature={liveWeather.temp}
          apparentTemperature={liveWeather.apparentTemp}
          onCloseDestination={() => setAiState((current) => current ? { ...current, route: undefined, routeDetails: undefined, distanceKm: undefined, durationMins: undefined, routingSource: undefined, isLiveRouting: undefined } : current)}
        />
      </Suspense>

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
