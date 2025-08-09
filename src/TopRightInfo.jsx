import { useState } from 'react'

const CONTRACT_ADDRESS = 'FDh8rgWZq34e425eAWEidwfSNavyoW9kVjwxqtPc1UXs'
const X_LINK = 'https://x.com/i/communities/1953995008664572121'

export default function TopRightInfo() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }

  return (
    <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 40, pointerEvents: 'auto' }}>
      <div
        style={{
          background: 'rgba(10,10,14,0.7)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: 12,
          minWidth: 280,
          color: 'white',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)'
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6, letterSpacing: '0.12em', textTransform: 'uppercase' }}>CA</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: 12,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 10px',
            borderRadius: 10,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}>
            {CONTRACT_ADDRESS}
          </div>
          <button onClick={copy} style={{
            padding: '8px 10px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.15)',
            background: copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)',
            color: 'white',
            cursor: 'pointer',
            flexShrink: 0,
          }}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div style={{ marginTop: 10 }}>
          <a href={X_LINK} target="_blank" rel="noreferrer" style={{
            color: '#8ab4ff',
            textDecoration: 'none',
            borderBottom: '1px dashed rgba(138,180,255,0.6)'
          }}>
            Join the X community
          </a>
        </div>
      </div>
    </div>
  )
}


