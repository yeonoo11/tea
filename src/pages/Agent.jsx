import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Card, Col, Form, InputGroup, Row, Spinner, Tab, Tabs } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import TeaWareViewer from '../components/TeaWareViewer'
import BrewAnimation from '../components/BrewAnimation'
import { TEAWARE } from '../data/teaware'
import { useAppStore } from '../store/useAppStore'

const STARTERS = [
  '제주 녹차는 다른 지역 녹차와 뭐가 달라요?',
  '차를 처음 마셔 보려는데 어떤 종류부터 시작하면 좋을까요?',
  '차 마실 때 지켜야 할 기본 예절을 알려 주세요',
  '녹차를 맛있게 우리는 방법을 알려 주세요',
  '애월에서 조용한 찻집을 추천해 주세요. 후기도 같이 알려 주세요',
  '비 오는 날 서귀포에서 갈 만한 찻집이 있을까요?',
]

// 이야기 = 설문대할망 AI 에이전트 + 다구 도감 + 차 우리기 (/agent?tab=ware, ?tab=brew 로 바로 열 수 있어요)
export default function Agent() {
  const [params] = useSearchParams()
  return (
    <>
      <PageHeader title="설문대할망의 차 이야기" art="/images/dadam/branch.png" artSide="right"
        subtitle="제주를 만든 할망에게 차 이야기를 묻고, 차를 우리는 다구를 3D로 둘러보세요." />
      <Tabs defaultActiveKey={['ware', 'brew'].includes(params.get('tab')) ? params.get('tab') : 'chat'} className="dd-pilltabs mb-4" mountOnEnter>
        <Tab eventKey="chat" title="할망에게 묻기"><Chat /></Tab>
        <Tab eventKey="ware" title="다구 도감"><TeaWare /></Tab>
        <Tab eventKey="brew" title="할망의 차 우리기"><BrewAnimation /></Tab>
      </Tabs>
    </>
  )
}

// 답 아래에 이어서 물어볼 질문 후보. keys 가 지금까지의 대화에 나오면 점수를 받아 먼저 보여 줘요.
const FOLLOW_UPS = [
  { q: '애월에서 조용한 찻집을 추천해 주세요', keys: ['찻집', '애월', '조용'] },
  { q: '비 오는 날 서귀포에서 갈 만한 찻집이 있을까요?', keys: ['비', '서귀포', '날씨'] },
  { q: '오늘 제주 날씨 어때요?', keys: ['날씨', '비', '바람'] },
  { q: '차를 처음 마셔 보려는데 어떤 차부터 시작하면 좋을까요?', keys: ['처음', '입문', '종류'] },
  { q: '차 마실 때 지켜야 할 기본 예절을 알려 주세요', keys: ['예절', '찻잔', '잔'] },
  { q: '녹차를 맛있게 우리는 방법을 알려 주세요', keys: ['우리', '물 온도', '온도'] },
  { q: '홍차랑 녹차는 뭐가 달라요?', keys: ['홍차', '녹차', '종류', '카페인'] },
  { q: '귤피차는 어떤 차예요?', keys: ['귤', '허브', '대용차'] },
  { q: '제주공항에서 가까운 찻집은 어디예요?', keys: ['공항', '이동', '분'] },
  { q: '설문대할망 이야기를 들려주세요', keys: ['할망', '설화', '오름'] },
]

