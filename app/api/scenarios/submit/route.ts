import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'

// Scenario suggestion form → emails the founder (ADMIN_EMAIL) via Resend.
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in to submit.' }, { status: 401 })
  }

  const { title, description } = await req.json().catch(() => ({ title: null, description: null }))
  if (typeof title !== 'string' || !title.trim() || typeof description !== 'string' || !description.trim()) {
    return NextResponse.json({ error: 'Add a title and a description.' }, { status: 400 })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  const resendKey = process.env.RESEND_API_KEY
  if (!adminEmail || !resendKey) {
    return NextResponse.json({ error: 'Submissions are not configured yet.' }, { status: 500 })
  }

  const user = await currentUser()
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ?? 'unknown'
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || email

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'LearnSignal <onboarding@resend.dev>',
      to: [adminEmail],
      reply_to: email,
      subject: `New scenario idea: ${title.trim().slice(0, 90)}`,
      text:
        `From: ${name} <${email}> (Clerk user ${userId})\n\n` +
        `Title:\n${title.trim()}\n\n` +
        `Situation & decision:\n${description.trim()}`,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('Resend scenario submit failed:', res.status, body)
    return NextResponse.json({ error: 'Could not send right now — try again shortly.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
