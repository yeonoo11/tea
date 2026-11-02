import { useMemo } from 'react'
import * as THREE from 'three'
// three.js 공식 예제(webgl_geometry_teapot)에서 쓰는 티팟 모양
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js'
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js'
import { Ink, Paint } from './Paint'
import { BAMBOO, CLAY, KETTLE, CUP, FAIR, LEAVES, PORCELAIN, SAUCER, SMALLCUP, TRAY, WALNUT, WALNUT_DARK, WASTE, WOOD, BOWL, boatPoint } from './wareShapes'


// 단면 점들을 빙 돌려서 그릇 모양을 만드는 도우미 (LatheGeometry)
// 점 순서: 아래 가운데 → 바깥쪽 위로 → 입술 → 안쪽 아래로. closed 면 바깥 바닥과 안쪽 바닥을 원판으로 따로 막아 줘요.
export function Lathe({ points, color, closed = true, ...rest }) {
  const geo = useMemo(() => new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), 48), [points])
  const base = points[1][0]
  const floor = points[points.length - 2][0]
  const y0 = points[0][1]
  const y1 = points[points.length - 1][1]
  return (
    <mesh geometry={geo} {...rest}>
      <Paint color={color} side={THREE.DoubleSide} /><Ink thickness={0.012} />
      {closed && (
        <>
          <mesh position={[0, y0, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[base, 48]} /><Paint color={color} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0, y1, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[floor, 48]} /><Paint color={color} side={THREE.DoubleSide} /></mesh>
        </>
      )}
    </mesh>
  )
}

// 다관: three.js 티팟 예제 모양 그대로. 뚜껑을 따로 만들어 열고 닫을 수 있어요 (lidRef 로 움직여요)
function Teapot({ lidRef }) {
  const { body, lid, c } = useMemo(() => {
    const body = new TeapotGeometry(0.9, 14, true, false, true)
    const lid = new TeapotGeometry(0.9, 14, false, true, false)
    lid.computeBoundingBox()
    const c = new THREE.Vector3()
    lid.boundingBox.getCenter(c)
    lid.translate(-c.x, -c.y, -c.z)   // 뚜껑 가운데를 기준으로 움직이도록
    return { body, lid, c }
  }, [])
  return (
    <group>
      <mesh geometry={body}><Paint color={CLAY} side={THREE.DoubleSide} /><Ink thickness={0.012} /></mesh>
      <group ref={lidRef} position={c} userData={{ base: [c.x, c.y, c.z] }}>
        <mesh geometry={lid}><Paint color={CLAY} side={THREE.DoubleSide} /><Ink thickness={0.012} /></mesh>
      </group>
    </group>
  )
}

// 차시와 다하: 호두나무색 배 모양 그릇(다하, 뒤쪽이 살짝 들린 모양)에 찻잎을 담고, 가는 막대(차시)를 곁에 둬요

