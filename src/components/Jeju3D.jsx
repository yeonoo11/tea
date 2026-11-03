import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { REGIONS } from '../../server/regions.js'
import { C } from './palette'
import { Citrus, RoundTree } from './Scenery'
import { Ink, Paint } from './Paint'
import TeaHouse3D from './TeaHouse3D'
import TeaVillageDecor from './TeaVillageDecor'
import { ramp } from './toon'
import { Boats, Dolhareubang, Islets, Oreums, StoneWalls } from './JejuExtras'
import { SEA_Y, SURFACE, heightAt, makeBrickTexture, toXZ } from './jejuTerrain'

const [hallasanX, hallasanZ] = toXZ(33.3617, 126.5292)

// 제주 해안선 (대략적인 윤곽, [경도, 위도] 시계 방향)
const COAST = [
  [126.16, 33.3], [126.22, 33.38], [126.27, 33.43], [126.31, 33.47], [126.4, 33.51], [126.5, 33.52],
  [126.6, 33.545], [126.7, 33.555], [126.8, 33.545], [126.88, 33.52], [126.95, 33.47], [126.94, 33.42],
  [126.88, 33.37], [126.85, 33.32], [126.78, 33.26], [126.65, 33.24], [126.55, 33.235], [126.45, 33.22],
  [126.35, 33.21], [126.25, 33.2], [126.18, 33.22], [126.15, 33.27],
]

// 점이 섬 윤곽 안에 있는지 (ray casting)
function inCoast(lng, lat) {
  let inside = false
  for (let i = 0, j = COAST.length - 1; i < COAST.length; j = i++) {
    const [xi, yi] = COAST[i]
    const [xj, yj] = COAST[j]
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// 같은 동네에 찻집이 여럿이면 집이 한곳에 겹쳐요. 실제 위치는 최대한 지키면서, 가까운 집끼리 서로 밀어내 간격을 벌려요.
const MIN_GAP = 0.95       // 집 사이 최소 간격 (지도 단위)
const MAX_SHIFT = 2.2      // 원래 자리에서 밀려날 수 있는 최대 거리
const insideIsland = (x, z) => {
  const lng = x / 17 + 126.55
  const lat = 33.38 - z / 20
  return inCoast(126.55 + (lng - 126.55) / 0.95, 33.38 + (lat - 33.38) / 0.95)   // 가장자리에 걸치지 않게 살짝 안쪽 기준
}
function spreadPins(houses) {
  const pts = [...houses].sort((a, b) => String(a.id).localeCompare(String(b.id))).map((h) => {
    const [x, z] = toXZ(h.lat, h.lng)
    return { id: h.id, ox: x, oz: z, x, z }
  })
  const tryMove = (p, dx, dz) => {
    const nx = p.x + dx
    const nz = p.z + dz
    if (Math.hypot(nx - p.ox, nz - p.oz) > MAX_SHIFT) return
    if (!insideIsland(nx, nz)) return
    p.x = nx
    p.z = nz
  }
  for (let it = 0; it < 120; it++) {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i]
        const b = pts[j]
        let dx = b.x - a.x
        let dz = b.z - a.z
        let d = Math.hypot(dx, dz)
        if (d >= MIN_GAP) continue
        if (d < 1e-4) { const ang = (i * 2.4 + j) * 1.3; dx = Math.cos(ang); dz = Math.sin(ang); d = 1 }   // 완전히 같은 자리면 어느 방향으로든 갈라놔요
        const push = (MIN_GAP - Math.hypot(b.x - a.x, b.z - a.z)) / 2 + 0.002
        tryMove(a, -(dx / d) * push, -(dz / d) * push)
        tryMove(b, (dx / d) * push, (dz / d) * push)
      }
    }
  }
  return new Map(pts.map((p) => [p.id, [p.x, p.z]]))
}

