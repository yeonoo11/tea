import { useCallback, useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Lathe, Model } from './WareModels'
import { Paint } from './Paint'
import { TRAY, WOOD } from './wareShapes'
import { BREW_TOTAL, stepAt } from '../data/brewSteps'
import { clock } from '../data/brewClock'

const Y = 0.16   // 다구가 놓이는 높이 (쟁반 안쪽 바닥 위)

// 쉬고 있을 때 각 다구의 자리 [x, y, z]
const REST = {
  canister: [-2.3, Y, -1.0], boat: [-1.45, Y, 1.05], pick: [-1.7, Y, 1.95], kettle: [-1.55, Y, -1.95], pitcher: [-0.95, Y, -1.0], teapot: [0, Y, 0.2],
  fair: [1.3, Y, 0.2], cup1: [2.25, Y, -0.15], cup2: [2.25, Y, 0.55], waste: [0.55, Y, -1.6],
}
const SCALE = { canister: 0.62, boat: 0.78, pick: 0.78, kettle: 0.6, pitcher: 0.56, teapot: 0.62, fair: 0.56, cup1: 0.5, cup2: 0.5, waste: 0.56 }
const KIND = { canister: 'canister', boat: 'boat', pick: 'pick', kettle: 'kettle', pitcher: 'pitcher', teapot: 'teapot', fair: 'gongdobae', cup1: 'dabae', cup2: 'dabae', waste: 'toesugi' }
// 따르는 곳(주둥이 끝)의 위치는 모양에서 직접 재서 채워요: [옆으로, 위로] (모양 크기 1 기준)
const SPOUT_OF = { teapot: null, pitcher: null, fair: null, boat: null, kettle: null }
const BACK_OF = { boat: null }   // 다하의 뒤쪽 끝

const rest = (id) => [...REST[id], 0]

// 시간(초)별 자세 [시각, x, y, z, 기울기]. 사이는 부드럽게 이어져요.
// 차시(pick)는 막대 끝의 작은 숟가락 쪽이 기준점이고, 기울기 1.4는 거의 세운 모양이에요.
const FRAMES = {
  canister: [[0, ...rest('canister')]],
  // 다하: 차통 곁으로 와서 찻잎을 받고(1.2~5초), 다관 입구로 가서 한 번만 기울여요(7초~)
  boat: [
    [0, ...rest('boat')], [0.5, ...rest('boat')],
    [1.2, -1.5, Y, -0.3, 0], [5.0, -1.5, Y, -0.3, 0],
    [6.0, -0.55, Y + 1.0, 0.25, -0.1], [7.0, -0.55, Y + 0.95, 0.25, -0.55], [9.2, -0.55, Y + 0.95, 0.25, -0.55],
    [9.8, -0.55, Y + 1.0, 0.25, -0.1], [10.6, ...rest('boat')],
  ],
  pick: [
    [0, ...rest('pick')], [0.6, ...rest('pick')],
    [1.4, -2.3, Y + 1.15, -1.0, 1.4], [1.9, -2.3, Y + 0.5, -1.0, 1.4], [2.5, -2.3, Y + 0.5, -1.0, 1.4], [3.0, -2.3, Y + 1.2, -1.0, 1.3],   // 차통 속 찻잎을 떠요
    [3.7, -1.5, Y + 0.85, -0.3, 1.2], [4.1, -1.5, Y + 0.3, -0.3, 1.2], [4.6, -1.5, Y + 0.85, -0.3, 1.2], [5.4, ...rest('pick')],         // 곁에 있는 다하에 옮겨 담아요
    [10.4, ...rest('pick')],
  ],
  // 탕관(끓는 물 주전자): 숙우에 끓는 물을 부어요
  kettle: [
    [0, ...rest('kettle')], [10.4, ...rest('kettle')], [11.0, -1.4, Y + 0.9, -0.9, -0.1], [11.5, -1.4, Y + 0.9, -0.9, -0.7], [12.7, -1.4, Y + 0.9, -0.9, -0.7], [13.4, ...rest('kettle')],
  ],
  // 숙우: 끓는 물을 식힌 뒤 다관에 붓고, 마지막에 남은 물을 퇴수기에 비워요
  pitcher: [
    [0, ...rest('pitcher')], [13.8, ...rest('pitcher')], [14.4, -0.8, Y + 1.0, 0.2, -0.05], [15.0, -0.8, Y + 1.0, 0.2, -0.6], [16.3, -0.8, Y + 1.0, 0.2, -0.6], [17.1, ...rest('pitcher')],
    [27.1, ...rest('pitcher')], [27.9, -0.2, Y + 0.85, -1.6, 0], [28.5, -0.2, Y + 0.85, -1.6, -0.6], [29.9, -0.2, Y + 0.85, -1.6, -0.6], [30.9, ...rest('pitcher')],
  ],
  teapot: [[0, ...rest('teapot')], [20.0, ...rest('teapot')], [20.7, 0.35, Y + 0.91, 0.2, -0.75], [22.1, 0.35, Y + 0.91, 0.2, -0.75], [22.9, ...rest('teapot')]],
  fair: [
    [0, ...rest('fair')], [23.0, ...rest('fair')], [23.5, 1.5, Y + 0.85, -0.15, -0.7], [24.7, 1.5, Y + 0.85, -0.15, -0.7],
    [25.1, 1.5, Y + 0.85, 0.55, -0.7], [26.3, 1.5, Y + 0.85, 0.55, -0.7], [27.0, ...rest('fair')],
  ],
  cup1: [[0, ...rest('cup1')]], cup2: [[0, ...rest('cup2')]], waste: [[0, ...rest('waste')]],
}

