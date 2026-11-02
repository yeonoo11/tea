import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// 주소가 "https://....supabase.co" 모양이 아니거나 예시 값 그대로면 쓰지 않아요.
const isRealUrl = (v) => {
  try {
    const u = new URL(String(v).trim())
    return (u.protocol === 'https:' || u.protocol === 'http:') && !u.hostname.startsWith('xxxx.')
  } catch {
    return false
  }
}

// 설정이 왜 안 되는지 쉬운 말로 알려 줘요 (화면 안내문에 써요). 문제가 없으면 빈 문자열.
function findProblem() {
  if (!url || !key) return 'VITE_SUPABASE_URL 과 VITE_SUPABASE_ANON_KEY 를 둘 다 넣어 주세요.'
  if (String(url).trim().startsWith('eyJ') || String(url).trim().startsWith('sb_')) {
    return 'VITE_SUPABASE_URL 칸에 주소가 아니라 키가 들어 있어요. https://프로젝트이름.supabase.co 모양의 Project URL 을 넣어 주세요.'
  }
  if (!isRealUrl(url)) return 'VITE_SUPABASE_URL 이 올바른 주소가 아니에요. Supabase 의 Project URL(https://….supabase.co)을 그대로 넣어 주세요.'
  return ''
}
export const supabaseProblem = findProblem()

// 값이 없거나 잘못되어 있어도 앱이 멈추지 않도록, 그럴 땐 null (북마크·회원 기능만 "설정이 필요해요"로 알려요)
function makeClient() {
  if (supabaseProblem) return null
  try {
    return createClient(String(url).trim(), String(key).trim())
  } catch {
    return null
  }
}

export const supabase = makeClient()
export const isSupabaseReady = Boolean(supabase)
