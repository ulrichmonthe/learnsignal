import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSharedBlock } from '@/lib/admin/queries'
import SharedBlockEditor from '@/components/admin/shared-block-editor'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function SharedBlockDetailPage({ params }: PageProps) {
  const { slug } = await params
  const block = await getSharedBlock(slug)
  if (!block) notFound()

  return (
    <div style={{ padding: '28px 32px', maxWidth: '720px' }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8">
        <Link
          href="/admin/shared"
          className="font-mono"
          style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textDecoration: 'none' }}
        >
          SHARED BLOCKS
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>›</span>
        <span
          className="font-mono"
          style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em' }}
        >
          {slug.toUpperCase()}
        </span>
      </div>

      <SharedBlockEditor block={block} />
    </div>
  )
}
