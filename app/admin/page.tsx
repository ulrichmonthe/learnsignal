import { redirect } from 'next/navigation'
import { getKits } from '@/lib/admin/queries'

export default async function AdminPage() {
  const kits = await getKits()

  // If the DB migration hasn't been run yet, kits will be empty
  if (kits.length === 0) {
    return (
      <div style={{ padding: '48px 32px', maxWidth: '640px' }}>
        <p
          className="font-mono uppercase mb-4"
          style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#C8F040' }}
        >
          Setup required
        </p>
        <h1
          className="font-display font-medium mb-4"
          style={{ fontSize: '24px', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' }}
        >
          Run the DB migration first
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: '24px' }}>
          The admin tables don&apos;t exist yet. Open the Supabase SQL editor and run:
        </p>
        <pre
          style={{
            fontSize: '13px',
            color: '#C8F040',
            background: 'rgba(0,0,0,0.4)',
            border: '0.5px solid rgba(200,240,64,0.2)',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '24px',
            fontFamily: 'var(--font-dm-mono, monospace)',
          }}
        >
          db/seed-admin-schema.sql
        </pre>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          After running it, refresh this page. You&apos;ll be redirected to the Evals kit.
        </p>
      </div>
    )
  }

  redirect('/admin/kits/eval-lab')
}
