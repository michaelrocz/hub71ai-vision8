import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, Compass, MapPin, RotateCcw, Route, ShieldCheck, Sun, Users, Briefcase } from 'lucide-react';
import ParallelLogo from '../components/ParallelLogo';
import { useRehearsal } from '../context/RehearsalContext';

export default function Recap() {
  const navigate = useNavigate();
  const { profile, selectedNeighborhood, commute, negotiation, resetRehearsal } = useRehearsal();
  const routeHere = commute.completed && commute.district === selectedNeighborhood;
  const negotiationHere = negotiation.completed && negotiation.district === selectedNeighborhood;
  const isBusiness = profile.track === 'business';
  const placeTitle = selectedNeighborhood || 'Abu Dhabi';

  return (
    <main className="recap-page relative h-screen overflow-y-auto text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_22%,rgba(140,188,174,.16),transparent_37%),radial-gradient(circle_at_85%_80%,rgba(218,182,112,.1),transparent_36%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.06]" style={{ backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px)', backgroundSize: '96px 100%' }} />
      <div className="relative mx-auto flex min-h-full max-w-[1280px] flex-col px-6 pb-8 pt-7 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <ParallelLogo size="compact" />
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.19em] text-white/55"><span className="hidden sm:inline">Your rehearsal memory</span><span className="h-px w-6 bg-[#ddbf81]" /><span className="text-[#e3c68b]">05 / 05</span></div>
        </header>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }} className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-16 lg:py-14">
          <section className="max-w-[540px]">
            <div className="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.22em] text-[#e0c589]"><span className="h-px w-8 bg-[#e0c589]" /> Before day one</div>
            <h1 className="text-[clamp(44px,5.2vw,78px)] font-semibold leading-[1.06] tracking-[-.055em]">A clearer first day starts <span className="text-[#dec38a]">here.</span></h1>
            <p className="mt-7 max-w-[470px] text-base leading-[1.75] text-[#c5d2cf]/75">You have explored a real Abu Dhabi district and started turning the unknowns into questions, routes, and next steps you can act on.</p>
            <div className="mt-9 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.055] px-3.5 py-2 text-xs font-medium text-white/85"><MapPin size={13} className="text-[#e0c589]" />{placeTitle}</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.055] px-3.5 py-2 text-xs font-medium text-white/75">{isBusiness ? <Briefcase size={13} className="text-[#8bc8be]" /> : <Users size={13} className="text-[#8bc8be]" />}{isBusiness ? 'Business setup' : 'Life and family'}</span>
              {profile.name && <span className="text-xs text-white/45">Prepared for {profile.name}</span>}
            </div>
            <div className="mt-11 flex flex-wrap gap-3">
              <button onClick={() => navigate('/moment')} className="group inline-flex min-h-12 items-center gap-4 rounded-full bg-[#d8bc7e] px-6 text-sm font-semibold text-[#0b2528] shadow-[0_12px_35px_rgba(216,188,126,.17)] transition hover:bg-[#ebd29b]"><Compass size={17} />Return to the live map<ArrowUpRight size={16} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button>
              <button onClick={() => { resetRehearsal(); navigate('/'); }} className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-white/20 px-5 text-sm font-medium text-white/75 transition hover:border-white/40 hover:text-white"><RotateCcw size={15} />Start again</button>
            </div>
          </section>

          <section aria-label="Your rehearsal notes" className="overflow-hidden rounded-[28px] border border-white/15 bg-[#10282c]/90 shadow-[0_28px_90px_rgba(0,0,0,.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-6 sm:px-8">
              <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#d8bd83]">Your field notes</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">What you now know</h2></div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8bd83]/30 bg-[#d8bd83]/10 text-[#e3ca96]"><Check size={19} /></span>
            </div>
            <div className="divide-y divide-white/10 px-6 sm:px-8">
              <div className="grid gap-3 py-5 sm:grid-cols-[35px_1fr]"><span className="pt-0.5 text-[11px] font-semibold tracking-[.13em] text-[#d8bd83]">01</span><div><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-white/45">Your place</p><p className="mt-1.5 text-[17px] font-semibold">{placeTitle}</p><p className="mt-1 text-xs leading-5 text-white/55">A real mapped district to inspect before you arrive.</p></div></div>
              <div className="grid gap-3 py-5 sm:grid-cols-[35px_1fr]"><span className="pt-0.5 text-[11px] font-semibold tracking-[.13em] text-[#d8bd83]">02</span><div>
                <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-white/45">Your route</p>
                {routeHere ? <><p className="mt-1.5 text-[17px] font-semibold">Walk to {commute.destination}</p><p className="mt-1 text-xs text-white/55">From {commute.origin || placeTitle}</p><p className="mt-1 text-xs text-white/70">{commute.distanceKm.toFixed(1)} km <span className="px-1 text-white/30">·</span> about {commute.durationMins} min on foot</p><p className="mt-1.5 text-xs leading-5 text-white/45">{commute.isRealRouting ? 'Mapped pedestrian geometry from OpenStreetMap.' : 'Illustrative route preview; verify before travelling.'}</p>{commute.apparentTemp > 0 && <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#d8bd83]/10 px-2.5 py-1 text-[11px] text-[#e3cd9c]"><Sun size={12} />Feels like {commute.apparentTemp.toFixed(1)}°C at rehearsal time</p>}</>
                  : <><p className="mt-1.5 text-[17px] font-semibold text-white/80">Choose a destination</p><p className="mt-1 text-xs leading-5 text-white/55">Open the map to trace a clinic or bus stop near {placeTitle}.</p></>}
              </div></div>
              <div className="grid gap-3 py-5 sm:grid-cols-[35px_1fr]"><span className="pt-0.5 text-[11px] font-semibold tracking-[.13em] text-[#d8bd83]">03</span><div><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-white/45">Your conversation</p>
                {negotiationHere ? <><p className="mt-1.5 text-[17px] font-semibold">Practice with {negotiation.counterpartName}</p><p className="mt-1 text-xs leading-5 text-white/55">Coaching estimate: {negotiation.confidenceScore}% readiness. Use the questions below in your real conversation.</p></>
                  : <><p className="mt-1.5 text-[17px] font-semibold text-white/80">A question worth practising</p><p className="mt-1 text-xs leading-5 text-white/55">{isBusiness ? 'Ask an advisor about licensing and setup details.' : 'Ask a landlord about cooling, lease terms, and registration.'}</p></>}
              </div></div>
            </div>
            {negotiationHere && negotiation.missedQuestions.length > 0 && <div className="border-t border-white/10 bg-white/[.035] px-6 py-5 sm:px-8"><p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.15em] text-[#dfc58d]"><ShieldCheck size={14} />Questions to verify</p><ul className="mt-3 space-y-2 text-xs leading-5 text-white/65">{negotiation.missedQuestions.slice(0, 3).map((question) => <li key={question} className="flex items-start gap-2"><ArrowRight size={12} className="mt-1 shrink-0 text-[#d8bd83]" />{question}</li>)}</ul></div>}
            <div className="flex items-start gap-2.5 border-t border-white/10 px-6 py-4 text-[11px] leading-5 text-white/45 sm:px-8"><Route size={14} className="mt-0.5 shrink-0 text-[#d8bd83]" />Map locations and walking routes depend on OpenStreetMap coverage. Confirm entrances, services, and schedules with the provider before travelling.</div>
          </section>
        </motion.div>
        <footer className="flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-[10px] text-white/35"><span>PARALLEL · Abu Dhabi arrival rehearsal</span><span>Explore first. Decide with confidence.</span></footer>
      </div>
    </main>
  );
}
