'use client'

import { useEffect, useRef } from 'react'
import { EXPLAINER_CSS, prefersReducedMotion } from './shell'

// ── Cost per completed task ──────────────────────────────────────────────────
// Dynamic explainer for Agent Orchestration · Lesson 6 ("Economics: cost per
// completed task"). Start from a real baseline — a 7-branch fan-out, 60k
// requests/week, $18,900 spend, 82% completion — then pull three cumulative
// levers (cache → tier → topology, cheapest-first) and watch cost per COMPLETED
// task move against the affordable ceiling ($0.203). The vendor bills per token;
// the number that decides your margin is per finished task.
//
// Same shape as the approved honesty-gap prototype: static markup in JSX, one
// scoped <style> (EXPLAINER_CSS + OWN_CSS), interaction wired imperatively in a
// single effect with an AbortController + cancelled rafs. Chrome uses `.expl-*`;
// the custom viz is prefixed `.expl-cpt-*` and scoped by `.expl-wrap`.

const OWN_CSS = `
  .expl-cpt-levers{display:flex;flex-direction:column;gap:9px}
  .expl-cpt-lever{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:transparent;border:0.5px solid var(--line);border-radius:9px;padding:11px 13px;cursor:pointer;color:var(--t2);
    transition:border-color .18s var(--e-out),background .18s var(--e-out),transform .12s var(--e-out)}
  .expl-cpt-lever:hover{border-color:rgba(200,240,64,0.42)}
  .expl-cpt-lever:active{transform:scale(0.985)}
  .expl-cpt-lever.active{background:rgba(200,240,64,0.07);border-color:var(--acc)}
  .expl-cpt-lever-main{flex:1;min-width:0}
  .expl-cpt-lever-name{font-size:12.5px;color:var(--t1);font-weight:600;font-family:"DM Sans",sans-serif;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .expl-cpt-lever-time{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:0.08em;border:0.5px solid var(--line);border-radius:20px;padding:1px 7px}
  .expl-cpt-lever-eff{font-size:10.5px;color:var(--t2);margin-top:4px;font-family:ui-monospace,"SF Mono",Menlo,monospace;letter-spacing:0.01em;transition:color .18s var(--e-out)}
  .expl-cpt-lever.active .expl-cpt-lever-eff{color:var(--acc)}
  .expl-cpt-lever-pill{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:var(--t3);flex:0 0 auto;transition:color .18s var(--e-out)}
  .expl-cpt-lever.active .expl-cpt-lever-pill{color:var(--acc)}

  .expl-cpt-order{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;color:var(--t3);margin-top:12px;letter-spacing:0.05em;line-height:1.5}
  .expl-cpt-order b{color:var(--t2);font-weight:400}

  .expl-cpt-metrics{display:flex;gap:18px;margin-top:18px;padding-top:16px;border-top:0.5px solid var(--line)}
  .expl-cpt-metric{flex:1;min-width:0}
  .expl-cpt-metric-l{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:var(--t3);margin-bottom:5px;line-height:1.3}
  .expl-cpt-metric-v{font-size:17px;font-weight:600;color:var(--t1);font-variant-numeric:tabular-nums;font-family:"DM Sans",sans-serif;letter-spacing:-0.01em;transition:color .25s var(--e-out)}
  .expl-cpt-metric-v.warm{color:var(--warm)}

  .expl-cpt-big{font-size:52px;font-weight:600;line-height:1;letter-spacing:-0.02em;font-variant-numeric:tabular-nums;font-family:"DM Sans",sans-serif;color:var(--warm);transition:color .25s var(--e-out)}

  .expl-cpt-ceil{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10px;color:var(--t3);margin-top:10px;line-height:1.55}
  .expl-cpt-ceil b{color:var(--t2)}

  .expl-cpt-reset{margin-top:16px}
`