// 같은 숫자에서 늘 같은 "무작위"가 나오게 하는 함수 (나무 위치가 새로고침마다 바뀌지 않게)
function seeded(seed) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 섬 위에 소나무와 감귤나무를 흩뿌립니다 (감귤나무는 남쪽 서귀포 쪽에)
function useScenery() {
  return useMemo(() => {
    const rand = seeded(7)
    const pines = []
    const citrus = []
    const cx = 126.55
    const cy = 33.38
    let guard = 0
    while ((pines.length < 46 || citrus.length < 16) && guard++ < 4000) {
      const lng = 126.16 + rand() * 0.79
      const lat = 33.2 + rand() * 0.36
      // 가장자리에 걸치지 않도록 중심 쪽으로 살짝 당겨서 검사
      if (!inCoast(cx + (lng - cx) / 0.93, cy + (lat - cy) / 0.93)) continue
      const [x, z] = toXZ(lat, lng)
      if (Math.hypot(x - hallasanX, z - hallasanZ) < 1.1) continue   // 한라산 정상 근처는 비움
      const s = 0.8 + rand() * 0.6
      if (lat < 33.34 && lng > 126.35 && lng < 126.8 && citrus.length < 16) citrus.push({ x, z, s })
      else if (pines.length < 46) pines.push({ x, z, s })
    }
    // 유채꽃: 섬 곳곳에 노란 점으로 (홈 그림의 유채꽃과 어울리게)
    const canola = []
    guard = 0
    while (canola.length < 60 && guard++ < 4000) {
      const lng = 126.16 + rand() * 0.79
      const lat = 33.2 + rand() * 0.36
      if (!inCoast(cx + (lng - cx) / 0.93, cy + (lat - cy) / 0.93)) continue
      const [x, z] = toXZ(lat, lng)
      if (Math.hypot(x - hallasanX, z - hallasanZ) < 1.4) continue
      canola.push({ x, z })
    }
    return { pines, citrus, canola }
  }, [])
}


// 섬: 윤곽선을 둥글게 부풀린 판 + 아래로 매달린 흙 덩어리 (떠 있는 디오라마)
function useIslandGeometries() {
  return useMemo(() => {
    const shape = new THREE.Shape()
    COAST.forEach(([lng, lat], i) => {
      const [x, z] = toXZ(lat, lng)
      // Shape 는 XY 평면 → 눕힐 때 y 가 -z 가 되므로 z 에 부호를 맞춰 줍니다
      if (i === 0) shape.moveTo(x, -z)
      else shape.lineTo(x, -z)
    })
    shape.closePath()
    const top = new THREE.ExtrudeGeometry(shape, {
      depth: 0.3, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.14, bevelSegments: 6, curveSegments: 24,
    })
    const under = new THREE.ExtrudeGeometry(shape, { depth: 1.5, bevelEnabled: false })
    return { top, under }
  }, [])
}

// 한라산: 완만하게 휘어 오르는 산자락 위에 눈 덮인 봉우리와 백록담
const lathe = (pts) => new THREE.LatheGeometry(new THREE.SplineCurve(pts.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(28), 36)
function Hallasan() {
  const { slope, cap } = useMemo(() => ({
    slope: lathe([[1.15, 0.18], [0.85, 0.36], [0.58, 0.62], [0.4, 0.86], [0.27, 1.0], [0.2, 1.05]]),
    cap: lathe([[0.45, 0.84], [0.36, 0.92], [0.28, 1.0], [0.21, 1.055]]),
  }), [])
  return (
    <group position={[hallasanX, SURFACE, hallasanZ]}>
      <mesh position={[0, 0.2, 0]}><coneGeometry args={[1.9, 0.45, 40]} /><Paint color={C.foothill} /><Ink thickness={0.02} /></mesh>
      <mesh geometry={slope}><Paint color={C.mountain} side={THREE.DoubleSide} /><Ink thickness={0.02} /></mesh>
      <mesh geometry={cap}><Paint color={C.snow} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 1.062, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.18, 24]} /><Paint color={C.lake} /></mesh>
    </group>
  )
}

