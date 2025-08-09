import './index.css'
import ModelCanvas from './ModelCanvas'
import ChatBot from './ChatBot'
import AudioPlayer from './AudioPlayer'
import TopRightInfo from './TopRightInfo'
import { useProgress } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'

function GlobalLoaderOverlay({ progress, show }) {
  const pct = Math.floor(progress)
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, rgba(2,3,15,0.9), rgba(2,3,15,0.8))',
      pointerEvents: show ? 'all' : 'none',
      opacity: show ? 1 : 0,
      transition: 'opacity 300ms ease-out'
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.55)',
        padding: '22px 24px',
        borderRadius: 14,
        color: 'white',
        minWidth: 320,
        textAlign: 'center',
        boxShadow: '0 8px 30px rgba(0,0,0,0.45)'
      }}>
        <div style={{
          fontWeight: 800,
          letterSpacing: '0.08em',
          marginBottom: 14,
          fontSize: 18
        }}>Ollo is Booting up</div>
        <div style={{
          display: 'inline-block',
          position: 'relative',
          width: 280,
          height: 42,
          borderRadius: 8,
          border: '2px solid rgba(255,255,255,0.9)',
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #22c55e, #86efac)',
            transition: 'width 0.2s ease-out'
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 10px, transparent 10px, transparent 20px)'
          }} />
          <div style={{
            position: 'absolute',
            right: -10,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 10,
            height: 18,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.9)'
          }} />
        </div>
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>{pct}%</div>
      </div>
    </div>
  )
}

export default function App() {
  const { progress, active } = useProgress()
  const isAssetsLoaded = useMemo(() => progress >= 100, [progress])
  const [modelReady, setModelReady] = useState(false)
  const [graceDone, setGraceDone] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)

  useEffect(() => {
    if (isAssetsLoaded && modelReady) {
      const t = setTimeout(() => setGraceDone(true), 300)
      return () => clearTimeout(t)
    }
    setGraceDone(false)
  }, [isAssetsLoaded, modelReady])

  // Fallback: if assets are at 100% for a while but modelReady didn't fire, proceed anyway
  useEffect(() => {
    if (!isAssetsLoaded || modelReady) return
    const t = setTimeout(() => {
      setModelReady(true)
    }, 1200)
    return () => clearTimeout(t)
  }, [isAssetsLoaded, modelReady])

  const showLoader = !(isAssetsLoaded && modelReady && graceDone)
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Title moved into 3D scene using Text3D, so remove 2D overlay title */}
      </div>
      <ModelCanvas onModelReady={() => setModelReady(true)} isMusicPlaying={isMusicPlaying} />
      <TopRightInfo />
      <ChatBot />
      <AudioPlayer isPlaying={isMusicPlaying} onPlayingChange={setIsMusicPlaying} />
      <GlobalLoaderOverlay progress={progress} show={showLoader} />
    </div>
  )
}
