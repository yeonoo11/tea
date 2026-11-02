import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// 개발 서버(npm run dev)에서도 api/ 폴더의 서버 함수를 그대로 쓰게 해 주는 작은 플러그인.
// 배포(Vercel)에서는 Vercel 이 api/ 를 직접 실행하므로 이 코드는 로컬에서만 쓰여요. (vercel dev 없이도 /api 확인 가능)
function devApi(mode) {
  return {
    name: 'dadam-dev-api',
    configureServer(server) {
      // .env.local 의 키를 서버 함수가 process.env 로 읽을 수 있게 올려 둬요 ("값  # 설명" 의 설명은 알아서 빠져요)
      Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        const m = url.pathname.match(/^\/api\/([\w-]+)$/)
        if (!m) return next()
        try {
          const mod = await server.ssrLoadModule(`/api/${m[1]}.js`)
          req.query = Object.fromEntries(url.searchParams)
          if (req.method === 'POST' || req.method === 'PUT') {
            const chunks = []
            for await (const c of req) chunks.push(c)
            const raw = Buffer.concat(chunks).toString('utf8')
            try { req.body = raw ? JSON.parse(raw) : {} } catch { req.body = raw }
          }
          res.status = (code) => { res.statusCode = code; return res }
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(data))
          }
          await mod.default(req, res)
        } catch (e) {
          server.ssrFixStacktrace?.(e)
          res.statusCode = e.code === 'ERR_MODULE_NOT_FOUND' ? 404 : 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: String(e.message) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), devApi(mode)],
}))
