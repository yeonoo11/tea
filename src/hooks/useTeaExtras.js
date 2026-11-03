import { useEffect, useState } from 'react'
import { fetchPhotos, fetchTravel } from '../api/client'
import { AIRPORT } from '../../server/regions.js'

// 찻집 하나에 대한 "제주공항에서 이동 시간(OSRM)"을 불러옵니다.
// 소개 카드와 상세 화면이 함께 써요. house 가 바뀌면 다시 불러오고, 늦게 온 이전 결과는 무시합니다.
export function useTeaExtras(house) {
  const [travel, setTravel] = useState(null)
  const [photos, setPhotos] = useState(null)

  useEffect(() => {
    if (!house) return
    let ignore = false
    setPhotos(null)
    fetchPhotos({ name: house.name, region: house.region })
      .then((d) => !ignore && setPhotos(d))
      .catch(() => !ignore && setPhotos([]))   // 사진을 못 찾으면 일러스트로 대신해요
    fetchTravel({ fromLng: AIRPORT.lng, fromLat: AIRPORT.lat, toLng: house.lng, toLat: house.lat })
      .then((d) => !ignore && setTravel(d))
      .catch((e) => !ignore && setTravel({ error: e.message }))
    return () => { ignore = true }
  }, [house])

  return { travel, photos }
}
