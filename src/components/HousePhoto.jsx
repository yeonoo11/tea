import { useState } from 'react'
import { artOf } from '../data/houseArt'

// 찻집 대표 사진 — 카카오 이미지 검색으로 찾은 실제 사진을 보여 주고,
// 사진을 못 찾았거나 불러오지 못하면 예시 일러스트로 돌아가요. (찻집이 바뀌면 key 로 새로 시작해요)
// 사진 아래에 작은 사진 목록, 그 아래에 출처 문구를 놓아서 사진을 가리지 않아요.
export default function HousePhoto({ house, photos, className = 'photo' }) {
  const [i, setI] = useState(0)
  const [broken, setBroken] = useState(() => new Set())

  const list = Array.isArray(photos) ? photos.filter((p) => !broken.has(p.image)) : []
  const cur = list[Math.min(i, list.length - 1)]

  if (!cur) {
    return (
      <div className={className}>
        <img src={`/images/dadam/${artOf(house)}.png`} alt="" />
        <span className="example">{photos === null ? '사진 찾는 중...' : '예시 일러스트 · 실제 매장 사진이 아니에요'}</span>
      </div>
    )
  }
  return (
    <div className="dd-photo-wrap">
      <div className={className}>
        <img src={cur.image} alt={`${house.name} 사진`} referrerPolicy="no-referrer" loading="lazy"
          onError={() => setBroken((b) => new Set(b).add(cur.image))} />
      </div>
      {list.length > 1 && (
        <div className="dd-photo-thumbs">
          {list.map((p, n) => (
            <button type="button" key={p.image} className={p === cur ? 'on' : ''} aria-label={`사진 ${n + 1}`}
              onClick={() => setI(n)}>
              <img src={p.thumbnail || p.image} alt="" referrerPolicy="no-referrer" />
            </button>
          ))}
        </div>
      )}
      <p className="dd-photo-credit">
        사진 출처 <a href={cur.link} target="_blank" rel="noreferrer">{cur.source || '웹'}</a> · 검색 결과라 실제 매장과 다를 수 있어요
      </p>
    </div>
  )
}
