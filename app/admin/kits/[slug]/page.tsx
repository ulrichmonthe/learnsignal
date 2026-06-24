import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getKit, getKitBlocks, getSharedBlocks, getKitOverrides, timeAgo } from '@/lib/admin/queries'
import ManifestEditor from '@/components/admin/manifest-editor'
import OverrideEditor from '@/components/admin/override-editor'
import { BLOCK_LABELS } from '@/lib/admin/types'

const ACCENT = '#C8F040'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function KitDetailPage({ params }: PageProps) {
  const { slug } = await params
  const kit = await getKit(slug)
  if (!kit) notFound()

  const [blocks, sharedBlocks, overrides] = await Promise.all([
    getKitBlocks(kit.id),
    getSharedBlocks(),
    getKitOverrides(kit.id),
  ])

  const editableBlockTypes = ['tickets', 'reveal_patterns']
  const editableBlocks = blocks.filter(b => editableBlockTypes.includes(b.block_type))

  // Map shared block id → override
  const overrideMap = new Map(overrides.map(o => [o.shared_block_id, o]))

  const lastEditTime = timeAgo(kit.updated_at)

  return (
    <div style={{ padding: '28px 32px', maxWidth: '920px' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p
            className="font-mono uppercase mb-2"
            style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)' }}
          >
            PLAYGROUND KIT · {kit.name.toUpperCase()}
          </p>
          <h1
            className="font-display font-medium"
            style={{ fontSize: '26px', color: 'rgba(255,255,255,0.95)', fontStyle: 'italic', marginBottom: '6px' }}
          >
            {kit.name}
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{kit.description}</p>
        </div>
        <p
          className="font-mono flex-shrink-0 text-right"
          style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}
        >
          LAST EDIT {lastEditTime.toUpperCase()}
        </p>
      </div>

      {/* Manifest */}
      <div className="mb-10">
        <ManifestEditor kit={kit} />
      </div>

      {/* Kit-specific content blocks */}
      <div className="mb-10">
        <p
          className="font-mono uppercase mb-4"
          style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)' }}
        >
          CONTENT BLOCKS · KIT-SPECIFIC
        </p>
        <div className="space-y-3">
          {editableBlocks.map(block => {
            const label = BLOCK_LABELS[block.block_type]
            return (
              <Link
                key={block.id}
                href={`/admin/kits/${slug}/blocks/${block.block_type}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.025)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  textDecoration: 'none',
                }}
              >
                <div>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginBottom: '4px' }}>
                    {label?.name ?? block.block_type}
                  </p>
                  <p
                    className="font-mono"
                    style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}
                  >
                    {label?.meta ?? block.block_type.toUpperCase()}
                    {block.updated_at && (
                      <> · LAST EDIT {timeAgo(block.updated_at).toUpperCase()}</>
                    )}
                  </p>
                </div>
                <span
                  className="font-mono"
                  style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}
                >
                  EDIT →
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Shared content blocks (inherited) */}
      <div>
        <p
          className="font-mono uppercase mb-4"
          style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)' }}
        >
          CONTENT BLOCKS · SHARED (INHERITED)
        </p>
        <div className="space-y-3">
          {sharedBlocks.map(sharedBlock => {
            const override = overrideMap.get(sharedBlock.id) ?? null
            return (
              <OverrideEditor
                key={sharedBlock.id}
                sharedBlock={sharedBlock}
                override={override}
                kitId={kit.id}
                kitSlug={slug}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
