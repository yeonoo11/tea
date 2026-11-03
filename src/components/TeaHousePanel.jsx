import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useTeaExtras } from '../hooks/useTeaExtras'
import HousePhoto from './HousePhoto'
import { featureOf } from '../data/filters'

// 핀을 누르면 나오는 "찻집 미리보기" 카드
// 기본 정보·사진(카카오) + 제주공항에서 이동 시간(OSRM). 후기는 카카오맵 링크로 연결해요
export default function TeaHousePanel({ house, real = false, onToggleView }) {
  const addFavorite = useAppStore((s) => s.addFavorite)
  const { travel, photos } = useTeaExtras(house)
  const feature = featureOf(house)

  return (
    <article className="dd-preview">
      <HousePhoto house={house} photos={photos} />
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

        <div className="actions">
          <Link to={`/tea/${house.id}`} className="btn btn-primary">상세 보기</Link>
          {onToggleView && (
            <button type="button" className="btn btn-outline-primary" onClick={onToggleView}>
              <i className={`bi ${real ? 'bi-box' : 'bi-map'} me-1`} aria-hidden="true" />{real ? '3D 모형에서 보기' : '실제 지도에서 보기'}
            </button>
          )}
        </div>

        <a className="small fw-bold" href={house.url} target="_blank" rel="noreferrer">
          <i className="bi bi-chat-square-text me-1" aria-hidden="true" />카카오맵에서 후기 보기
        </a>
      </div>
    </article>
  )
}
