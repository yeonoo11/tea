import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tab, Tabs } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import { ENJOY_STEPS, ETIQUETTE, GUIDE_SECTIONS, GUIDE_TEAS } from '../data/teaGuide'
import { TEA_FACTS } from '../../server/teaFacts.js'

// 차 가이드 — 빈티지 식물 도감처럼. 카드를 누르면 아래에 자세한 정보가 펼쳐져요.
export default function TeaGuide() {
  return (
    <>
      <PageHeader title="제주의 차 가이드" art="/images/dadam/guide-head.png"
        subtitle="제주가 품은 차의 향과 이야기를 만나보세요." />
      <Tabs defaultActiveKey="teas" className="dd-pilltabs" mountOnEnter>
        <Tab eventKey="teas" title="제주의 차"><Teas /></Tab>
        <Tab eventKey="enjoy" title="차 즐기는 법"><Enjoy /></Tab>
        <Tab eventKey="story" title="설문대할망 이야기"><Story /></Tab>
      </Tabs>
    </>
  )
}

function Teas() {
  const [openId, setOpenId] = useState('')
  const open = GUIDE_TEAS.find((t) => t.id === openId)
  return (
    <>
      <ul className="dd-tea-grid">
        {GUIDE_TEAS.map((t) => (
          <li key={t.id}>
            <button type="button" className={`dd-tea-card ${t.id === openId ? 'on' : ''}`}
              aria-expanded={t.id === openId} aria-controls="tea-detail"
              onClick={() => setOpenId(t.id === openId ? '' : t.id)}>
              <img src={`/images/dadam/${t.art}.png`} alt="" />
              <strong>{t.name}</strong>
              <span>{t.short}</span>
              <i className="bi bi-chevron-down go" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <div id="tea-detail" aria-live="polite">
        {open ? (
          <article className="dd-tea-detail">
            <h2>{open.name}</h2>
            {open.caution && (
              <p className="caution"><i className="bi bi-exclamation-circle" aria-hidden="true" /> 식용 안전성이 확인되지 않아 음용을 권하지 않는 항목이에요.</p>
            )}
            <dl>
              {GUIDE_SECTIONS.map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{open[key]}</dd>
                </div>
              ))}
            </dl>
          </article>
        ) : (
          <p className="dd-hint-line">차 카드를 누르면 소개, 재료, 맛과 향, 음용 방법, 카페인 정보, 어울리는 디저트가 펼쳐져요.</p>
        )}
      </div>
    </>
  )
}

function Enjoy() {
  return (
    <div className="dd-enjoy">
      <ol className="dd-steps">
        {ENJOY_STEPS.map((s, i) => (
          <li key={s.t}><span className="no">{i + 1}</span><div><strong>{s.t}</strong><p>{s.d}</p></div></li>
        ))}
      </ol>
      <aside className="dd-note-box">
        <h2>차 마실 때의 예절</h2>
        <ul>{ETIQUETTE.map((e) => <li key={e}>{e}</li>)}</ul>
        <p className="mb-0">궁금한 건 <Link to="/agent">할망에게 물어보고</Link>, 차를 우리는 도구는 <Link to="/agent?tab=ware">다구 도감</Link>에서 3D로 볼 수 있어요.</p>
      </aside>
    </div>
  )
}

function Story() {
  return (
    <div className="dd-story">
      <section>
        <h2>설문대할망은 누구일까요?</h2>
        <p>제주에 전해 내려오는 창조 설화 속 거인 여신이에요. 설화에 따르면 아주 커다란 몸으로 한라산과 제주의 땅을 빚었다고 전해져요. 지역마다 이야기가 조금씩 다르게 전해져서, 다담록은 널리 알려진 큰 줄기만 소개해요.</p>
        <Link to="/agent" className="btn btn-primary">할망에게 차 이야기 묻기</Link>
      </section>
      <section>
        <h2>제주 차 이야기 · 확인된 사실만</h2>
        <ul className="dd-facts-list">
          {TEA_FACTS.map((f) => (
            <li key={f.topic}>
              <strong>{f.topic}</strong>
              <p>{f.fact}</p>
              <small>출처: {f.source}</small>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
