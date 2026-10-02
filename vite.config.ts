import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { createAiHandler } from './server/ai.js'

function aiProxy(apiKey: string): Plugin {
  const handler = createAiHandler(() => apiKey)
  const middleware = async (req: any, res: any, next: () => void) => {
    if (req.url?.split('?')[0] !== '/api/ai') { next(); return }
    res.status = (code: number) => { res.statusCode = code; return res }
    res.json = (body: unknown) => res.end(JSON.stringify(body))
    await handler(req, res)
  }
  return {
    name: 'parallel-server-only-ai-proxy',
    configureServer(server) { server.middlewares.use(middleware) },
    configurePreviewServer(server) { server.middlewares.use(middleware) },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return { plugins: [react(), aiProxy(env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '')], build: { sourcemap: false } }
})
