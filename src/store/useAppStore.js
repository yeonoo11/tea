import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { askAgent, fetchTeaHouses } from '../api/client'

// Supabase 사용자 → 우리가 쓰는 모양. 닉네임은 가입할 때 적은 값(없으면 이메일 앞부분)
const toUser = (u) => (u ? { id: u.id, email: u.email, nickname: u.user_metadata?.nickname || u.email?.split('@')[0] || '회원' } : null)
let authStarted = false

// Supabase 의 영어 오류를 쉬운 한국어로
function authMessage(error) {
  const m = String(error.message || '')
  if (/invalid login credentials/i.test(m)) return '이메일 또는 비밀번호가 맞지 않아요'
  if (/email not confirmed/i.test(m)) return '메일함의 확인 링크를 먼저 눌러 주세요'
  if (/already registered|already been registered/i.test(m)) return '이미 가입된 이메일이에요'
  if (/at least \d+ characters/i.test(m)) return '비밀번호는 6자 이상이어야 해요'
  if (/rate limit|too many/i.test(m)) return '잠시 후에 다시 시도해 주세요'
  if (/valid email|invalid.*email/i.test(m)) return '이메일 형식을 확인해 주세요'
  return m || '문제가 생겼어요. 잠시 후에 다시 시도해 주세요'
}

// ── 앱 전체가 함께 쓰는 상태(store) ──────────────────────
// 여러 페이지에서 같이 쓰는 데이터는 여기에 둡니다. (한 페이지에서만 쓰면 useState)
// 사용법:  const nickname = useAppStore((s) => s.nickname)
export const useAppStore = create(
  persist(
    (set, get) => ({
      // ① 사용자 — localStorage 에 저장되어 새로고침해도 유지
      nickname: '',
      setNickname: (nickname) => set({ nickname: nickname.trim() }),

      // ② 알림(토스트) — 어느 페이지에서든 get().toast('메시지')
      toasts: [],
      toast: (message, variant = 'success') => {
        const id = Date.now() + Math.random()
        set({ toasts: [...get().toasts, { id, message, variant }] })
        setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 2500)
      },

      // ②-2 회원 — Supabase Auth (이메일 + 비밀번호). 로그인 정보는 Supabase 가 알아서 기억해요.
      user: null,            // { id, email, nickname } | null
      authReady: false,      // 로그인 여부 확인이 끝났는지
      initAuth: () => {
        if (authStarted) return
        authStarted = true
        if (!supabase) return set({ authReady: true })
        supabase.auth.getSession().then(({ data }) => set({ user: toUser(data.session?.user), authReady: true }))
        supabase.auth.onAuthStateChange((_event, session) => {
          set({ user: toUser(session?.user), authReady: true })
          if (!session) set({ favorites: [] })
        })
      },
      signUp: async ({ email, password, nickname }) => {
        if (!supabase) return { error: 'Supabase 설정(.env.local)이 필요해요' }
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nickname } } })
        if (error) return { error: authMessage(error) }
        return { needsConfirm: !data.session }   // 메일 확인이 켜져 있으면 session 이 아직 없어요
      },
      signIn: async ({ email, password }) => {
        if (!supabase) return { error: 'Supabase 설정(.env.local)이 필요해요' }
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return error ? { error: authMessage(error) } : {}
      },
      signOut: async () => {
        await supabase?.auth.signOut()
        set({ user: null, favorites: [] })
        get().toast('로그아웃했어요')
      },

      // ③ 북마크 — Supabase favorites 테이블. 로그인한 본인 것만 읽고 쓰고 지울 수 있어요.
      favorites: [],
      favLoading: false,
      loadFavorites: async () => {
        if (!supabase || !get().user) return
        set({ favLoading: true })
        const { data, error } = await supabase.from('favorites').select('*').order('created_at', { ascending: false })
        set({ favLoading: false })
        if (error) return get().toast(error.message, 'danger')
        set({ favorites: data })
      },
      addFavorite: async ({ source, id, title }) => {
        if (!supabase) return get().toast('Supabase 설정(.env.local)이 필요해요', 'warning')
        const user = get().user
        if (!user) return get().toast('북마크는 로그인한 뒤에 쓸 수 있어요', 'warning')
        const row = { nickname: user.nickname, source, item_id: String(id), title }
        const { data, error } = await supabase.from('favorites').insert(row).select().single()
        if (error) return get().toast(error.code === '23505' ? '이미 북마크한 찻집이에요' : error.message, error.code === '23505' ? 'warning' : 'danger')
        set({ favorites: [data, ...get().favorites] })
        get().toast('북마크에 저장했어요')
      },
      removeFavorite: async (favId) => {
        if (!supabase) return
        const { error } = await supabase.from('favorites').delete().eq('id', favId)
        if (error) return get().toast(error.message, 'danger')
        set({ favorites: get().favorites.filter((f) => f.id !== favId) })
        get().toast('북마크를 지웠어요')
      },

      // ③-2 찻집 지도 — 3D 지도의 핀(찻집 목록)과 지금 선택한 찻집
      teaHouses: [],
      teaLoading: false,
      teaError: '',
      selectedHouse: null,
      selectHouse: (selectedHouse) => set({ selectedHouse }),
      // 설문대할망이 추천한 찻집 — 지도에서 이 집들을 밝히고 카메라가 그쪽으로 날아가요 ({ ids, key })
      mapHighlight: null,
      highlightOnMap: (ids) => set({ mapHighlight: ids?.length ? { ids: ids.map(String), key: Date.now() } : null }),
      loadTeaHouses: async () => {
        if (get().teaHouses.length || get().teaLoading) return
        set({ teaLoading: true, teaError: '' })
        try { set({ teaHouses: await fetchTeaHouses() }) }
        catch (e) { set({ teaError: e.message }) }
        finally { set({ teaLoading: false }) }
      },

      // ④ STEP 6: 에이전트 대화 — 페이지를 옮겨도 대화가 남도록 store 에 둡니다
      messages: [],          // { role: 'user' | 'assistant', text, steps }
      chatLoading: false,
      sendMessage: async (text) => {
        const history = get().messages.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.text }))  // Claude 형식
        set({ messages: [...get().messages, { role: 'user', text }], chatLoading: true })
        try {
          const { answer, steps, houses } = await askAgent(text, history)
          set({ messages: [...get().messages, { role: 'assistant', text: answer, steps, houses }] })
        } catch (e) {
          // 실패해도 채팅창에 할망의 말로 남겨요 (토스트는 금방 사라져서)
          set({ messages: [...get().messages, { role: 'assistant', text: e.message, error: true }] })
        } finally {
          set({ chatLoading: false })
        }
      },
    }),
    {
      name: 'jeju-ip-store',                          // localStorage 키 이름
      partialize: (s) => ({ nickname: s.nickname }),  // 저장할 항목만 고르기
    },
  ),
)