// 뚜껑의 움직임 [시각, 옆, 위, 앞, 기울기] — 모양 크기 기준, 닫혀 있을 때가 0
const LIDS = {
  canister: [[0, 0, 0, 0, 0], [0.4, 0, 0, 0, 0], [1.0, -0.95, 0.55, 0, 0.5], [4.8, -0.95, 0.55, 0, 0.5], [5.4, 0, 0, 0, 0]],
  teapot: [[0, 0, 0, 0, 0], [4.8, 0, 0, 0, 0], [5.5, 0.2, 0.95, -1.2, 0.5], [16.6, 0.2, 0.95, -1.2, 0.5], [17.4, 0, 0, 0, 0]],
}

// 물줄기: 시각 구간, 시작(주둥이 끝)을 가진 다구, 도착 위치, 색
const STREAMS = [
  { t0: 7.0, t1: 9.2, from: 'boat', to: [0, Y + 0.5, 0.2], h: 0.3, leaf: true },   // 찻잎(물줄기는 없고 정렬만)
  { t0: 11.5, t1: 12.7, from: 'kettle', to: [REST.pitcher[0], Y + 0.4, REST.pitcher[2]], h: 0.5, color: '#DCEFF7', w: 0.034 },   // 끓는 물 → 숙우
  { t0: 15.0, t1: 16.3, from: 'pitcher', to: [0, Y + 0.5, 0.2], h: 0.5, color: '#8EC4D8', w: 0.032 },                              // 식힌 물 → 다관
  { t0: 20.7, t1: 22.1, from: 'teapot', to: [1.3, Y + 0.32, 0.2], h: 0.5, color: '#C9D96A', w: 0.036 },
  { t0: 23.5, t1: 24.7, from: 'fair', to: [2.25, Y + 0.4, -0.15], h: 0.5, color: '#C9D96A', w: 0.03 },
  { t0: 25.1, t1: 26.3, from: 'fair', to: [2.25, Y + 0.4, 0.55], h: 0.5, color: '#C9D96A', w: 0.03 },
  { t0: 28.5, t1: 29.9, from: 'pitcher', to: [0.55, Y + 0.4, -1.6], h: 0.5, color: '#8EC4D8', w: 0.032 },
]
const LEAF_DROPS = 24
// 차시가 다하 위를 두 번 쓸어요: [시작, 끝] (초)
const STROKES = [[7.0, 7.9], [8.3, 9.0]]
const dropStart = (j) => (j < 12 ? 7.1 + j * 0.07 : 8.4 + (j - 12) * 0.05)

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const ease = (x) => x * x * (3 - 2 * x)
function sample(frames, t) {
  if (t <= frames[0][0]) return frames[0].slice(1)
  for (let i = 0; i < frames.length - 1; i++) {
    const [t0, ...a] = frames[i]
    const [t1, ...b] = frames[i + 1]
    if (t < t1) { const k = ease((t - t0) / (t1 - t0)); return a.map((v, j) => v + (b[j] - v) * k) }
  }
  return frames[frames.length - 1].slice(1)
}

