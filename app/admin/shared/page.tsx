import Link from 'next/link'
import { getSharedBlocks, timeAgo } from '@/lib/admin/queries'

const ACCENT = '#C8F040'

export default async function SharedBlocksPage() {
  const sharedBlocks = await getSharedBlocks()

  return (
    <div style={{ padding: '28px 32px', maxWidth: '760px' }}>
      <div className="mb-8">
        <p
          className="font-mono uppercase mb-2"
          style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)' }}
        >
          SHARED CONTENT
        </p>
        <h1
          className="font-display font-medium mb-2"
          style={{ fontSize: '26px', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' }}
        >
          Shared blocks
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: '500px' }}>
          These blocks have a canonical default that applies to all kits. Some allow per-kit overrides — edit those from within the kit view.
        </p>
      </div>

      <div className="space-y-3">
        {sharedBlocks.map(block => (
          <Link
            key={block.slug}
            href={`/admin/shared/${block.slug}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.025)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginBottom: '4px' }}>
                {block.name}
              </p>
              <p
                className="font-mono"
                style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}
              >
                {block.allows_kit_override ? 'ALLOWS KIT OVERRIDES' : 'SHARED — NO OVERRIDES'}
                {' · LAST EDIT '}
                {timeAgo(block.updated_at).toUpperCase()}
              </p>
              {block.description && (
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                  {block.description}
                </p>
              )}
            </div>
            <span
              className="font-mono flex-shrink-0 ml-4"
              style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}
            >
              EDIT →
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
