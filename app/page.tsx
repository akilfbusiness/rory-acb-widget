import { RoryChatWidget } from "@/components/rory-chat-widget"

export default function Page() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: "#0a0a0a" }}
    >
      {/* Demo backdrop — replace this with your actual website content */}
      <div className="flex flex-col items-center gap-6 text-center max-w-xl">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl text-2xl font-black"
          style={{ background: "#e05c1a", color: "#fff" }}
        >
          A
        </div>
        <h1
          className="text-3xl font-bold tracking-tight text-balance"
          style={{ color: "#f0f0f0" }}
        >
          All Clutch &amp; Brake
        </h1>
        <p
          className="text-sm leading-relaxed text-pretty"
          style={{ color: "#666" }}
        >
          Adelaide&apos;s trusted automotive workshop. Expert clutch, brake, and drivetrain specialists.
          <br />
          <span style={{ color: "#444" }}>
            Click the wrench icon in the bottom right to chat with Rory, our AI assistant.
          </span>
        </p>
      </div>

      {/* The chat widget — drop this into any page */}
      <RoryChatWidget />
    </main>
  )
}
