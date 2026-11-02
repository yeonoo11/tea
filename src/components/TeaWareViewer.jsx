import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Model } from './WareModels'

// 마우스로 돌려 볼 수 있는 3D 다구 (가만히 두면 천천히 돌아요)
export default function TeaWareViewer({ kind, height = 320 }) {
  return (
    <div className="dd-3d">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="dd-paint"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="8" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="3" /></filter>
      </svg>
    <Canvas camera={{ position: [0, 1.3, 4.2], fov: 45 }} style={{ height }}>
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 5, 4]} intensity={2.0} color="#fff0d6" />
      <directionalLight position={[-3, 1, -2]} intensity={0.35} color="#cfe0e6" />
      <ContactShadows position={[0, -0.6, 0]} opacity={0.4} scale={7} blur={2.6} far={2.2} color="#6B5444" />
      <Model kind={kind} />
      <OrbitControls autoRotate autoRotateSpeed={2} enablePan={false} minDistance={2} maxDistance={7} />
    </Canvas>
    </div>
  )
}







