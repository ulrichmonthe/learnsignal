import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getKits, getSharedBlocks } from '@/lib/admin/queries'
import AdminShell from '@/components/admin/admin-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Auth gate: 404 for everyone except the founder email.
  // Hiding existence > friendly rejection.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || user.email !== process.env.ADMIN_EMAIL) {
    notFound()
  }

  const [kits, sharedBlocks] = await Promise.all([getKits(), getSharedBlocks()])

  return (
    <AdminShell kits={kits} sharedBlocks={sharedBlocks}>
      {children}
    </AdminShell>
  )
}
