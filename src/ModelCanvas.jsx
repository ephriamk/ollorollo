import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, useFBX, useAnimations, Center, Environment, Stars, Text3D } from '@react-three/drei'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useControls } from 'leva'

/**
 * Expects:
 *   public/model/character.glb
 *   public/model/dance.fbx
 */

function AnimatedCharacter({ onReady }) {
  const groupRef = useRef()
  const readySignaledRef = useRef(false)

  // 1) Load assets
  const gltf = useGLTF('/model/character.glb')
  const fbx = useFBX('/model/dance.fbx')

  // 2) Clone to avoid mutating cached scenes
  const target = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene])
  const source = useMemo(() => SkeletonUtils.clone(fbx), [fbx])

  // 3) Mixamo FBX comes in centimeters -> normalize
  useEffect(() => {
    if (!source) return
    source.scale.setScalar(0.01)
    source.updateMatrixWorld(true)
  }, [source])

  // 4) Helpers
  const findBones = (root) => {
    const bones = []
    root?.traverse?.((o) => { if (o.isBone) bones.push(o) })
    return bones
  }

  const sanitize = (name) =>
    String(name || '')
      .toLowerCase()
      .replace(/^mixamorig/gi, '')
      .replace(/^armature/gi, '')
      .replace(/^beta:/gi, '')
      .replace(/[^a-z0-9]/g, '')

  // 5) Build tolerant bone-name map (FBX -> GLB)
  const nameMap = useMemo(() => {
    const srcBones = findBones(source)
    const dstBones = findBones(target)
    const dstBySan = new Map(dstBones.map((b) => [sanitize(b.name), b.name]))
    const map = {}

    for (const sb of srcBones) {
      const key = sanitize(sb.name)
      if (dstBySan.has(key)) {
        map[sb.name] = dstBySan.get(key)
        continue
      }
      // Fuzzy fallback (ends-with either way)
      const candidate = [...dstBySan.keys()].find((k) => k.endsWith(key) || key.endsWith(k))
      if (candidate) map[sb.name] = dstBySan.get(candidate)
    }

    // Ensure hips/root gets a mapping (common failure point)
    const hipsKeys = ['hips', 'pelvis', 'root']
    const dstKeys = [...dstBySan.keys()]
    const dstVals = [...dstBySan.values()]
    const hasHips = Object.values(map).some((v) => sanitize(v) === 'hips')
    if (!hasHips) {
      const found = dstKeys.find((k) => hipsKeys.some((h) => k.includes(h)))
      if (found) {
        // Map any source hips-like bone to dest hips
        const srcHips = srcBones.find((b) => hipsKeys.some((h) => sanitize(b.name).includes(h)))
        if (srcHips) map[srcHips.name] = dstBySan.get(found)
      }
    }

    return map
  }, [source, target])

  // 6) If GLB has no bones, just play FBX directly
  const targetBoneCount = useMemo(() => findBones(target).length, [target])
  const noTargetBones = targetBoneCount === 0

  if (noTargetBones) {
    const fbxGroupRef = useRef()
    const { actions: fbxActions, names: fbxNames, mixer: fbxMixer } = useAnimations(fbx.animations || [], fbxGroupRef)

    useEffect(() => {
      source?.traverse?.((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })
    }, [source])

    useEffect(() => {
      const first = fbxNames?.[0] ? fbxActions[fbxNames[0]] : Object.values(fbxActions ?? {})[0]
      if (first) first.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.3).play()
      return () => { try { first?.fadeOut(0.2).stop() } catch {}; fbxMixer?.stopAllAction() }
    }, [fbxActions, fbxNames, fbxMixer])

    return (
      <group ref={fbxGroupRef}>
        <primitive object={source} />
      </group>
    )
  }

  // 7) Retarget FBX clips to GLB rig
  const retargetedClips = useMemo(() => {
    const inputClips = fbx.animations || []
    if (!inputClips.length) {
      console.warn('[ModelCanvas] No animations found in FBX. Double-check /model/dance.fbx.')
      return []
    }
    const out = inputClips.map((clip) => {
      try {
        // Retarget onto GLB skeleton
        const c = SkeletonUtils.retargetClip(target, source, clip, { names: nameMap })
        // Optional: tiny cleanups
        c.optimize()
        return c
      } catch (err) {
        console.warn('[ModelCanvas] retargetClip failed for a clip:', err)
        return null
      }
    }).filter(Boolean)

    if (!out.length) {
      console.warn('[ModelCanvas] Retargeting produced 0 clips. Bone name mismatches likely.')
    }
    return out
  }, [fbx.animations, source, target, nameMap])

  // 8) Fallback to GLB’s own animations if retargeting fails
  const clips = retargetedClips.length > 0 ? retargetedClips : (gltf.animations ?? [])
  if (retargetedClips.length === 0 && (gltf.animations?.length ?? 0) > 0) {
    console.info('[ModelCanvas] Using GLB animations as fallback (no retargeted clips).')
  }

  // 9) Create actions
  const { actions, names, mixer } = useAnimations(clips, groupRef)

  // 10) Auto-play the first available animation
  useEffect(() => {
    const firstName = names?.[0]
    const firstAction = (firstName && actions[firstName]) || Object.values(actions ?? {})[0]

    if (!firstAction) {
      console.warn('[ModelCanvas] No animation action to play. Check clips & bone mapping.')
      return
    }

    firstAction.reset()
    firstAction.setLoop(THREE.LoopRepeat, Infinity)
    firstAction.clampWhenFinished = false
    firstAction.fadeIn(0.35).play()

    // Optional: tweak global speed
    // mixer.timeScale = 1.0

    return () => {
      try {
        firstAction.fadeOut(0.25).stop()
        mixer?.stopAllAction()
      } catch {}
    }
  }, [actions, names, mixer])

  // 11) Shadows and quick material sanity
  useEffect(() => {
    if (!target) return
    target.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
        // If your export has odd materials you can coerce to Standard:
        // if (!(o.material instanceof THREE.MeshStandardMaterial)) {
        //   o.material = new THREE.MeshStandardMaterial({ map: o.material.map, color: o.material.color })
        // }
      }
    })
  }, [target])

  // Optional: face camera
  useEffect(() => {
    if (!target) return
    target.rotation.y = Math.PI
  }, [target])

  // Debug
  useEffect(() => {
    console.debug('[ModelCanvas] FBX clips:', fbx.animations?.map(c => c.name))
    console.debug('[ModelCanvas] Retargeted clips:', retargetedClips.map(c => c.name))
    console.debug('[ModelCanvas] GLB clips:', gltf.animations?.map(c => c.name))
  }, [fbx.animations, retargetedClips, gltf.animations])

  useFrame(() => {
    if (!readySignaledRef.current && groupRef.current) {
      readySignaledRef.current = true
      try {
        const box = new THREE.Box3().setFromObject(groupRef.current)
        const size = new THREE.Vector3()
        const center = new THREE.Vector3()
        box.getSize(size)
        box.getCenter(center)
        onReady?.({ size, center })
      } catch {
        try { onReady?.() } catch {}
      }
    }
  })

  return <group ref={groupRef}><primitive object={target} /></group>
}

