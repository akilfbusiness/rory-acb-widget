"use client"

import { useEffect, useRef, useState } from "react"

const WEBHOOK_URL =
  "https://n8n-customer-automations.onrender.com/webhook/63d10583-2eb6-4d46-a338-265ffa890160"

const PHONE_NUMBER = "08 8277 8122"
const PHONE_HREF = "tel:+61882778122"
const PHONE_TRIGGER = PHONE_NUMBER

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`(.*?)`/g, "$1")
}

const PROACTIVE_MESSAGES = [
  "Car making a strange noise? 🔧 I can help figure out what it is.",
  "Got a brake or clutch issue? Ask me — I'll help you sort it.",
  "Not sure if your car needs attention? Chat with me, it's free.",
]

function getSessionId(): string {
  if (typeof window === "undefined") return crypto.randomUUID()
  const key = "rory_session_id"
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

type Message = {
  id: string
  role: "user" | "assistant"
  text: string
  showCall?: boolean
}

const PhoneIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6.29 6.29l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const ChatIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#2563eb",
            display: "inline-block",
            animation: `roryBounce 1.3s ease-in-out ${i * 0.18}s infinite`,
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  )
}

export function RoryChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi I'm Rory, VA at All Clutch & Brake Service. What's going on with your car today? Let me know and I'll help you get it sorted out",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [proactiveDismissed, setProactiveDismissed] = useState(false)
  const [proactiveVisible, setProactiveVisible] = useState(false)
  const [proactiveMsg] = useState(() => PROACTIVE_MESSAGES[Math.floor(Math.random() * PROACTIVE_MESSAGES.length)])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sessionId = useRef<string>("")

  useEffect(() => {
    sessionId.current = getSessionId()
    // Show proactive bubble after 4 seconds
    const t = setTimeout(() => setProactiveVisible(true), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (open) {
      setHasUnread(false)
      setProactiveDismissed(true)
      setTimeout(() => inputRef.current?.focus(), 350)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatInput: text, sessionId: sessionId.current }),
      })

      if (!res.ok) throw new Error("Network error")

      const data = await res.json()
      const reply = data?.output ?? "Sorry, I didn't get a response. Please try again."

      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: stripMarkdown(reply),
        showCall: reply.includes(PHONE_TRIGGER),
      }
      setMessages((prev) => [...prev, botMsg])
      if (!open) setHasUnread(true)
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `Sorry, I'm having trouble connecting right now. Please call us directly on ${PHONE_NUMBER}.`,
          showCall: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <style>{`
        @keyframes roryBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes roryOpen {
          from { opacity: 0; transform: translateY(20px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes roryClose {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(20px) scale(0.94); }
        }
        @keyframes roryFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes roryPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.5); }
          50%       { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
        }
        @keyframes roryBadgePop {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.25); }
        }
        @keyframes roryShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .rory-widget-open  { animation: roryOpen  0.35s cubic-bezier(0.34, 1.4, 0.64, 1) forwards; }
        .rory-msg-in       { animation: roryFadeUp 0.22s ease-out forwards; }
        .rory-btn-pulse    { animation: roryPulse 2.5s ease-in-out infinite; }
        .rory-badge-pop    { animation: roryBadgePop 1.4s ease-in-out infinite; }

        .rory-call-btn {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%);
          background-size: 200% auto;
          transition: background-position 0.4s ease, transform 0.15s ease, box-shadow 0.15s ease;
        }
        .rory-call-btn:hover {
          background-position: right center;
          box-shadow: 0 4px 20px rgba(37, 99, 235, 0.45);
          transform: translateY(-1px);
        }
        .rory-call-btn:active { transform: scale(0.97); }

        .rory-send-btn {
          transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.15s ease;
        }
        .rory-send-btn:hover:not(:disabled) {
          box-shadow: 0 2px 12px rgba(37, 99, 235, 0.4);
          transform: scale(1.08);
        }
        .rory-send-btn:active:not(:disabled) { transform: scale(0.95); }

        .rory-toggle-btn {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .rory-toggle-btn:hover { transform: scale(1.06); }
        .rory-toggle-btn:active { transform: scale(0.95); }

        .rory-scrollbar::-webkit-scrollbar { width: 3px; }
        .rory-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .rory-scrollbar::-webkit-scrollbar-thumb { background: #dbeafe; border-radius: 4px; }

        .rory-input:focus { outline: none; }
        .rory-input-wrap:focus-within {
          border-color: #93c5fd !important;
          box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.2);
        }
      `}</style>

      {/* Floating button + teaser */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>

        {/* Proactive bubble — appears after 4s, dismissed on click or when chat opens */}
        {!open && proactiveVisible && !proactiveDismissed && !hasUnread && (
          <div
            className="rory-msg-in"
            style={{
              display: "flex", alignItems: "flex-end", gap: 8,
              maxWidth: 260,
            }}
          >
            <div
              onClick={() => { setOpen(true); setProactiveDismissed(true) }}
              style={{
                background: "#fff",
                border: "1px solid #dbeafe",
                borderRadius: "16px 16px 4px 16px",
                padding: "12px 14px",
                fontSize: 13,
                color: "#1e293b",
                lineHeight: 1.45,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(30,58,138,0.15)",
                position: "relative",
              }}
            >
              {proactiveMsg}
              <button
                onClick={(e) => { e.stopPropagation(); setProactiveDismissed(true) }}
                style={{
                  position: "absolute", top: -6, right: -6,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#94a3b8", border: "none",
                  color: "#fff", fontSize: 10, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  lineHeight: 1,
                }}
              >✕</button>
            </div>
          </div>
        )}

        {/* Unread teaser pill */}
        {!open && hasUnread && (
          <div
            className="rory-msg-in"
            onClick={() => setOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#fff",
              border: "1px solid #e0eaff",
              borderRadius: 999,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              color: "#1e3a8a",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(37,99,235,0.15)",
              userSelect: "none",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} className="rory-badge-pop" />
            Rory has a message for you
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close Rory" : "Chat with Rory"}
          className="rory-toggle-btn rory-btn-pulse"
          style={{
            width: 56, height: 56,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
            color: "#fff",
            boxShadow: "0 4px 24px rgba(37,99,235,0.4)",
            position: "relative",
          }}
        >
          <span style={{ transition: "opacity 0.2s, transform 0.2s", opacity: open ? 0 : 1, transform: open ? "rotate(90deg) scale(0.5)" : "rotate(0deg) scale(1)", position: "absolute" }}>
            <ChatIcon />
          </span>
          <span style={{ transition: "opacity 0.2s, transform 0.2s", opacity: open ? 1 : 0, transform: open ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)", position: "absolute" }}>
            <CloseIcon />
          </span>

          {hasUnread && !open && (
            <span
              className="rory-badge-pop"
              style={{
                position: "absolute", top: -3, right: -3,
                width: 16, height: 16, borderRadius: "50%",
                background: "#ef4444",
                color: "#fff",
                fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid #fff",
              }}
            >1</span>
          )}
        </button>
      </div>

      {/* Chat window */}
      {open && (
        <div
          className="rory-widget-open"
          style={{
            position: "fixed",
            bottom: 96, right: 24,
            zIndex: 9998,
            width: "min(390px, calc(100vw - 48px))",
            height: "min(580px, calc(100vh - 140px))",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 20,
            background: "#ffffff",
            border: "1px solid #dbeafe",
            boxShadow: "0 24px 60px rgba(30,58,138,0.18), 0 4px 16px rgba(30,58,138,0.08)",
          }}
        >
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Avatar */}
              <div style={{
                width: 42, height: 42,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                border: "2px solid rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 16, color: "#fff",
                position: "relative",
                backdropFilter: "blur(4px)",
              }}>
                R
                <span style={{
                  position: "absolute", bottom: -1, right: -1,
                  width: 11, height: 11, borderRadius: "50%",
                  background: "#22c55e",
                  border: "2px solid #1e40af",
                }} />
              </div>
              <div>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.2, margin: 0 }}>Rory Clutch</p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "3px 0 0 0" }}>All Clutch &amp; Brake Service</p>
              </div>
            </div>

            {/* Live call button in header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <a
                href={PHONE_HREF}
                className="rory-call-btn"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px",
                  borderRadius: 999,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <PhoneIcon size={13} />
                Call now
              </a>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="rory-scrollbar"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              background: "#f8faff",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="rory-msg-in"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "11px 15px",
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)"
                      : "#ffffff",
                    color: msg.role === "user" ? "#fff" : "#1e293b",
                    border: msg.role === "assistant" ? "1px solid #e0eaff" : "none",
                    boxShadow: msg.role === "user"
                      ? "0 2px 12px rgba(37,99,235,0.25)"
                      : "0 1px 6px rgba(30,58,138,0.07)",
                  }}
                >
                  {msg.text}
                </div>

                {msg.showCall && (
                  <a
                    href={PHONE_HREF}
                    className="rory-call-btn rory-msg-in"
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 18px",
                      borderRadius: 999,
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                      letterSpacing: "0.01em",
                    }}
                  >
                    <PhoneIcon size={14} />
                    Call {PHONE_NUMBER}
                  </a>
                )}
              </div>
            ))}

            {loading && (
              <div className="rory-msg-in" style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{
                  background: "#fff",
                  border: "1px solid #e0eaff",
                  borderRadius: "18px 18px 18px 4px",
                  boxShadow: "0 1px 6px rgba(30,58,138,0.07)",
                }}>
                  <TypingIndicator />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            flexShrink: 0,
            padding: "12px 14px 14px",
            background: "#fff",
            borderTop: "1px solid #e0eaff",
          }}>
            <div
              className="rory-input-wrap"
              style={{
                display: "flex", alignItems: "flex-end", gap: 8,
                background: "#f0f6ff",
                border: "1.5px solid #dbeafe",
                borderRadius: 16,
                padding: "8px 8px 8px 14px",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Rory anything..."
                rows={1}
                disabled={loading}
                className="rory-input"
                style={{
                  flex: 1,
                  resize: "none",
                  background: "transparent",
                  border: "none",
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  color: "#1e293b",
                  paddingTop: 4,
                  paddingBottom: 4,
                  maxHeight: 90,
                  overflowY: "auto",
                  fontFamily: "inherit",
                  opacity: loading ? 0.5 : 1,
                }}
                onInput={(e) => {
                  const el = e.currentTarget
                  el.style.height = "auto"
                  el.style.height = Math.min(el.scrollHeight, 90) + "px"
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                aria-label="Send"
                className="rory-send-btn"
                style={{
                  width: 34, height: 34,
                  borderRadius: 10,
                  border: "none",
                  background: input.trim() && !loading
                    ? "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)"
                    : "#cbd5e1",
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  flexShrink: 0,
                  marginBottom: 1,
                }}
              >
                <SendIcon />
              </button>
            </div>
            <p style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
              Powered by All Clutch &amp; Brake AI · <a href={PHONE_HREF} style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>{PHONE_NUMBER}</a>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
