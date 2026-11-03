import { useEffect, useRef, useState } from 'react'

// 실제 카카오맵 — 3D 지도와 같은 찻집 목록·같은 선택 상태를 공유해요.
// 브라우저용 JavaScript 키(VITE_KAKAO_JS_KEY)가 필요하고, 카카오 개발자 콘솔 > 플랫폼 > Web 에 사이트 주소를 등록해야 해요.
const KEY = import.meta.env.VITE_KAKAO_JS_KEY
let sdkPromise

function loadSdk() {
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      if (window.kakao?.maps?.load) return window.kakao.maps.load(() => resolve(window.kakao))
      const s = document.createElement('script')
      s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`
      s.onload = () => window.kakao.maps.load(() => resolve(window.kakao))
      s.onerror = () => { sdkPromise = null; reject(new Error('카카오맵을 불러오지 못했어요. 키와 등록한 사이트 주소를 확인해 주세요.')) }
      document.head.appendChild(s)
    })
  }
  return sdkPromise
}

const pinSvg = (on, gold) => `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42"><path d="M17 1C8.7 1 2 7.5 2 15.6 2 26 17 41 17 41s15-15 15-25.4C32 7.5 25.3 1 17 1z" fill="${on ? '#C8641E' : gold ? '#D9A21B' : '#5E6B3E'}" stroke="#fff" stroke-width="2.5"/><circle cx="17" cy="15.5" r="5.5" fill="#fff"/></svg>`)}`

const NONE = []   // 기본값을 매번 새로 만들지 않게

export default function KakaoMap({ houses = [], selectedId, onSelect, highlightIds = NONE, height = 520 }) {
  const box = useRef(null)
  const map = useRef(null)
  const markers = useRef(new Map())
  const onSelectRef = useRef(onSelect)
  const [err, setErr] = useState(KEY ? '' : 'VITE_KAKAO_JS_KEY 가 없어요. 카카오 개발자 콘솔의 JavaScript 키를 .env.local 에 넣어 주세요.')
  const [ready, setReady] = useState(false)
  useEffect(() => { onSelectRef.current = onSelect })

  // 지도 만들기 (한 번)
  useEffect(() => {
    if (!KEY) return
    let dead = false
    loadSdk().then((kakao) => {
      if (dead || !box.current) return
      map.current = new kakao.maps.Map(box.current, { center: new kakao.maps.LatLng(33.38, 126.55), level: 10 })
      setReady(true)
    }).catch((e) => !dead && setErr(e.message))
    return () => { dead = true; map.current = null; markers.current.clear(); setReady(false) }
  }, [])

  // 핀 꽂기 — 필터로 목록이 바뀌면 다시 꽂아요
  useEffect(() => {
    if (!ready) return
    const { kakao } = window
    markers.current.forEach((m) => m.setMap(null))
    markers.current.clear()
    for (const h of houses) {
      const m = new kakao.maps.Marker({
        map: map.current, position: new kakao.maps.LatLng(h.lat, h.lng), title: h.name,
        image: new kakao.maps.MarkerImage(pinSvg(false), new kakao.maps.Size(26, 32), { offset: new kakao.maps.Point(13, 32) }),
      })
      kakao.maps.event.addListener(m, 'click', () => onSelectRef.current?.(h))
      markers.current.set(h.id, m)
    }
  }, [ready, houses])

  // 선택된 찻집 강조 + 지도 이동 (3D 지도에서 고른 곳이 여기서도 똑같이 선택돼요)
  useEffect(() => {
    if (!ready) return
    const { kakao } = window
    markers.current.forEach((m, id) => {
      const on = id === selectedId
      const gold = highlightIds.includes(String(id))
      const big = on || gold
      m.setImage(new kakao.maps.MarkerImage(pinSvg(on, gold), big ? new kakao.maps.Size(34, 42) : new kakao.maps.Size(26, 32),
        { offset: new kakao.maps.Point(big ? 17 : 13, big ? 42 : 32) }))
      m.setZIndex(on ? 10 : gold ? 5 : 0)
    })
    const h = houses.find((x) => x.id === selectedId)
    if (h) { map.current.setLevel(5); map.current.panTo(new kakao.maps.LatLng(h.lat, h.lng)) }
  }, [ready, selectedId, houses, highlightIds])

  if (err) return <div className="dd-notice" style={{ margin: '1rem' }}>{err}</div>
  return <div ref={box} style={{ width: '100%', height }} role="application" aria-label="카카오맵 찻집 지도" />
}
