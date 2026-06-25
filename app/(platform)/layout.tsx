import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-bg">
      <nav className="border-b border-border px-8 py-4 flex items-center justify-between">
        <a href="/dashboard" className="font-mono text-sm tracking-widest text-accent uppercase">
          The Signal
        </a>
        <div className="flex items-center gap-6">
          <a href="/scenarios" className="font-mono text-xs text-text2 hover:text-text transition-colors">Scenarios</a>
          <a href="/playground" className="font-mono text-xs text-text2 hover:text-text transition-colors">Playground</a>
          <a href="/playground/learn" className="font-mono text-xs text-text2 hover:text-text transition-colors">Learn</a>
          <a href="/dashboard" className="font-mono text-xs text-text2 hover:text-text transition-colors">Skills</a>
        </div>
      </nav>
      <main className="relative z-10">{children}</main>
    </div>
  )
}
