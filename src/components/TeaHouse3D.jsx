import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { Ink, Paint } from './Paint'

// 제주 찻집 한 채: 홈 그림 속 마을처럼 크림색 벽 + 초가지붕(황금빛) 또는 기와지붕(테라코타),
// 나무 문, 불이 켜진 창, 돌담 한 조각, 마당. 색은 수채화처럼 연하게 쓰고 연필선을 둘러요.
const WALL = '#F4E7D0'
const THATCH = '#DDB66F'
const TILE = '#C9805A'
const WOOD = '#9A6444'
const LIGHT = '#F5CB72'
const STONE = '#A39A8E'
const YARD = '#CDD49E'

// 삼각 지붕(기와) 단면을 길게 늘인 모양
const gableGeometry = (() => {
  const s = new THREE.Shape()
  s.moveTo(-0.2, 0); s.lineTo(0.2, 0); s.lineTo(0, 0.15); s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false })
  g.translate(0, 0, -0.15)
  return g
})()

// 찻집 id 마다 늘 같은 지붕이 나오게 (초가 2 : 기와 1)
const kindOf = (id) => ([...String(id)].reduce((n, c) => n + c.charCodeAt(0), 0) % 3 === 2 ? 'tile' : 'thatch')

export default function TeaHouse3D({ id, selected }) {
  const kind = useMemo(() => kindOf(id), [id])
  return (
    <group>
      {/* 마당 */}
      <mesh position={[0, 0.006, 0.01]}>
        <cylinderGeometry args={[0.27, 0.29, 0.012, 24]} /><Paint color={YARD} />
      </mesh>
      {/* 선택하면 바닥에 따뜻한 고리 */}
      {selected && (
        <mesh position={[0, 0.016, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.37, 32]} /><meshBasicMaterial color="#BF8660" transparent opacity={0.85} />
        </mesh>
      )}

      {/* 벽 */}
      <RoundedBox args={[0.3, 0.17, 0.24]} radius={0.022} smoothness={3} position={[0, 0.095, 0]}>
        <Paint color={WALL} /><Ink thickness={0.008} />
      </RoundedBox>

      {/* 지붕 */}
      {kind === 'thatch' ? (
        <group position={[0, 0.175, 0]}>
          <mesh scale={[0.24, 0.16, 0.2]}>
            <sphereGeometry args={[1, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><Paint color={THATCH} /><Ink thickness={0.008} />
          </mesh>
          <mesh position={[0, 0.155, 0]}><sphereGeometry args={[0.03, 10, 8]} /><Paint color="#B78E49" /></mesh>
        </group>
      ) : (
        <mesh geometry={gableGeometry} position={[0, 0.175, 0]}>
          <Paint color={TILE} /><Ink thickness={0.008} />
        </mesh>
      )}

      {/* 나무 문과 불이 켜진 창 */}
      <mesh position={[0.02, 0.065, 0.122]}><boxGeometry args={[0.07, 0.12, 0.012]} /><Paint color={WOOD} /></mesh>
      <mesh position={[-0.095, 0.115, 0.122]}><boxGeometry args={[0.06, 0.05, 0.012]} /><Paint color={LIGHT} /></mesh>
      <mesh position={[0.11, 0.115, 0.122]}><boxGeometry args={[0.05, 0.05, 0.012]} /><Paint color={LIGHT} /></mesh>

      {/* 제주의 돌담 한 조각 */}
      {[[-0.22, 0.12], [-0.22, 0.05], [-0.22, -0.02]].map(([x, z], i) => (
        <RoundedBox key={i} args={[0.075, 0.045, 0.06]} radius={0.015} smoothness={2} position={[x, 0.03 + (i % 2) * 0.012, z]}>
          <Paint color={STONE} />
        </RoundedBox>
      ))}
    </group>
  )
}
