import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { Ink, Paint } from './Paint'
import { RoundTree } from './Scenery'
import { OREUMS, SEA_Y, SURFACE, heightAt, makeBrickTexture, toXZ } from './jejuTerrain'

const SKIRT = '#97B06A'     // 잔디 단의 옆면 (돌벽 위로 늘어진 풀)
const GRASS = '#B9C58D'
const ROCK = '#B3A88F'
const STONE = '#6F6B66'   // 현무암

// 실제 오름과 바위산: 둥근 언덕(오름)과 뾰족한 바위산(성산일출봉·산방산)
export function Oreums() {
  return OREUMS.map((o) => (
    <group key={o.name} position={[o.x, SURFACE, o.z]}>
      {o.rock ? (
        <mesh scale={[o.r * 0.85, o.h * 1.15, o.r * 0.85]}>
          <sphereGeometry args={[1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><Paint color={ROCK} /><Ink thickness={0.02} />
        </mesh>
      ) : (
        <mesh scale={[o.r, o.h, o.r]}>
          <sphereGeometry args={[1, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><Paint color="#C3CE96" /><Ink thickness={0.02} />
        </mesh>
      )}
    </group>
  ))
}

// 제주 곁의 작은 섬들 (우도·비양도·가파도·마라도): 돌벽 블록 위에 잔디와 나무
const ISLETS = [
  { name: '우도', lng: 126.99, lat: 33.52, r: 0.62 },
  { name: '비양도', lng: 126.17, lat: 33.42, r: 0.4 },
  { name: '가파도', lng: 126.27, lat: 33.15, r: 0.45 },
  { name: '마라도', lng: 126.27, lat: 33.105, r: 0.34 },
]
export function Islets() {
  const brick = useMemo(() => {
    const t = makeBrickTexture()
    t.repeat.set(3, 5)
    return t
  }, [])
  return ISLETS.map((s) => {
    const [x, z] = toXZ(s.lat, s.lng)
    return (
      <group key={s.name} position={[x, 0, z]}>
        {/* 돌벽 */}
        <mesh position={[0, (0.1 + SEA_Y) / 2, 0]}>
          <cylinderGeometry args={[s.r * 0.97, s.r, 0.1 - SEA_Y, 22]} />
          <Paint color="#ffffff" map={brick} /><Ink thickness={0.02} />
        </mesh>
        {/* 잔디 단 */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[s.r, s.r, 0.3, 22]} />
          <Paint attach="material-0" color={SKIRT} />
          <Paint attach="material-1" color={GRASS} />
          <Paint attach="material-2" color={SKIRT} />
          <Ink thickness={0.02} />
        </mesh>
        <RoundTree position={[0.08, SURFACE, -0.05]} scale={0.9} tone={1} />
        <RoundTree position={[-0.14, SURFACE, 0.08]} scale={0.7} tone={2} />
        <Html position={[0, 0.85, 0]} center distanceFactor={11} style={{ pointerEvents: 'none' }}>
          <div className="dd-region-label">{s.name}</div>
        </Html>
      </group>
    )
  })
}

// 바다 위의 작은 돛단배 (살랑살랑 흔들려요)
const BOATS = [[3.2, -5.8], [-8.2, 1.4], [9.4, -0.6], [1.5, 6.4], [-3.6, 6.8]]
export function Boats() {
  const refs = useRef([])
  const sail = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0); s.lineTo(0.15, 0); s.lineTo(0, 0.3); s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false })
  }, [])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    refs.current.forEach((g, i) => {
      if (!g) return
      g.position.y = SEA_Y + 0.02 + Math.sin(t * 1.2 + i * 1.7) * 0.014
      g.rotation.z = Math.sin(t * 0.9 + i) * 0.05
    })
  })
  return BOATS.map(([x, z], i) => (
    <group key={i} ref={(g) => { refs.current[i] = g }} position={[x, SEA_Y, z]} rotation={[0, i * 1.3, 0]}>
      <mesh><boxGeometry args={[0.3, 0.06, 0.1]} /><Paint color="#A9714A" /><Ink thickness={0.01} /></mesh>
      <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.008, 0.008, 0.3, 6]} /><Paint color="#7A5636" /></mesh>
      <mesh geometry={sail} position={[0.005, 0.07, -0.003]}><Paint color="#F7F0E2" side={THREE.DoubleSide} /></mesh>
    </group>
  ))
}

// 제주의 돌담: 귤밭 사이의 낮은 돌 줄
const WALLS = [
  [[126.46, 33.305], [126.62, 33.295]],
  [[126.5, 33.272], [126.7, 33.268]],
  [[126.4, 33.43], [126.5, 33.445]],
]
export function StoneWalls() {
  const stones = useMemo(() => {
    const out = []
    WALLS.forEach(([[lng1, lat1], [lng2, lat2]]) => {
      const [x1, z1] = toXZ(lat1, lng1)
      const [x2, z2] = toXZ(lat2, lng2)
      const n = Math.max(2, Math.round(Math.hypot(x2 - x1, z2 - z1) / 0.15))
      for (let i = 0; i <= n; i++) {
        const k = i / n
        const x = x1 + (x2 - x1) * k
        const z = z1 + (z2 - z1) * k
        out.push({ x, z, y: heightAt(x, z), s: 0.9 + ((i * 37) % 7) / 20 })
      }
    })
    return out
  }, [])
  return stones.map((p, i) => (
    <mesh key={i} position={[p.x, SURFACE + p.y + 0.025, p.z]} scale={[p.s, 0.7, p.s]}>
      <sphereGeometry args={[0.06, 8, 6]} /><Paint color={STONE} />
    </mesh>
  ))
}

// 돌하르방: 한라산 자락과 제주시 쪽에 하나씩
const DOLS = [[126.545, 33.322], [126.47, 33.49]]
export function Dolhareubang() {
  return DOLS.map(([lng, lat], i) => {
    const [x, z] = toXZ(lat, lng)
    return (
      <group key={i} position={[x, SURFACE + heightAt(x, z), z]} scale={1.25}>
        <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.035, 0.05, 0.14, 12]} /><Paint color="#A59D91" /><Ink thickness={0.008} /></mesh>
        <mesh position={[0, 0.17, 0]}><sphereGeometry args={[0.048, 14, 10]} /><Paint color="#AFA79B" /><Ink thickness={0.008} /></mesh>
        <mesh position={[0, 0.225, 0]}><cylinderGeometry args={[0.04, 0.056, 0.032, 12]} /><Paint color="#9A9286" /><Ink thickness={0.008} /></mesh>
      </group>
    )
  })
}
