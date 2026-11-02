import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Ink, Paint } from './Paint'

// 찻집 한 채 = 찻주전자 모양의 집. 둥근 몸통에 뚜껑, 주둥이, 손잡이가 있고
// 둥근 창에는 노란 불이 켜져 있고, 아치형 나무 문이 달려 있어요. 선택하면 주둥이에서 김이 올라와요.
// 도자기 색은 홈 그림처럼 연한 파스텔 네 가지를 찻집마다 돌려 써요.
const PORCELAIN = ['#EDF1F0', '#E4EEF2', '#DDE9DB', '#F4E4DE']
const WOOD = '#9A5A38'
const LIGHT = '#F5BE68'
const YARD = '#CDD49E'

const tone = (id) => PORCELAIN[[...String(id)].reduce((n, c) => n + c.charCodeAt(0), 0) % PORCELAIN.length]

// 주둥이에서 피어오르는 김 (선택했을 때만 보여요)
function Steam() {
  const refs = useRef([])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    refs.current.forEach((m, i) => {
      if (!m) return
      const k = (t * 0.45 + i / 3) % 1
      m.position.set(0.27 + Math.sin(t * 1.6 + i * 2) * 0.025 + k * 0.05, 0.3 + k * 0.28, 0)
      m.scale.setScalar(0.6 + k * 0.9)
      m.material.opacity = Math.sin(Math.PI * k) * 0.55
    })
  })
  return (
    <>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => { refs.current[i] = m }}>
          <sphereGeometry args={[0.035, 10, 8]} /><meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}

export default function TeapotHouse3D({ id, selected }) {
  const color = useMemo(() => tone(id), [id])
  return (
    <group>
      {/* 마당 */}
      <mesh position={[0, 0.006, 0.01]}>
        <cylinderGeometry args={[0.3, 0.32, 0.012, 24]} /><Paint color={YARD} />
      </mesh>
      {selected && (
        <mesh position={[0, 0.016, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.33, 0.4, 32]} /><meshBasicMaterial color="#BF8660" transparent opacity={0.85} />
        </mesh>
      )}

      {/* 몸통 */}
      <mesh position={[0, 0.135, 0]} scale={[0.2, 0.145, 0.17]}>
        <sphereGeometry args={[1, 24, 18]} /><Paint color={color} /><Ink thickness={0.03} />
      </mesh>
      {/* 뚜껑과 꼭지 */}
      <mesh position={[0, 0.262, 0]} scale={[0.115, 0.05, 0.1]}>
        <sphereGeometry args={[1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><Paint color={color} /><Ink thickness={0.03} />
      </mesh>
      <mesh position={[0, 0.318, 0]}><sphereGeometry args={[0.024, 12, 10]} /><Paint color={color} /><Ink thickness={0.012} /></mesh>

      {/* 주둥이 (오른쪽 위로 휘어 올라가요) */}
      <mesh position={[0.218, 0.19, 0]} rotation={[0, 0, -0.62]}>
        <cylinderGeometry args={[0.028, 0.05, 0.17, 14]} /><Paint color={color} /><Ink thickness={0.012} />
      </mesh>
      {/* 손잡이 (왼쪽에 D자 모양) */}
      <mesh position={[-0.175, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.085, 0.022, 8, 20, Math.PI]} /><Paint color={color} /><Ink thickness={0.01} />
      </mesh>

      {/* 아치형 나무 문 */}
      <mesh position={[0, 0.055, 0.147]} scale={[1, 1, 0.3]}>
        <boxGeometry args={[0.075, 0.07, 0.03]} /><Paint color={WOOD} />
      </mesh>
      <mesh position={[0, 0.09, 0.147]} scale={[1, 1, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0375, 0.0375, 0.03, 16, 1, false, -Math.PI / 2, Math.PI]} /><Paint color={WOOD} />
      </mesh>
      <mesh position={[0.022, 0.07, 0.158]}><sphereGeometry args={[0.007, 8, 6]} /><Paint color="#3F3A33" /></mesh>

      {/* 둥근 창 둘 (노란 불빛) */}
      <mesh position={[-0.085, 0.165, 0.147]} scale={[1, 1, 0.35]}>
        <sphereGeometry args={[0.03, 14, 10]} /><Paint color={LIGHT} />
      </mesh>
      <mesh position={[0.085, 0.165, 0.147]} scale={[1, 1, 0.35]}>
        <sphereGeometry args={[0.03, 14, 10]} /><Paint color={LIGHT} />
      </mesh>

      {selected && <Steam />}
    </group>
  )
}