useGLTF.preload('/model/character.glb')
useFBX.preload('/model/dance.fbx')

// Camera controller component that works inside Canvas
function CameraController() {
  const { camera, controls } = useThree()
  
  const cameraControls = useControls('Camera', {
    positionX: { value: 0.0, min: -10, max: 10, step: 0.1 },
    positionY: { value: 5.8, min: -5, max: 10, step: 0.1 },
    positionZ: { value: 12.9, min: 1, max: 15, step: 0.1 },
    targetX: { value: 0.4, min: -5, max: 5, step: 0.1 },
    targetY: { value: -0.9, min: -5, max: 5, step: 0.1 },
    targetZ: { value: 0.0, min: -5, max: 5, step: 0.1 },
    fov: { value: 45, min: 10, max: 120, step: 1 }
  })

  useEffect(() => {
    camera.position.set(cameraControls.positionX, cameraControls.positionY, cameraControls.positionZ)
    camera.fov = cameraControls.fov
    camera.updateProjectionMatrix()
  }, [camera, cameraControls.positionX, cameraControls.positionY, cameraControls.positionZ, cameraControls.fov])

  useEffect(() => {
    if (controls) {
      controls.target.set(cameraControls.targetX, cameraControls.targetY, cameraControls.targetZ)
      controls.update()
    }
  }, [controls, cameraControls.targetX, cameraControls.targetY, cameraControls.targetZ])

  return null
}

