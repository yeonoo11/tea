import { Link } from 'react-router-dom'
import { featureOf } from '../data/filters'
import { artOf } from '../data/houseArt'
import { useAppStore } from '../store/useAppStore'

// 찻집 카드: 이미지 · 이름 · 지역 · 특징 태그 · 상세 보기 · 북마크
export default function TeaCard({ house }) {
  const addFavorite = useAppStore((s) => s.addFavorite)
  const feature = featureOf(house)
  return (
    <article className="dd-card">
      <Link to={`/tea/${house.id}`} className="photo" aria-label={`${house.name} 상세 보기`}>
        <img src={`/images/dadam/${artOf(house)}.png`} alt="" loading="lazy" />
        <span className="example">예시 일러스트</span>
      </Link>
      <div className="body">
        <div className="top">
          <h3><Link to={`/tea/${house.id}`}>{house.name}</Link></h3>
          <button type="button" className="bookmark" aria-label={`${house.name} 북마크`}
            onClick={() => addFavorite({ source: 'tea', id: house.id, title: house.name })}>
            <i className="bi bi-bookmark" aria-hidden="true" />
          </button>
        </div>
        <div className="loc"><i className="bi bi-geo-alt-fill" aria-hidden="true" />제주 {house.region}</div>
        <div className="tags">
          {feature && <span>#{feature}</span>}
          <span>#{house.region}</span>
        </div>
        <Link to={`/tea/${house.id}`} className="more">상세 보기 <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
      </div>
    </article>
  )
}
