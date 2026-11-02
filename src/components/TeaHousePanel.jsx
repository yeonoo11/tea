import { Link } from 'react-router-dom'
import { ListGroup } from 'react-bootstrap'
import { useAppStore } from '../store/useAppStore'
import { useTeaExtras } from '../hooks/useTeaExtras'
import { Loading } from './Status'
import { artOf } from '../data/houseArt'
import { featureOf } from '../data/filters'

// 핀을 누르면 나오는 "찻집 미리보기" 카드
// 기본 정보(카카오) + 후기(네이버 블로그) + 제주공항에서 이동 시간(OSRM)
export default function TeaHousePanel({ house }) {
  const addFavorite = useAppStore((s) => s.addFavorite)
  const { reviews, travel } = useTeaExtras(house)
  const feature = featureOf(house)

  return (
    <article className="dd-preview">
      <div className="photo">
        <img src={`/images/dadam/${artOf(house)}.png`} alt="" />
        <span className="example">예시 일러스트</span>
      </div>
      <div className="body">
        <div className="top">
          <h2>{house.name}</h2>
          <button type="button" className="bookmark" aria-label={`${house.name} 북마크`}
            onClick={() => addFavorite({ source: 'tea', id: house.id, title: house.name })}>
            <i className="bi bi-bookmark" aria-hidden="true" />
          </button>
        </div>
        <div className="dd-loc"><i className="bi bi-geo-alt-fill" aria-hidden="true" />제주 {house.region}</div>
        <div className="dd-tags">
          {feature && <span>#{feature}</span>}
          <span>#{house.region}</span>
        </div>

        <ul className="dd-facts">
          <li>
            <span className="k">이동</span>
            <span>
              제주공항에서{' '}
              {!travel ? '계산 중...' : travel.error ? '정보 없음' : <strong>약 {travel.minutes}분 ({travel.km}km)</strong>}
            </span>
          </li>
          <li><span className="k">주소</span><span>{house.address}</span></li>
        </ul>

        <Link to={`/tea/${house.id}`} className="btn btn-primary w-100 mb-3">상세 보기</Link>

        <div className="fw-bold small mb-1">블로그 후기</div>
        {!reviews ? <Loading text="후기 찾는 중..." /> : reviews.error ? (
          <div className="small text-muted">후기를 불러오지 못했어요.</div>
        ) : reviews.length === 0 ? (
          <div className="small text-muted">후기를 찾지 못했어요.</div>
        ) : (
          <ListGroup variant="flush">
            {reviews.slice(0, 2).map((r) => (
              <ListGroup.Item key={r.link} action href={r.link} target="_blank" rel="noreferrer"
                className="px-0 bg-transparent">
                <div className="small fw-bold">{r.title}</div>
                <div className="small text-muted text-truncate">{r.summary}</div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>
    </article>
  )
}
