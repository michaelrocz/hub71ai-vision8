import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRehearsal } from '../context/RehearsalContext';
import { ArrowLeft, ArrowRight, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Compare() {
  const navigate = useNavigate();
  const { profile, selectedNeighborhood, commute, negotiation } = useRehearsal();
  const isBusiness = profile.track === 'business';

  const commuteDescription = !commute.completed
    ? 'You have not rehearsed a commute yet.'
    : commute.mode === 'ac_transit'
      ? `Illustrative AC transit scenario: ${commute.durationMins} minutes total, about 5 minutes outdoors.`
      : `${commute.distanceKm.toFixed(1)} km walking route, about ${commute.durationMins} minutes at the demo pace.`;

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-sand-900 text-slate-900 p-6 relative">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512632578888-169bbbc64f33?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 backdrop-blur-xl border border-white/60 p-8 md:p-12 text-center max-w-4xl w-full rounded-3xl shadow-2xl relative z-10"
      >
        <div className="flex justify-between items-center mb-6 gap-3">
          <button
            onClick={() => navigate('/moment')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft size={13} /> Back to Simulation
          </button>
          <span className="text-xs uppercase tracking-widest font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
            Step 4 of 5: Felt Comparison
          </span>
          <span className="text-xs text-slate-500 font-mono">{profile.name}</span>
        </div>

        <h2 className="text-3xl font-black text-slate-900 mb-2">
          Your rehearsal, beside the unknowns
        </h2>
        <p className="text-sm text-slate-500 mb-8 max-w-xl mx-auto">
          The first card reflects this session. The comparison card is an illustrative baseline, not verified neighborhood data.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
          <div className="bg-gradient-to-b from-amber-50/60 to-white p-6 rounded-3xl border-2 border-amber-400 relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-bl-xl shadow-sm">
              This session
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">{selectedNeighborhood}</h3>
            <span className="text-xs text-amber-800 font-bold block mb-4">
              {isBusiness ? 'Business setup rehearsal' : 'Residential newcomer rehearsal'}
            </span>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-slate-400 font-semibold block mb-1">Commute</span>
                <p className="text-slate-900 font-bold flex items-start gap-1.5">
                  {commute.completed
                    ? <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    : <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />}
                  {commuteDescription}
                </p>
                {commute.completed && <span className="text-[10px] text-slate-500 mt-1 block">{commute.routingSource}</span>}
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-slate-400 font-semibold block mb-1">Weather comfort estimate</span>
                {commute.completed ? (
                  <p className="text-slate-900 font-bold">
                    Apparent temperature {commute.apparentTemp.toFixed(1)}°C · {commute.weatherIsLive ? 'Open-Meteo reading' : 'illustrative weather'}
                    {commute.heatWarning ? ' · above the demo comfort threshold' : ' · below the demo comfort threshold'}
                  </p>
                ) : (
                  <p className="text-slate-500">No route or weather snapshot has been saved yet.</p>
                )}
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center gap-4">
                <div>
                  <span className="text-slate-400 font-semibold block">Coach readiness score</span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {negotiation.completed ? 'Based on this practice turn' : 'Complete a coach turn to receive a score'}
                  </span>
                </div>
                <span className="text-2xl font-mono font-black text-emerald-600">
                  {negotiation.completed ? `${negotiation.confidenceScore}%` : '—'}
                </span>
              </div>
              {negotiation.completed && negotiation.missedQuestions.length > 0 && (
                <p className="text-[11px] text-slate-500">Checklist saved: {negotiation.missedQuestions.length} questions to verify.</p>
              )}
            </div>
          </div>

          <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200 text-left relative">
            <div className="absolute top-0 right-0 bg-slate-300 text-slate-700 text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-bl-xl">
              Illustrative baseline
            </div>
            <h3 className="text-xl font-black text-slate-700 mb-1">Saadiyat / alternative area</h3>
            <span className="text-xs text-slate-500 font-medium block mb-4">Placeholder comparison for the MVP</span>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white/70 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-semibold block mb-0.5">Commute & thermal exposure</span>
                <p className="text-slate-600 font-semibold">Not measured in this session.</p>
              </div>
              <div className="p-3 bg-white/70 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-semibold block mb-0.5">Lease or setup friction</span>
                <p className="text-slate-600 font-semibold">Needs verified listings and current local sources.</p>
              </div>
              <div className="p-3 bg-white/70 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-semibold block mb-0.5">Readiness</span>
                <p className="text-slate-600 font-semibold">No rehearsal data for this alternative yet.</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/recap')}
          className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-full font-bold text-base transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto"
        >
          <ShieldCheck size={18} className="text-gold" /> Generate My First 90-Day Memory <ArrowRight size={18} />
        </button>
      </motion.div>
    </div>
  );
}
