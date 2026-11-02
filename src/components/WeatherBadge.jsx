import { useEffect, useState } from 'react'
import { fetchWeather } from '../api/client'

const ICON = { 맑음: 'sun', 구름많음: 'cloud-sun', 흐림: 'clouds' }

// 날씨를 못 가져오면(키 없음 등) 방문자에게 오류를 보이지 않고 그냥 숨겨요
export default function WeatherBadge({ place = '제주시' }) {
  const [w, setW] = useState(null)

  useEffect(() => {
    fetchWeather(place).then((list) => setW(list[0])).catch(() => setW(null))
  }, [place])

  if (!w) return null
  const icon = w.rain !== '없음' ? 'cloud-rain' : ICON[w.sky] ?? 'cloud'
  return (
    <span className="dd-weather">
      <i className={`bi bi-${icon} me-2`} />{place} {w.temp}℃ {w.sky} · 강수 {w.pop}%
    </span>
  )
}