export function CostPerTaskExplainer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const ac = new AbortController()
    const sig = ac.signal
    const rafs: number[] = []
    const reduce = prefersReducedMotion()
    const el = (q: string) => root.querySelector(q) as HTMLElement

    type Lever = 'caching' | 'tiering' | 'topology'
    const state: Record<Lever, boolean> = { caching: false, tiering: false, topology: false }

    const REQ = 60000        // requests / week (fixed)
    const CEIL = 0.203       // affordable ceiling: $29/mo · 70% margin · 100 tasks/user/mo
    const MAX = 0.40         // bar full-scale ($)

    // Deterministic model — start at baseline, apply enabled levers cheapest-first.
    function compute() {
      let spend = 18900
      if (state.caching) spend -= 3900                     // shared prefix cached → 15000
      if (state.tiering) spend = Math.round(spend * 0.58)  // cheap model on easy branches (−42%)
      if (state.topology) spend = Math.round(spend * 0.39655) // fan-out 7 → 3.2 branches → ~3450
      let comp = 0.82
      if (state.tiering) comp = 0.74                        // cheap model misses edge cases
      if (state.topology) comp = 0.80                       // completion recovers
      const cpt = spend / (REQ * comp)                      // cost per COMPLETED task
      const waste = spend * (1 - comp)                      // abandonment waste ($/wk)
      return { spend, comp, cpt, waste }
    }

    const money3 = (x: number) => '$' + x.toFixed(3)

    function rafMoney(node: HTMLElement, to: number, dur: number) {
      if (reduce) { node.textContent = money3(to); node.dataset.val = String(to); return }
      const from = parseFloat(node.dataset.val || '0')
      const t0 = performance.now()
      function step(t: number) {
        const k = Math.min(1, (t - t0) / dur)
        const v = from + (to - from) * (1 - Math.pow(1 - k, 3))
        node.textContent = money3(v); node.dataset.val = String(v)
        if (k < 1) rafs.push(requestAnimationFrame(step))
        else { node.textContent = money3(to); node.dataset.val = String(to) }
      }
      rafs.push(requestAnimationFrame(step))
    }

    function swap(node: HTMLElement, html: string, animate: boolean) {
      if (!animate || reduce) { node.innerHTML = html; return }
      node.style.opacity = '0.35'; node.style.filter = 'blur(2px)'
      setTimeout(() => { node.innerHTML = html; node.style.opacity = '1'; node.style.filter = 'none' }, 120)
    }

    function verdict(cpt: number): string {
      if (cpt <= CEIL) return '<b style="color:var(--acc)">Now it&rsquo;s viable.</b> Note the ORDER got you here &mdash; caching first, then tiering, then topology.'
      if (state.tiering) return 'Spend dropped &mdash; but completion fell <b style="color:var(--warm)">82&rarr;74%</b>. A third of the headline saving evaporated into a number nobody was watching.'
      if (state.caching) return 'One day of work, zero quality change. The uncomfortable part: this <b style="color:var(--t1)">should have been done before launch.</b>'
      return '<b style="color:var(--warm)">$0.384</b> per completed task against a $0.203 ceiling &mdash; your power users are your worst-margin users.'
    }

    function render(animate: boolean) {
      const r = compute()
      const good = r.cpt <= CEIL
      const col = good ? 'var(--acc)' : 'var(--warm)'

      const big = el('#cpt-big')
      big.style.color = col
      if (animate) rafMoney(big, r.cpt, 650)
      else { big.textContent = money3(r.cpt); big.dataset.val = String(r.cpt) }

      el('#cpt-fill').style.width = Math.min(100, (r.cpt / MAX) * 100) + '%'
      el('#cpt-fill').style.background = col

      el('#cpt-spend').textContent = '$' + r.spend.toLocaleString('en-US')
      const waste = el('#cpt-waste'); waste.textContent = '$' + Math.round(r.waste).toLocaleString('en-US')
      const comp = el('#cpt-comp'); comp.textContent = Math.round(r.comp * 100) + '%'
      comp.classList.toggle('warm', r.comp < 0.82)

      swap(el('#cpt-verdict'), verdict(r.cpt), animate)

      ;(['caching', 'tiering', 'topology'] as Lever[]).forEach((lv) => {
        const btn = el('.expl-cpt-lever[data-lever="' + lv + '"]')
        btn.classList.toggle('active', state[lv])
        ;(btn.querySelector('.expl-cpt-lever-pill') as HTMLElement).textContent = state[lv] ? 'on' : 'off'
      })
    }

    // Ceiling marker is fixed — position it once.
    el('#cpt-mark').style.left = (CEIL / MAX) * 100 + '%'

    root.querySelectorAll('.expl-cpt-lever').forEach((b) => b.addEventListener('click', function (this: HTMLElement) {
      const lv = this.dataset.lever as Lever
      state[lv] = !state[lv]
      render(true)
    }, { signal: sig }))

    el('#cpt-reset').addEventListener('click', () => {
      state.caching = false; state.tiering = false; state.topology = false
      render(true)
    }, { signal: sig })

    render(false)

    return () => { ac.abort(); rafs.forEach((id) => cancelAnimationFrame(id)) }
  }, [])

  return (
    <div className="expl-wrap" ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: EXPLAINER_CSS + OWN_CSS }} />
      <h2 className="sr-only">
        Interactive explainer: a 7-branch fan-out runs 60,000 requests a week for $18,900 at 82% completion, giving $0.384 per completed task against a $0.203 affordable ceiling. Toggle three cumulative levers &mdash; prompt caching, model tiering, and rebuilding the topology, applied cheapest-first &mdash; and the cost per completed task falls below the ceiling, but only when the levers are pulled in the right order.
      </h2>

      <div className="expl-head">
        <div className="expl-eyebrow">Interactive · Agent Orchestration · Lesson 6</div>
        <div className="expl-title">Cost per completed task</div>
        <div className="expl-sub">A 7-branch fan-out runs <em>60,000 requests</em> a week for <em>$18,900</em> &mdash; but only 82% of tasks actually finish. Cost per token is the vendor&rsquo;s unit. Pull the levers and watch the one that&rsquo;s yours.</div>
      </div>

      <div className="expl-body">
        <div className="expl-controls">
          <div className="expl-cpt-levers">
            <button className="expl-cpt-lever" data-lever="caching">
              <div className="expl-cpt-lever-main">
                <div className="expl-cpt-lever-name">Prompt caching <span className="expl-cpt-lever-time">1 day</span></div>
                <div className="expl-cpt-lever-eff">Cache the 6k shared prefix sent 7&times; · &minus;$3,900/wk</div>
              </div>
              <span className="expl-cpt-lever-pill">off</span>
            </button>
            <button className="expl-cpt-lever" data-lever="tiering">
              <div className="expl-cpt-lever-main">
                <div className="expl-cpt-lever-name">Model tiering <span className="expl-cpt-lever-time">2 days</span></div>
                <div className="expl-cpt-lever-eff">Cheap model on easy branches · &times;0.58 spend, 82&rarr;74% done</div>
              </div>
              <span className="expl-cpt-lever-pill">off</span>
            </button>
            <button className="expl-cpt-lever" data-lever="topology">
              <div className="expl-cpt-lever-main">
                <div className="expl-cpt-lever-name">Rebuild topology <span className="expl-cpt-lever-time">3 weeks</span></div>
                <div className="expl-cpt-lever-eff">Fan-out 7&rarr;3.2 branches · completion recovers to ~80%</div>
              </div>
              <span className="expl-cpt-lever-pill">off</span>
            </button>
          </div>
          <div className="expl-cpt-order">Cumulative, applied cheapest-first: <b>cache &rarr; tier &rarr; topology</b></div>

          <div className="expl-cpt-metrics">
            <div className="expl-cpt-metric">
              <div className="expl-cpt-metric-l">Weekly spend</div>
              <div className="expl-cpt-metric-v" id="cpt-spend">$18,900</div>
            </div>
            <div className="expl-cpt-metric">
              <div className="expl-cpt-metric-l">Abandonment waste</div>
              <div className="expl-cpt-metric-v warm" id="cpt-waste">$3,402</div>
            </div>
            <div className="expl-cpt-metric">
              <div className="expl-cpt-metric-l">Completion</div>
              <div className="expl-cpt-metric-v" id="cpt-comp">82%</div>
            </div>
          </div>

          <button className="expl-btn expl-cpt-reset" id="cpt-reset">Reset to baseline</button>
        </div>

        <div className="expl-readout">
          <div className="expl-scorelabel">Cost per completed task</div>
          <div className="expl-cpt-big" id="cpt-big" data-val="0.3841463">$0.384</div>
          <div className="expl-bar">
            <div className="expl-bartrack">
              <div className="expl-barfill" id="cpt-fill"></div>
              <div className="expl-mark" id="cpt-mark"><span>ceiling $0.203</span></div>
            </div>
          </div>
          <div className="expl-cpt-ceil">Affordable ceiling <b>$0.203</b> &mdash; $29/mo · 70% margin · 100 tasks/user/mo. Green under it, clay above.</div>
          <div className="expl-verdict" id="cpt-verdict"><b style={{ color: 'var(--warm)' }}>$0.384</b> per completed task against a $0.203 ceiling &mdash; your power users are your worst-margin users.</div>
        </div>
      </div>

      <div className="expl-take">Cost per token is the vendor&rsquo;s unit. Cost per completed task is yours. Pull the levers cheapest-first: <b>cache, tier, topology, price.</b></div>
    </div>
  )
}
