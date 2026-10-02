import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Briefcase, Home, MapPin, Sparkles } from 'lucide-react';
import { useRehearsal } from '../context/RehearsalContext';
import PlaceMapPreview from '../components/PlaceMapPreview';
import { ABU_DHABI_AREAS, type AbuDhabiArea } from '../lib/abuDhabiAreas';

const residentialAreas = ABU_DHABI_AREAS.filter((area) => area.track === 'residential');
const businessAreas = ABU_DHABI_AREAS.filter((area) => area.track === 'business');

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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#1c3641_0%,#0b1b24_42%,#07131b_78%)]" />
      <div className="absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(203,190,159,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(203,190,159,.2)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />

      <header className="relative z-20 mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-5 pb-10 pt-6 sm:px-9 md:flex-row md:items-center md:justify-between md:pb-14 md:pt-8 xl:px-14">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white/75 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft size={14} /> Back to your profile
        </button>

        <div className="order-first text-center md:order-none md:text-right">
          <div className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d7bd8a] md:justify-end">
            <span className="h-px w-8 bg-[#9f895e]" /> STEP 02 <span className="text-white/35">/ 05</span>
          </div>
          <p className="mt-2 text-xs text-white/55">{profile.name || profile.role ? `A rehearsal for ${[profile.name, profile.role].filter(Boolean).join(' · ')}` : 'Choose a real place to begin your rehearsal.'}</p>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-[1440px] px-5 pb-12 sm:px-9 xl:px-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-9 flex flex-col justify-between gap-5 md:mb-11 xl:flex-row xl:items-end"
        >
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#d7bd8a]">
              <Sparkles size={13} /> Two paths into the same city
            </div>
            <h1 className="font-sans text-4xl font-medium leading-[1.04] tracking-[-0.04em] sm:text-5xl xl:text-6xl">
              Which Abu Dhabi do you want to <span className="text-[#d7bd8a]">step into?</span>
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#c2ced0]/65 md:pb-1">
            Start with a real district. Rehearse the routines, routes, and decisions that would shape your life or work there.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-7">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="group relative isolate flex min-h-[600px] flex-col overflow-hidden rounded-[28px] border border-[#d5c49a]/25 bg-[#14262b] shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:min-h-[650px]"
          >
            <div className="absolute inset-0 -z-20 bg-[linear-gradient(160deg,#65776a_0%,#293e3c_36%,#14262b_72%)]" />
            <div className="absolute inset-x-0 top-0 -z-10 h-[66%] opacity-95">
              <PlaceMapPreview area={selectedHomeArea} className="h-full w-full" />
            </div>
            <div className="absolute inset-x-0 top-0 -z-10 h-[70%] bg-gradient-to-b from-[#12232a]/10 via-transparent to-[#14262b]" />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_100%_0%,rgba(230,205,151,.17),transparent_42%)]" />

            <div className="flex items-start justify-between p-6 sm:p-8">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.19em] text-[#ead4a5]">
                <Home size={14} /> TRACK 01 <span className="text-white/35">·</span> RESIDENTIAL
              </div>
              <div className="flex items-center gap-1 rounded-full border border-white/15 bg-[#102127]/65 p-1 backdrop-blur">
                {residentialAreas.map((area) => <button key={area.id} type="button" onClick={() => setHomeAreaId(area.id)} aria-pressed={homeAreaId === area.id} className={`rounded-full px-2.5 py-1.5 text-[9px] font-medium transition ${homeAreaId === area.id ? 'bg-[#e3d1a6] text-[#17292d]' : 'text-white/75 hover:bg-white/10'}`}>{area.name}</button>)}
              </div>
            </div>

            <div className="mt-auto p-6 pt-28 sm:p-8 sm:pt-36">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-[0.19em] text-[#c5b78e]">Find your rhythm</div>
                  <h2 className="font-sans text-3xl font-medium tracking-[-0.03em] sm:text-4xl">{selectedHomeArea.name}</h2>
                </div>
                <span className="hidden font-sans text-5xl text-white/15 sm:block">01</span>
              </div>
              <p className="max-w-xl text-sm leading-6 text-white/65">
                {selectedHomeArea.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {['Daily commute', 'Lease questions', 'Family routines'].map((item) => (
                  <span key={item} className="rounded-full border border-white/12 bg-white/[0.045] px-3 py-1.5 text-[10px] text-white/70">{item}</span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleSelectFuture(selectedHomeArea)}
                className="mt-7 flex h-12 w-full items-center justify-between rounded-full border border-[#d7bd8a]/55 bg-[#d7bd8a] px-5 text-sm font-semibold text-[#15262a] transition hover:border-[#ead7ad] hover:bg-[#ead7ad] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#14262b]"
              >
                <span>Rehearse life in {selectedHomeArea.name}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#21373a]/10"><ArrowRight size={15} /></span>
              </button>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="group relative isolate flex min-h-[600px] flex-col overflow-hidden rounded-[28px] border border-[#88c8c1]/20 bg-[#10232e] shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:min-h-[650px]"
          >
            <div className="absolute inset-0 -z-20 bg-[linear-gradient(155deg,#416a72_0%,#1c3b49_38%,#10232e_72%)]" />
            <div className="absolute inset-x-0 top-0 -z-10 h-[66%] opacity-95">
              <PlaceMapPreview area={selectedBusinessArea} className="h-full w-full" />
            </div>
            <div className="absolute inset-x-0 top-0 -z-10 h-[70%] bg-gradient-to-b from-[#10232e]/10 via-transparent to-[#10232e]" />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_100%_0%,rgba(129,208,194,.19),transparent_42%)]" />

            <div className="flex items-start justify-between p-6 sm:p-8">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.19em] text-[#9dd5ce]">
                <Briefcase size={14} /> TRACK 02 <span className="text-white/35">·</span> BUSINESS
              </div>
              <div className="flex items-center gap-1 rounded-full border border-white/15 bg-[#102127]/65 p-1 backdrop-blur">
                {businessAreas.map((area) => <button key={area.id} type="button" onClick={() => setBusinessAreaId(area.id)} aria-pressed={businessAreaId === area.id} className={`rounded-full px-2.5 py-1.5 text-[9px] font-medium transition ${businessAreaId === area.id ? 'bg-[#8fd0c8] text-[#10262d]' : 'text-white/75 hover:bg-white/10'}`}>{area.name}</button>)}
              </div>
            </div>

            <div className="mt-auto p-6 pt-28 sm:p-8 sm:pt-36">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-[0.19em] text-[#9dd5ce]">Build your next chapter</div>
                  <h2 className="font-sans text-3xl font-medium tracking-[-0.03em] sm:text-4xl">{selectedBusinessArea.name}</h2>
                </div>
                <span className="hidden font-sans text-5xl text-white/15 sm:block">02</span>
              </div>
              <p className="max-w-xl text-sm leading-6 text-white/65">
                {selectedBusinessArea.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {['Entity setup', 'Office location', 'Rules to verify'].map((item) => (
                  <span key={item} className="rounded-full border border-white/12 bg-white/[0.045] px-3 py-1.5 text-[10px] text-white/70">{item}</span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleSelectFuture(selectedBusinessArea)}
                className="mt-7 flex h-12 w-full items-center justify-between rounded-full border border-[#8bcac2]/50 bg-[#7ebdb6] px-5 text-sm font-semibold text-[#10232e] transition hover:border-[#b2e2dc] hover:bg-[#a1d5ce] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#10232e]"
              >
                <span>Rehearse business in {selectedBusinessArea.name}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#18353d]/10"><ArrowRight size={15} /></span>
              </button>
            </div>
          </motion.article>
        </div>

        <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 text-[10px] text-white/40 sm:flex-row">
          <span className="flex items-center gap-2"><MapPin size={13} className="text-[#d7bd8a]" /> Explore four real Abu Dhabi locations</span>
          <span>Satellite imagery is real; route and local scenario details may be illustrative.</span>
        </div>
      </section>
    </main>
  );
}
