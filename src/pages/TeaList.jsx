import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import FilterBar from '../components/FilterBar'
import TeaCard from '../components/TeaCard'
import { Empty, Loading } from '../components/Status'
import { matchesFilters } from '../data/filters'
import { useAppStore } from '../store/useAppStore'

// 찻집 찾기 — 조건(지역·분위기·메뉴)을 고르면 카드가 바로 걸러져요
export default function TeaList() {
  const { teaHouses, teaLoading, teaError, loadTeaHouses } = useAppStore()
  const [params] = useSearchParams()   // 홈의 지역 버튼에서 /tea?region=애월 처럼 넘어와요
  const [filters, setFilters] = useState({
    region: params.get('region') ?? '', mood: params.get('mood') ?? '', kind: params.get('kind') ?? '', q: params.get('q') ?? '',
  })

  useEffect(() => { loadTeaHouses() }, [loadTeaHouses])

  const shown = useMemo(() => teaHouses.filter((h) => matchesFilters(h, filters)), [teaHouses, filters])

  return (
    <>
      <PageHeader title="제주 찻집 둘러보기" art="/images/dadam/oranges.png" artSide="right"
        subtitle="원하는 조건에 맞는 제주 찻집을 찾아보세요." />
      <FilterBar value={filters} onChange={setFilters} withKeyword />

      {teaError && (
        <div className="dd-notice">
          찻집 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          <details><summary>자세히 보기</summary>{teaError}</details>
        </div>
      )}

      <div className="dd-count" aria-live="polite">총 {shown.length}개의 찻집</div>
      {teaLoading ? <Loading text="찻집을 찾는 중..." /> : shown.length === 0 ? <Empty text="조건에 맞는 찻집이 없어요" /> : (
        <div className="dd-card-grid">
          {shown.map((h) => <TeaCard key={h.id} house={h} />)}
        </div>
      )}
      <p className="dd-footnote">카드의 그림은 분위기를 보여 주는 예시 일러스트이며 실제 매장 사진이 아니에요. 찻집 정보는 카카오 로컬 검색 결과예요.</p>
    </>
  )
}
