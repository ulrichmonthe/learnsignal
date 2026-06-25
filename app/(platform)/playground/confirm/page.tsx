import { classifyQuery } from '@/lib/classify'
import ConfirmClient from './confirm-client'

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams
  const classification = classifyQuery(q)

  return <ConfirmClient query={q} classification={classification} />
}
