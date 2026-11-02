import * as THREE from 'three'

// 3D 지도가 함께 쓰는 좌표·높이·질감 도우미

// 위도·경도 → 3D 좌표 (제주 중심 북위 33.38, 동경 126.55 기준. 경도 1°가 위도 1°보다 짧아서 0.84배)
export const toXZ = (lat, lng) => [(lng - 126.55) * 17, (33.38 - lat) * 20]

export const SURFACE = 0.4    // 섬 윗면 높이
export const SEA_Y = -1.15    // 바다 높이 (섬이 바다 위로 우뚝 솟은 블록처럼 보이게)

// 실제 오름·바위산 위치 (r: 반지름, h: 높이). 집·나무는 이 높이만큼 올라앉아요.
const RAW_OREUMS = [
  { name: '성산일출봉', lng: 126.918, lat: 33.455, r: 0.5, h: 0.42, rock: true },
  { name: '산방산', lng: 126.314, lat: 33.239, r: 0.48, h: 0.45, rock: true },
  { name: '송악산', lng: 126.3, lat: 33.222, r: 0.42, h: 0.2 },
  { name: '새별오름', lng: 126.358, lat: 33.364, r: 0.55, h: 0.24 },
  { name: '금오름', lng: 126.303, lat: 33.35, r: 0.45, h: 0.2 },
  { name: '거문오름', lng: 126.7, lat: 33.43, r: 0.5, h: 0.2 },
  { name: '따라비오름', lng: 126.775, lat: 33.357, r: 0.5, h: 0.2 },
  { name: '용눈이오름', lng: 126.796, lat: 33.459, r: 0.5, h: 0.2 },
]
export const OREUMS = RAW_OREUMS.map((o) => {
  const [x, z] = toXZ(o.lat, o.lng)
  return { ...o, x, z }
})

// (x, z) 자리의 땅 높이: 가장 가까운 오름의 둥근 언덕 높이
export function heightAt(x, z) {
  let h = 0
  for (const o of OREUMS) {
    const d = Math.hypot(x - o.x, z - o.z) / o.r
    if (d < 1) h = Math.max(h, o.h * Math.sqrt(1 - d * d))
  }
  return h
}

// 돌을 쌓은 벽 질감 (수채화처럼 연한 갈색 돌과 줄눈, 옅은 얼룩)
export function makeBrickTexture() {
  const W = 256
  const H = 128
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const g = canvas.getContext('2d')
  g.fillStyle = '#A38B66'   // 줄눈 색
  g.fillRect(0, 0, W, H)
  const tones = ['#D3BB8F', '#C8AB80', '#BEA175', '#D8C49B', '#C2A97B']
  const rows = 4
  const bh = H / rows
  const bw = 64
  let seed = 3
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? bw / 2 : 0
    for (let x = -bw; x < W + bw; x += bw) {
      g.fillStyle = tones[Math.floor(rnd() * tones.length)]
      g.fillRect(x + off + 2, r * bh + 2, bw - 4, bh - 4)
    }
  }
  for (let i = 0; i < 46; i++) {   // 물감이 번진 듯한 옅은 얼룩
    g.fillStyle = `rgba(255, 249, 232, ${0.04 + rnd() * 0.07})`
    g.beginPath()
    g.arc(rnd() * W, rnd() * H, 6 + rnd() * 16, 0, Math.PI * 2)
    g.fill()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// 수채화처럼 번진 얼룩 질감 (거의 흰색 바탕이라, 재질 색을 곱해서 집마다 다른 색을 낼 수 있어요)
const wcCache = {}
export function getWatercolorTexture(kind) {
  if (wcCache[kind]) return wcCache[kind]
  const S = 128
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const g = canvas.getContext('2d')
  g.fillStyle = '#FFFFFF'
  g.fillRect(0, 0, S, S)
  let seed = kind === 'thatch' ? 11 : kind === 'tile' ? 23 : 37
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < 46; i++) {   // 물감이 고인 듯 밝고 어두운 얼룩
    g.fillStyle = i % 2 ? `rgba(255, 244, 220, ${0.1 + rnd() * 0.18})` : `rgba(120, 80, 40, ${0.04 + rnd() * 0.07})`
    g.beginPath()
    g.arc(rnd() * S, rnd() * S, 5 + rnd() * 20, 0, Math.PI * 2)
    g.fill()
  }
  if (kind === 'thatch') {   // 볏짚 결
    for (let i = 0; i < 130; i++) {
      g.strokeStyle = `rgba(120, 85, 38, ${0.08 + rnd() * 0.12})`
      g.lineWidth = 1
      const x = rnd() * S
      const y = rnd() * S
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x + rnd() * 6 - 3, y + 10 + rnd() * 14)
      g.stroke()
    }
  }
  if (kind === 'tile') {   // 기와 줄
    g.strokeStyle = 'rgba(120, 60, 30, 0.16)'
    g.lineWidth = 1.5
    for (let y = 8; y < S; y += 16) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke()
      for (let x = ((y / 16) % 2) * 8; x < S; x += 16) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke() }
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  wcCache[kind] = tex
  return tex
}