// 모양을 크기에 맞춰 줄이고, 바닥이 쟁반에 닿도록 높이를 맞춰요
function Piece({ id, setRef }) {
  const outer = useRef()
  const shift = useRef()
  const lid = useRef()
  const leaves = useRef()
  const s = SCALE[id]
  useLayoutEffect(() => {
    const o = outer.current
    setRef(id, o, { lid, leaves })
    // 재는 동안만 원점에 두어요 (다시 재도 움직이던 위치가 섞이지 않게)
    const keepPos = o.position.clone()
    const keepRot = o.rotation.clone()
    o.position.set(0, 0, 0)
    o.rotation.set(0, 0, 0)
    shift.current.position.y = 0
    o.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(shift.current)
    shift.current.position.y = -box.min.y / s

    // 따르는 곳(주둥이 끝) = 모양에서 가장 옆으로 튀어나온 점. 직접 재서 물줄기가 정확히 나오게 해요.
    if (id in SPOUT_OF) {
      outer.current.updateMatrixWorld(true)
      const v = new THREE.Vector3()
      let best = null
      let back = null
      shift.current.traverse((o) => {
        if (!o.isMesh || !o.geometry.attributes.position) return
        for (let p = o.parent; p && p !== shift.current; p = p.parent) if (p.userData.noTip) return   // 막대처럼 따르는 곳이 아닌 부분은 빼요
        const pos = o.geometry.attributes.position
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld)
          if (!best || v.x > best.x) best = v.clone()
          if (!back || v.x < back.x) back = v.clone()
        }
      })
      if (best) SPOUT_OF[id] = [best.x / s, best.y / s]
      if (back && id in BACK_OF) BACK_OF[id] = [back.x / s, back.y / s]
    }
    o.position.copy(keepPos)
    o.rotation.copy(keepRot)
    o.updateMatrixWorld(true)
  }, [id, s, setRef])
  return (
    <group ref={outer} scale={s}>
      <group ref={shift}><Model kind={KIND[id]} lidRef={lid} leavesRef={leaves} /></group>
    </group>
  )
}

// 다구의 한 점(모양 기준 [옆, 위])이 지금 자세에서 있는 곳
const point = (id, [ox, oy], pose) => {
  const [x, y, z, rz] = pose
  const c = Math.cos(rz), sn = Math.sin(rz), s = SCALE[id]
  return new THREE.Vector3(x + (ox * c - oy * sn) * s, y + (ox * sn + oy * c) * s, z)
}
const tip = (id, pose) => point(id, SPOUT_OF[id], pose)

// 차시가 다하 위를 쓸 때의 위치(0~1: 다하의 뒤쪽 끝에서 앞쪽 끝까지)와 들어 올린 정도
function sweepAt(t) {
  const [a0, a1] = STROKES[0]
  const [b0, b1] = STROKES[1]
  if (t < a0) return { f: 0.1, lift: 0.35 * (1 - ease(clamp01((t - (a0 - 0.5)) / 0.5))) }
  if (t <= a1) return { f: 0.1 + 0.8 * ease((t - a0) / (a1 - a0)), lift: 0 }
  if (t < b0) { const k = ease((t - a1) / (b0 - a1)); return { f: 0.9 - 0.8 * k, lift: 0.35 * Math.sin(Math.PI * k) } }
  if (t <= b1) return { f: 0.1 + 0.8 * ease((t - b0) / (b1 - b0)), lift: 0 }
  return { f: 0.9, lift: 0.35 * ease(clamp01((t - b1) / 0.4)) }
}

// 화면이 좁을수록 카메라를 뒤로 빼서 쟁반 전체가 보이게 해요
function FitCamera() {
  const camera = useThree((st) => st.camera)
  const { width, height } = useThree((st) => st.size)
  useLayoutEffect(() => {
    const f = Math.min(2.4, Math.max(1, 1.65 / (width / height)))
    camera.position.set(0, 3.9 * f, 4.9 * f)
    camera.lookAt(0.3, 0.4, 0)
  }, [camera, width, height])
  return null
}

const UP = new THREE.Vector3(0, 1, 0)

