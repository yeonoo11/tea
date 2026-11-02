import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { ping } from '../api/client'
import { isSupabaseReady, supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import WeatherCard from '../components/WeatherCard'
import FilterBar from '../components/FilterBar'
import { GUIDE_TEAS } from '../data/teaGuide'
import { REGIONS } from '../../server/regions.js'

// 홈의 클릭 오브젝트 3개 — 위치·크기는 장면(stage) 가로·세로 대비 %라서, 화면 크기가 달라져도 그림과 정확히 겹쳐요.
const HOTS = {
  cup:      { to: '/tea',   label: '설문대할망의 찻잔: 내 취향의 찻집 찾기' },
  teapot:   { to: '/guide', label: '녹차 다관: 제주의 차 알아보기' },
  hallasan: { to: '/map',   label: '한라산: 지도로 찻집 둘러보기' },
}

const HINT_KEY = 'dadam-hint-seen'
const seenHint = () => { try { return localStorage.getItem(HINT_KEY) === '1' } catch { return false } }

// 홈 = 살아 있는 동화 속 장면. 시안의 수채화를 오브젝트별로 잘라 각각 독립된 요소로 올렸어요.
export default function Home() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const debug = params.has('debug')
  const nickname = useAppStore((s) => s.nickname)
  const setNickname = useAppStore((s) => s.setNickname)
  const [filters, setFilters] = useState({ region: '', mood: '', kind: '', q: '' })
  const [hint, setHint] = useState(() => !seenHint())
  const [db, setDb] = useState(isSupabaseReady
    ? { state: 'wait', msg: '확인 중...' }
    : { state: 'fail', msg: '.env.local 에 VITE_SUPABASE_URL / ANON_KEY 를 넣으세요' })
  const [api, setApi] = useState({ state: 'wait', msg: '확인 중...' })

  // 처음 온 사람에게만 안내 문구를 잠깐 보여 줘요
  useEffect(() => {
    if (!hint) return
    const t = setTimeout(() => {
      setHint(false)
      try { localStorage.setItem(HINT_KEY, '1') } catch { /* 저장이 막혀 있어도 괜찮아요 */ }
    }, 5200)
    return () => clearTimeout(t)
  }, [hint])

  useEffect(() => {
    if (isSupabaseReady) supabase.from('favorites').select('id').limit(1).then(({ error }) =>
      setDb(error ? { state: 'fail', msg: error.message } : { state: 'ok', msg: '연결 OK' }))
    ping()
      .then((d) => setApi({ state: 'ok', msg: `OK · 공공데이터 키 ${d.hasDataKey ? '있음' : '없음'} · Claude 키 ${d.hasClaudeKey ? '있음' : '없음'}` }))
      .catch(() => setApi({ state: 'fail', msg: 'npm run dev 가 아니라 vercel dev 로 실행했는지 확인' }))
  }, [])

  // 오브젝트는 마우스를 올려도 아무것도 바뀌지 않고, 누르면 바로 이동해요 (키보드 Tab·Enter·Space 가능)
  // 고른 조건만 주소에 붙여서 찻집 찾기 목록으로 이동
  function search(f) {
    const q = new URLSearchParams(Object.entries(f).filter(([, v]) => String(v).trim()))
    navigate(`/tea${q.toString() ? `?${q}` : ''}`)
  }
  const hot = (key) => ({ type: 'button', 'aria-label': HOTS[key].label, onClick: () => navigate(HOTS[key].to) })

  return (
    <>
      <section className="dd-home" aria-label="설문대할망과 함께하는 제주 찻집 여행">
        <h1 className="visually-hidden">다담록</h1>

        {/* 작은 화면에서는 장면 위에 문구를 따로 보여 줘요 */}
        <div className="dd-copy above" aria-hidden="true">
          <p className="lead-in">할망이 들려주는 제주의 차 여행</p>
          <p className="brand">다담록<span className="seal">茶</span></p>
          <p className="sub">차를 담다, 제주를 만나다.<br />지역, 분위기, 차 종류까지 나만의 취향에 맞는 제주 찻집을 발견해 보세요.</p>
        </div>

        <div className="dd-stage-home">
          <img className="dd-bg" src="/images/dadam/scene.jpg" alt="하얀 올림머리의 설문대할망이 녹차를 마시고, 뒤로 한라산과 바다, 돌하르방이 보이는 수채화" />
          {/* 나뭇잎 부분만 따로 살랑여요 (같은 그림을 위쪽 잎 자리만 잘라 겹침) */}
          <img className="dd-bg sway" src="/images/dadam/scene.jpg" alt="" aria-hidden="true" />

          <div className="dd-copy in-stage" aria-hidden="true">
            <p className="lead-in">할망이 들려주는 제주의 차 여행</p>
            <p className="brand">다담록<span className="seal">茶</span></p>
            <p className="rule" />
            <p className="sub">차를 담다, 제주를 만나다.<br />지역, 분위기, 차 종류까지 나만의 취향에 맞는 제주 찻집을 발견해 보세요.</p>
          </div>

          {/* 누를 수 있는 오브젝트 3개: 보이지 않는 독립 버튼이 그림 위에 정확히 겹쳐 있어요 */}
          <button {...hot('hallasan')} className="dd-hot hallasan" />
          <button {...hot('teapot')} className="dd-hot teapot" />
          <button {...hot('cup')} className="dd-hot cup" />

          <p className={`dd-hint ${hint ? 'show' : ''}`} aria-live="polite">
            {hint && '할망이 숨겨둔 제주의 차 이야기를 찾아보세요.'}
          </p>
        </div>

        <div className="dd-search">
          <FilterBar value={filters} onChange={setFilters} withKeyword onSubmit={search} submitLabel="찻집 찾기" />
        </div>

        {/* 빠른 이동 (오브젝트가 작은 화면에서도 누르기 쉽게) */}
        <nav className="dd-quick" aria-label="빠른 이동">
          <Link to="/tea"><i className="bi bi-cup-hot" aria-hidden="true" />찻집 찾기</Link>
          <Link to="/guide"><i className="bi bi-flower2" aria-hidden="true" />차 가이드</Link>
          <Link to="/map"><i className="bi bi-geo-alt" aria-hidden="true" />제주 지도</Link>
        </nav>
      </section>

      <WeatherCard />

      <section className="dd-below" aria-labelledby="home-teas">
        <div className="dd-below-head">
          <h2 id="home-teas">제주의 차 살펴보기</h2>
          <Link to="/guide">차 가이드 전체 보기 <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
        </div>
        <ul className="dd-mini-teas">
          {GUIDE_TEAS.map((t) => (
            <li key={t.id}>
              <Link to="/guide">
                <img src={`/images/dadam/${t.art}.png`} alt="" loading="lazy" />
                <strong>{t.name}</strong>
                <span>{t.short}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="dd-below" aria-labelledby="home-regions">
        <div className="dd-below-head">
          <h2 id="home-regions">지역으로 찻집 찾기</h2>
          <Link to="/map">제주 지도로 보기 <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
        </div>
        <div className="dd-region-chips">
          {REGIONS.map((r) => <Link key={r.name} to={`/tea?region=${encodeURIComponent(r.name)}`}>{r.name}</Link>)}
        </div>
      </section>

      <section className="dd-below">
        <Link to="/agent" className="dd-ask">
          <div>
            <h2>설문대할망에게 물어보세요</h2>
            <p>차를 처음 접한다면 마시는 법, 예절, 제주 차 이야기를 할망에게 물어보고 다구를 3D로 둘러보세요.</p>
            <span className="btn btn-primary">차 이야기 듣기</span>
          </div>
          <img src="/images/dadam/branch.png" alt="" loading="lazy" />
        </Link>
      </section>

      {debug && (
        <section className="container pt-5">
          <h2 className="dd-section-title">DEBUG</h2>
          <Row xs={1} md={3} className="g-3">
            <Col><Check title="React · 라우터" state="ok" msg="이 화면이 보이면 OK" /></Col>
            <Col><Check title="Supabase" {...db} /></Col>
            <Col><Check title="서버 함수 /api" {...api} /></Col>
          </Row>
          <Card className="mt-3">
            <Card.Body>
              <Card.Title className="fs-6">Store(Zustand) 확인</Card.Title>
              <Form.Control placeholder="닉네임을 입력하세요" value={nickname}
                onChange={(e) => setNickname(e.target.value)} style={{ maxWidth: 320 }} />
              <Form.Text>입력하면 오른쪽 위 메뉴에도 바로 보이고, 새로고침해도 남아 있습니다.</Form.Text>
            </Card.Body>
          </Card>
        </section>
      )}
    </>
  )
}

function Check({ title, state, msg }) {
  const icon = { ok: 'check-circle-fill text-success', fail: 'x-circle-fill text-danger', wait: 'hourglass-split text-muted' }[state]
  return (
    <Card className="h-100">
      <Card.Body>
        <div className="fw-bold mb-1"><i className={`bi bi-${icon} me-2`} />{title}</div>
        <div className="small text-muted">{msg}</div>
      </Card.Body>
    </Card>
  )
}

