import { notFound } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { getKits, getSharedBlocks } from '@/lib/admin/queries'
import AdminShell from '@/components/admin/admin-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Auth gate: 404 for everyone except the founder email.
  // Hiding existence > friendly rejection.
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress

  if (!email || email !== process.env.ADMIN_EMAIL) {
    notFound()
  }

  const [kits, sharedBlocks] = await Promise.all([getKits(), getSharedBlocks()])

  return (
    <AdminShell kits={kits} sharedBlocks={sharedBlocks}>
      {children}
    </AdminShell>
  )
}
