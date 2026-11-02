import { Outlines } from '@react-three/drei'
import { ramp } from './toon'

// 3D 모양에 입히는 "수채화 물감" 재질: 딱딱한 면 대신 옅은 3단 명암만 써요
export function Paint(props) {
  return <meshToonMaterial gradientMap={ramp} {...props} />
}

// 모양 둘레에 연한 갈색 연필선 (손으로 그린 느낌)
export function Ink({ thickness = 0.015 }) {
  return <Outlines thickness={thickness} color="#7A6150" transparent opacity={0.5} />
}
