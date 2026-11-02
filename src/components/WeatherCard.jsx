import { useEffect, useState } from 'react'
import { fetchWeather } from '../api/client'

const PLACES = ['제주시', '서귀포시']
const ICON = { 맑음: 'sun', 구름많음: 'cloud-sun', 흐림: 'clouds' }

// 날씨에 어울리는 한마디 (건강 효능 같은 말은 쓰지 않아요)
function tip({ temp, rain, pop }) {
  if (rain !== '없음' || pop >= 60) return '비 소식이 있어요. 따뜻한 차 한 잔과 함께 쉬어 가기 좋은 날이에요.'
  if (temp >= 26) return '더운 날에는 시원하게 우린 차가 잘 어울려요.'
  if (temp <= 10) return '쌀쌀한 날에는 따뜻한 찻집이 생각나요.'
  return '산책하고 찻집에 들르기 좋은 날씨예요.'
}

// 오늘의 제주 날씨 — 기상청 단기예보(공공데이터포털). 불러오지 못하면 카드를 숨겨요.
export default function WeatherCard() {
  const [items, setItems] = useState(null)

  useEffect(() => {
    let ignore = false
    Promise.all(PLACES.map((p) => fetchWeather(p).then((list) => list[0]).catch(() => null)))
      .then((rows) => { if (!ignore) setItems(rows.filter(Boolean)) })
    return () => { ignore = true }
  }, [])

  if (!items?.length) return null
  return (
    <section className="dd-below" aria-labelledby="home-weather">
      <div className="dd-below-head">
        <h2 id="home-weather">오늘의 제주 날씨</h2>
        <span className="dd-source">기상청 단기예보 · 공공데이터포털</span>
      </div>
      <ul className="dd-weather-cards">
        {items.map((w) => (
          <li key={w.place}>
            <i className={`bi bi-${w.rain !== '없음' ? 'cloud-rain' : ICON[w.sky] ?? 'cloud'}`} aria-hidden="true" />
            <div>
              <strong>{w.place}</strong>
              <span className="temp">{w.temp}℃</span>
              <span>{w.sky} · 강수확률 {w.pop}%</span>
              <p>{tip(w)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
