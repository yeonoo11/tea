import * as THREE from 'three'

// 3단계로 부드럽게 끊어지는 명암: 그림자가 진하지 않고 물감이 번진 듯한 느낌
const shades = new Uint8Array([120, 170, 218, 255])
export const ramp = new THREE.DataTexture(shades, shades.length, 1, THREE.RedFormat)
ramp.minFilter = THREE.NearestFilter
ramp.magFilter = THREE.NearestFilter
ramp.needsUpdate = true

