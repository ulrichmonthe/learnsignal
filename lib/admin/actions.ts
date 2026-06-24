'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Ticket } from './types'

// ── Auth guard ──────────────────────────────────────────────

async function requireAdmin(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error('Unauthorized')
  }
  return user.email
}

// ── Version snapshots ───────────────────────────────────────

async function snapshotVersion(
  entityType: 'kit_block' | 'shared_block' | 'kit_override' | 'kit_manifest',
  entityId: string,
  snapshot: unknown,
): Promise<void> {
  const db = await createServiceClient()

  await db.from('content_versions').insert({
    entity_type: entityType,
    entity_id: entityId,
    snapshot,
  })

  // Prune to last 5 versions
  const { data: versions } = await db
    .from('content_versions')
    .select('id')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })

  if (versions && versions.length > 5) {
    const toDelete = versions.slice(5).map((v: { id: string }) => v.id)
    await db.from('content_versions').delete().in('id', toDelete)
  }
}

// ── Kit manifest ────────────────────────────────────────────

export async function updateKitManifest(
  kitId: string,
  updates: {
    name?: string
    description?: string
    status?: 'live' | 'draft' | 'coming_soon'
    classifier_keywords?: string[]
    tool_mirrored?: string
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const email = await requireAdmin()
    const db = await createServiceClient()

    const { data: current } = await db.from('kits').select('*').eq('id', kitId).single()
    if (current) await snapshotVersion('kit_manifest', kitId, current)

    const { error } = await db
      .from('kits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', kitId)

    if (error) throw error

    revalidatePath('/admin', 'layout')
    revalidatePath(`/admin/kits/${current?.slug}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ── Kit content blocks ──────────────────────────────────────

export async function updateKitBlock(
  blockId: string,
  blockData: unknown,
  kitSlug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const email = await requireAdmin()
    const db = await createServiceClient()

    const { data: current } = await db
      .from('kit_content_blocks')
      .select('*')
      .eq('id', blockId)
      .single()

    if (current) await snapshotVersion('kit_block', blockId, current)

    const { data: updated, error } = await db
      .from('kit_content_blocks')
      .update({
        block_data: blockData,
        updated_at: new Date().toISOString(),
        updated_by: email,
      })
      .eq('id', blockId)
      .select()
      .single()

    if (error) throw error

    // Sync tickets to live eval_tickets table
    if (updated?.block_type === 'tickets') {
      await syncTicketsToLiveTable(blockData as Ticket[])
    }

    revalidatePath('/admin', 'layout')
    revalidatePath(`/admin/kits/${kitSlug}`)
    revalidatePath(`/admin/kits/${kitSlug}/blocks/${updated?.block_type}`)
    revalidatePath('/playground/eval-lab/vibe-check')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

async function syncTicketsToLiveTable(tickets: Ticket[]): Promise<void> {
  const db = await createServiceClient()
  for (const ticket of tickets) {
    await db.from('eval_tickets').upsert(
      {
        slot_number: ticket.slot,
        ticket_text: ticket.ticket_text,
        agent_category: ticket.agent_category,
        agent_sentiment: ticket.agent_sentiment,
        agent_urgency: ticket.agent_urgency ?? null,
        agent_reasoning: ticket.agent_reasoning,
        agent_escalate: ticket.agent_escalate,
        expected_label: ticket.expected_label,
        pattern_tag: ticket.pattern_tag,
      },
      { onConflict: 'slot_number' },
    )
  }
}

// ── Shared blocks ───────────────────────────────────────────

export async function updateSharedBlock(
  blockId: string,
  defaultData: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()
    const db = await createServiceClient()

    const { data: current } = await db
      .from('shared_blocks')
      .select('*')
      .eq('id', blockId)
      .single()

    if (current) await snapshotVersion('shared_block', blockId, current)

    const { error } = await db
      .from('shared_blocks')
      .update({ default_data: defaultData, updated_at: new Date().toISOString() })
      .eq('id', blockId)

    if (error) throw error

    revalidatePath('/admin/shared')
    revalidatePath(`/admin/shared/${current?.slug}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ── Kit overrides ───────────────────────────────────────────

export async function upsertKitOverride(
  kitId: string,
  sharedBlockId: string,
  overrideData: unknown,
  kitSlug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()
    const db = await createServiceClient()

    const { data: existing } = await db
      .from('kit_overrides')
      .select('*')
      .eq('kit_id', kitId)
      .eq('shared_block_id', sharedBlockId)
      .single()

    if (existing) {
      await snapshotVersion('kit_override', existing.id, existing)
      const { error } = await db
        .from('kit_overrides')
        .update({ override_data: overrideData, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await db.from('kit_overrides').insert({
        kit_id: kitId,
        shared_block_id: sharedBlockId,
        override_data: overrideData,
      })
      if (error) throw error
    }

    revalidatePath(`/admin/kits/${kitSlug}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteKitOverride(
  overrideId: string,
  kitSlug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()
    const db = await createServiceClient()

    const { data: current } = await db
      .from('kit_overrides')
      .select('*')
      .eq('id', overrideId)
      .single()

    if (current) await snapshotVersion('kit_override', overrideId, current)

    const { error } = await db.from('kit_overrides').delete().eq('id', overrideId)
    if (error) throw error

    revalidatePath(`/admin/kits/${kitSlug}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ── Version revert ──────────────────────────────────────────

export async function getVersionsAction(entityId: string) {
  try {
    await requireAdmin()
    const db = await createServiceClient()
    const { data } = await db
      .from('content_versions')
      .select('*')
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(5)
    return { success: true, versions: data || [] }
  } catch (e) {
    return { success: false, versions: [], error: String(e) }
  }
}

export async function revertToVersion(
  versionId: string,
  entityType: 'kit_block' | 'shared_block' | 'kit_override' | 'kit_manifest',
  entityId: string,
  kitSlug?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const email = await requireAdmin()
    const db = await createServiceClient()

    const { data: version } = await db
      .from('content_versions')
      .select('*')
      .eq('id', versionId)
      .single()

    if (!version) throw new Error('Version not found')
    const snap = version.snapshot as Record<string, unknown>

    // Snapshot current before reverting
    if (entityType === 'kit_block') {
      const { data: cur } = await db
        .from('kit_content_blocks')
        .select('*')
        .eq('id', entityId)
        .single()
      if (cur) await snapshotVersion('kit_block', entityId, cur)
      const { error } = await db
        .from('kit_content_blocks')
        .update({
          block_data: snap.block_data,
          updated_at: new Date().toISOString(),
          updated_by: email,
        })
        .eq('id', entityId)
      if (error) throw error
      if ((snap as { block_type?: string }).block_type === 'tickets') {
        await syncTicketsToLiveTable(snap.block_data as Ticket[])
      }
    } else if (entityType === 'shared_block') {
      const { data: cur } = await db
        .from('shared_blocks')
        .select('*')
        .eq('id', entityId)
        .single()
      if (cur) await snapshotVersion('shared_block', entityId, cur)
      const { error } = await db
        .from('shared_blocks')
        .update({ default_data: snap.default_data, updated_at: new Date().toISOString() })
        .eq('id', entityId)
      if (error) throw error
    } else if (entityType === 'kit_override') {
      const { data: cur } = await db
        .from('kit_overrides')
        .select('*')
        .eq('id', entityId)
        .single()
      if (cur) await snapshotVersion('kit_override', entityId, cur)
      const { error } = await db
        .from('kit_overrides')
        .update({ override_data: snap.override_data, updated_at: new Date().toISOString() })
        .eq('id', entityId)
      if (error) throw error
    } else if (entityType === 'kit_manifest') {
      const { data: cur } = await db.from('kits').select('*').eq('id', entityId).single()
      if (cur) await snapshotVersion('kit_manifest', entityId, cur)
      const { error } = await db
        .from('kits')
        .update({
          name: snap.name,
          description: snap.description,
          status: snap.status,
          classifier_keywords: snap.classifier_keywords,
          tool_mirrored: snap.tool_mirrored,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entityId)
      if (error) throw error
    }

    revalidatePath('/admin', 'layout')
    if (kitSlug) {
      revalidatePath(`/admin/kits/${kitSlug}`)
      revalidatePath(`/admin/kits/${kitSlug}/blocks/tickets`)
      revalidatePath(`/admin/kits/${kitSlug}/blocks/reveal_patterns`)
    }
    revalidatePath('/admin/shared')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
