import { useEffect, useState } from 'react'
import BrewScene from './BrewScene'
import { BREW_STEPS } from '../data/brewSteps'
import { clock } from '../data/brewClock'

const prefersReduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// 할망이 말로 안내하고, 옆의 3D 쟁반 위에서 다구들이 차례로 움직여요
export default function BrewAnimation() {
  const [playing, setPlaying] = useState(() => !prefersReduced())   // 움직임 줄이기 설정이면 멈춘 채로 시작

  // 탭에 들어올 때마다 처음부터
  useEffect(() => { clock.t = 0; clock.playing = playing }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  const [step, setStep] = useState(0)

  const toggle = () => { clock.playing = !clock.playing; setPlaying(clock.playing) }
  const go = (i) => {
    const k = (i + BREW_STEPS.length) % BREW_STEPS.length
    clock.t = BREW_STEPS[k].start + 0.01
  }
  const cur = BREW_STEPS[step]

  return (
    <div className="dd-brew">
      <figure className="halmang">
        <img src="/images/dadam/halmang.jpg" alt="차를 마시며 웃고 있는 설문대할망" />
        <figcaption className="say" aria-live="polite">
          <span className="who">설문대할망</span>
          <strong>{step + 1}. {cur.title}</strong>
          <p>{cur.say}</p>
        </figcaption>
      </figure>

      <div className="stage3d">
        <div className="dd-stage"><BrewScene onStep={setStep} height={420} /></div>
        <div className="dd-brew-controls">
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => go(step - 1)} aria-label="이전 단계"><i className="bi bi-skip-backward-fill" aria-hidden="true" /></button>
          <button type="button" className="btn btn-primary btn-sm" onClick={toggle}>
            <i className={`bi bi-${playing ? 'pause-fill' : 'play-fill'} me-1`} aria-hidden="true" />{playing ? '멈추기' : '재생'}
          </button>
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => go(step + 1)} aria-label="다음 단계"><i className="bi bi-skip-forward-fill" aria-hidden="true" /></button>
          <ol className="dots" aria-label="단계 목록">
            {BREW_STEPS.map((s, i) => (
              <li key={s.title}><button type="button" className={i === step ? 'on' : ''} onClick={() => go(i)} aria-label={`${i + 1}단계 ${s.title}`} aria-current={i === step} /></li>
            ))}
          </ol>
        </div>
        <p className="dd-ware-caption">쓰는 다구: {cur.tool} · 마우스로 돌려 볼 수 있어요.</p>
      </div>
    </div>
  )
}
