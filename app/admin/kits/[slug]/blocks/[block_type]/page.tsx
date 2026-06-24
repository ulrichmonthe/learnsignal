import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getKit, getKitBlock, timeAgo } from '@/lib/admin/queries'
import TicketsEditor from '@/components/admin/tickets-editor'
import RevealPatternsEditor from '@/components/admin/reveal-patterns-editor'

interface PageProps {
  params: Promise<{ slug: string; block_type: string }>
}

export default async function BlockEditorPage({ params }: PageProps) {
  const { slug, block_type } = await params
  const kit = await getKit(slug)
  if (!kit) notFound()

  const block = await getKitBlock(kit.id, block_type)
  if (!block) notFound()

  const lastChange = timeAgo(block.updated_at).toUpperCase()

  return (
    <div style={{ padding: '28px 32px', maxWidth: '960px' }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8">
        <Link
          href={`/admin/kits/${slug}`}
          className="font-mono"
          style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textDecoration: 'none' }}
        >
          {kit.name.toUpperCase()}
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>›</span>
        <span
          className="font-mono"
          style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em' }}
        >
          {block_type.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {block_type === 'tickets' && (
        <TicketsEditor block={block} kitSlug={slug} lastChange={lastChange} />
      )}

      {block_type === 'reveal_patterns' && (
        <RevealPatternsEditor block={block} kitSlug={slug} lastChange={lastChange} />
      )}

      {block_type !== 'tickets' && block_type !== 'reveal_patterns' && (
        <div>
          <p
            className="font-mono uppercase mb-2"
            style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)' }}
          >
            EVAL KIT · CONTENT BLOCK
          </p>
          <h2
            className="font-display font-medium mb-4"
            style={{ fontSize: '22px', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' }}
          >
            {block_type.replace(/_/g, ' ')}
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
            No dedicated editor for this block type yet.
          </p>
          <pre
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
              background: 'rgba(0,0,0,0.3)',
              padding: '16px',
              borderRadius: '8px',
              overflow: 'auto',
              maxHeight: '400px',
            }}
          >
            {JSON.stringify(block.block_data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
