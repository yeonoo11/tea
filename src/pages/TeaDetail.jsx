import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Col, ListGroup, Row } from 'react-bootstrap'
import { Empty, Loading } from '../components/Status'
import { artOf } from '../data/houseArt'
import { featureOf } from '../data/filters'
import { useTeaExtras } from '../hooks/useTeaExtras'
import { useAppStore } from '../store/useAppStore'

// 찻집 상세 — 실제 데이터(카카오 로컬)가 있는 항목만 보여줘요. 운영시간·메뉴·사진은 데이터가 없어서 싣지 않아요.
export default function TeaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { teaHouses, teaLoading, loadTeaHouses, addFavorite, selectHouse } = useAppStore()
  const house = teaHouses.find((h) => String(h.id) === id)
  const { reviews, travel } = useTeaExtras(house)

  useEffect(() => { loadTeaHouses() }, [loadTeaHouses])   // 주소로 바로 들어와도 목록을 불러와요

  if (!house) return teaLoading || !teaHouses.length ? <Loading text="찻집 정보를 불러오는 중..." /> : <Empty text="찾는 찻집이 없어요" />

  const feature = featureOf(house)
  return (
    <>
      <Link to="/tea" className="dd-back"><i className="bi bi-arrow-left" aria-hidden="true" /> 찻집 찾기</Link>
      <Row className="g-4 g-lg-5">
        <Col lg={7}>
          <div className="dd-detail-photo">
            <img src={`/images/dadam/${artOf(house)}.png`} alt="" />
            <span className="example">예시 일러스트 · 실제 매장 사진이 아니에요</span>
          </div>
          <h1 className="dd-detail-title">{house.name}</h1>
          <div className="dd-loc"><i className="bi bi-geo-alt-fill" aria-hidden="true" />제주 {house.region}</div>
          <div className="dd-tags">
            {feature && <span>#{feature}</span>}
            <span>#{house.region}</span>
          </div>

          <ul className="dd-facts">
            <li><span className="k">주소</span><span>{house.address}</span></li>
            {house.phone && <li><span className="k">전화</span><a href={`tel:${house.phone}`}>{house.phone}</a></li>}
            <li>
              <span className="k">이동</span>
              <span>
                제주공항에서{' '}
                {!travel ? '계산 중...' : travel.error ? '정보 없음' : <strong>자동차로 약 {travel.minutes}분 ({travel.km}km)</strong>}
              </span>
            </li>
          </ul>

          <div className="dd-actions">
            <button type="button" className="btn btn-primary"
              onClick={() => addFavorite({ source: 'tea', id: house.id, title: house.name })}>
              <i className="bi bi-bookmark me-1" aria-hidden="true" />북마크
            </button>
            <button type="button" className="btn btn-outline-primary"
              onClick={() => { selectHouse(house); navigate('/map') }}>
              <i className="bi bi-geo-alt me-1" aria-hidden="true" />제주 지도에서 보기
            </button>
            <a className="btn btn-outline-primary" href={house.url} target="_blank" rel="noreferrer">
              <i className="bi bi-map me-1" aria-hidden="true" />카카오맵
            </a>
          </div>
          <p className="dd-footnote">운영시간과 메뉴는 이 서비스에 데이터가 없어요. 방문 전에 카카오맵에서 확인해 주세요.</p>
        </Col>

        <Col lg={5}>
          <h2 className="dd-section-title" id="reviews">블로그 후기</h2>
          {!reviews ? <Loading text="후기 찾는 중..." /> : reviews.error ? (
            <div className="text-muted small">블로그 후기를 지금은 불러올 수 없어요. <a href={house.url} target="_blank" rel="noreferrer">카카오맵에서 후기 보기</a></div>
          ) : reviews.length === 0 ? (
            <div className="text-muted small">후기를 찾지 못했어요.</div>
          ) : (
            <ListGroup variant="flush">
              {reviews.map((r) => (
                <ListGroup.Item key={r.link} action href={r.link} target="_blank" rel="noreferrer" className="px-0 bg-transparent">
                  <div className="fw-bold">{r.title}</div>
                  <div className="small text-muted">{r.summary}</div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>
      </Row>
    </>
  )
}
