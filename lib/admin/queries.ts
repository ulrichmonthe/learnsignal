import { createServiceClient } from '@/lib/supabase/server'
import type { Kit, KitContentBlock, SharedBlock, KitOverride, ContentVersion } from './types'

export async function getKits(): Promise<Kit[]> {
  const db = await createServiceClient()
  const { data, error } = await db.from('kits').select('*').order('created_at')
  if (error) return []   // Tables may not exist yet — handled via setup banner
  return (data || []) as Kit[]
}

export async function getKit(slug: string): Promise<Kit | null> {
  const db = await createServiceClient()
  const { data, error } = await db.from('kits').select('*').eq('slug', slug).single()
  if (error) return null
  return data as Kit
}

export async function getKitBlocks(kitId: string): Promise<KitContentBlock[]> {
  const db = await createServiceClient()
  const { data, error } = await db
    .from('kit_content_blocks')
    .select('*')
    .eq('kit_id', kitId)
    .order('block_type')
  if (error) throw error
  return (data || []) as KitContentBlock[]
}

export async function getKitBlock(kitId: string, blockType: string): Promise<KitContentBlock | null> {
  const db = await createServiceClient()
  const { data, error } = await db
    .from('kit_content_blocks')
    .select('*')
    .eq('kit_id', kitId)
    .eq('block_type', blockType)
    .single()
  if (error) return null
  return data as KitContentBlock
}

export async function getSharedBlocks(): Promise<SharedBlock[]> {
  const db = await createServiceClient()
  const { data, error } = await db.from('shared_blocks').select('*').order('slug')
  if (error) return []
  return (data || []) as SharedBlock[]
}

export async function getSharedBlock(slug: string): Promise<SharedBlock | null> {
  const db = await createServiceClient()
  const { data, error } = await db.from('shared_blocks').select('*').eq('slug', slug).single()
  if (error) return null
  return data as SharedBlock
}

export async function getKitOverrides(kitId: string): Promise<KitOverride[]> {
  const db = await createServiceClient()
  const { data, error } = await db
    .from('kit_overrides')
    .select('*, shared_block:shared_blocks(*)')
    .eq('kit_id', kitId)
  if (error) throw error
  return (data || []) as KitOverride[]
}

export async function getVersionsForEntity(entityId: string): Promise<ContentVersion[]> {
  const db = await createServiceClient()
  const { data, error } = await db
    .from('content_versions')
    .select('*')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(5)
  if (error) throw error
  return (data || []) as ContentVersion[]
}

export function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
