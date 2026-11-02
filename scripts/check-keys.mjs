// 연동 점검: 키를 하나 넣을 때마다 `npm run check` 로 확인해요. (키 값은 화면에 찍지 않아요)
import fs from 'node:fs'

// .env.local 읽기: "값  # 설명" 처럼 뒤에 붙은 설명은 떼고 읽어요
for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].split(/\s+#/)[0].trim()
}

const kakao = await import('../server/kakao.js')
const naver = await import('../server/naver.js')
const osrm = await import('../server/osrm.js')

const run = async (name, fn) => {
  try { console.log(`✅ ${name}: ${await fn()}`) } catch (e) { console.log(`❌ ${name}: ${String(e.message).slice(0, 180)}`) }
}

await run('카카오 로컬', async () => {
  const r = await kakao.listTeaHouses()
  return `찻집 ${r.length}곳 (예: ${r[0]?.name}, ${r[0]?.region})`
})
await run('네이버 검색', async () => `후기 ${(await naver.searchBlogReviews({ query: '제주 애월 찻집 후기' })).length}건`)
await run('OSRM 길찾기', async () => {
  const r = await osrm.getTravelTime({ fromLng: 126.493, fromLat: 33.5113, toLng: 126.33, toLat: 33.46 })
  return `공항 → 애월 ${r.minutes}분, ${r.km}km`
})
const weather = await import('../server/weather.js')
await run('기상청 날씨(공공데이터)', async () => {
  if (!process.env.DATA_GO_KR_KEY) throw new Error('DATA_GO_KR_KEY 가 비어 있어요')
  const r = await weather.getWeather({ place: '제주시' })
  if (!r.length) throw new Error('응답은 왔지만 날씨 항목이 비어 있어요')
  return `제주시 ${r[0].temp}℃, ${r[0].sky}, 강수확률 ${r[0].pop}%`
})
await run('Claude(할망 AI)', async () => {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY 가 비어 있어요')
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const r = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
    model: 'claude-sonnet-5-5', max_tokens: 20, messages: [{ role: 'user', content: '한 단어로 인사해줘' }],
  })
  return `응답 "${r.content[0].text.trim().slice(0, 20)}"`
})
await run('Supabase', async () => {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || url === 'https://xxxx.supabase.co' || !key) throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 를 실제 값으로 넣어 주세요')
  const res = await fetch(`${url}/rest/v1/favorites?select=id&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!res.ok) throw new Error(`favorites 테이블 읽기 실패 (${res.status}) — SQL Editor 에서 supabase/favorites.sql 을 실행했는지 확인`)
  return 'favorites 테이블 읽기 OK'
})
