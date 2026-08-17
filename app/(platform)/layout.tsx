import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: middleware already gates these routes, but guard here too.
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
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
          <a href="/jobs" className="font-mono text-xs text-text2 hover:text-text transition-colors">Jobs</a>
          <a href="/drafts" className="font-mono text-xs text-text2 hover:text-text transition-colors">Drafts</a>
          <UserButton />
        </div>
      </nav>
      <main className="relative z-10">{children}</main>
    </div>
  )
}