function World({ onStep }) {
  const refs = useRef({})
  const extras = useRef({})
  const streams = useRef([])
  const rings = useRef([])
  const drops = useRef([])
  const steam = useRef([])
  const coolSteam = useRef([])
  const fill = useRef([])
  const lastStep = useRef(-1)
  const setRef = useCallback((id, o, ex) => { refs.current[id] = o; extras.current[id] = ex }, [])

  useFrame((_, dt) => {
    if (clock.playing) clock.t = (clock.t + Math.min(dt, 0.05)) % BREW_TOTAL
    const t = clock.t

    // 다구 자세
    const poses = {}
    for (const id of Object.keys(REST)) {
      const p = sample(FRAMES[id], t)
      poses[id] = p
    }
    // 다하는 한 번만 기울이고, 그동안 차시가 위를 쓸어요 (차시가 따라오는 정도)
    const sweepW = ease(clamp01((t - 6.6) / 0.7)) * (1 - ease(clamp01((t - 9.4) / 0.8)))
    // 따르는 동안에는 주둥이 끝이 받는 곳 바로 위에 오도록 다구를 옮겨 줘요 (들어 올리고 내려놓는 것도 부드럽게)
    for (const st of STREAMS) {
      const h = ease(clamp01((t - (st.t0 - 0.7)) / 0.7)) * (1 - ease(clamp01((t - st.t1) / 0.6)))
      if (h < 0.001) continue
      const p = poses[st.from]
      const a = tip(st.from, p)
      p[0] += (st.to[0] - a.x) * h
      p[1] += (st.to[1] + st.h - a.y) * h
      p[2] += (st.to[2] - a.z) * h
    }
    // 차시는 다하와 함께 움직여요: 다하의 뒤쪽 끝에서 앞쪽 끝까지 위를 쓸어 찻잎을 다관으로 밀어 넣어요
    const w = sweepW
    if (w > 0.001) {
      const bp = poses.boat
      const back = point('boat', BACK_OF.boat, bp)
      const front = tip('boat', bp)
      const { f, lift } = sweepAt(t)
      const head = back.clone().lerp(front, f)
      const rel = [head.x, head.y + 0.08 + lift, head.z, 1.9 + bp[3]]
      const base = poses.pick
      poses.pick = base.map((v, i) => v + (rel[i] - v) * w)
    }
    for (const id of Object.keys(REST)) {
      const p = poses[id]
      const o = refs.current[id]
      if (o) { o.position.set(p[0], p[1], p[2]); o.rotation.z = p[3] }
    }

    // 뚜껑 열고 닫기
    for (const id of Object.keys(LIDS)) {
      const lid = extras.current[id]?.lid.current
      if (!lid) continue
      const [dx, dy, dz, rz] = sample(LIDS[id], t)
      const b = lid.userData.base
      lid.position.set(b[0] + dx, b[1] + dy, b[2] + dz)
      lid.rotation.set(0, 0, rz)
    }

    // 차시 끝에 묻은 찻잎: 차통 속에서 묻어나서(2.0~2.4초) 다하 위에서 떨어져요(4.0~4.4초)
    const clump = extras.current.pick?.leaves.current
    if (clump) {
      const k = t < 3.9 ? clamp01((t - 2.0) / 0.4) : clamp01(1 - (t - 4.0) / 0.4)
      clump.children.forEach((c) => { c.userData.s ??= c.scale.x; c.scale.setScalar(c.userData.s * k) })
    }
    // 다하 속 찻잎: 차시가 옮겨 담고(4.1초~), 두 번 쓸어낼 때 하나씩 사라져요
    const boat = extras.current.boat?.leaves.current
    if (boat) {
      const n = boat.children.length
      boat.children.forEach((c, i) => {
        c.userData.s ??= c.scale.x
        const f = i / n
        const tv = f < 0.5 ? 7.1 + f * 1.6 : 8.4 + (f - 0.5) * 1.2
        const k = t < 6.8 ? clamp01((t - 4.1 - f * 0.5) / 0.3) : clamp01(1 - (t - tv) / 0.3)
        c.scale.setScalar(c.userData.s * k)
      })
    }
    // 다관으로 떨어지는 찻잎
    const sp = tip('boat', poses.boat)
    drops.current.forEach((m, j) => {
      if (!m) return
      const p = (t - dropStart(j)) / 0.5
      m.visible = p >= 0 && p <= 1
      if (!m.visible) return
      const e = p * p   // 중력처럼 점점 빨라지게
      m.position.set(sp.x * (1 - p) + Math.sin(j * 5) * 0.05, sp.y - e * (sp.y - (Y + 0.5)), sp.z + Math.cos(j * 3) * 0.05)
      m.rotation.set(p * 5 + j, p * 3, j)
    })

    // 물줄기: 주둥이 끝에서 아래로 길게 자라나고, 끝나면 위쪽부터 줄어들어요
    STREAMS.forEach((st, i) => {
      const m = streams.current[i]
      const ring = rings.current[i]
      if (!m || !ring || st.leaf) return
      const grow = ease(clamp01((t - st.t0) / 0.4))
      const shrink = ease(clamp01((t - st.t1) / 0.4))
      const a = tip(st.from, poses[st.from])
      const g = new THREE.Vector3(...st.to)
      const top = a.clone().lerp(g, shrink)
      const bot = a.clone().lerp(g, grow)
      const len = top.distanceTo(bot)
      const on = t >= st.t0 && t <= st.t1 + 0.4 && len > 0.01
      m.visible = on
      ring.visible = on && grow > 0.9 && shrink < 0.6
      if (!on) return
      m.position.copy(top).add(bot).multiplyScalar(0.5)
      m.quaternion.setFromUnitVectors(UP, top.clone().sub(bot).normalize())
      m.scale.set(1, len, 1)
      if (ring.visible) {
        ring.position.set(g.x, g.y + 0.01, g.z)
        const pulse = 1 + 0.25 * Math.sin(t * 14)
        ring.scale.set(pulse, pulse, pulse)
        ring.material.opacity = 0.55 * (1 - shrink)
      }
    })

    // 숙우 위로 오르는 김: 끓는 물을 부으면 피어오르다가 식으면서 옅어져요
    coolSteam.current.forEach((m, i) => {
      if (!m) return
      const on = t >= 11.8 && t <= 14.6
      m.visible = on
      if (!on) return
      const k = ((t * 0.55 + i / 3) % 1)
      const fade = 1 - clamp01((t - 11.8) / 2.8) * 0.85
      m.position.set(REST.pitcher[0] + (i - 1) * 0.1 + Math.sin(t * 1.3 + i) * 0.04, Y + 0.55 + k * 0.6, REST.pitcher[2])
      m.material.opacity = Math.sin(Math.PI * k) * 0.5 * fade
    })

    // 다관 위로 오르는 김 (④ 우리는 동안)
    steam.current.forEach((m, i) => {
      if (!m) return
      const on = t >= 17.3 && t <= 20.1
      m.visible = on
      if (!on) return
      const k = ((t * 0.5 + i / 3) % 1)
      m.position.set(REST.teapot[0] + (i - 1) * 0.12 + Math.sin(t + i) * 0.05, Y + 0.75 + k * 0.7, REST.teapot[2])
      m.material.opacity = Math.sin(Math.PI * k) * 0.45
    })

    // 잔에 차가 차오르는 높이
    const fl = [(t - 23.5) / 1.2, (t - 25.1) / 1.2]
    fill.current.forEach((m, i) => {
      if (!m) return
      const k = t >= 31.0 ? 0 : clamp01(fl[i])
      m.visible = k > 0
      m.position.y = Y + 0.1 + k * 0.28
    })

    const step = stepAt(t)
    if (step !== lastStep.current) { lastStep.current = step; onStep(step) }
  })

  return (
    <group>
      {/* 다반(둥근 쟁반) */}
      <group scale={1.85}><Lathe points={TRAY} color={WOOD} /></group>
      {Object.keys(REST).map((id) => <Piece key={id} id={id} setRef={setRef} />)}

      {STREAMS.map((st, i) => st.leaf ? null : (
        <group key={i}>
          <mesh ref={(m) => { streams.current[i] = m }} visible={false}>
            <cylinderGeometry args={[st.w, st.w * 0.6, 1, 10]} /><meshBasicMaterial color={st.color} />
          </mesh>
          <mesh ref={(m) => { rings.current[i] = m }} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.07, 0.13, 24]} /><meshBasicMaterial color={st.color} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: LEAF_DROPS }, (_, j) => (
        <mesh key={`d${j}`} ref={(m) => { drops.current[j] = m }} visible={false}>
          <capsuleGeometry args={[0.012, 0.07, 3, 6]} /><Paint color={j % 2 ? '#3B2B1F' : '#4A3626'} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={`c${i}`} ref={(m) => { coolSteam.current[i] = m }} visible={false}>
          <sphereGeometry args={[0.09, 12, 10]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={`s${i}`} ref={(m) => { steam.current[i] = m }} visible={false}>
          <sphereGeometry args={[0.1, 12, 10]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
        </mesh>
      ))}
      {['cup1', 'cup2'].map((id, i) => (
        <mesh key={`f${id}`} ref={(m) => { fill.current[i] = m }} visible={false} position={[REST[id][0], Y + 0.1, REST[id][2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.25, 24]} /><Paint color="#C8D870" />
        </mesh>
      ))}
    </group>
  )
}

// 차 우리기 3D 장면: 시간(clock.t)에 따라 다구들이 차례로 움직여요
export default function BrewScene({ onStep, height = 420 }) {
  return (
    <div className="dd-3d">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="dd-paint"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="8" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="3" /></filter>
      </svg>
      <Canvas camera={{ position: [0, 3.9, 4.9], fov: 38 }} style={{ height }}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 6, 4]} intensity={2.0} color="#fff0d6" />
        <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#cfe0e6" />
        <FitCamera />
        <World onStep={onStep} />
        <ContactShadows position={[0, 0.02, 0]} opacity={0.35} scale={9} blur={2.6} far={2.2} color="#6B5444" />
        <OrbitControls target={[0.3, 0.4, 0]} enablePan={false} minDistance={3.5} maxDistance={11} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  )
}












