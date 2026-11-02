import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { Ink, Paint } from './Paint'
import { getWatercolorTexture } from './jejuTerrain'
import { houseStyle } from './teaHouseStyle'

// 제주 전통 찻집 한 채: 모서리가 둥근 크림색 벽, 수채화 질감의 초가(황금빛) 또는 기와(테라코타) 지붕,
// 나무 문, 따뜻한 주황빛 창. 귤나무·돌담·화분·찻주전자 간판은 TeaVillageDecor 가 한꺼번에 그려요(가볍게).
// 마우스를 올리거나 선택하면 건물이 살짝 밝아져요(glow).
const WALLS = ['#F5E8D2', '#F2E3CA', '#F7EBD8', '#EFE0C8']
const THATCH = ['#DDB66F', '#D6AC60', '#E2BF7C']
const TILE = ['#C9805A', '#BF7650', '#D08C66']
const DOORS = ['#9A6444', '#8A5A3A', '#A56E4A']
const WARM = '#F2A24E'
const YARD = '#CFD6A2'

// 밝아지는 재질: glow 면 은은한 빛을 더해요
function Lit({ glow, emissive = '#FFE2B0', ...rest }) {
  return <Paint emissive={emissive} emissiveIntensity={glow ? 0.38 : 0} {...rest} />
}

// 기와지붕: 삼각 단면을 길게 늘인 모양
const gableGeometry = (() => {
  const s = new THREE.Shape()
  s.moveTo(-0.2, 0); s.lineTo(0.2, 0); s.lineTo(0, 0.15); s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false })
  g.translate(0, 0, -0.15)
  return g
})()

export default function TeaHouse3D({ id, selected, glow }) {
  const st = useMemo(() => houseStyle(id), [id])
  const roofTex = useMemo(() => getWatercolorTexture(st.kind), [st.kind])
  const wallTex = useMemo(() => getWatercolorTexture('plaster'), [])
  const win = st.windows === 2 ? [-0.095, 0.11] : [-0.095]
  return (
    <group rotation={[0, st.yaw, 0]} scale={st.size}>
      {/* 마당 */}
      <mesh position={[0, 0.006, 0.01]}>
        <cylinderGeometry args={[0.3, 0.32, 0.012, 24]} /><Paint color={YARD} />
      </mesh>
      {selected && (
        <mesh position={[0, 0.016, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.41, 32]} /><meshBasicMaterial color="#BF8660" transparent opacity={0.85} />
        </mesh>
      )}

      {/* 벽 */}
      <RoundedBox args={[0.3, 0.17, 0.24]} radius={0.026} smoothness={3} position={[0, 0.095, 0]}>
        <Lit glow={glow} color={WALLS[st.wall]} map={wallTex} /><Ink thickness={0.008} />
      </RoundedBox>

      {/* 지붕: 수채화 얼룩 질감 + 집마다 다른 색 */}
      {st.kind === 'thatch' ? (
        <group position={[0, 0.175, 0]}>
          <mesh scale={[0.24, 0.16, 0.2]}>
            <sphereGeometry args={[1, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Lit glow={glow} color={THATCH[st.roof]} map={roofTex} /><Ink thickness={0.008} />
          </mesh>
          <mesh position={[0, 0.155, 0]}><sphereGeometry args={[0.03, 10, 8]} /><Paint color="#B78E49" /></mesh>
        </group>
      ) : (
        <mesh geometry={gableGeometry} position={[0, 0.175, 0]}>
          <Lit glow={glow} color={TILE[st.roof]} map={roofTex} /><Ink thickness={0.008} />
        </mesh>
      )}

      {/* 나무 문(위가 둥근 아치)과 주황빛 창 */}
      <mesh position={[0.02, 0.06, 0.122]}><boxGeometry args={[0.07, 0.11, 0.012]} /><Paint color={DOORS[st.door]} /></mesh>
      <mesh position={[0.02, 0.115, 0.122]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.012, 14, 1, false, -Math.PI / 2, Math.PI]} /><Paint color={DOORS[st.door]} />
      </mesh>
      {win.map((x) => (
        <mesh key={x} position={[x, 0.115, 0.122]}>
          <boxGeometry args={[0.055, 0.05, 0.012]} /><Paint color={WARM} emissive={WARM} emissiveIntensity={0.45} />
        </mesh>
      ))}
    </group>
  )
}
