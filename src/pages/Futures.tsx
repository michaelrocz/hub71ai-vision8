import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Briefcase, Home, MapPin, Sparkles } from 'lucide-react';
import { useRehearsal } from '../context/RehearsalContext';
import PlaceMapPreview from '../components/PlaceMapPreview';
import ParallelLogo from '../components/ParallelLogo';
import { ABU_DHABI_AREAS, type AbuDhabiArea } from '../lib/abuDhabiAreas';

const residentialAreas = ABU_DHABI_AREAS.filter((area) => area.track === 'residential');
const businessAreas = ABU_DHABI_AREAS.filter((area) => area.track === 'business');

interface FutureCardProps {
  number: string;
  area: AbuDhabiArea;
  options: AbuDhabiArea[];
  kind: 'residential' | 'business';
  onAreaChange: (area: AbuDhabiArea) => void;
  onExplore: () => void;
}

function FutureCard({ number, area, options, kind, onAreaChange, onExplore }: FutureCardProps) {
  const isHome = kind === 'residential';
  const accent = isHome ? '#dfc38a' : '#8fd0c8';
  const topics = isHome ? ['Daily rhythm', 'Commute', 'Family life'] : ['Company setup', 'Work district', 'Advisor meetings'];

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: isHome ? 0.06 : 0.13 }}
      className="group overflow-hidden rounded-[26px] border border-white/[.13] bg-[#0d1e25] shadow-[0_28px_90px_rgba(0,0,0,.32)] transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_32px_100px_rgba(0,0,0,.42)]"
    >
      <div className="relative h-[330px] overflow-hidden bg-[#19323a] sm:h-[350px]">
        <PlaceMapPreview area={area} className="h-full w-full transition duration-700 group-hover:scale-[1.025]" showAttribution={false} showCaption={false} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,17,23,.46)_0%,rgba(5,17,23,.08)_34%,rgba(5,17,23,.02)_50%,rgba(5,17,23,.82)_100%)]" />
        <div className="absolute inset-x-5 top-5 flex items-start justify-between gap-3 sm:inset-x-6 sm:top-6">
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-[#071821]/75 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-white/90 shadow-lg backdrop-blur-xl">
            {isHome ? <Home size={13} style={{ color: accent }} /> : <Briefcase size={13} style={{ color: accent }} />}
            <span>{number}</span><span className="text-white/35">/</span><span>{isHome ? 'Home & everyday' : 'Business & setup'}</span>
          </div>
          <div className="flex max-w-[68%] items-center gap-1 rounded-full border border-white/20 bg-[#071821]/80 p-1 shadow-lg backdrop-blur-xl" role="group" aria-label={`Choose a ${isHome ? 'residential' : 'business'} district`}>
            {options.map((option) => <button
              key={option.id}
              type="button"
              onClick={() => onAreaChange(option)}
              aria-pressed={area.id === option.id}
              className="whitespace-nowrap rounded-full px-3 py-2 text-[10px] font-medium transition sm:text-[11px]"
              style={area.id === option.id ? { color: '#102129', backgroundColor: accent } : { color: 'rgba(255,255,255,.78)' }}
            >{option.name}</button>)}
          </div>
        </div>

        <div className="absolute inset-x-6 bottom-5 flex items-end justify-between gap-3 sm:inset-x-7 sm:bottom-6">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.17em]" style={{ color: accent }}><MapPin size={12} /> {area.descriptor}</p>
            <h2 className="text-[34px] font-medium leading-none tracking-[-.04em] text-white drop-shadow sm:text-[40px]">{area.name}</h2>
          </div>
          <span className="hidden rounded-full border border-white/20 bg-[#071821]/55 px-3 py-2 text-[9px] font-medium text-white/75 backdrop-blur sm:inline-flex">SATELLITE · ABU DHABI</span>
        </div>
      </div>

      <div className="border-t border-white/[.08] px-5 py-5 sm:px-7 sm:py-6">
        <p className="max-w-[670px] text-sm leading-[1.65] text-[#d1dadd]/75 sm:text-[15px]">{area.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {topics.map((topic, index) => <span key={topic} className="inline-flex items-center gap-2 rounded-full border border-white/[.12] bg-white/[.035] px-3 py-1.5 text-[10px] font-medium text-white/70 sm:text-[11px]">
            <span className="h-1 w-1 rounded-full" style={{ backgroundColor: accent, opacity: index === 0 ? 1 : .55 }} />{topic}
          </span>)}
        </div>
        <button
          type="button"
          onClick={onExplore}
          className="mt-5 flex min-h-[52px] w-full items-center justify-between rounded-xl border px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0d1e25]"
          style={{ color: '#11252b', backgroundColor: accent, borderColor: `${accent}99` }}
        >
          <span>{isHome ? 'Explore life here' : 'Explore work here'} <span className="font-medium opacity-70">· {area.name}</span></span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[.08] transition group-hover:translate-x-0.5"><ArrowRight size={16} /></span>
        </button>
      </div>
    </motion.article>
  );
}

