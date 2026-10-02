import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, Check, MapPin, Mic, MicOff, Users } from 'lucide-react';
import { useRehearsal } from '../context/RehearsalContext';
import PlaceMapPreview from '../components/PlaceMapPreview';
import ParallelLogo from '../components/ParallelLogo';
import { ABU_DHABI_AREAS } from '../lib/abuDhabiAreas';

export default function Intake() {
  const navigate = useNavigate();
  const { profile, setProfile } = useRehearsal();
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [track, setTrack] = useState<'residential' | 'business'>(profile.track);
  const [selectedWorries, setSelectedWorries] = useState<string[]>(profile.worries);
  const [voiceRequirement, setVoiceRequirement] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isCapturingNeed, setIsCapturingNeed] = useState(false);
  const voiceRequirementRef = useRef('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      const spokenText = Array.from(event.results as ArrayLike<any>)
        .map((result: any) => result[0]?.transcript || '')
        .join(' ').trim();
      voiceRequirementRef.current = spokenText;
      setVoiceRequirement(spokenText);
    };
    recognition.onend = () => {
      setIsCapturingNeed(false);
      const spokenText = voiceRequirementRef.current.trim();
      if (!spokenText) return;
      setSelectedWorries((previous) => {
        const custom = previous.filter((item) => !item.startsWith('I want my guide to know:'));
        return [...custom, `I want my guide to know: ${spokenText}`];
      });
    };
    recognition.onerror = () => setIsCapturingNeed(false);
    recognitionRef.current = recognition;
    setVoiceSupported(true);
    return () => {
      recognition.onend = null;
      try { recognition.stop(); } catch { /* Recognition may not have started. */ }
      recognitionRef.current = null;
    };
  }, []);

  const residentialWorries = [
    'Summer heat and outdoor commute time',
    'Cooling charges and lease terms',
    'Tenancy registration questions',
    'Schools and everyday walkability',
  ];
  const businessWorries = [
    'Company setup options and costs',
    'Tax rules for my company activity',
    'Office location and licensing',
    'Investor visa eligibility questions',
  ];
  const currentWorries = track === 'residential' ? residentialWorries : businessWorries;

  const selectTrack = (nextTrack: 'residential' | 'business') => {
    setTrack(nextTrack);
    const defaults = nextTrack === 'residential'
      ? [residentialWorries[0], residentialWorries[1]]
      : [businessWorries[0], businessWorries[1]];
    setSelectedWorries(voiceRequirement.trim()
      ? [...defaults, `I want my guide to know: ${voiceRequirement.trim()}`]
      : defaults);
  };

  const toggleWorry = (item: string) => {
    setSelectedWorries((previous) => previous.includes(item)
      ? previous.filter((worry) => worry !== item)
      : [...previous, item]);
  };

  const handleProceed = () => {
    setProfile({
      name: name.trim() || 'Newcomer',
      role: role.trim() || 'Future resident or founder',
      track,
      worries: selectedWorries.length > 0 ? selectedWorries : [currentWorries[0]],
    });
    navigate('/futures');
  };

  const toggleVoiceRequirement = () => {
    if (!recognitionRef.current) return;
    if (isCapturingNeed) {
      recognitionRef.current.stop();
      return;
    }
    voiceRequirementRef.current = '';
    setVoiceRequirement('');
    try {
      recognitionRef.current.start();
      setIsCapturingNeed(true);
    } catch {
      setIsCapturingNeed(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#07131b] text-white xl:grid xl:min-h-screen xl:grid-cols-[1.05fr_0.95fr]">
      <section className="relative isolate flex min-h-[620px] flex-col overflow-hidden px-6 pb-10 pt-6 sm:px-10 xl:min-h-screen xl:px-16 xl:pb-14 xl:pt-10">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_15%_15%,#244653_0%,#102530_35%,#07131b_78%)]" />
        <div className="absolute inset-y-0 -right-24 -z-10 w-[115%] opacity-65 sm:right-[-12%] sm:w-[88%]">
          <PlaceMapPreview area={ABU_DHABI_AREAS[0]} className="h-full w-full" />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#07131b_0%,rgba(7,19,27,.92)_30%,rgba(7,19,27,.18)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-[#07131b] to-transparent" />

        <header className="flex items-center justify-between gap-4">
          <div>
            <ParallelLogo />
            <div className="ml-[53px] mt-0.5 text-[9px] uppercase tracking-[0.2em] text-white/45">Abu Dhabi · Before day one</div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-white/60 sm:flex">
            <MapPin size={12} className="text-[#dfc796]" /> 90-day arrival rehearsal
          </div>
        </header>

        <div className="relative z-10 mt-auto max-w-[650px] pb-8 pt-24 xl:pb-12">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
            <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.28em] text-[#d9bf8d]">Before you arrive, feel the difference</p>
            <h1 className="max-w-[620px] font-sans text-5xl font-medium leading-[1.02] tracking-[-0.045em] text-[#fbf8f0] sm:text-6xl xl:text-[4.5rem]">
              A new life,<br />
              <span className="text-[#d9bf8d]">before day one.</span>
            </h1>
            <p className="mt-6 max-w-[470px] text-sm leading-7 text-[#d3dde0]/75 sm:text-base">
              Walk through the choices behind a move to Abu Dhabi. Rehearse a neighborhood, a commute, a lease, or your company’s first steps—before they become real decisions.
            </p>
          </motion.div>

          <div className="mt-12 grid max-w-lg grid-cols-3 border-t border-white/15 pt-5">
            {[
              ['01', 'Choose a future'],
              ['02', 'Explore the place'],
              ['03', 'Practice the moment'],
            ].map(([number, label]) => (
              <div key={number} className="pr-3">
                <div className="font-sans text-xl text-[#d9bf8d]">{number}</div>
                <div className="mt-1 text-[10px] leading-4 text-white/55 sm:text-xs">{label}</div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[10px] uppercase tracking-[0.16em] text-white/45">Real satellite views · curated Abu Dhabi districts</p>
        </div>
      </section>

      <section className="relative flex items-center justify-center bg-[#f3f0e8] px-5 py-12 text-[#17262a] sm:px-10 xl:px-14 xl:py-10">
        <div className="w-full max-w-[580px]">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a7650]">Your starting point</p>
              <h2 className="mt-2 font-sans text-3xl font-medium tracking-[-0.03em] sm:text-4xl">Build your rehearsal</h2>
            </div>
            <div className="rounded-full border border-[#d9d3c5] px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#77766f]">01 / 05</div>
          </div>

          <div className="mb-7 grid grid-cols-2 gap-2 rounded-2xl bg-[#e7e3d9] p-1.5">
            <button
              type="button"
              aria-pressed={track === 'residential'}
              onClick={() => selectTrack('residential')}
              className={`flex min-h-[70px] items-center gap-3 rounded-xl px-4 text-left transition-colors ${track === 'residential' ? 'bg-white text-[#17262a] shadow-[0_4px_20px_rgba(26,37,38,.08)]' : 'text-[#68706d] hover:text-[#17262a]'}`}
            >
              <Users size={19} className={track === 'residential' ? 'text-[#9c8354]' : 'text-[#858981]'} />
              <span><span className="block text-sm font-semibold">Family & home</span><span className="mt-1 block text-[10px] text-[#8a8d86]">A resident’s first days</span></span>
            </button>
            <button
              type="button"
              aria-pressed={track === 'business'}
              onClick={() => selectTrack('business')}
              className={`flex min-h-[70px] items-center gap-3 rounded-xl px-4 text-left transition-colors ${track === 'business' ? 'bg-white text-[#17262a] shadow-[0_4px_20px_rgba(26,37,38,.08)]' : 'text-[#68706d] hover:text-[#17262a]'}`}
            >
              <Briefcase size={18} className={track === 'business' ? 'text-[#397c7b]' : 'text-[#858981]'} />
              <span><span className="block text-sm font-semibold">Business & setup</span><span className="mt-1 block text-[10px] text-[#8a8d86]">A founder’s first steps</span></span>
            </button>
          </div>

          <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a7b73]">Your name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your preferred name"
                className="h-12 w-full rounded-xl border border-[#d8d5cb] bg-white/70 px-4 text-sm outline-none transition focus:border-[#9d875b] focus:bg-white focus:ring-2 focus:ring-[#c2ac7d]/20"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a7b73]">Your next chapter</span>
              <input
                type="text"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="Moving with family, starting a role…"
                className="h-12 w-full rounded-xl border border-[#d8d5cb] bg-white/70 px-4 text-sm outline-none transition focus:border-[#9d875b] focus:bg-white focus:ring-2 focus:ring-[#c2ac7d]/20"
              />
            </label>
          </div>

          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a7b73]">What should your local guide know?</p>
                <p className="mt-1 text-xs text-[#8b8b83]">Choose a moment or tell us what matters in your own words.</p>
              </div>
              <span className="text-[10px] text-[#99978e]">{selectedWorries.length} selected</span>
            </div>
            <div className="mb-3 mt-4 rounded-2xl border border-[#d9d3c5] bg-white/55 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#263633]">Make this journey yours</p>
                  <p className="mt-1 text-[10px] text-[#86877f]">Mention family, accessibility, work, budget, or anything on your mind.</p>
                </div>
                <button type="button" onClick={toggleVoiceRequirement} disabled={!voiceSupported} aria-label={isCapturingNeed ? 'Stop speaking your priorities' : 'Speak your priorities'} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${isCapturingNeed ? 'bg-rose-500 text-white' : 'bg-[#14282e] text-[#e4cb97] hover:bg-[#203b40]'}`}>
                  {isCapturingNeed ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>
              <textarea
                value={voiceRequirement}
                onChange={(event) => {
                  voiceRequirementRef.current = event.target.value;
                  setVoiceRequirement(event.target.value);
                  setSelectedWorries((previous) => {
                    const custom = previous.filter((item) => !item.startsWith('I want my guide to know:'));
                    return event.target.value.trim() ? [...custom, `I want my guide to know: ${event.target.value.trim()}`] : custom;
                  });
                }}
                placeholder={isCapturingNeed ? 'Listening… tell us what matters to you.' : 'Or type a personal priority here…'}
                rows={2}
                className="mt-2 w-full resize-none rounded-xl border border-[#e1ddd4] bg-white/75 px-3 py-2 text-xs leading-5 text-[#243431] outline-none placeholder:text-[#a09f97] focus:border-[#a89162]"
              />
              {isCapturingNeed && <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-medium text-rose-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" /> Listening — speak naturally</p>}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {currentWorries.map((worry) => {
                const selected = selectedWorries.includes(worry);
                return (
                  <button
                    key={worry}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleWorry(worry)}
                    className={`flex min-h-[52px] items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left text-xs leading-5 transition ${selected ? 'border-[#a89162] bg-[#ede6d7] text-[#293330]' : 'border-[#dedbd2] bg-white/45 text-[#646c67] hover:border-[#c2b798] hover:bg-white/70'}`}
                  >
                    <span>{worry}</span>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-[#927a4e] bg-[#927a4e] text-white' : 'border-[#c5c3bb] text-transparent'}`}><Check size={12} /></span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleProceed}
            className="mt-8 flex h-14 w-full items-center justify-between rounded-full bg-[#14282e] px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(13,35,40,.15)] transition hover:bg-[#203b40] focus:outline-none focus:ring-2 focus:ring-[#9d875b] focus:ring-offset-2"
          >
            <span>Choose your Abu Dhabi future</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d2b983] text-[#16282b]"><ArrowRight size={16} /></span>
          </button>
          <p className="mt-4 text-center text-[10px] leading-5 text-[#8c8a81]">This is a private rehearsal in your browser session. Seed figures and scene previews are illustrative.</p>
        </div>
      </section>
    </main>
  );
}
