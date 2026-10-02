import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoachResponse, type FrictionResponse } from '../lib/openai';
import { useRehearsal } from '../context/RehearsalContext';
import { Send, AlertTriangle, ShieldAlert, Sparkles, X, Briefcase, Home, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MapAction } from './MapBackground';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface Props {
  onMapAction?: (action: MapAction) => void;
  onClose?: () => void;
  initialMode?: 'landlord' | 'investment';
}

export default function FrictionEngine({ onMapAction, onClose, initialMode = 'landlord' }: Props) {
  const navigate = useNavigate();
  const { profile, selectedNeighborhood, setNegotiationOutcome } = useRehearsal();

  const [mode, setMode] = useState<'landlord' | 'investment'>(
    profile.track === 'business' ? 'investment' : initialMode
  );
  const [input, setInput] = useState('');
  
  const landlordWelcome = 'Welcome to Abu Dhabi. I am Mr. Rashed, an illustrative landlord persona. You are interested in a 2-bedroom apartment on Al Reem Island. In this practice scenario, I ask for one cheque and a quick decision. How would you respond?';
  const investorWelcome = 'Welcome to the investment practice scenario. I am Tariq, an illustrative advisor persona. Are you planning an SPV, holding company, or operating company?';

  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: mode === 'investment' ? investorWelcome : landlordWelcome }
  ]);
  const [coachData, setCoachData] = useState<FrictionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const switchMode = (newMode: 'landlord' | 'investment') => {
    setMode(newMode);
    setCoachData(null);
    setMessages([
      { role: 'model', text: newMode === 'investment' ? investorWelcome : landlordWelcome }
    ]);
  };

  const handleSend = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || loading) return;
    
    const newMessages: Message[] = [...messages, { role: 'user', text: promptToSend }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await getCoachResponse(newMessages, mode, {
        neighborhood: selectedNeighborhood,
        priorities: profile.worries,
      });
      setMessages([...newMessages, { role: 'model', text: response.counterpartReply }]);
      setCoachData(response);

      // Record real dynamic outcome to RehearsalContext!
      setNegotiationOutcome({
        completed: true,
        district: selectedNeighborhood,
        personaType: mode === 'investment' ? 'adgm_officer' : 'landlord',
        counterpartName: mode === 'investment' ? 'Tariq (illustrative advisor persona)' : 'Mr. Rashed (illustrative landlord persona)',
        confidenceScore: response.confidenceScore,
        missedQuestions: response.missingQuestions,
        warnings: response.warnings,
        tips: response.tips,
        finalAgreementReached: /\b(we have a deal|agreement reached|i accept your terms)\b/i.test(response.counterpartReply),
        responseSource: response.responseSource || 'demo scenario'
      });

      if (response.mapAction && onMapAction) {
        onMapAction(response.mapAction);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col md:flex-row overflow-y-auto p-3 sm:p-6 gap-4 md:gap-6 pointer-events-none bg-black/50 backdrop-blur-sm">
      
      {/* LEFT: Rehearsal Dialogue Interface */}
      <div className="w-full md:w-1/2 max-w-lg flex flex-col pointer-events-auto h-[72vh] md:h-full max-h-[90vh] self-center shrink-0">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl flex flex-col h-full overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h2 className="text-lg font-black text-slate-900">
                  {mode === 'investment' ? 'Investment Setup Practice' : 'Landlord Negotiation Practice'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {mode === 'investment' ? 'Example advisor persona: Tariq' : 'Example landlord persona: Mr. Rashed'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-full text-xs font-bold">
                <button
                  onClick={() => switchMode('landlord')}
                  className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all ${
                    mode === 'landlord' ? 'bg-gold text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Home size={12} /> Family/Lease
                </button>
                <button
                  onClick={() => switchMode('investment')}
                  className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all ${
                    mode === 'investment' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Briefcase size={12} /> Investor/ADGM
                </button>
              </div>

              {onClose && (
                <button 
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors ml-1"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 text-[11px] leading-relaxed text-amber-900">
            Practice conversation with an illustrative character. Replies and checklist items are not official advice or a real offer.
          </div>

          {/* Quick Prompts */}
          <div className="px-5 pt-3 flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {(mode === 'investment' ? [
              "Are we eligible for 0% corporate tax in ADGM?",
              "How do I qualify for the 10-year Golden Visa?",
              "What startup subsidies does Hub71 offer?"
            ] : [
              "Are chiller and AC fees included?",
              "Can I pay in 4 cheques instead of 1?",
              "Is this lease registered on TAMM Tawtheeq?"
            ]).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(undefined, q)}
                className="whitespace-nowrap px-3 py-1 bg-slate-100 hover:bg-gold/20 text-slate-700 text-[11px] font-medium rounded-full border border-slate-200 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-br-none shadow-md' 
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200 shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-500 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                  <span className="text-xs ml-2 font-mono">Preparing your rehearsal response...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form onSubmit={(e) => handleSend(e)} className="p-4 border-t border-slate-200 bg-white/80 flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'investment' ? "Ask about taxes, licensing, or Golden Visa..." : "Negotiate lease terms, cheques, or chiller fees..."}
              className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gold text-slate-900 placeholder:text-slate-400 text-sm"
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </motion.div>
      </div>

      {/* RIGHT: AI Coach Friction Feedback */}
      <div className="w-full md:w-1/2 max-w-md pointer-events-auto h-auto md:h-full flex flex-col justify-center shrink-0">
        <AnimatePresence>
          {coachData && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl p-6 space-y-5 overflow-y-auto max-h-[85vh]"
            >
              {/* Score */}
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                  {coachData.responseSource === 'AI coach' ? 'AI coach response' : 'Illustrative demo response'}
                </p>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-slate-800 text-xs font-black uppercase tracking-wider">
                    Practice readiness estimate
                  </h3>
                  <span className="font-mono font-bold text-xl text-slate-900">{coachData.confidenceScore}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <motion.div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      coachData.confidenceScore > 80 ? 'bg-emerald-500' : coachData.confidenceScore > 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${coachData.confidenceScore}%` }}
                  />
                </div>
              </div>

              {/* Missed Questions */}
              {coachData.missingQuestions?.length > 0 && (
                <div>
                  <h3 className="text-slate-800 text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 text-amber-700">
                    <AlertTriangle size={15} className="text-amber-500" />
                    Questions to ask or verify next
                  </h3>
                  <ul className="space-y-1.5">
                    {coachData.missingQuestions.map((q: string, i: number) => (
                      <li key={i} className="bg-amber-50 border border-amber-200/80 text-amber-900 px-3 py-2 rounded-xl text-xs font-medium leading-relaxed">
                        • {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Critical Warnings */}
              {coachData.warnings?.length > 0 && (
                <div>
                  <h3 className="text-slate-800 text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 text-red-700">
                    <ShieldAlert size={15} className="text-red-500" />
                    Friction & Financial Blind Spots
                  </h3>
                  <ul className="space-y-1.5">
                    {coachData.warnings.map((w: string, i: number) => (
                      <li key={i} className="bg-red-50 border border-red-200/80 text-red-900 px-3 py-2 rounded-xl text-xs leading-relaxed">
                        ⚠️ {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pro Tips */}
              {coachData.tips?.length > 0 && (
                <div>
                  <h3 className="text-slate-800 text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 text-blue-700">
                    <Sparkles size={15} className="text-blue-500" />
                    Abu Dhabi Insider Strategy
                  </h3>
                  <ul className="space-y-1.5">
                    {coachData.tips.map((t: string, i: number) => (
                      <li key={i} className="bg-blue-50 border border-blue-200/80 text-blue-900 px-3 py-2 rounded-xl text-xs leading-relaxed">
                        💡 {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Step Button */}
              <button
                onClick={() => navigate('/compare')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02]"
              >
                Proceed to Comparison & Recap <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
