import { useEffect, useMemo, useRef, useState } from 'react'

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(true)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your Ollo CoPilot Companion. How can I help?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || ''

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, isOpen])

  async function sendMessage(e) {
    e?.preventDefault?.()
    const content = input.trim()
    if (!content || loading) return
    setInput('')
    const next = [...messages, { role: 'user', content }]
    setMessages(next)
    setLoading(true)
    try {
      if (!apiKey) {
        throw new Error('Missing VITE_OPENAI_API_KEY')
      }
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.4,
          messages: [
            { role: 'system', content: 'You are Ollo CoPilot Companion, a concise, friendly assistant.' },
            ...next.map(({ role, content }) => ({ role, content })),
          ],
        }),
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      const reply = data?.choices?.[0]?.message?.content?.trim() || '...'
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `I hit a snag: ${err.message}. Add VITE_OPENAI_API_KEY to a .env file and restart dev server.` },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 50 }}>
      <div
        style={{
          background: 'rgba(10,10,14,0.7)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          width: 340,
          height: isOpen ? 450 : 54,
          transition: 'height 160ms ease, box-shadow 160ms ease',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px' }}>
          <div style={{ flex: 1, color: 'white', fontWeight: 700, letterSpacing: '0.08em' }}>
            Ollo Chat
          </div>
          <button
            onClick={() => setIsOpen((v) => !v)}
            style={{
              background: 'transparent',
              color: 'rgba(255,255,255,0.9)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {isOpen ? '−' : '+'}
          </button>
        </div>

        {isOpen && (
          <>
            <div
              ref={listRef}
              style={{
                height: 320,
                overflowY: 'auto',
                padding: '8px 12px 0 12px',
              }}
            >
              {messages.map((m, i) => (
                <div key={i} style={{ margin: '10px 0', display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '10px 12px',
                      borderRadius: 12,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: m.role === 'user' ? 'white' : 'rgba(255,255,255,0.95)',
                      background: m.role === 'user' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(255,255,255,0.08)',
                      border: m.role === 'user' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: m.role === 'user' ? '0 6px 22px rgba(29,78,216,0.35)' : 'none',
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} style={{ padding: 12, display: 'flex', gap: 8 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(0,0,0,0.35)',
                  color: 'white',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(59,130,246,0.4)',
                  background: loading ? 'rgba(59,130,246,0.35)' : 'linear-gradient(135deg, #60a5fa, #2563eb)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: loading ? 'default' : 'pointer',
                }}
              >
                {loading ? '...' : 'Send'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}


