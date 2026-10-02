import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Briefcase, Check, ExternalLink, MapPin, MessageSquare, Navigation, X } from 'lucide-react';
import { BUSINESS_SETUP, type RehearsalPlace } from '../lib/places';

interface Props {
  place: RehearsalPlace;
  onClose: () => void;
  onLocate: () => void;
  onRoute: () => void;
  onCoach: () => void;
}

export default function PlaceBrief({ place, onClose, onLocate, onRoute, onCoach }: Props) {
  const [tab, setTab] = useState<'arrival' | 'setup' | 'questions'>(place.category === 'business' ? 'setup' : 'arrival');
  const dialogRef = useRef<HTMLDivElement>(null);
  const setup = place.areaId === 'masdar-city' ? BUSINESS_SETUP.masdar : BUSINESS_SETUP.adgm;
  const business = place.category === 'business';
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],[tabindex="0"]');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [onClose]);

  return <div className="absolute inset-0 z-[70] grid place-items-center bg-[#041216]/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="place-brief-title" className="flex max-h-[88vh] w-full max-w-[880px] flex-col overflow-hidden rounded-[28px] border border-white/15 bg-[#0c242a] text-white shadow-[0_32px_100px_rgba(0,0,0,.6)] outline-none">
      <header className="relative border-b border-white/10 p-6 sm:p-8">
        <button onClick={onClose} aria-label="Close place details" className="absolute right-5 top-5 rounded-full border border-white/15 p-2 text-white/65 hover:bg-white/10"><X size={18} /></button>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-[#dfc795]">{business ? <Briefcase size={15} /> : <MapPin size={15} />} Your {business ? 'business' : 'arrival'} field notes</p>
        <h2 id="place-brief-title" className="mt-3 pr-8 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">{place.name}</h2>
        <p className="mt-3 max-w-[650px] text-[15px] leading-6 text-white/65">{place.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {(['arrival', ...(business ? ['setup'] : []), 'questions'] as const).map((item) => <button key={item} role="tab" aria-selected={tab === item} onClick={() => setTab(item as typeof tab)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${tab === item ? 'bg-[#ddc493] text-[#10292e]' : 'border border-white/15 text-white/65 hover:bg-white/10'}`}>{item === 'arrival' ? 'Place & arrival' : item === 'setup' ? 'How to set up' : 'Questions to rehearse'}</button>)}
        </div>
      </header>
      <div className="min-h-0 overflow-y-auto p-6 sm:p-8">
        {tab === 'setup' && <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-semibold">{setup.title}</h3><a href={setup.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-[#a3d3cb]">Official process <ExternalLink size={13} /></a></div>
          <ol className="grid gap-4 sm:grid-cols-2">{setup.steps.map(([title, body], index) => <li key={title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#ddc493]/15 text-xs font-semibold text-[#ddc493]">{String(index + 1).padStart(2, '0')}</span><div><h4 className="text-sm font-semibold">{title}</h4><p className="mt-1.5 text-sm leading-[1.65] text-white/60">{body}</p></div></li>)}</ol>
          {place.id === 'hub71' && <p className="mt-4 rounded-xl bg-[#92cfc4]/10 p-4 text-sm leading-6 text-[#bbe0d9]">Hub71 programme admission is separate from incorporation. For an incentivised ADGM Tech Startup licence, ADGM lists a Hub71 approval letter as a requirement. Check the current programme and licence criteria.</p>}
          <p className="mt-5 text-xs leading-5 text-white/45">Preparation checklist based on official guidance checked 2 October 2026. Fees, eligibility, processing times and tax treatment depend on your activity and circumstances. Confirm the current requirements with the authority.</p>
        </div>}
        {tab === 'arrival' && <div className="grid gap-5 sm:grid-cols-[1fr_1.15fr]">
          <div className="rounded-2xl border border-[#ddc493]/20 bg-[#ddc493]/[.06] p-5"><MapPin className="text-[#ddc493]" size={22} /><h3 className="mt-3 text-lg font-semibold">Find the right place</h3><p className="mt-2 text-sm leading-6 text-white/70">{place.address}</p><p className="mt-4 font-mono text-xs text-white/45">{place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}</p><button onClick={onLocate} className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#ddc493]">Locate this building <ArrowRight size={16} /></button></div>
          <div><h3 className="text-lg font-semibold">Before your first visit</h3><p className="mt-3 text-sm leading-7 text-white/70">{place.arrival}</p><p className="mt-4 text-xs leading-5 text-white/45">The map uses an OSM building or place point. A gold pin shows the point; any road-facing entrance is estimated unless explicitly recorded in OSM. Pedestrian routes follow mapped streets.</p><a className="mt-4 inline-flex items-center gap-2 text-xs text-[#a3d3cb]" href={place.sourceUrl} target="_blank" rel="noopener noreferrer">{place.source} <ExternalLink size={13} /></a></div>
        </div>}
        {tab === 'questions' && <div><h3 className="text-xl font-semibold">Go into the conversation prepared.</h3><div className="mt-5 grid gap-3">{place.questions.map((question) => <div key={question} className="flex gap-3 rounded-xl border border-white/10 p-4 text-[15px] leading-6"><Check className="mt-1 shrink-0 text-[#92cfc4]" size={16} />{question}</div>)}</div><p className="mt-4 text-sm leading-6 text-white/50">Practice asking these questions with an illustrative {business ? 'business advisor' : 'local counterpart'}. No application, appointment or agreement is made by the rehearsal.</p></div>}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/10 px-6 py-4 sm:px-8"><button onClick={onRoute} className="flex items-center gap-2 rounded-full bg-[#ddc493] px-5 py-3 text-sm font-semibold text-[#10292e]"><Navigation size={16} /> {business ? 'Rehearse the arrival' : 'Plan a route here'} <ArrowRight size={16} /></button><button onClick={onCoach} className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-3 text-sm text-white/80"><MessageSquare size={16} /> Practice the conversation</button></footer>
    </div>
  </div>;
}
