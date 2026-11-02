// 3D 지도와 다구 도감이 함께 쓰는 "동화 같은 파스텔 디오라마" 나무 부품
import { C } from './palette'
import { Ink, Paint } from './Paint'

// 소나무: 줄기 + 원뿔 두 단
export function Pine({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.04, 0.05, 0.2, 6]} /><Paint color={C.trunk} /></mesh>
      <mesh position={[0, 0.35, 0]}><coneGeometry args={[0.2, 0.36, 7]} /><Paint color={C.pine} /><Ink thickness={0.012} /></mesh>
      <mesh position={[0, 0.58, 0]}><coneGeometry args={[0.15, 0.3, 7]} /><Paint color="#8FAE75" /><Ink thickness={0.012} /></mesh>
    </group>
  )
}

// 감귤나무: 둥근 초록 나무에 주황색 열매
export function Citrus({ position, scale = 1 }) {
  const fruits = [[0.1, 0.32, 0.08], [-0.1, 0.26, 0.1], [0.02, 0.4, -0.1], [-0.08, 0.34, -0.08]]
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.03, 0.04, 0.14, 6]} /><Paint color={C.trunk} /></mesh>
      <mesh position={[0, 0.27, 0]}><icosahedronGeometry args={[0.19, 2]} /><Paint color={C.citrus} /><Ink thickness={0.012} /></mesh>
      {fruits.map((p, i) => (
        <mesh key={i} position={p}><sphereGeometry args={[0.04, 8, 8]} /><Paint color={C.orange} /></mesh>
      ))}
    </group>
  )
}
