import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { Nav } from '@/components/marketing/Nav'
import { getJobs } from '@/lib/jobs/get-jobs'
import { JobBoard } from '@/components/jobs/job-board'
import { createServiceClient } from '@/lib/supabase/server'
import { getClaimedCaps, getPractice, jobReadiness } from '@/lib/capabilities/readiness'
import { getScenarioPractice } from '@/lib/capabilities/scenarios'
import type { JobReadiness } from '@/lib/capabilities/types'

export const metadata: Metadata = {
  title: 'AI PM Jobs — real AI product roles, ranked by depth · LearnSignal',
  description:
    'A curated board of genuine AI product management roles — not generic PM jobs with AI bolted on. Every role is filtered by an AI-depth rubric and ranked so you can see how deep the AI work actually goes.',
}

// Render fresh on every request so the board always reflects the latest rows the
// n8n workflow has published (it publishes every 6 hours). The query is a single
// indexed read; if traffic grows, swap this for `export const revalidate = 900`.
export const dynamic = 'force-dynamic'

// Public server component. Reads the read-only jobs feed the n8n workflow
// publishes, then hands it to the interactive client board. Self-contained
// styles scoped under `.jb-page` — no dependency on marketing.css.
export default async function JobsPage() {
  const { jobs, ok, error } = await getJobs()

  // Job-gap loop: for signed-in visitors, diff each role's required capabilities
  // against the user's practice history (one lab_progress read for all rows).
  // Failure to compute readiness must never take the public board down.
  const { userId } = await auth()
  let readiness: Record<string, JobReadiness> | null = null
  if (userId && jobs.length > 0) {
    try {
      const supabase = await createServiceClient()
      const [practice, claimed, scenarios] = await Promise.all([
        getPractice(supabase, userId),
        getClaimedCaps(supabase, userId),
        getScenarioPractice(supabase, userId),
      ])
      readiness = Object.fromEntries(
        jobs.map((job) => [job.jobHash, jobReadiness(job, practice, claimed, scenarios)]),
      )
    } catch {
      readiness = null
    }
  }

  return (
    <>
      <Nav />
      <div className="jb-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.jb-page{
  --acc:#C8F040; --bg:#100f0c; --line:rgba(255,255,255,0.10);
  --t1:rgba(255,255,255,0.92); --t2:rgba(255,255,255,0.62); --t3:rgba(255,255,255,0.38);
  --e-out:cubic-bezier(0.23,1,0.32,1);
  background:var(--bg); color:var(--t1); min-height:100vh;
  font-family:"DM Sans",ui-sans-serif,system-ui,-apple-system,sans-serif;
  padding:0 20px; box-sizing:border-box;
}
.jb-page *{box-sizing:border-box}
.jb-page-inner{max-width:860px;margin:0 auto;padding:40px 0 72px}
.jb-page-header{padding-bottom:26px;border-bottom:0.5px solid var(--line);margin-bottom:26px}
.jb-logo{display:inline-block;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:14px;
  letter-spacing:0.04em;color:var(--t1);text-decoration:none;transition:color .16s var(--e-out)}
.jb-logo b{color:var(--acc);font-weight:500}
.jb-logo:hover{color:var(--acc)}
.jb-eyebrow{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10px;letter-spacing:0.14em;
  text-transform:uppercase;color:var(--acc);margin:22px 0 8px}
.jb-page-title{font-size:26px;font-weight:600;letter-spacing:-0.01em;line-height:1.2;margin:0 0 10px}
.jb-page-title em{font-style:italic;color:var(--acc)}
.jb-frame{font-size:13.5px;line-height:1.55;color:var(--t2);max-width:620px;margin:0}
.jb-page-cta{margin-top:40px;padding:24px;border:0.5px solid rgba(200,240,64,0.22);border-radius:14px;
  background:rgba(200,240,64,0.04);display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between}
.jb-page-cta-text{font-size:14px;color:var(--t1);max-width:460px;line-height:1.5}
.jb-page-cta-btn{flex:0 0 auto;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:12px;
  letter-spacing:0.03em;color:#100f0c;background:var(--acc);border:0.5px solid var(--acc);
  padding:11px 18px;border-radius:8px;text-decoration:none;transition:transform .14s var(--e-out),filter .18s var(--e-out)}
.jb-page-cta-btn:hover{filter:brightness(1.06)}
.jb-page-cta-btn:active{transform:scale(0.97)}
@media(prefers-reduced-motion:reduce){.jb-page *{transition-duration:0.01ms!important}}
`,
        }}
      />

      <div className="jb-page-inner">
        <header className="jb-page-header">
          <div className="jb-eyebrow">The board</div>
          <h1 className="jb-page-title">
            AI PM jobs, ranked by <em>depth</em>.
          </h1>
          <p className="jb-frame">
            Real AI product roles pulled from live ATS boards — then filtered by an AI-depth rubric,
            so you see the roles where the AI work is genuine, not generic PM jobs with AI bolted on.
          </p>
        </header>

        <JobBoard jobs={jobs} ok={ok} error={error} signedIn={!!userId} readiness={readiness} />

        <div className="jb-page-cta">
          <div className="jb-page-cta-text">
            Want to be the PM these roles are hunting for?
          </div>
          <Link href="/sign-up" className="jb-page-cta-btn">
            Start with LearnSignal →
          </Link>
        </div>
      </div>
    </div>
    </>
  )
}
