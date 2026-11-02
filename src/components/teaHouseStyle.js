// 찻집마다 미세하게 다른 모습을 정하는 규칙. 집 본체(TeaHouse3D)와 주변 소품(TeaVillageDecor)이 똑같이 써서,
// 같은 찻집은 새로고침해도, 어디서 그려도 같은 모습이에요.
export const HOUSE_SCALE = 1.2

export const hashId = (id) => [...String(id)].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7)

export function houseStyle(id) {
  const h = hashId(id)
  return {
    kind: h % 3 === 2 ? 'tile' : 'thatch',        // 초가 2 : 기와 1
    wall: (h >>> 3) % 4,                           // 벽 색
    roof: (h >>> 5) % 3,                           // 지붕 색
    door: (h >>> 7) % 3,                           // 문 색
    yaw: (((h >>> 9) % 9) - 4) * 0.07,             // 살짝 다른 방향
    size: 0.93 + ((h >>> 12) % 9) * 0.0175,        // 크기 ±7%
    side: (h >>> 15) % 2 ? 1 : -1,                 // 귤나무가 서는 쪽
    windows: 1 + ((h >>> 16) % 2),                 // 창 1~2개
  }
}