// 지금 대화에서 아직 묻지 않은 질문 3개를 고릅니다
function pickFollowUps(messages) {
  const asked = new Set(messages.filter((m) => m.role === 'user').map((m) => m.text))
  const last = messages.slice(-2).map((m) => m.text).join(' ')
  return FOLLOW_UPS
    .filter((f) => !asked.has(f.q))
    .map((f) => ({ ...f, score: f.keys.filter((k) => last.includes(k)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

// 설문대할망 AI 에이전트와 대화
function Chat() {
  const messages = useAppStore((s) => s.messages)
  const loading = useAppStore((s) => s.chatLoading)
  const sendMessage = useAppStore((s) => s.sendMessage)
  const resetChat = useAppStore((s) => s.resetChat)
  const highlightOnMap = useAppStore((s) => s.highlightOnMap)
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const lastMsg = messages[messages.length - 1]
  const showFollowUps = !loading && lastMsg?.role === 'assistant' && !lastMsg.error

  function onSubmit(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    sendMessage(input)
    setInput('')
  }

  return (
    <>
      {messages.length > 0 && (
        <div className="d-flex justify-content-end mb-2">
          <button type="button" className="btn btn-sm btn-outline-primary" disabled={loading} onClick={resetChat}>
            <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true" />처음으로
          </button>
        </div>
      )}
      <Card className="chat-box mb-3">
        <Card.Body>
          {messages.length === 0 && (
            <div>
              <div className="dd-eyebrow mb-2">혼저옵서예 · 어서 오렴</div>
              <div className="text-muted mb-3">차가 처음이라면 이런 걸 물어보렴.</div>
              <div className="d-grid" style={{ maxWidth: 560 }}>
                {STARTERS.map((q) => (
                  <button key={q} type="button" className="dd-starter" disabled={loading} onClick={() => sendMessage(q)}>{q}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role} ${m.error ? 'error' : ''}`}>
              {m.text}
              {m.houses?.length > 0 && (
                <div className="mt-2">
                  <button type="button" className="btn btn-sm btn-outline-primary"
                    onClick={() => { highlightOnMap(m.houses); navigate('/map') }}>
                    <i className="bi bi-geo-alt me-1" aria-hidden="true" />추천한 찻집 {m.houses.length}곳 3D 지도에서 보기
                  </button>
                </div>
              )}
            </div>
          ))}
          {showFollowUps && (
            <div className="dd-followups">
              <div className="small text-muted mb-2">이어서 이런 것도 물어보렴</div>
              <div className="d-flex flex-wrap gap-2">
                {pickFollowUps(messages).map((f) => (
                  <button key={f.q} type="button" className="dd-starter" onClick={() => sendMessage(f.q)}>{f.q}</button>
                ))}
              </div>
            </div>
          )}
          {loading && <div className="small text-muted"><Spinner size="sm" className="me-2" />할망이 도구를 사용하는 중...</div>}
        </Card.Body>
      </Card>
      <Form onSubmit={onSubmit}>
        <InputGroup>
          <Form.Control value={input} onChange={(e) => setInput(e.target.value)} placeholder="할망에게 질문을 입력하세요" />
          <Button type="submit" disabled={loading}><i className="bi bi-send" /></Button>
        </InputGroup>
      </Form>
    </>
  )
}

// 다구 도감: 왼쪽 글자 메뉴에서 고르면 가운데 3D 모양과 오른쪽 설명이 바뀝니다 (전시 도록처럼)
function TeaWare() {
  const [selected, setSelected] = useState(TEAWARE[0])
  return (
    <Row className="g-4 g-lg-5 align-items-start">
      <Col md={3} lg={2}>
        <nav className="dd-ware-menu">
          {TEAWARE.map((w, i) => (
            <button key={w.kind} type="button" className={`dd-ware-item ${w.kind === selected.kind ? 'active' : ''}`}
              onClick={() => setSelected(w)}>
              <span className="no">{String(i + 1).padStart(2, '0')}</span>
              <span className="nm">{w.name}</span>
            </button>
          ))}
        </nav>
      </Col>
      <Col md={5} lg={6}>
        <div className="dd-stage">
          <TeaWareViewer key={selected.kind} kind={selected.kind} height={380} />
        </div>
        <div className="dd-ware-caption">드래그로 돌려 보고, 휠로 확대·축소할 수 있어요.</div>
      </Col>
      <Col md={4}>
        <div className="dd-eyebrow">{selected.alias}</div>
        <h2 className="dd-ware-name">{selected.name}</h2>
        <p className="dd-ware-role">{selected.role}</p>
        <p>{selected.desc}</p>
        <p className="dd-ware-tip mb-0">{selected.tip}</p>
      </Col>
    </Row>
  )
}