// 찻집: 제주 전통 찻집 한 채와 소품. 마우스를 올리면 살짝 밝아지고, 누르면 onSelect 로 정보가 열려요 (찻주전자 모양 집은 TeapotHouse3D.jsx 에 남겨 뒀어요)
function Pin({ house, pos, selected, highlight, onSelect }) {
  const [hover, setHover] = useState(false)
  const [x, z] = pos
  const active = selected || hover || highlight
  return (
    <group position={[x, SURFACE + heightAt(x, z), z]} scale={active ? 1.6 : 1.2}
      onClick={(e) => { e.stopPropagation(); onSelect(house) }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto' }}>
      {/* 작아진 집을 누르기 쉽게, 보이지 않는 넉넉한 클릭 영역 */}
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.34, 12, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <TeaHouse3D id={house.id} selected={selected || highlight} glow={active} />
      <TeaVillageDecor id={house.id} />
      {active && (
        <Html position={[0, 0.62, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <div className="dd-pin-label">{house.name}</div>
        </Html>
      )}
    </group>
  )
}

// 하늘에 떠 있는 구름 (동글동글 겹친 공)
function Cloud({ position }) {
  return (
    <group position={position}>
      {[[0, 0, 0, 0.5], [0.5, -0.05, 0.1, 0.38], [-0.5, -0.05, 0, 0.36]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} scale={[1, 0.7, 1]}><sphereGeometry args={[r, 14, 12]} /><Paint color="#fffaf0" /></mesh>
      ))}
    </group>
  )
}

// 화면이 좁을수록(휴대폰 등) 카메라를 뒤로 빼서 섬 전체가 보이게 합니다
function FitCamera() {
  const camera = useThree((s) => s.camera)
  const { width, height } = useThree((s) => s.size)
  useEffect(() => {
    const f = Math.min(2.1, Math.max(1, 1.35 / (width / height)))
    camera.position.set(7 * f, 7.6 * f, 10 * f)
    camera.lookAt(0, 0, 0)
  }, [camera, width, height])
  return null
}

// 추천·북마크한 찻집들이 있으면 카메라가 그쪽으로 부드럽게 날아가요. flyKey 가 바뀔 때마다 다시 날아가고, 도착하면 마우스로 자유롭게 돌려 볼 수 있어요.
const NONE = []   // 기본값을 매번 새로 만들지 않게

function FlyTo({ goal, flyKey }) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)
  const anim = useRef(null)
  const goalRef = useRef(goal)
  goalRef.current = goal
  const hasGoal = Boolean(goal)
  useEffect(() => {
    const goal = goalRef.current
    if (!goal || !controls) return
    const dist = Math.min(15, Math.max(8, 5 + goal.spread * 1.3))
    const dir = new THREE.Vector3(0.45, 0.62, 0.64).normalize().multiplyScalar(dist)
    const to = new THREE.Vector3(goal.x, 0, goal.z)
    anim.current = { t: 0, to, pos: to.clone().add(dir) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyKey, controls, hasGoal])
  useFrame((_, dt) => {
    const a = anim.current
    if (!a || !controls) return
    a.t += dt
    const f = 1 - Math.exp(-dt * 3.5)
    controls.target.lerp(a.to, f)
    camera.position.lerp(a.pos, f)
    controls.update()
    if (a.t > 2.2) anim.current = null
  })
  return null
}

