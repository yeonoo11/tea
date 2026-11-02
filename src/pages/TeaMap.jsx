import { useEffect, useMemo, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import Jeju3D from '../components/Jeju3D'
import FilterBar from '../components/FilterBar'
import TeaHousePanel from '../components/TeaHousePanel'
import { Loading } from '../components/Status'
import { matchesFilters } from '../data/filters'
import { useAppStore } from '../store/useAppStore'

// 제주 지도 — 찻집 위치(실제 좌표)에 핀을 꽂고, 핀을 누르면 미리보기 카드가 떠요
export default function TeaMap() {
  const { teaHouses, teaLoading, teaError, selectedHouse, selectHouse, loadTeaHouses } = useAppStore()
  const [filters, setFilters] = useState({ region: '', mood: '', kind: '' })

  useEffect(() => { loadTeaHouses() }, [loadTeaHouses])

  const shown = useMemo(() => teaHouses.filter((h) => matchesFilters(h, filters)), [teaHouses, filters])
  // 필터로 가려진 찻집은 미리보기에서도 내려요 (지도와 결과가 항상 같게)
  const selected = selectedHouse && shown.some((h) => h.id === selectedHouse.id) ? selectedHouse : null

  return (
    <Row className="g-4 pt-4">
      <Col lg={4} xl={3} className="order-lg-1">
        <h1 className="dd-map-title">제주 찻집 지도</h1>
        <p className="dd-map-sub">지도로 제주 찻집을 한눈에 둘러보세요.</p>
        <FilterBar value={filters} onChange={setFilters} stacked />
        <div className="dd-count" aria-live="polite">총 {shown.length}개의 찻집
          {shown.length !== teaHouses.length && ` (전체 ${teaHouses.length}곳 중)`}
        </div>
        {teaError && (
          <div className="dd-notice">
            찻집 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
            <details><summary>자세히 보기</summary>{teaError}</details>
          </div>
        )}
        {selected && <TeaHousePanel key={selected.id} house={selected} />}
      </Col>
      <Col lg={8} xl={9} className="order-lg-2">
        <div className="dd-frame">
          {teaLoading ? <Loading text="찻집을 찾는 중..." /> : (
            <Jeju3D houses={shown} selectedId={selected?.id} onSelect={selectHouse} height="min(72vh, max(440px, 70vw))" />
          )}
        </div>
        <div className="dd-map-meta">드래그로 회전 · 휠이나 두 손가락으로 확대/축소 · 작은 집(핀)을 눌러 보세요</div>
      </Col>
    </Row>
  )
}
