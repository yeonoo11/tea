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

// 필터 값('' 이면 전체)에 맞는 찻집인지
export function matchesFilters(house, { region = '', kind = '', mood = '', q = '' }) {
  const text = `${house.name} ${house.category ?? ''} ${house.address ?? ''}`
  return (!region || house.region === region)
    && (!kind || !KINDS[kind] || KINDS[kind].test(text))
    && (!mood || !MOODS[mood] || MOODS[mood].test(text))
    && (!q.trim() || text.toLowerCase().includes(q.trim().toLowerCase()))
}
