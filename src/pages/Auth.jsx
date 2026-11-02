import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { isSupabaseReady, supabaseProblem } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'

// 로그인(/login) · 회원가입(/signup) — Supabase Auth 를 써요.
export default function Auth({ mode }) {
  const isSignup = mode === 'signup'
  const navigate = useNavigate()
  const { state } = useLocation()
  const { user, signIn, signUp, toast } = useAppStore()
  const [form, setForm] = useState({ email: '', password: '', password2: '', nickname: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)   // 가입 후 "확인 메일" 안내 화면

  const to = state?.from ?? '/'
  if (user) return <Navigate to={to} replace />   // 이미 로그인했으면 돌아가요

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  // 보내기 전에 쉬운 말로 먼저 확인해 줘요
  function check() {
    const { email, password, password2, nickname } = form
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return '이메일 형식을 확인해 주세요'
    if (isSignup && nickname.trim().length < 2) return '닉네임은 2글자 이상으로 적어 주세요'
    if (password.length < 6) return '비밀번호는 6자 이상이어야 해요'
    if (isSignup && password !== password2) return '비밀번호가 서로 달라요'
    return ''
  }

  async function onSubmit(e) {
    e.preventDefault()
    const problem = check()
    setError(problem)
    if (problem) return
    setBusy(true)
    const email = form.email.trim()
    if (isSignup) {
      const r = await signUp({ email, password: form.password, nickname: form.nickname.trim() })
      setBusy(false)
      if (r.error) return setError(r.error)
      if (r.needsConfirm) return setDone(true)     // 메일 확인이 켜져 있는 경우
      toast('가입했어요. 환영해요!')
      navigate(to, { replace: true })
    } else {
      const r = await signIn({ email, password: form.password })
      setBusy(false)
      if (r.error) return setError(r.error)
      toast('로그인했어요')
      navigate(to, { replace: true })
    }
  }

  if (done) {
    return (
      <div className="dd-auth">
        <h1>메일을 확인해 주세요</h1>
        <p className="lead-text"><strong>{form.email}</strong>로 확인 메일을 보냈어요. 메일 속 링크를 누르면 가입이 끝나요.</p>
        <Link to="/login" className="btn btn-primary">로그인하러 가기</Link>
      </div>
    )
  }

  return (
    <div className="dd-auth">
      <h1>{isSignup ? '회원가입' : '로그인'}</h1>
      <p className="lead-text">
        {isSignup ? '가입하면 마음에 든 찻집을 북마크해 두고 언제든 다시 볼 수 있어요.' : '로그인하면 내 북마크를 볼 수 있어요.'}
      </p>

      {!isSupabaseReady && (
        <div className="dd-notice">
          회원 기능은 Supabase 설정이 필요해요.<br />{supabaseProblem}
          <small className="d-block mt-1">내 컴퓨터는 <code>.env.local</code>, 배포는 Vercel의 Environment Variables 에서 고치고 다시 배포(Redeploy)해 주세요.</small>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        {isSignup && (
          <label className="dd-field">
            <span>닉네임</span>
            <input type="text" value={form.nickname} onChange={set('nickname')} maxLength={12} autoComplete="nickname" placeholder="2~12글자" />
          </label>
        )}
        <label className="dd-field">
          <span>이메일</span>
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" />
        </label>
        <label className="dd-field">
          <span>비밀번호</span>
          <input type="password" value={form.password} onChange={set('password')} autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="6자 이상" />
        </label>
        {isSignup && (
          <label className="dd-field">
            <span>비밀번호 확인</span>
            <input type="password" value={form.password2} onChange={set('password2')} autoComplete="new-password" />
          </label>
        )}

        {error && <p className="dd-form-error" role="alert"><i className="bi bi-exclamation-circle" aria-hidden="true" /> {error}</p>}

        <button type="submit" className="btn btn-primary w-100 mt-2" disabled={busy || !isSupabaseReady}>
          {busy ? '잠시만요...' : isSignup ? '가입하기' : '로그인'}
        </button>
      </form>

      <p className="dd-auth-switch">
        {isSignup ? <>이미 계정이 있나요? <Link to="/login" state={state}>로그인</Link></> : <>처음이신가요? <Link to="/signup" state={state}>회원가입</Link></>}
      </p>
    </div>
  )
}
