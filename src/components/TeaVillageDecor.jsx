import { Paint } from './Paint'
import { C } from './palette'
import { hashId, houseStyle } from './teaHouseStyle'

// 찻집 곁의 작은 소품: 현무암 돌담, 귤나무, 화분, 찻주전자(또는 찻잔) 간판.
// 집 본체와 같은 좌표계(앞쪽이 +z)에서 그려서 집을 따라 함께 움직이고, 모양은 가볍게(작은 구 몇 개) 유지해요.
const STONES = [[-0.07, 0.012, 0.03], [0, 0.016, 0.0], [0.07, 0.012, 0.035], [0.14, 0.014, 0.0], [0.035, 0.05, 0.0], [0.105, 0.045, 0.01]]
const POTS = ['#C98A62', '#D9A27A', '#B87454']
const LEAF = ['#8DAA6A', '#9DB77A', '#7F9E5F']
const FRUITS = [[0.05, 0.19, 0.05], [-0.04, 0.16, 0.06], [0.01, 0.23, -0.05]]

export default function TeaVillageDecor({ id }) {
  const st = houseStyle(id)
  const h = hashId(id)
  const s = st.side
  const cup = (h >>> 18) % 2 === 1   // 찻잔 간판이냐 찻주전자 간판이냐
  return (
    <group>
      {/* 현무암 돌담: 집 뒤쪽 한 줄 */}
      <group position={[-s * 0.06, 0.012, -0.22]}>
        {STONES.map(([x, y, z], i) => (
          <mesh key={i} position={[x * s, y, z]} scale={[1.25, 0.8, 1]}>
            <sphereGeometry args={[0.04, 8, 6]} /><Paint color={i % 2 ? '#7E7A74' : '#8C8780'} />
          </mesh>
        ))}
      </group>

      {/* 귤나무: 둥근 잎 + 주황 열매 */}
      <group position={[s * 0.28, 0, 0.0]}>
        <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.012, 0.018, 0.12, 6]} /><Paint color={C.trunk} /></mesh>
        <mesh position={[0, 0.17, 0]}><sphereGeometry args={[0.1, 14, 10]} /><Paint color={LEAF[st.roof]} /></mesh>
        <mesh position={[0.05, 0.14, -0.02]}><sphereGeometry args={[0.065, 12, 8]} /><Paint color="#A8C284" /></mesh>
        {FRUITS.map((p, i) => (
          <mesh key={i} position={p}><sphereGeometry args={[0.02, 8, 6]} /><Paint color={C.orange} /></mesh>
        ))}
      </group>

      {/* 작은 화분 두 개 */}
      {[[-s * 0.13, 0.19, 0], [-s * 0.2, 0.17, 1]].map(([x, z, k]) => (
        <group key={k} position={[x, 0, z]}>
          <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.024, 0.018, 0.04, 10]} /><Paint color={POTS[(st.door + k) % 3]} /></mesh>
          <mesh position={[0, 0.058, 0]}><sphereGeometry args={[0.03, 10, 8]} /><Paint color={LEAF[(st.wall + k) % 3]} /></mesh>
        </group>
      ))}

      {/* 간판: 기둥 + 팔 + 매달린 찻주전자(또는 찻잔) */}
      <group position={[-s * 0.25, 0, 0.2]}>
        <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.007, 0.009, 0.2, 6]} /><Paint color="#7A5636" /></mesh>
        <mesh position={[s * 0.035, 0.195, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.005, 0.005, 0.07, 6]} /><Paint color="#7A5636" /></mesh>
        <group position={[s * 0.06, 0.155, 0]}>
          {cup ? (
            <>
              <mesh><cylinderGeometry args={[0.03, 0.02, 0.035, 12]} /><Paint color="#F6EEDC" /></mesh>
              <mesh position={[0.034, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.012, 0.004, 6, 10]} /><Paint color="#F6EEDC" /></mesh>
            </>
          ) : (
            <>
              <mesh scale={[1, 0.82, 1]}><sphereGeometry args={[0.032, 12, 10]} /><Paint color="#C98A62" /></mesh>
              <mesh position={[0, 0.03, 0]}><sphereGeometry args={[0.012, 8, 6]} /><Paint color="#A56E4A" /></mesh>
              <mesh position={[0.036, 0.004, 0]} rotation={[0, 0, -0.9]}><cylinderGeometry args={[0.004, 0.008, 0.03, 6]} /><Paint color="#C98A62" /></mesh>
            </>
          )}
        </group>
      </group>
    </group>
  )
}
