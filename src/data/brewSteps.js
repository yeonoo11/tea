// 설문대할망이 알려 주는 차 우리기 순서 (일반적으로 알려진 기본 순서를 쉬운 말로 풀었어요)
export const BREW_TOTAL = 31.8   // 한 바퀴 길이(초)

export const BREW_STEPS = [
  { start: 0, title: '찻잎 꺼내기', tool: '차통 · 차시와 다하', say: '다하를 차통 곁에 두고, 차통 뚜껑을 열어 차시로 찻잎을 떠서 다하에 담자꾸나.' },
  { start: 5.4, title: '다관에 넣기', tool: '차시와 다하', say: '다관 뚜껑을 열고 다하를 한 번 기울여 입구에 대렴. 차시로 찻잎을 살살 밀어 넣으면 된단다.' },
  { start: 10.4, title: '물 식혀 붓기', tool: '탕관 · 숙우', say: '끓는 물을 숙우에 부어 잠시 식히렴. 식은 물을 다관에 천천히 부으면 찻잎이 상하지 않는단다.' },
  { start: 17.2, title: '우리기', tool: '다관', say: '뚜껑을 덮고 잠시 기다리렴. 향이 피어오른단다.' },
  { start: 20.0, title: '공도배에 모으기', tool: '다관 · 공도배', say: '우린 차는 공도배에 한데 모은단다. 그래야 맛이 고르지.' },
  { start: 23.0, title: '잔에 나누기', tool: '공도배 · 다배', say: '잔마다 진하기가 같도록 번갈아 조금씩 따르렴.' },
  { start: 27.0, title: '물 비우기', tool: '숙우 · 퇴수기', say: '남은 물은 퇴수기에 비우면 된단다. 수고했구나!' },
]

export const stepAt = (t) => {
  let i = 0
  BREW_STEPS.forEach((s, k) => { if (t >= s.start) i = k })
  return i
}
