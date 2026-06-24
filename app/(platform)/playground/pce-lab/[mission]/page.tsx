import { notFound } from 'next/navigation'
import { getMissionById, MISSIONS } from '@/lib/pce-lab/missions'
import PCELabClient from './client'

interface PageProps {
  params: Promise<{ mission: string }>
}

export async function generateStaticParams() {
  return MISSIONS.map(m => ({ mission: m.id }))
}

export default async function MissionPage({ params }: PageProps) {
  const { mission: missionId } = await params
  const mission = getMissionById(missionId)
  if (!mission) notFound()

  return <PCELabClient missionId={missionId} />
}
