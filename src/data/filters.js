import { AIRPORT } from '../../server/regions.js'
// 찻집 찾기 필터 — 홈의 검색 바와 찻집 지도가 함께 씁니다.
// 카카오 데이터에는 "분위기·차 종류" 항목이 없어서, 찻집 이름·분류·주소에 들어 있는 글자로 거릅니다.
export const KINDS = {
  전통찻집: /전통찻집|찻집|다방|다실/,
  '녹차·다원': /녹차|다원|차밭|농원/,
  '티룸·홍차': /티룸|티하우스|홍차|tea/i,
  카페: /카페/,
}

export const MOODS = {
  '한옥·고즈넉': /한옥|고택|고즈넉|옛/,
  '바다·전망': /바다|해변|해안|오션|뷰|전망|포구/,
  '숲·정원': /숲|정원|가든|곶자왈|오름/,
}

// 카카오 분류("음식점 > 카페 > 전통찻집")에서 맨 끝 항목을 찻집의 "특징"으로 씁니다
export const featureOf = (house) => house.category?.split('>').pop()?.trim()

// 권역: 지역 12곳을 네 묶음으로 나눠요 (찻집 개수가 적어서 지역별보다 고르기 쉬워요)
export const AREAS = {
  '제주시내': ['제주시'],
  '동부': ['조천·함덕', '구좌·세화', '성산'],
  '서부': ['애월', '한림', '한경', '대정', '안덕'],
  '남부': ['서귀포', '표선', '남원'],
}

// 두 점 사이의 직선거리(km). 실제 도로 거리·이동 시간이 아니에요.
const km = (a, b) => {
  const R = 6371
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// 정렬: 'airport' 이면 제주공항과의 직선거리가 가까운 순, 아니면 그대로
export function sortHouses(list, sort = '') {
  if (sort !== 'airport') return list
  return [...list].sort((a, b) => km(AIRPORT, a) - km(AIRPORT, b))
}

// 필터 값('' 이면 전체)에 맞는 찻집인지. region 에는 권역 이름이나 지역 이름이 올 수 있어요.
export function matchesFilters(house, { region = '', kind = '', mood = '', q = '' }) {
  const text = `${house.name} ${house.category ?? ''} ${house.address ?? ''}`
  return (!region || house.region === region || AREAS[region]?.includes(house.region))
    && (!kind || !KINDS[kind] || KINDS[kind].test(text))
    && (!mood || !MOODS[mood] || MOODS[mood].test(text))
    && (!q.trim() || text.toLowerCase().includes(q.trim().toLowerCase()))
}
