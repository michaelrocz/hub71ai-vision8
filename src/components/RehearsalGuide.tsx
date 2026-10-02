import { useEffect, useState } from 'react';
import { ArrowRight, AudioLines, Check, Mic, Moon, Navigation, Send, Sun, Sunrise, Users, Briefcase, MapPin } from 'lucide-react';
import { ABU_DHABI_AREAS, findAbuDhabiArea } from '../lib/abuDhabiAreas';

type Track = 'residential' | 'business';

interface RehearsalGuideProps {
  name: string;
  track: Track;
  neighborhood: string;
  priority: string;
  listening: boolean;
  speechSupported: boolean;
  loading: boolean;
  recentResponse: string;
  responseSource?: string;
  routeSummary?: string;
  businessInsight?: string;
  onListen: () => void;
  onAsk: (prompt: string) => void;
  onCoach: () => void;
  onTimeChange: (time: 'morning' | 'noon' | 'night') => void;
  onLocationChange: (areaId: string) => void;
  onPlaceDetails: () => void;
  hasPlaceDetails: boolean;
}

export default function RehearsalGuide({
  name,
  track,
  neighborhood,
  priority,
  listening,
  speechSupported,
  loading,
  recentResponse,
  responseSource,
  routeSummary,
  businessInsight,
  onListen,
  onAsk,
  onCoach,
  onTimeChange,
  onLocationChange,
  onPlaceDetails,
  hasPlaceDetails,
}: RehearsalGuideProps) {
  const [scene, setScene] = useState(0);
  const [draft, setDraft] = useState('');
  useEffect(() => { setScene(0); }, [track, neighborhood]);
  const scenes = track === 'business'
    ? [
        { time: '08:30', label: 'Your first workday', title: `${name ? `Good morning, ${name}.` : 'Your first morning in Abu Dhabi.'} Let’s prepare your first business visit.`, body: `You’re in ${neighborhood}. Explore the right building, understand the setup steps, and rehearse the questions before your meeting.`, choices: [{ label: neighborhood === 'Masdar City' ? 'Open my Masdar arrival brief' : 'Open my ADGM arrival brief', prompt: `Take me to ${neighborhood === 'Masdar City' ? 'Masdar One Stop Shop' : 'ADGM Al Khatem Tower'} and show the setup and arrival brief.` }, { label: neighborhood === 'Masdar City' ? 'Explore ADGM instead' : 'Explore Hub71', prompt: neighborhood === 'Masdar City' ? 'Visit ADGM and show the setup brief.' : 'Visit Hub71 and show the startup arrival brief.' }] },
        { time: '10:15', label: 'Choose your base', title: 'Where would your business come to life?', body: 'Move between districts and rehearse the trade-offs behind your first office decision.', choices: [{ label: 'Visit ADGM', prompt: 'Take me to ADGM on Al Maryah Island. What should I notice as a first-time founder?' }, { label: 'Visit Masdar City', prompt: 'Show me Masdar City and what a clean-tech founder should explore there.' }] },
        { time: '12:00', label: 'A real conversation', title: 'Practice the question before the meeting.', body: 'Step into a conversation with an advisor. Ask about setup, licensing, or the details you want to verify.', choices: [{ label: 'Practice with an advisor', prompt: '' }, { label: 'Ask about setup requirements', prompt: 'What company setup questions should I verify for my business activity in Abu Dhabi?' }] },
      ]
    : [
        { time: '07:45', label: 'Your first morning', title: `${name ? `Welcome to ${neighborhood}, ${name}.` : `Welcome to ${neighborhood}.`} Where should we begin?`, body: `We’ll rehearse the everyday details around your move. First, let’s look at the things you said matter: ${priority || 'your commute, home, and daily routine'}.`, choices: [{ label: 'Explore this district in 3D', prompt: `Explore ${neighborhood} in 3D and help me choose a place to visit.` }, { label: 'Plan a comfortable commute', prompt: `Help me rehearse a comfortable commute from ${neighborhood}, considering Abu Dhabi heat and transport options.` }] },
        { time: '11:30', label: 'The everyday rhythm', title: 'A small errand can tell you a lot about a neighborhood.', body: 'Explore local essentials, notice how you would get there, and see how the time of day changes the experience.', choices: [{ label: 'Find everyday essentials', prompt: `Show me groceries, healthcare, and useful places near ${neighborhood}.` }, { label: 'Feel the midday heat', prompt: 'What would a midday outdoor trip feel like in Abu Dhabi? Help me compare walking and air-conditioned transport.' }] },
        { time: '17:00', label: 'Before you decide', title: 'Let’s rehearse a conversation that matters.', body: 'Try a rental conversation and practice asking about cooling costs, tenancy registration, and the details you want confirmed.', choices: [{ label: 'Practice a lease conversation', prompt: '' }, { label: 'Explore another daily moment', prompt: `Take me to a family-friendly everyday place near ${neighborhood}.` }] },
      ];
  const current = scenes[scene];

  const choose = (prompt: string) => {
    if (!prompt) onCoach();
    else onAsk(prompt);
    setScene((currentScene) => Math.min(currentScene + 1, scenes.length - 1));
  };

  return (
    <section aria-label="Guided Abu Dhabi rehearsal" className="moment-guide absolute left-3 top-20 z-30 max-h-[calc(100vh-6rem)] w-[calc(100vw-1.5rem)] max-w-[360px] overflow-y-auto rounded-[26px] border border-white/15 bg-[#071821]/95 text-white shadow-[0_24px_70px_rgba(0,0,0,.4)] lg:left-7">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d4bd8b]/15 text-[#e5cc98]">{track === 'business' ? <Briefcase size={15} /> : <Users size={15} />}</div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.15em] text-[#e1c78f]">Your arrival rehearsal</p>
            <label className="mt-1 flex items-center gap-1.5 text-xs text-white/75"><MapPin size={12} className="shrink-0 text-[#d8c18c]" />
              <select aria-label="Choose a real Abu Dhabi location" value={findAbuDhabiArea(neighborhood)?.id || ABU_DHABI_AREAS[0].id} onChange={(event) => onLocationChange(event.target.value)} className="max-w-[175px] cursor-pointer appearance-none bg-transparent pr-1 text-sm font-medium text-white outline-none">
                {ABU_DHABI_AREAS.map((area) => <option key={area.id} value={area.id} className="bg-[#10242c] text-white">{area.name}</option>)}
              </select>
              <span className="whitespace-nowrap text-[11px] text-white/45">· Scene {scene + 1} of {scenes.length}</span>
            </label>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[.04] p-1" aria-label="Set scene time">
          {(['morning', 'noon', 'night'] as const).map((time) => (
            <button key={time} onClick={() => onTimeChange(time)} aria-label={`${time} lighting`} title={`${time} lighting`} className="rounded-full p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white">{time === 'morning' ? <Sunrise size={12} /> : time === 'noon' ? <Sun size={12} /> : <Moon size={12} />}</button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5 pt-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[.12em] text-[#b8c5c7]/65"><span className="h-px w-5 bg-[#d4bd8b]/60" /> {current.time} <span className="text-white/30">/</span> {current.label}</div>
        <h2 className="text-xl font-semibold leading-[1.25] tracking-[-.02em]">{current.title}</h2>
        <p className="mt-2.5 text-sm leading-[1.6] text-white/70">{current.body}</p>

        <div className="mt-4 grid gap-2">
          {current.choices.map((choice, index) => (
            <button key={choice.label} onClick={() => choose(choice.prompt)} className={`group flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition ${index === 0 ? 'border-[#d3bd8c]/45 bg-[#d3bd8c] text-[#14282d] hover:bg-[#ead6a8]' : 'border-white/12 bg-white/[.055] text-white/85 hover:border-white/25 hover:bg-white/[.1]'}`}>
              <span className="flex items-center gap-2.5"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${index === 0 ? 'bg-[#14282d]/10' : 'bg-white/10'}`}>{scene > 0 && index === 0 ? <Check size={13} /> : <Navigation size={12} />}</span>{choice.label}</span>
              <ArrowRight size={14} className="shrink-0 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
            </button>
          ))}
        </div>

        {loading && <div className="mt-3 rounded-xl border border-white/10 bg-white/[.05] px-3.5 py-3 text-xs text-white/70">Your guide is preparing the next part of the rehearsal…</div>}
        {!loading && recentResponse && <div className="mt-3 rounded-xl border border-[#d3bd8c]/20 bg-[#d3bd8c]/[.08] px-3.5 py-3.5">
          <p className="text-sm leading-[1.6] text-white/90">{recentResponse}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            {responseSource && <p className="text-[9px] font-medium uppercase tracking-[.12em] text-[#e0c78f]/65">{responseSource}</p>}
            {routeSummary && <p className="text-[9px] font-semibold text-emerald-100/80">{routeSummary}</p>}
          </div>
          {businessInsight && <p className="mt-2 border-t border-white/10 pt-2 text-[10px] leading-4 text-sky-50/75">{businessInsight} <span className="text-sky-50/45">· illustrative; verify current rules</span></p>}
        </div>}

        {hasPlaceDetails && <button onClick={onPlaceDetails} className="mt-3 flex w-full items-center justify-between rounded-xl border border-[#a3d3cb]/25 bg-[#a3d3cb]/10 px-3.5 py-3 text-sm font-medium text-[#c7e6df]">{track === 'business' ? 'Setup steps & place details' : 'View destination details'}<ArrowRight size={15} /></button>}

        <form onSubmit={(event) => { event.preventDefault(); if (draft.trim()) { onAsk(draft.trim()); setDraft(''); } }} className={`mt-3 flex min-h-12 items-center gap-2 rounded-xl border bg-black/20 p-1.5 focus-within:border-[#d3bd8c]/40 ${listening ? 'border-rose-300/40' : 'border-white/10'}`}>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={listening ? 'Listening — speak naturally…' : 'Ask your guide anything…'} className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/40" />
          <button type="button" onClick={onListen} disabled={!speechSupported} aria-label={listening ? 'Stop voice input' : 'Start voice input'} title={speechSupported ? 'Speak naturally to your guide' : 'Voice input unavailable in this browser'} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${listening ? 'bg-rose-500 text-white' : 'bg-white/10 text-white/75 hover:bg-white/20'}`}>
            {listening ? <AudioLines size={14} className="animate-pulse" /> : <Mic size={14} />}
          </button>
          <button type="submit" disabled={!draft.trim() || loading} aria-label="Send question to local guide" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#d3bd8c] text-[#14282d] transition hover:bg-[#ead6a8] disabled:opacity-40"><Send size={13} /></button>
        </form>

        <div className="mt-3 flex items-center gap-2 text-[10px] leading-4 text-white/40"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300/80" /> Explore the real aerial view and its 3D district model.</div>
      </div>
    </section>
  );
}
