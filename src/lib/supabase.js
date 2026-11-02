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

// 값이 없거나 잘못되어 있어도 앱이 멈추지 않도록, 그럴 땐 null (북마크만 "설정이 필요해요"로 알려요)
function makeClient() {
  if (!url || !key || !isRealUrl(url)) return null
  try {
    return createClient(String(url).trim(), String(key).trim())
  } catch {
    return null
  }
}

export const supabase = makeClient()
export const isSupabaseReady = Boolean(supabase)
