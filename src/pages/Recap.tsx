import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRehearsal } from '../context/RehearsalContext';
import { Check, ArrowRight, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';

export default function Recap() {
  const navigate = useNavigate();
  const { profile, selectedNeighborhood, commute, negotiation, resetRehearsal } = useRehearsal();
  const isBusiness = profile.track === 'business';

  const rehearsalSummary = isBusiness
    ? negotiation.completed
      ? `You practiced a business setup conversation for ${selectedNeighborhood}. Treat the coach's notes as questions to verify with the relevant authority before acting.`
      : `You selected the business track for ${selectedNeighborhood}, but have not completed an advisor practice turn yet.`
    : [
        commute.completed
          ? commute.mode === 'ac_transit'
            ? `You explored an illustrative air-conditioned transit scenario to ${commute.destination}; its bus segment and timing are demo data.`
            : `You rehearsed a ${commute.distanceKm.toFixed(1)} km walking estimate to ${commute.destination}.`
          : 'You have not recorded a commute rehearsal yet.',
        negotiation.completed
          ? 'You practiced lease questions with the landlord coach and saved a checklist for your real arrival.'
          : 'You have not completed a landlord conversation yet.'
      ].join(' ');

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-sand-900 text-white relative overflow-hidden p-6">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512632578888-169bbbc64f33?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="text-center relative z-10 max-w-3xl w-full"
      >
        <span className="text-xs font-black uppercase tracking-[0.25em] text-gold bg-gold/10 px-4 py-1.5 rounded-full border border-gold/30 inline-block mb-4">
          Step 5 of 5: Your Rehearsal Memory
        </span>

        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
          Arrival shock becomes <br />
          <span className="text-gold font-sans">déjà vu.</span>
        </h1>

        <p className="text-sm text-sand-300 mb-8 max-w-lg mx-auto">
          {profile.name} · {profile.role} · {selectedNeighborhood}
        </p>

        <div className="glass-panel-dark p-8 md:p-10 border border-gold/40 text-left relative overflow-hidden rounded-3xl shadow-2xl">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gold" />
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-gold" /> Session debrief
          </h2>
          <p className="text-base text-white/90 leading-relaxed mb-6">{rehearsalSummary}</p>

          <div className="space-y-3 border-t border-white/10 pt-5 text-sm">
            <div className="flex items-start gap-3">
              <span className={`w-5 h-5 rounded-full ${commute.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'} flex items-center justify-center shrink-0`}>
                {commute.completed ? <Check size={13} /> : <AlertTriangle size={13} />}
              </span>
              <span>
                <strong>Commute:</strong>{' '}
                {commute.completed
                  ? `${commute.mode === 'ac_transit' ? 'Illustrative AC transit scenario' : 'Walking route estimate'} · ${commute.distanceKm.toFixed(1)} km · ${commute.durationMins} min`
                  : 'Not rehearsed yet'}
                {commute.completed && <span className="block text-white/60 text-xs mt-1">{commute.routingSource}</span>}
              </span>
            </div>

            {commute.completed && (
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 text-[10px]">°</span>
                <span>
                  <strong>Weather comfort estimate:</strong> {commute.apparentTemp.toFixed(1)}°C apparent temperature · {commute.weatherIsLive ? 'Open-Meteo reading' : 'illustrative estimate'}
                </span>
              </div>
            )}

            <div className="flex items-start gap-3">
              <span className={`w-5 h-5 rounded-full ${negotiation.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'} flex items-center justify-center shrink-0`}>
                {negotiation.completed ? <Check size={13} /> : <AlertTriangle size={13} />}
              </span>
              <span>
                <strong>Practice counterpart:</strong> {negotiation.completed ? negotiation.counterpartName : 'Not rehearsed yet'}
                {negotiation.completed && <span className="block text-white/60 text-xs mt-1">{negotiation.responseSource === 'AI coach' ? 'AI coach response' : 'Illustrative demo response'}</span>}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-gold/20 text-gold flex items-center justify-center shrink-0 font-bold text-xs">★</span>
              <span>
                <strong>Practice readiness score:</strong>{' '}
                <span className="text-gold font-mono font-bold text-base">
                  {negotiation.completed ? `${negotiation.confidenceScore}%` : 'Not scored'}
                </span>
                {negotiation.completed && <span className="block text-white/60 text-xs mt-1">A coaching estimate, not a prediction of real-world outcomes.</span>}
              </span>
            </div>

            {negotiation.completed && negotiation.finalAgreementReached && (
              <div className="text-emerald-300 text-xs font-semibold">The practice counterpart indicated agreement in this rehearsal.</div>
            )}
          </div>

          {negotiation.missedQuestions.length > 0 && (
            <div className="mt-6 pt-5 border-t border-white/10">
              <span className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5 mb-2">
                <AlertTriangle size={13} /> Questions to verify on arrival
              </span>
              <ul className="space-y-1.5 text-xs text-white/80">
                {negotiation.missedQuestions.map((question, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-gold">•</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => {
              resetRehearsal();
              navigate('/');
            }}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold transition-colors flex items-center gap-2 border border-white/20"
          >
            <RotateCcw size={14} /> Rehearse another scenario
          </button>
          <button
            onClick={() => navigate('/moment')}
            className="px-8 py-3 bg-gold hover:bg-amber-300 text-sand-900 rounded-full text-xs font-black transition-transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            Return to the map <ArrowRight size={14} />
          </button>
        </div>
        <p className="text-[10px] text-white/40 mt-5">Routes, counterpart dialogue, and readiness scores may use illustrative MVP data. Verify real-world transport and lease details independently.</p>
      </motion.div>
    </div>
  );
}
