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
  '애월에서 조용한 찻집 추천해 줘. 후기도 같이 알려 줘',
  '비 오는 날 서귀포에서 갈 만한 찻집은?',
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

// 설문대할망 AI 에이전트와 대화
function Chat() {
  const messages = useAppStore((s) => s.messages)
  const loading = useAppStore((s) => s.chatLoading)
  const sendMessage = useAppStore((s) => s.sendMessage)
  const highlightOnMap = useAppStore((s) => s.highlightOnMap)
  const navigate = useNavigate()
  const [input, setInput] = useState('')

  function onSubmit(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    sendMessage(input)
    setInput('')
  }

  return (
    <>
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
              {m.steps?.length > 0 && (
                <div className="small text-muted mb-1">
                  <i className="bi bi-tools me-1" />에이전트가 호출한 도구:{' '}
                  {m.steps.map((s) => `${s.tool}(${JSON.stringify(s.args)}) → ${s.error ? '실패' : `${s.count}건`}`).join(' · ')}
                </div>
              )}
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
