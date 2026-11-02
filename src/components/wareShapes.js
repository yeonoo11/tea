// 다구 도감과 "차 우리기" 장면이 함께 쓰는 색, 단면 점, 계산 함수
export const PORCELAIN = '#F6F1E6'   // 백자 느낌

export const CLAY = '#B9755A'        // 자사호 느낌의 붉은 흙

export const WOOD = '#B88A5A'

export const BAMBOO = '#D6B574'

export const WALNUT = '#B07A52'

export const WALNUT_DARK = '#8A5A3A'

export const BOAT = { L: 2.0, W: 0.42, D: 0.13, LIFT: 0.3 }

// 다하 표면의 한 점 (u: 길이 방향 0~1, v: 폭 방향 0~1)
export function boatPoint(u, v) {
  const { L, W, D, LIFT } = BOAT
  const hw = W * Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.42) / (u < 0.42 ? 0.62 : 0.58), 2)))   // 뒤는 넓게 잘리고 앞은 둥글게 모이는 윤곽
  const across = (v - 0.5) * 2                                                                    // -1 ~ 1
  const body = Math.sin(Math.PI * Math.min(1, u * 1.05)) ** 0.6
  const lift = u < 0.24 ? LIFT * ((0.24 - u) / 0.24) ** 2 * (1 - 0.25 * across * across) : 0      // 뒤쪽 끝이 위로 들려요
  const bowl = D * (across * across - 1) * body
  return [(u - 0.45) * L, bowl + lift, across * hw, -bowl / D]                                     // 마지막 값은 얼마나 깊은 곳인지(0~1)
}


// 찻잎: 가늘고 짙은 갈색 조각을 그릇 가운데에 소복하게 쌓아요
export const LEAVES = (() => {
  let seed = 11
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
  return Array.from({ length: 150 }, () => {
    const u = 0.3 + rand() * 0.38
    const v = 0.5 + (rand() - 0.5) * 0.7 * (1 - Math.abs(u - 0.5))
    const [x, y, z] = boatPoint(u, v)
    const mound = 0.05 * Math.sin(Math.PI * (u - 0.2) / 0.6) * (1 - Math.pow((v - 0.5) * 2, 2))
    return { p: [x, y + 0.05 + Math.max(0, mound) + rand() * 0.02, z], r: [(rand() - 0.5) * 0.5, rand() * Math.PI, (rand() - 0.5) * 0.6], s: 0.7 + rand() * 0.8, c: rand() > 0.5 ? '#3B2B1F' : '#4A3626' }
  })
})()


export const CUP = [[0, 0], [0.22, 0], [0.28, 0.05], [0.45, 0.38], [0.5, 0.58], [0.47, 0.58], [0.42, 0.38], [0.26, 0.12], [0, 0.1]]

export const BOWL = [[0, 0], [0.3, 0], [0.36, 0.06], [0.6, 0.42], [0.68, 0.64], [0.65, 0.64], [0.57, 0.42], [0.32, 0.13], [0, 0.11]]

export const LID = [[0, 0.24], [0.1, 0.22], [0.3, 0.16], [0.52, 0.08], [0.7, 0], [0.6, -0.01], [0.3, 0.04], [0, 0.06]]

export const SAUCER = [[0, 0], [0.4, 0], [0.8, 0.05], [0.98, 0.13], [0.95, 0.13], [0.78, 0.08], [0.4, 0.03], [0, 0.03]]

export const TRAY = [[0, 0], [1.5, 0], [1.56, 0.05], [1.56, 0.17], [1.5, 0.17], [1.46, 0.08], [0, 0.08]]

export const WASTE = [[0, 0], [0.5, 0], [0.82, 0.15], [0.9, 0.5], [0.86, 0.62], [0.8, 0.62], [0.82, 0.5], [0.75, 0.2], [0, 0.1]]

export const SMALLCUP = [[0, 0], [0.2, 0], [0.26, 0.04], [0.3, 0.45], [0.32, 0.5], [0.29, 0.5], [0.26, 0.08], [0, 0.07]]

export const FAIR = [[0, 0], [0.34, 0], [0.4, 0.05], [0.5, 0.32], [0.48, 0.62], [0.44, 0.62], [0.45, 0.32], [0.36, 0.1], [0, 0.08]]

// 탕관(끓는 물 주전자): 차 우리기 장면에서 숙우에 끓는 물을 부어요
export const KETTLE = [[0, 0], [0.5, 0], [0.68, 0.14], [0.7, 0.5], [0.54, 0.74], [0.3, 0.84], [0.22, 0.86], [0.26, 0.8], [0.5, 0.7], [0.64, 0.5], [0.62, 0.16], [0, 0.1]]
