'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { Kit, SharedBlock } from '@/lib/admin/types'

const ACCENT = '#C8F040'

interface AdminShellProps {
  kits: Kit[]
  sharedBlocks: SharedBlock[]
  children: React.ReactNode
}

export default function AdminShell({ kits, sharedBlocks, children }: AdminShellProps) {
  const pathname = usePathname()
  const [newKitModal, setNewKitModal] = useState(false)

  const activeKitSlug = pathname.match(/\/admin\/kits\/([^/]+)/)?.[1]
  const isSharedSection = pathname.includes('/admin/shared')

  function sectionLabel() {
    if (isSharedSection) return 'SHARED BLOCKS'
    if (activeKitSlug) return 'CONTENT EDITOR'
    return 'ADMIN'
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0d0d' }}>
      {/* Top nav */}
      <nav
        className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}
      >
        <Link
          href="/admin"
          className="font-mono"
          style={{ fontSize: '11px', letterSpacing: '0.08em', color: ACCENT }}
        >
          THE SIGNAL · ADMIN
        </Link>
        <span className="font-mono" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
          {sectionLabel()}
        </span>
      </nav>

      {/* Body: left rail + main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left rail */}
        <aside
          className="flex-shrink-0 flex flex-col overflow-y-auto"
          style={{
            width: '220px',
            background: 'rgba(255,255,255,0.02)',
            borderRight: '0.5px solid rgba(255,255,255,0.08)',
            padding: '20px 0',
          }}
        >
          {/* Kits section */}
          <div className="px-4 mb-3">
            <p className="font-mono" style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)' }}>
              PLAYGROUND KITS
            </p>
          </div>

          <div className="mb-2">
            {kits.map(kit => {
              const isActive = activeKitSlug === kit.slug
              return (
                <Link
                  key={kit.slug}
                  href={`/admin/kits/${kit.slug}`}
                  style={{
                    display: 'block',
                    padding: '10px 16px',
                    borderRadius: '0 8px 8px 0',
                    background: isActive ? 'rgba(200,240,64,0.06)' : 'transparent',
                    borderLeft: isActive ? `2px solid ${ACCENT}` : '2px solid transparent',
                    textDecoration: 'none',
                    marginRight: '8px',
                  }}
                >
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '2px' }}>
                    {kit.name}
                  </p>
                  <p
                    className="font-mono"
                    style={{
                      fontSize: '10px',
                      color: kit.status === 'live' ? ACCENT : 'rgba(255,255,255,0.4)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {kit.status.toUpperCase().replace('_', ' ')}
                    {kit.tool_mirrored ? ` · MIRRORS ${kit.tool_mirrored.toUpperCase()}` : ''}
                  </p>
                </Link>
              )
            })}
          </div>

          {/* Divider */}
          <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.08)', margin: '12px 16px' }} />

          {/* Shared section */}
          <div className="px-4 mb-3">
            <p className="font-mono" style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)' }}>
              SHARED
            </p>
          </div>

          <div className="mb-4">
            {sharedBlocks.map(block => {
              const isActive = pathname === `/admin/shared/${block.slug}`
              return (
                <Link
                  key={block.slug}
                  href={`/admin/shared/${block.slug}`}
                  style={{
                    display: 'block',
                    padding: '8px 16px',
                    textDecoration: 'none',
                    background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                  }}
                >
                  <p
                    style={{
                      fontSize: '13px',
                      color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {block.name}
                  </p>
                </Link>
              )
            })}
          </div>

          {/* Divider */}
          <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.08)', margin: '4px 16px 12px' }} />

          {/* New kit */}
          <div className="px-4">
            <button
              onClick={() => setNewKitModal(true)}
              className="font-mono"
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.5)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                letterSpacing: '0.08em',
              }}
            >
              + NEW KIT
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* New Kit modal */}
      {newKitModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setNewKitModal(false)}
        >
          <div
            className="rounded-lg p-8 max-w-md w-full mx-4"
            style={{ background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            <p
              className="font-mono uppercase mb-4"
              style={{ fontSize: '10px', letterSpacing: '0.14em', color: ACCENT }}
            >
              Adding a new kit
            </p>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: '16px' }}>
              New kits are added via the kit scaffolding prompt — not through this UI.
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: '24px' }}>
              Open a fresh Claude Code session and use:{' '}
              <code
                className="font-mono"
                style={{ color: ACCENT, fontSize: '12px' }}
              >
                kit-scaffolding-prompt.md
              </code>
            </p>
            <button
              onClick={() => setNewKitModal(false)}
              className="font-mono"
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.5)',
                background: 'none',
                border: '0.5px solid rgba(255,255,255,0.15)',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