function BoatScoop({ leavesRef }) {
  const geo = useMemo(() => {
    const g = new ParametricGeometry((u, v, t) => { const [x, y, z] = boatPoint(u, v); t.set(x, y, z) }, 56, 24)
    // 음영: 그릇이 깊은 곳과 앞쪽 끝은 어둡게, 나뭇결은 옅은 줄무늬로
    const pos = g.attributes.position
    const col = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const u = (i % 57) / 56   // ParametricGeometry는 길이 방향(u)으로 57개씩, 폭 방향(v)으로 25줄을 차례로 만들어요
      const [, , , depth] = boatPoint(u, Math.floor(i / 57) / 24)
      const grain = 0.94 + 0.06 * Math.sin(x * 38 + z * 4)
      const f = (1 - 0.32 * Math.min(1, Math.abs(depth))) * (1 - 0.18 * Math.max(0, u - 0.6)) * grain
      col.set([f, f, f], i * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
  }, [])
  return (
    <group>
      <mesh geometry={geo}>
        <Paint color={WALNUT} side={THREE.DoubleSide} vertexColors /><Ink thickness={0.012} />
      </mesh>
      <group ref={leavesRef}>
      {LEAVES.map((l, i) => (
        <mesh key={i} position={l.p} rotation={l.r} scale={l.s}>
          <capsuleGeometry args={[0.011, 0.085, 3, 6]} /><Paint color={l.c} />
        </mesh>
      ))}
      </group>
    </group>
  )
}

function TeaPick() {
  const stick = useMemo(() => new THREE.LatheGeometry([
    [0, 0.0], [0.035, 0.0], [0.058, 0.08], [0.06, 0.3], [0.05, 0.8], [0.034, 1.3], [0.016, 1.65], [0, 1.82],
  ].map(([r, y]) => new THREE.Vector2(r, y)), 20), [])
  return (
    <group>
      <mesh geometry={stick}><Paint color={WALNUT_DARK} /><Ink thickness={0.008} /></mesh>
      {/* 굵은 쪽 끝의 작은 둥근 머리: 막대와 겹쳐서 한 몸처럼 이어져요 */}
      <mesh position={[0, 0.02, 0]} scale={[1.25, 1.5, 0.75]}><sphereGeometry args={[0.075, 20, 14]} /><Paint color={WALNUT_DARK} /><Ink thickness={0.008} /></mesh>
    </group>
  )
}

function Scoop({ leavesRef }) {
  return (
    <group position={[0.1, -0.1, 0]} rotation={[0.5, -0.35, 0]} scale={1.3}>
      <group position={[0.1, 0.12, -0.2]} rotation={[0, 0.25, 0]}><BoatScoop leavesRef={leavesRef} /></group>
      {/* 막대는 그릇 앞쪽에 비스듬히 눕혀 둬요 */}
      <group position={[-0.7, 0.045, 0.62]} rotation={[0, 0.12, -Math.PI / 2 + 0.03]} scale={0.95} userData={{ noTip: true }}><TeaPick /></group>
    </group>
  )
}



// 종류(kind)마다 3D 모양 하나씩
export function Model({ kind, lidRef, leavesRef }) {
  switch (kind) {
    case 'teapot':
      return <Teapot lidRef={lidRef} />
    case 'gaiwan':
      return (
        <group position={[0, -0.5, 0]}>
          <Lathe points={SAUCER} color={PORCELAIN} />
          <Lathe points={BOWL} color={PORCELAIN} position={[0, 0.1, 0]} />
          <Lathe points={LID} color={PORCELAIN} position={[0, 0.76, 0]} closed={false} />
          <mesh position={[0, 1.0, 0]}><sphereGeometry args={[0.07, 16, 16]} /><Paint color={PORCELAIN} /></mesh>
        </group>
      )
    case 'cup':
      return <Lathe points={CUP} color={PORCELAIN} scale={1.6} position={[0, -0.5, 0]} />
    case 'pitcher':
      return (
        <group position={[0, -0.5, 0]}>
          <Lathe points={BOWL} color={PORCELAIN} scale={1.2} />
          {/* 따르는 주둥이 */}
          <mesh position={[0.78, 0.74, 0]} rotation={[0, 0, -Math.PI / 2.6]}>
            <coneGeometry args={[0.16, 0.45, 20, 1, true]} />
            <Paint color={PORCELAIN} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )
    case 'tray':
      return (
        <group position={[0, -0.3, 0]}>
          <mesh position={[0, 0, 0]}><boxGeometry args={[2.6, 0.35, 1.6]} /><Paint color={WOOD} /><Ink thickness={0.02} /></mesh>
          {/* 물이 빠지는 윗판 틈새 */}
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} position={[-1.1 + i * 0.275, 0.2, 0]}>
              <boxGeometry args={[0.2, 0.06, 1.5]} /><Paint color={BAMBOO} />
            </mesh>
          ))}
          <mesh position={[0, -0.19, 0]}><boxGeometry args={[2.7, 0.04, 1.7]} /><Paint color="#9A7448" /></mesh>
        </group>
      )
    case 'canister':
      return (
        <group position={[0, -0.6, 0]}>
          <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.6, 0.6, 1.1, 40]} /><Paint color="#9A6444" /><Ink thickness={0.015} /></mesh>
          {/* 뚜껑: 따로 움직여 열 수 있어요 */}
          <group ref={lidRef} position={[0, 1.18, 0]} userData={{ base: [0, 1.18, 0] }}>
            <mesh><cylinderGeometry args={[0.64, 0.64, 0.16, 40]} /><Paint color="#6E4529" /></mesh>
            <mesh position={[0, 0.14, 0]}><sphereGeometry args={[0.08, 16, 16]} /><Paint color="#6E4529" /></mesh>
          </group>
        </group>
      )
    case 'scoop':
      return <Scoop leavesRef={leavesRef} />
    case 'boat':
      return <BoatScoop leavesRef={leavesRef} />
    case 'kettle':
      return (
        <group>
          <Lathe points={KETTLE} color="#7A6C5F" />
          {/* 뚜껑 윗면: 입구를 덮어서 안쪽이 비치지 않게 해요 */}
          <mesh position={[0, 0.865, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.3, 32]} /><Paint color="#7A6C5F" side={THREE.DoubleSide} /></mesh>
          {/* 뚜껑 손잡이 */}
          <mesh position={[0, 0.93, 0]}><sphereGeometry args={[0.07, 14, 12]} /><Paint color="#5A4E44" /></mesh>
          {/* 따르는 주둥이 */}
          <mesh position={[0.74, 0.5, 0]} rotation={[0, 0, -Math.PI / 2.5]}>
            <coneGeometry args={[0.15, 0.5, 20, 1, true]} /><Paint color="#7A6C5F" side={THREE.DoubleSide} /><Ink thickness={0.01} />
          </mesh>
          {/* 위로 올라간 손잡이 */}
          <mesh position={[0, 0.72, 0]}><torusGeometry args={[0.52, 0.04, 8, 28, Math.PI]} /><Paint color="#5A4E44" /></mesh>
        </group>
      )
    case 'pick':
      return (
        <group rotation={[0, 0, -Math.PI / 2]}>
          <TeaPick />
          {/* 막대 끝에 묻어나는 찻잎 (차 우리기 장면에서만 보여요) */}
          <group ref={leavesRef}>
            {[[0, -0.02, 0.06, 1], [0.05, 0.02, 0, 2], [-0.05, 0.03, 0.03, 3], [0.02, -0.06, -0.04, 4], [-0.03, 0.06, -0.05, 5]].map(([x, y, z, k]) => (
              <mesh key={k} position={[x, y, z]} rotation={[k, k * 2, k * 3]}><capsuleGeometry args={[0.012, 0.07, 3, 6]} /><Paint color={k % 2 ? '#3B2B1F' : '#4A3626'} /></mesh>
            ))}
          </group>
        </group>
      )
    case 'daban':
      return (
        <group position={[0, -0.3, 0]}>
          <Lathe points={TRAY} color={WOOD} />
          {/* 쟁반 위에 올려 둔 찻잔 둘 */}
          <Lathe points={CUP} color={PORCELAIN} scale={0.8} position={[-0.5, 0.08, 0.2]} />
          <Lathe points={CUP} color={PORCELAIN} scale={0.8} position={[0.45, 0.08, -0.15]} />
        </group>
      )
    case 'toesugi':
      return (
        <group position={[0, -0.4, 0]}>
          <Lathe points={WASTE} color={CLAY} scale={1.2} />
          {/* 위에 얹는 거름망 */}
          <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.88, 0.88, 0.04, 40]} /><Paint color={BAMBOO} /><Ink thickness={0.01} /></mesh>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2
            return <mesh key={i} position={[Math.cos(a) * 0.5, 0.725, Math.sin(a) * 0.5]}><cylinderGeometry args={[0.05, 0.05, 0.01, 12]} /><Paint color="#5E4228" /></mesh>
          })}
        </group>
      )
    case 'dabae':
      return <Lathe points={SMALLCUP} color={PORCELAIN} scale={2.2} position={[0, -0.55, 0]} />
    case 'gongdobae':
      return (
        <group position={[0, -0.5, 0]} scale={1.2}>
          <Lathe points={FAIR} color={PORCELAIN} />
          {/* 손잡이 */}
          <mesh position={[-0.5, 0.36, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.2, 0.04, 10, 24, Math.PI]} /><Paint color={PORCELAIN} /><Ink thickness={0.01} />
          </mesh>
          {/* 따르는 주둥이 */}
          <mesh position={[0.56, 0.58, 0]} rotation={[0, 0, -Math.PI / 2.6]}>
            <coneGeometry args={[0.14, 0.4, 20, 1, true]} /><Paint color={PORCELAIN} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )
    default:
      return null
  }
}





