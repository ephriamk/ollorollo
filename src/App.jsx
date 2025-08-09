import './index.css'
import ModelCanvas from './ModelCanvas'
import ChatBot from './ChatBot'
import AudioPlayer from './AudioPlayer'
import TopRightInfo from './TopRightInfo'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            top: '14vh',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              color: 'white',
              fontWeight: 800,
              letterSpacing: '0.08em',
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
              fontSize: 'clamp(20px, 4.2vw, 44px)',
              lineHeight: 1.1,
              textShadow: '0 6px 30px rgba(0,0,0,0.45), 0 2px 10px rgba(0,0,0,0.6)'
            }}
          >
            <span style={{
              background: 'linear-gradient(90deg, #e2e8f0, #f8fafc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Ollo CoPilot Companion
            </span>
          </div>
          <div
            style={{
              marginTop: 6,
              color: 'rgba(255,255,255,0.7)',
              fontSize: 'clamp(10px, 1.6vw, 14px)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textShadow: '0 1px 6px rgba(0,0,0,0.4)'
            }}
          >
            Your 3D AI sidekick
          </div>
        </div>
      </div>
      <ModelCanvas />
      <TopRightInfo />
      <ChatBot />
      <AudioPlayer />
    </div>
  )
}
