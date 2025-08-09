import { useEffect, useRef, useState } from 'react'

const playlist = [
  { src: '/song/Ollo the Botto.mp3', title: 'Ollo the Botto' },
  { src: '/song/Ollo the Robot.mp3', title: 'Ollo the Robot' },
]

export default function AudioPlayer() {
  const audioRef = useRef(null)
  const [trackIndex, setTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [needsInteraction, setNeedsInteraction] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const current = playlist[trackIndex]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = current.src
    audio.muted = isMuted
    audio.currentTime = 0
    if (isPlaying) {
      audio.play().catch(() => setNeedsInteraction(true))
    }
  }, [trackIndex])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = isMuted
  }, [isMuted])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch(() => setNeedsInteraction(true))
    } else {
      audio.pause()
    }
  }, [isPlaying])

  const onEnded = () => {
    if (trackIndex < playlist.length - 1) {
      setTrackIndex((i) => i + 1)
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
    }
  }

  const onUserEnableAudio = async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
      await audio.play()
      setIsPlaying(true)
      setNeedsInteraction(false)
    } catch {
      // remain disabled
    }
  }

  const togglePlay = () => setIsPlaying((p) => !p)
  const stop = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setIsPlaying(false)
  }
  const toggleMute = () => setIsMuted((m) => !m)

  const next = () => setTrackIndex((i) => (i + 1) % playlist.length)
  const prev = () => {
    const audio = audioRef.current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    setTrackIndex((i) => (i - 1 + playlist.length) % playlist.length)
  }

  // time tracking
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onLoaded = () => setDuration(audio.duration || 0)
    const onTime = () => setCurrentTime(audio.currentTime || 0)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('timeupdate', onTime)
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('timeupdate', onTime)
    }
  }, [])

  const onSeek = (e) => {
    const audio = audioRef.current
    if (!audio) return
    const t = Number(e.target.value)
    audio.currentTime = isFinite(t) ? t : 0
    setCurrentTime(audio.currentTime)
  }

  const fmt = (s) => {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const ss = Math.floor(s % 60)
    return `${m}:${ss.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ position: 'fixed', left: 18, bottom: 18, zIndex: 45 }}>
      <div
        style={{
          background: 'rgba(10,10,14,0.7)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: 12,
          width: 340,
          color: 'white',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontWeight: 700, letterSpacing: '0.06em' }}>{current.title}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{trackIndex + 1} / {playlist.length}</div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 42, textAlign: 'right', fontSize: 12, opacity: 0.8 }}>{fmt(currentTime)}</div>
          <input
            type="range"
            min={0}
            max={isFinite(duration) && duration > 0 ? duration : 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={onSeek}
            style={{ flex: 1 }}
          />
          <div style={{ width: 42, fontSize: 12, opacity: 0.8 }}>{fmt(duration)}</div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={prev}
            style={{
              flexShrink: 0,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              cursor: 'pointer',
              minWidth: 56,
            }}
          >
            Prev
          </button>
          <button
            onClick={togglePlay}
            style={{
              flexShrink: 0,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              cursor: 'pointer',
              minWidth: 72,
            }}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={stop}
            style={{
              flexShrink: 0,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              cursor: 'pointer',
              minWidth: 56,
            }}
          >
            Stop
          </button>
          <button
            onClick={next}
            style={{
              flexShrink: 0,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              cursor: 'pointer',
              minWidth: 56,
            }}
          >
            Next
          </button>
          <button
            onClick={toggleMute}
            style={{
              flexShrink: 0,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              cursor: 'pointer',
              minWidth: 72,
            }}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>

        {/* Track list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {playlist.map((t, idx) => (
            <button
              key={t.src}
              onClick={() => { setTrackIndex(idx); setIsPlaying(true) }}
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                borderRadius: 10,
                border: idx === trackIndex ? '1px solid #8ab4ff' : '1px solid rgba(255,255,255,0.12)',
                background: idx === trackIndex ? 'rgba(138,180,255,0.15)' : 'rgba(255,255,255,0.06)',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              {idx + 1}. {t.title}
            </button>
          ))}
        </div>
        {needsInteraction && (
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
            Autoplay blocked. Click
            <button
              onClick={onUserEnableAudio}
              style={{
                marginLeft: 8,
                padding: '6px 8px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Enable Audio
            </button>
          </div>
        )}
      </div>
      <audio ref={audioRef} onEnded={onEnded} preload="auto" />
    </div>
  )
}