export default function ModelCanvas({ onModelReady, isMusicPlaying = false }) {
  return (
    <Canvas 
      camera={{ position: [0.0, 5.8, 12.9], fov: 45 }} 
      shadows
    >
      <CameraController />
      
      <color attach="background" args={['#02030f']} />

      {/* Key light with soft shadows */}
      <spotLight
        position={[6, 10, 6]}
        angle={0.35}
        penumbra={0.8}
        intensity={2.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Fill and rim lights */}
      <directionalLight position={[-6, 4, 2]} intensity={0.6} />
      <directionalLight position={[2, 3, -6]} intensity={0.5} />
      <directionalLight position={[0, 3, -5]} intensity={0.8} color="#99ccff" />

      {/* Soft ambient from sky/ground */}
      <hemisphereLight color="#4455ff" groundColor="#0b0b10" intensity={0.45} />

      {/* Accent points for galaxy vibe */}
      <pointLight position={[-3, 1.5, 2]} intensity={1.2} distance={12} decay={2} color="#7aa2ff" />
      <pointLight position={[3, 2, -1]} intensity={1.1} distance={12} decay={2} color="#ff7ad9" />

      {/* Image-based lighting */}
      <Environment preset="night" intensity={1.0} />

                        <Suspense fallback={null}>
                    <Center position={[0, 0, 1]}>
                      <AnimatedCharacter onReady={() => onModelReady?.()} />
                    </Center>

                            {/* 3D title above the character (excluded from Bounds so it doesn't affect framing) */}
                    <Center position={[0, 2.2, 0]}>
                      <group>
                        <Text3D
                          font={"/song/DarkNet_Regular.json"}
                          size={0.6}
                          height={0.12}
                          curveSegments={16}
                          bevelEnabled
                          bevelThickness={0.03}
                          bevelSize={0.015}
                          bevelSegments={2}
                          letterSpacing={-0.02}
                          lineHeight={0.8}
                        >
                          Ollo{'\n'}CoPilot{'\n'}Companion
                          <meshStandardMaterial 
                            color={isMusicPlaying ? "#ff6b6b" : "#ffffff"} 
                            emissive={isMusicPlaying ? "#ff8e53" : "#66ccff"} 
                            emissiveIntensity={isMusicPlaying ? 3.0 : 2.2} 
                          />
                        </Text3D>
                        {/* Faux glow layer */}
                        <Text3D
                          font={"/song/DarkNet_Regular.json"}
                          size={0.6}
                          height={0.12}
                          curveSegments={16}
                          bevelEnabled
                          bevelThickness={0.03}
                          bevelSize={0.015}
                          bevelSegments={2}
                          letterSpacing={-0.02}
                          lineHeight={0.8}
                          scale={[1.035, 1.035, 1.035]}
                        >
                          Ollo{'\n'}CoPilot{'\n'}Companion
                          <meshBasicMaterial 
                            color={isMusicPlaying ? "#ff8e53" : "#66ccff"} 
                            transparent 
                            opacity={isMusicPlaying ? 0.4 : 0.28} 
                            blending={THREE.AdditiveBlending} 
                            depthWrite={false} 
                          />
                        </Text3D>
                      </group>
                    </Center>

        {/* Background stars */}
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

      <OrbitControls 
        enableDamping 
        makeDefault 
        target={[0.4, -0.9, 0.0]}
      />
    </Canvas>
  )
}
