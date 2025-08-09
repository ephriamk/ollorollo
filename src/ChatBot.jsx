import { useEffect, useMemo, useRef, useState } from 'react'

const systemPrompt = `You are Ollo — a witty, warm, slightly edgy 21-year-old companion with dry/dark humor. Be playful, kind, and hype your human up, but never punch down. Keep replies short, high-signal, and conversational. Use emojis sparingly (only if they add vibe).\n\nStyle\n- Funny, a little chaotic in a good way, but respectful\n- Snappy sentences, clear takeaways, minimal fluff\n- Ask a clarifying question when needed\n\nBoundaries & Safety\n- No bigotry, slurs, harassment, sexual content involving minors, self-harm encouragement, or illegal guidance\n- Don’t provide definitive medical/legal/financial advice; suggest professionals when relevant\n- Respect privacy; don’t store sensitive info without consent\n\nBehavior\n- If asked to do something harmful or disallowed, refuse with wit and offer a safe alternative\n- Be supportive during tough moments; encourage breaks, hydration, and reaching out to real humans when needed\n- Celebrate wins, even small ones\n\nCapabilities\n- Helpful chat, planning, learning support, creative brainstorming, and light entertainment\n- Keep it useful, keep it kind, keep it fun\n\nRemember: You’re here to make life easier and lighter — be helpful, funny, and safe.`

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(true)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your Ollo CoPilot Companion. How can I help?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState(() =>
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('openai_api_key') || ''
      : ''
  )
  const listRef = useRef(null)

  // Fallback to env if no user-provided key
  const envApiKey = import.meta.env.VITE_OPENAI_API_KEY || ''
  const effectiveKey = apiKey || envApiKey

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, isOpen])

  useEffect(() => {
    if (apiKey) {
      try { localStorage.setItem('openai_api_key', apiKey) } catch {}
    } else {
      try { localStorage.removeItem('openai_api_key') } catch {}
    }
  }, [apiKey])

  async function sendMessage(e) {
    e?.preventDefault?.()
    const content = input.trim()
    if (!content || loading) return
    setInput('')
    const next = [...messages, { role: 'user', content }]
    setMessages(next)
    setLoading(true)
    try {
      if (!effectiveKey) {
        throw new Error('Missing API key. Click Key and paste your OpenAI API key.')
      }
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.4,
          messages: [
            { role: 'system', content: systemPrompt },
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
        { role: 'assistant', content: `I hit a snag: ${err.message}` },
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
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 8 }}>
          <div style={{ flex: 1, color: 'white', fontWeight: 700, letterSpacing: '0.08em' }}>
            Ollo Chat
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>
              Enter your API key via “Key” to save it locally
            </div>
          </div>
          <button
            onClick={() => setShowSettings((v) => !v)}
            style={{
              background: 'transparent',
              color: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 8,
              padding: '6px 8px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Key
          </button>
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

        {showSettings && (
          <div style={{ padding: '0 12px 10px 12px' }}>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 6 }}>
              Enter your OpenAI API key (stored locally in your browser)
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(0,0,0,0.4)',
                  color: 'white',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => setApiKey('')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

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


