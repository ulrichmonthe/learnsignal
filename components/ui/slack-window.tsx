'use client'

interface Message {
  user: string
  avatar: string
  time: string
  text: string
}

interface Props {
  messages: Message[]
  channel?: string
}

export function SlackWindow({ messages, channel = 'ai-product · engineering' }: Props) {
  return (
    <div className="bg-surface border border-border2 overflow-hidden">
      {/* Title bar */}
      <div className="bg-surface2 border-b border-border px-4 py-2.5 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
        <span className="ml-2 font-mono text-[11px] text-text2 tracking-wide">
          # {channel}
        </span>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 bg-surface2 border border-border flex items-center justify-center shrink-0">
              <span className="font-mono text-xs text-text2">{msg.avatar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-mono text-xs text-text font-medium">{msg.user}</span>
                <span className="font-mono text-[10px] text-text3">{msg.time}</span>
              </div>
              <p className="text-sm text-text2 leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