export default function Jeju3D({ houses = [], selectedId, onSelect, highlightIds = NONE, flyKey, height = 520 }) {
  const { top, under } = useIslandGeometries()
  const { pines, citrus, canola } = useScenery()
  const pinPos = useMemo(() => spreadPins(houses), [houses])
  const lit = useMemo(() => new Set(highlightIds.map(String)), [highlightIds])
  // 밝힐 찻집들의 한가운데와 흩어진 정도 (카메라가 어디로 얼마나 가까이 갈지)
  const goal = useMemo(() => {
    const pts = houses.filter((h) => lit.has(String(h.id))).map((h) => pinPos.get(h.id)).filter(Boolean)
    if (!pts.length) return null
    const x = pts.reduce((s, p) => s + p[0], 0) / pts.length
    const z = pts.reduce((s, p) => s + p[1], 0) / pts.length
    return { x, z, spread: Math.max(...pts.map((p) => Math.hypot(p[0] - x, p[1] - z))) }
  }, [houses, lit, pinPos])
  const brick = useMemo(() => makeBrickTexture(), [])
  const topMaterials = useMemo(() => [
    new THREE.MeshToonMaterial({ color: C.grass, gradientMap: ramp }),
    new THREE.MeshToonMaterial({ color: '#97B06A', gradientMap: ramp }),   // 돌벽 위로 늘어진 잔디 단
  ], [])
  return (
    <div className="dd-3d">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="dd-paint"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="8" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="3" /></filter>
      </svg>
    <Canvas camera={{ position: [7, 7.6, 10], fov: 50 }} style={{ height }}>
      <FitCamera />
      <FlyTo goal={goal} flyKey={flyKey} />
      <color attach="background" args={[C.bg]} />
      <fog attach="fog" args={[C.bg, 30, 80]} />
      <hemisphereLight args={['#fff4e2', '#e3d3b8', 2.0]} />
      <directionalLight position={[6, 10, 4]} intensity={1.6} color="#ffeccc" />

      {/* 바다: 섬 둘레의 얕은 물 + 넓은 바다 (섬이 바다 위로 솟은 모양) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, SEA_Y, 0]}>
        <circleGeometry args={[48, 64]} /><meshBasicMaterial color={C.sea} />
      </mesh>
      <mesh geometry={under} rotation={[-Math.PI / 2, 0, 0]} position={[0, SEA_Y + 0.02, 0]} scale={[1.12, 1.12, 0.02]}>
        <meshBasicMaterial color={C.shallow} />
      </mesh>

      {/* 제주섬: 풀밭 윗판(위: 풀색, 옆: 흙색) + 아래로 매달린 흙 */}
      <mesh geometry={top} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}
        material={topMaterials}><Ink thickness={0.03} /></mesh>
      {/* 돌을 쌓은 두꺼운 옆면 */}
      <mesh geometry={under} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]} scale={[0.99, 0.99, 1]}>
        <Paint color="#ffffff" map={brick} /><Ink thickness={0.03} />
      </mesh>

      <Hallasan />
      <Oreums />
      <StoneWalls />
      <Dolhareubang />
      <Islets />
      <Boats />
      {pines.map((p, i) => <RoundTree key={`p${i}`} tone={i} position={[p.x, SURFACE + heightAt(p.x, p.z), p.z]} scale={p.s} />)}
      {citrus.map((p, i) => <Citrus key={`c${i}`} position={[p.x, SURFACE + heightAt(p.x, p.z), p.z]} scale={p.s} />)}
      {canola.map((p, i) => (
        <mesh key={`f${i}`} position={[p.x, SURFACE + 0.03 + heightAt(p.x, p.z), p.z]}><sphereGeometry args={[0.06, 8, 8]} /><Paint color={C.canola} /></mesh>
      ))}

      {/* 지역 이름표 */}
      {REGIONS.map((r) => {
        const [x, z] = toXZ(r.lat, r.lng)
        return (
          <Html key={r.name} position={[x, SURFACE + 0.02, z + 0.35]} center distanceFactor={11} style={{ pointerEvents: 'none' }}>
            <div className="dd-region-label">{r.name}</div>
          </Html>
        )
      })}

      {houses.map((h) => (
        <Pin key={h.id} house={h} pos={pinPos.get(h.id)} selected={h.id === selectedId} highlight={lit.has(String(h.id))} onSelect={onSelect} />
      ))}

      <Cloud position={[-5.5, 4.2, -3]} />
      <Cloud position={[5, 4.8, 2]} />
      <Cloud position={[1, 5.2, -5]} />
      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.2} minDistance={4} maxDistance={45} />   {/* 마우스로 돌리기·확대 */}
    </Canvas>
    </div>
  )
}











