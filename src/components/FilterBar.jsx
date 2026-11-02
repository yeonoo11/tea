import { REGIONS } from '../../server/regions.js'
import { KINDS, MOODS } from '../data/filters'

// 지역 · 분위기 · 메뉴를 고르는 필터 (찻집 찾기와 제주 지도가 함께 씀)
// value = { region, mood, kind, q } ('' 는 전체). stacked 면 세로로 쌓고, withKeyword 면 검색어 칸이 생기고, onSubmit 을 주면 검색 버튼이 생겨요.
export default function FilterBar({ value, onChange, stacked = false, withKeyword = false, onSubmit, submitLabel = '검색' }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })
  return (
    <form className={`dd-filterbar ${stacked ? 'stacked' : ''}`} role="search" aria-label="찻집 검색"
      onSubmit={(e) => { e.preventDefault(); onSubmit?.(value) }}>
      <label className="dd-fb-field">
        <i className="bi bi-geo-alt" aria-hidden="true" />
        <select value={value.region} onChange={set('region')} aria-label="지역">
          <option value="">지역 전체</option>
          {REGIONS.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
        </select>
      </label>
      <label className="dd-fb-field">
        <i className="bi bi-cup-hot" aria-hidden="true" />
        <select value={value.mood} onChange={set('mood')} aria-label="분위기">
          <option value="">분위기 전체</option>
          {Object.keys(MOODS).map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
      <label className="dd-fb-field">
        <i className="bi bi-flower2" aria-hidden="true" />
        <select value={value.kind} onChange={set('kind')} aria-label="메뉴">
          <option value="">메뉴 전체</option>
          {Object.keys(KINDS).map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>
      {withKeyword && (
        <label className="dd-fb-field keyword">
          <i className="bi bi-search" aria-hidden="true" />
          <input type="search" value={value.q ?? ''} onChange={set('q')} placeholder="찻집 이름이나 동네 검색" aria-label="검색어" />
        </label>
      )}
      {onSubmit && <button type="submit" className="btn btn-primary dd-fb-submit">{submitLabel}</button>}
    </form>
  )
}
