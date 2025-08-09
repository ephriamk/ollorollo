import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, useFBX, useAnimations, Center, Environment, Stars } from '@react-three/drei'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

function AnimatedCharacter() {
  const groupRef = useRef()
  const gltf = useGLTF('/model/character.glb')
  const fbx = useFBX('/model/dance.fbx')

  const target = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene])
  const source = useMemo(() => SkeletonUtils.clone(fbx), [fbx])

  // Normalize FBX scale (Mixamo exports in centimeters)
  useEffect(() => {
    if (!source) return
    source.scale.setScalar(0.01)
    source.updateMatrixWorld(true)
  }, [source])

  // Build a tolerant bone name map between FBX (source) and GLB (target)
  const findBones = (root) => {
    const bones = []
    root.traverse((o) => { if (o.isBone) bones.push(o) })
    return bones
  }
  const sanitize = (name) => String(name)
    .toLowerCase()
    .replace(/^mixamorig/gi, '')
    .replace(/^armature/gi, '')
    .replace(/^beta:/gi, '')
    .replace(/[^a-z]/g, '')

  const nameMap = useMemo(() => {
    const srcBones = findBones(source)
    const dstBones = findBones(target)
    const dstBySan = new Map(dstBones.map((b) => [sanitize(b.name), b.name]))
    const map = {}
    for (const sb of srcBones) {
      const key = sanitize(sb.name)
      if (dstBySan.has(key)) { map[sb.name] = dstBySan.get(key); continue }
      const candidate = [...dstBySan.keys()].find((k) => k.endsWith(key) || key.endsWith(k))
      if (candidate) map[sb.name] = dstBySan.get(candidate)
    }
    return map
  }, [source, target])

  // Retarget FBX clips onto GLB target
  const clips = useMemo(() => {
    if (!fbx.animations || fbx.animations.length === 0) return []
    return fbx.animations.map((clip) => {
      try {
        return SkeletonUtils.retargetClip(target, source, clip, { names: nameMap })
      } catch {
        return null
      }
    }).filter(Boolean)
  }, [fbx.animations, source, target, nameMap])

  const { actions, names } = useAnimations(clips, groupRef)

  useEffect(() => {
    const first = names && names.length > 0 ? actions[names[0]] : Object.values(actions ?? {})[0]
    if (first) first.reset().fadeIn(0.3).play()
    return () => { if (first) first.fadeOut(0.2).stop() }
  }, [actions, names])

  // Enable shadows on the target hierarchy
  useEffect(() => {
    if (!target) return
    target.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
  }, [target])

  return (
    <group ref={groupRef}>
      <primitive object={target} />
    </group>
  )
}

useGLTF.preload('/model/character.glb')
useFBX.preload('/model/dance.fbx')

export default function ModelCanvas() {
  return (
    <Canvas camera={{ position: [0, 1.2, 3.5], fov: 45 }} shadows>
      <color attach="background" args={["#02030f"]} />

      {/* Key light with soft shadows */}
      <spotLight
        position={[6, 10, 6]}
        angle={0.35}
        penumbra={0.8}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Fill and rim lights */}
      <directionalLight position={[-6, 4, 2]} intensity={0.6} />
      <directionalLight position={[2, 3, -6]} intensity={0.5} />

      {/* Image-based lighting for glossy materials */}
      <Environment preset="night" environmentIntensity={0.8} />

      <Suspense fallback={null}>
        <Center>
          <AnimatedCharacter />
        </Center>
        {/* Starfield to evoke a galaxy backdrop */}
        <Stars
          radius={120}
          depth={80}
          count={6000}
          factor={4}
          saturation={0}
          fade
          speed={0.25}
        />
      </Suspense>

      <OrbitControls enableDamping makeDefault />
    </Canvas>
  )
}