export default function Futures() {
  const navigate = useNavigate();
  const { profile, setSelectedNeighborhood, setProfile } = useRehearsal();
  const [homeAreaId, setHomeAreaId] = useState(residentialAreas[0].id);
  const [businessAreaId, setBusinessAreaId] = useState(businessAreas[0].id);
  const selectedHomeArea = residentialAreas.find((area) => area.id === homeAreaId) || residentialAreas[0];
  const selectedBusinessArea = businessAreas.find((area) => area.id === businessAreaId) || businessAreas[0];

  const handleSelectFuture = (area: AbuDhabiArea) => {
    setSelectedNeighborhood(area.name);
    setProfile({ track: area.track });
    navigate('/moment');
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07131b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_54%_0%,#1b3540_0%,#0b1b24_43%,#07131b_82%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(203,190,159,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(203,190,159,.18)_1px,transparent_1px)] [background-size:88px_88px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />

      <header className="relative z-20 mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-white/[.09] px-5 pb-5 pt-5 sm:px-9 sm:pb-6 xl:px-14">
        <div className="flex items-center gap-5 sm:gap-7">
          <ParallelLogo size="compact" />
          <span className="h-7 w-px bg-white/15" />
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 text-xs font-medium text-white/65 transition hover:text-white"><ArrowLeft size={14} /> Back to profile</button>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#d7bd8a]">
              <span className="h-px w-6 bg-[#9f895e]" /> STEP 02 <span className="text-white/35">/ 05</span>
            </div>
            <p className="mt-1.5 text-[10px] text-white/48 sm:text-[11px]">{profile.name || profile.role ? `A rehearsal for ${[profile.name, profile.role].filter(Boolean).join(' · ')}` : 'Your Abu Dhabi rehearsal'}</p>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-[1440px] px-5 pb-10 pt-9 sm:px-9 sm:pt-12 xl:px-14">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-7 grid gap-5 md:mb-8 xl:grid-cols-[1.2fr_.8fr] xl:items-end">
          <div className="max-w-[800px]">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.22em] text-[#d7bd8a]"><Sparkles size={13} /> Two paths into one city</div>
            <h1 className="font-sans text-[42px] font-medium leading-[1.04] tracking-[-.045em] sm:text-5xl xl:text-[58px]">Which Abu Dhabi will you <span className="text-[#d7bd8a]">step into?</span></h1>
          </div>
          <div className="flex flex-col gap-3 xl:items-end xl:pb-1">
            <p className="max-w-[420px] text-sm leading-6 text-[#c2ced0]/75 sm:text-[15px] xl:text-right">Choose a real district. Then walk through the routines, routes, and decisions that could shape life or work there.</p>
            <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[.13em] text-white/42"><MapPin size={12} className="text-[#d7bd8a]" /> Four Abu Dhabi districts · real satellite imagery</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <FutureCard number="01" kind="residential" area={selectedHomeArea} options={residentialAreas} onAreaChange={(area) => setHomeAreaId(area.id)} onExplore={() => handleSelectFuture(selectedHomeArea)} />
          <FutureCard number="02" kind="business" area={selectedBusinessArea} options={businessAreas} onAreaChange={(area) => setBusinessAreaId(area.id)} onExplore={() => handleSelectFuture(selectedBusinessArea)} />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-white/[.09] pt-4 text-[9px] text-white/40 sm:text-[10px]">
          <span>Imagery © Esri · Maxar · Earthstar Geographics</span>
          <span>Some route and local scenario details are illustrative.</span>
        </div>
      </section>
    </main>
  );
}
