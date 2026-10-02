export default async function handler(request, response) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return response.status(503).json({ error: 'AI is not configured. Add OPENAI_API_KEY in Vercel project settings.' });
  }

  try {
    const { kind, mode, messages = [], weather, context = {} } = request.body || {};
    if (kind !== 'simulation' && kind !== 'coach') {
      return response.status(400).json({ error: 'Unknown AI request type.' });
    }

    const conversation = messages.slice(-12).map((message) => ({
      role: message.role === 'assistant' || message.role === 'model' ? 'assistant' : 'user',
      content: String(message.text || '').slice(0, 2000),
    }));
    const isCoach = kind === 'coach';
    const selectedMode = mode || (isCoach ? 'landlord' : 'residential');
    const weatherContext = weather
      ? `Current apparent temperature: ${weather.apparentTemp ?? 'unknown'}°C (${weather.isLive ? 'live reading' : 'illustrative estimate'}). Treat this as a comfort estimate, not medical advice.`
      : 'Do not invent current weather or route conditions.';
    const prompt = isCoach
      ? `You are a warm but realistic Abu Dhabi negotiation practice partner. This is a rehearsal, not legal advice, an official service, or a real offer. Stay in character, respond to the newcomer, and help them notice terms to verify. Mode: ${selectedMode}. Session context: ${JSON.stringify(context)}. Return only JSON with counterpartReply (string), personaType ("landlord" or "adgm_officer"), confidenceScore (integer 0-100), missingQuestions (string array), warnings (string array), and tips (string array). Keep claims qualified and do not invent official rules, eligibility, or amounts.`
      : `You are Parallel, a practical Abu Dhabi newcomer guide. Give a short spoken reply to the user's latest request. Do not claim to change a route unless the app shows a route. Treat tax, visa, licensing, tenancy, and incentive rules as questions to verify; do not assert eligibility or exact current rules. Any investmentExamples in session context are illustrative seed data, not verified guidance. ${weatherContext} Mode: ${selectedMode}. Session context: ${JSON.stringify(context)}. Return only JSON with voiceReply (string).`;

    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: isCoach ? 0.35 : 0.2,
        messages: [{ role: 'system', content: prompt }, ...conversation],
      }),
    });
    if (!upstream.ok) return response.status(502).json({ error: 'The AI provider could not complete the request.' });

    const result = await upstream.json();
    const content = result.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('AI response was empty.');
    return response.status(200).json({ ...JSON.parse(content), responseSource: 'AI coach' });
  } catch {
    return response.status(500).json({ error: 'Could not process the AI request.' });
  }
}
