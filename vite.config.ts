import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

type AiKind = 'simulation' | 'coach'

function aiProxy(apiKey: string): Plugin {
  const middleware = async (req: any, res: any, next: () => void) => {
    if (req.url?.split('?')[0] !== '/api/ai' || req.method !== 'POST') {
      next()
      return
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    if (!apiKey) {
      res.statusCode = 503
      res.end(JSON.stringify({ error: 'AI is not configured. Add OPENAI_API_KEY to the local server environment.' }))
      return
    }

    try {
      const chunks: Uint8Array[] = []
      for await (const chunk of req) chunks.push(chunk)
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
        kind?: AiKind
        mode?: 'residential' | 'business' | 'landlord' | 'investment'
        messages?: Array<{ role: string; text: string }>
        weather?: { apparentTemp?: number; isLive?: boolean }
        context?: Record<string, unknown>
      }

      if (body.kind !== 'simulation' && body.kind !== 'coach') {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'Unknown AI request type.' }))
        return
      }

      const messages = (body.messages || []).slice(-12).map((message) => ({
        role: message.role === 'assistant' || message.role === 'model' ? 'assistant' : 'user',
        content: String(message.text || '').slice(0, 2000),
      }))
      const isCoach = body.kind === 'coach'
      const mode = body.mode || (isCoach ? 'landlord' : 'residential')
      const weatherContext = body.weather
        ? `Current apparent temperature: ${body.weather.apparentTemp ?? 'unknown'}°C (${body.weather.isLive ? 'live reading' : 'illustrative estimate'}). Treat this as a comfort estimate, not medical advice.`
        : 'Do not invent current weather or route conditions.'
      const sessionContext = JSON.stringify(body.context || {})
      const systemPrompt = isCoach
        ? `You are a warm but realistic Abu Dhabi negotiation practice partner. This is a rehearsal, not legal advice, an official service, or a real offer. Stay in character, respond to the newcomer, and help them notice terms to verify. Mode: ${mode}. Session context: ${sessionContext}. Return only JSON with counterpartReply (string), personaType ("landlord" or "adgm_officer"), confidenceScore (integer 0-100), missingQuestions (string array), warnings (string array), and tips (string array). Keep claims qualified and do not invent official rules, eligibility, or amounts.`
        : `You are Parallel, a practical Abu Dhabi newcomer guide. Give a short spoken reply to the user's latest request. Do not claim to change a route unless the app shows a route. Treat tax, visa, licensing, tenancy, and incentive rules as questions to verify; do not assert eligibility or exact current rules. Any investmentExamples in session context are illustrative seed data, not verified guidance. ${weatherContext} Mode: ${mode}. Session context: ${sessionContext}. Return only JSON with voiceReply (string).`

      const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          temperature: isCoach ? 0.35 : 0.2,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
        }),
      })
      const result = (await upstream.json()) as any
      if (!upstream.ok) {
        res.statusCode = 502
        res.end(JSON.stringify({ error: 'The AI provider could not complete the request.' }))
        return
      }

      const content = result.choices?.[0]?.message?.content
      if (typeof content !== 'string') throw new Error('AI response was empty.')
      const data = JSON.parse(content)
      res.statusCode = 200
      res.end(JSON.stringify({ ...data, responseSource: 'AI coach' }))
    } catch {
      res.statusCode = 500
      res.end(JSON.stringify({ error: 'Could not process the AI request.' }))
    }
  }

  return {
    name: 'parallel-server-only-ai-proxy',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''

  return {
    plugins: [react(), aiProxy(apiKey)],
  }
})
