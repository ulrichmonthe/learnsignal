import { notFound } from 'next/navigation'
import { getMissionById, MISSIONS } from '@/lib/rag-lab/missions'
import RAGLabClient from './client'

interface PageProps {
  params: Promise<{ mission: string }>
}

export default async function RAGLabMissionPage({ params }: PageProps) {
  const { mission: missionId } = await params
  const mission = getMissionById(missionId)
  if (!mission) notFound()
  return <RAGLabClient missionId={missionId} />
}

export async function generateStaticParams() {
  return MISSIONS.map(m => ({ mission: m.id }))
}
