"use client"

import { useEffect, useRef, useState } from "react"

const WEBHOOK_URL =
  "https://n8n-customer-automations.onrender.com/webhook/63d10583-2eb6-4d46-a338-265ffa890160"

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

const PHONE_TRIGGER = "08 8277 8122"
const PHONE_HREF = "tel:+61882778122"

const WrenchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
)

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6.29 6.29l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-[var(--chat-accent)] inline-block"
          style={{
            animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
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
      text: "G'day! I'm Rory, your assistant at All Clutch & Brake. How can I help you today?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sessionId = useRef<string>("")

  useEffect(() => {
    sessionId.current = getSessionId()
  }, [])

  useEffect(() => {
    if (open) {
      setHasUnread(false)
      setTimeout(() => inputRef.current?.focus(), 300)
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

      if (!res.ok) throw new Error("Network response was not ok")

      const data = await res.json()
      const reply = data?.output ?? "Sorry, I didn't get a response. Please try again."

      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: reply,
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
          text: "Sorry, I'm having trouble connecting right now. Please call us on 08 8277 8122.",
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
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes widgetOpen {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseBadge {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes fadeInMsg {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .widget-open {
          animation: widgetOpen 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .msg-in {
          animation: fadeInMsg 0.25s ease-out forwards;
        }
        .pulse-badge {
          animation: pulseBadge 1.5s ease-in-out infinite;
        }
        :root {
          --chat-bg: #0f0f0f;
          --chat-surface: #181818;
          --chat-surface-2: #222222;
          --chat-border: #2a2a2a;
          --chat-accent: #e05c1a;
          --chat-accent-dim: #c04e14;
          --chat-text: #f0f0f0;
          --chat-muted: #888888;
          --chat-user-bg: #e05c1a;
          --chat-bot-bg: #222222;
        }
        .chat-scrollbar::-webkit-scrollbar { width: 4px; }
        .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .chat-scrollbar::-webkit-scrollbar-thumb { background: var(--chat-border); border-radius: 4px; }
        textarea:focus { outline: none; }
      `}</style>

      {/* Floating toggle button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

        {/* Unread badge teaser — shows when closed and there's a new message */}
        {!open && hasUnread && (
          <div
            className="msg-in flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-2xl cursor-pointer"
            style={{
              background: "var(--chat-surface)",
              border: "1px solid var(--chat-border)",
              color: "var(--chat-text)",
            }}
            onClick={() => setOpen(true)}
          >
            <span className="w-2 h-2 rounded-full pulse-badge" style={{ background: "var(--chat-accent)" }} />
            New message from Rory
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close chat" : "Open chat with Rory"}
          className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: open ? "var(--chat-surface-2)" : "var(--chat-accent)",
            border: "2px solid",
            borderColor: open ? "var(--chat-border)" : "var(--chat-accent)",
            color: "#fff",
          }}
        >
          <span
            className="absolute inset-0 rounded-full transition-all duration-300"
            style={{
              boxShadow: open ? "none" : "0 0 24px 4px rgba(224, 92, 26, 0.35)",
            }}
          />
          <span className="relative z-10 transition-all duration-300" style={{ opacity: open ? 0 : 1, position: open ? "absolute" : "relative" }}>
            <WrenchIcon />
          </span>
          <span className="relative z-10 transition-all duration-300" style={{ opacity: open ? 1 : 0, position: open ? "relative" : "absolute" }}>
            <ChevronDownIcon />
          </span>
          {hasUnread && !open && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold pulse-badge"
              style={{ background: "#ef4444", color: "#fff", fontSize: "10px" }}
            >
              1
            </span>
          )}
        </button>
      </div>

      {/* Chat window */}
      {open && (
        <div
          className="widget-open fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden shadow-2xl"
          style={{
            width: "min(380px, calc(100vw - 48px))",
            height: "min(560px, calc(100vh - 140px))",
            background: "var(--chat-bg)",
            border: "1px solid var(--chat-border)",
            borderRadius: "20px",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{
              background: "var(--chat-surface)",
              borderBottom: "1px solid var(--chat-border)",
            }}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className="relative flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm shrink-0"
                style={{ background: "var(--chat-accent)" }}
              >
                R
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                  style={{ background: "#22c55e", borderColor: "var(--chat-surface)" }}
                />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none" style={{ color: "var(--chat-text)" }}>
                  Rory
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--chat-muted)" }}>
                  All Clutch &amp; Brake — Adelaide
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:bg-[var(--chat-surface-2)]"
              style={{ color: "var(--chat-muted)" }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-scrollbar"
            style={{ background: "var(--chat-bg)" }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`msg-in flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className="max-w-[85%] px-4 py-3 text-sm leading-relaxed"
                  style={{
                    background: msg.role === "user" ? "var(--chat-user-bg)" : "var(--chat-bot-bg)",
                    color: "var(--chat-text)",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    border: msg.role === "assistant" ? "1px solid var(--chat-border)" : "none",
                  }}
                >
                  {msg.text}
                </div>
                {msg.showCall && (
                  <a
                    href={PHONE_HREF}
                    className="msg-in flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
                    style={{
                      background: "var(--chat-accent)",
                      color: "#fff",
                      marginTop: "2px",
                    }}
                  >
                    <PhoneIcon />
                    Call 08 8277 8122
                  </a>
                )}
              </div>
            ))}

            {loading && (
              <div className="msg-in flex items-start">
                <div
                  className="rounded-2xl rounded-tl-sm"
                  style={{
                    background: "var(--chat-bot-bg)",
                    border: "1px solid var(--chat-border)",
                  }}
                >
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div
            className="shrink-0 px-4 py-3"
            style={{
              borderTop: "1px solid var(--chat-border)",
              background: "var(--chat-surface)",
            }}
          >
            <div
              className="flex items-end gap-2 rounded-2xl px-4 py-2"
              style={{
                background: "var(--chat-surface-2)",
                border: "1px solid var(--chat-border)",
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
                className="flex-1 resize-none bg-transparent text-sm leading-relaxed py-1 placeholder:opacity-40 disabled:opacity-50"
                style={{
                  color: "var(--chat-text)",
                  maxHeight: "96px",
                  overflowY: "auto",
                  fontFamily: "inherit",
                }}
                onInput={(e) => {
                  const el = e.currentTarget
                  el.style.height = "auto"
                  el.style.height = Math.min(el.scrollHeight, 96) + "px"
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 shrink-0 mb-0.5 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: input.trim() && !loading ? "var(--chat-accent)" : "var(--chat-border)",
                  color: "#fff",
                }}
              >
                <SendIcon />
              </button>
            </div>
            <p className="text-center mt-2 text-xs" style={{ color: "var(--chat-muted)" }}>
              Powered by All Clutch &amp; Brake AI
            </p>
          </div>
        </div>
      )}
    </>
  )
}
