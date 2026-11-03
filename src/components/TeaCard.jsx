import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPhotos } from '../api/client'
import { featureOf } from '../data/filters'
import { artOf } from '../data/houseArt'
import { useAppStore } from '../store/useAppStore'

// 카드가 화면에 보일 때 실제 매장 사진(카카오 이미지 검색) 한 장을 찾아요. 못 찾으면 일러스트 그대로예요.
function useShopPhoto(house) {
  const ref = useRef(null)
  const [photo, setPhoto] = useState(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let dead = false
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      fetchPhotos({ name: house.name, region: house.region })
        .then((list) => !dead && setPhoto(list[0] ?? null))
        .catch(() => {})
    }, { rootMargin: '300px' })
    io.observe(el)
    return () => { dead = true; io.disconnect() }
  }, [house.name, house.region])
  return [ref, photo]
}

// 찻집 카드: 이미지 · 이름 · 지역 · 특징 태그 · 상세 보기 · 북마크
export default function TeaCard({ house }) {
  const addFavorite = useAppStore((s) => s.addFavorite)
  const feature = featureOf(house)
  const [ref, found] = useShopPhoto(house)
  const [failed, setFailed] = useState(false)
  const photo = failed ? null : found
  return (
    <article className="dd-card">
      <Link ref={ref} to={`/tea/${house.id}`} className="photo" aria-label={`${house.name} 상세 보기`}>
        {photo ? (
          <img src={photo.image} alt={`${house.name} 사진`} referrerPolicy="no-referrer" loading="lazy"
            onError={() => setFailed(true)} />
        ) : (
          <>
            <img src={`/images/dadam/${artOf(house)}.png`} alt="" loading="lazy" />
            <span className="example">예시 일러스트</span>
          </>
        )}
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
