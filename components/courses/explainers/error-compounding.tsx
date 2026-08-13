'use client'

import { useEffect, useRef } from 'react'
import { EXPLAINER_CSS, prefersReducedMotion } from './shell'

// ── Error compounding ───────────────────────────────────────────────────────
// Dynamic explainer for Agent Orchestration · Lesson 5 ("Reliability: how
// chains lie to you"). Two sliders — chain length and per-stage accuracy — feed
// the one equation that matters: endToEnd = perStage ^ stages. The big readout
// makes the counterintuitive multiplication tangible; the stage pills make the
// chain length physical; the derived figures translate the percentage into the
// two things a PM actually feels (how often a run is wrong, and whether four
// clean demos in a row is even likely).
//
// Same shape as the gold reference honesty-gap.tsx: static markup in JSX, one
// scoped stylesheet (shared chrome + own viz CSS), interaction wired
// imperatively in a single effect with an AbortController on every listener and
// rafs cancelled on cleanup. Chrome selectors are `.expl-*`; this viz owns
// `.expl-ec-*`; nothing leaks.

const OWN_CSS = `
  .expl-ec-pills-lbl{font-family:ui-monospace,Menlo,monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:var(--t3);margin:18px 0 8px}
  .expl-ec-pills{display:flex;flex-wrap:wrap;gap:5px;min-height:26px}
  .expl-ec-pill{font-family:ui-monospace,Menlo,monospace;font-size:10px;padding:4px 7px;border-radius:6px;background:rgba(255,255,255,0.05);border:0.5px solid var(--line);color:var(--t2);
    font-variant-numeric:tabular-nums;animation:ecpop .34s var(--e-pop) both}
  @keyframes ecpop{from{opacity:0;transform:scale(0.55)}to{opacity:1;transform:scale(1)}}

  .expl-ec-facts{margin-top:20px;display:flex;flex-direction:column;gap:8px}
  .expl-ec-fact{font-family:ui-monospace,Menlo,monospace;font-size:11px;color:var(--t2);display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:9px 11px;border-radius:7px;background:rgba(255,255,255,0.03);border:0.5px solid var(--line2)}
  .expl-ec-fact-lbl{color:var(--t3)}
  .expl-ec-fact b{color:var(--t1);font-weight:600;font-variant-numeric:tabular-nums}

  @media(prefers-reduced-motion:reduce){.expl-ec-pill{animation:none}}
`

export function ErrorCompoundingExplainer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const ac = new AbortController()
    const sig = ac.signal
    const rafs: number[] = []

    const reduce = prefersReducedMotion()
    const el = (q: string) => root.querySelector(q) as HTMLElement
    const sn = el('#ec-n') as HTMLInputElement
    const sa = el('#ec-a') as HTMLInputElement

    function fmtA(a: number): string {
      const r = Math.round(a * 10) / 10
      return r % 1 === 0 ? String(r) : r.toFixed(1)
    }
    function color(ee: number): string {
      return ee >= 95 ? 'var(--acc)' : ee < 85 ? 'var(--warm)' : 'var(--t2)'
    }
    function setNum(node: HTMLElement, v: number) {
      node.innerHTML = v.toFixed(1) + '<span class="expl-pct">%</span>'
      node.dataset.val = String(v)
    }
    function rafCount(node: HTMLElement, to: number, dur: number, animate: boolean) {
      if (!animate || reduce) { setNum(node, to); return }
      const from = +(node.dataset.val || 0)
      const t0 = performance.now()
      function step(t: number) {
        const k = Math.min(1, (t - t0) / dur)
        const v = from + (to - from) * (1 - Math.pow(1 - k, 3))
        setNum(node, v)
        if (k < 1) rafs.push(requestAnimationFrame(step)); else setNum(node, to)
      }
      rafs.push(requestAnimationFrame(step))
    }
    function swap(node: HTMLElement, html: string, animate: boolean) {
      if (!animate || reduce) { node.innerHTML = html; return }
      node.style.opacity = '0.35'; node.style.filter = 'blur(2px)'
      setTimeout(() => { node.innerHTML = html; node.style.opacity = '1'; node.style.filter = 'none' }, 120)
    }
    function pills(n: number, a: number) {
      const host = el('#ec-pills')
      if (host.children.length !== n) {
        host.innerHTML = ''
        for (let i = 0; i < n; i++) {
          const p = document.createElement('span')
          p.className = 'expl-ec-pill'
          host.appendChild(p)
        }
      }
      const label = fmtA(a) + '%'
      Array.from(host.children).forEach((c) => { (c as HTMLElement).textContent = label })
    }

    function render(animate: boolean) {
      const n = +sn.value, a = +sa.value
      const frac = Math.pow(a / 100, n)
      const ee = frac * 100

      el('#ec-cn').textContent = String(n)
      el('#ec-ca').textContent = fmtA(a) + '%'

      const num = el('#ec-num')
      num.style.color = color(ee)
      rafCount(num, ee, 650, animate)

      pills(n, a)

      const wrong = Math.round(1 / (1 - frac))
      const demos = Math.round(Math.pow(frac, 4) * 100)
      el('#ec-wrong').innerHTML = '1 wrong run in <b>' + wrong + '</b>'
      el('#ec-demos').innerHTML = '<b>' + demos + '%</b>'

      let vh: string
      if (ee < 85) {
        vh = '<b style="color:var(--warm)">One run in ' + wrong + ' is wrong end-to-end</b> — and every stage individually looked fine in review.'
      } else if (ee < 95) {
        vh = 'Better, but still lossy. Notice how much of the loss is just stage <b>COUNT</b>, not stage quality.'
      } else {
        vh = '<b style="color:var(--acc)">This survives</b> — but only because the components are near-perfect or there are few of them.'
      }
      swap(el('#ec-verdict'), vh, animate)

      root!.querySelectorAll('.expl-preset').forEach((b) => {
        const bt = b as HTMLElement
        bt.classList.toggle('active', +bt.dataset.n! === n && +bt.dataset.a! === a)
      })
    }

    ;[sn, sa].forEach((x) => x.addEventListener('input', () => render(false), { signal: sig }))
    root.querySelectorAll('.expl-preset').forEach((b) => b.addEventListener('click', function (this: HTMLElement) {
      sn.value = this.dataset.n!; sa.value = this.dataset.a!; render(true)
    }, { signal: sig }))

    render(false)

    return () => { ac.abort(); rafs.forEach((id) => cancelAnimationFrame(id)) }
  }, [])

  return (
    <div className="expl-wrap" ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: EXPLAINER_CSS + OWN_CSS }} />
      <h2 className="sr-only">
        Interactive explainer: two sliders set a chain&apos;s length and each stage&apos;s accuracy; the end-to-end accuracy is the product of the per-stage rates, so five stages at ninety-five percent is a seventy-seven percent system. Derived figures show how often a full run is wrong and how unlikely four clean demos in a row become.
      </h2>

      <div className="expl-head">
        <div className="expl-eyebrow">Interactive · Agent Orchestration · Lesson 5</div>
        <div className="expl-title">Reliability: how chains lie to you</div>
        <div className="expl-sub">Five stages at <em>95%</em> is a 77% system — because end-to-end accuracy is the <em>product</em>, not the average. Set the chain and watch the number fall.</div>
      </div>

      <div className="expl-presets">
        <span className="expl-presets-label">Try:</span>
        <button className="expl-preset" data-n="5" data-a="95">5 × 95%</button>
        <button className="expl-preset" data-n="8" data-a="98">8 × 98%</button>
        <button className="expl-preset" data-n="3" data-a="99.5">3 × 99.5%</button>
      </div>

      <div className="expl-body">
        <div className="expl-controls">
          <div className="expl-ctl">
            <div className="expl-ctl-top">Stages in the chain <span className="expl-hint">length</span><span className="expl-count" id="ec-cn">5</span></div>
            <input type="range" className="expl-slider" min="1" max="12" step="1" defaultValue="5" id="ec-n" aria-label="Number of stages in the chain" />
          </div>
          <div className="expl-ctl">
            <div className="expl-ctl-top">Per-stage accuracy <span className="expl-hint">looks fine in review</span><span className="expl-count" id="ec-ca">95%</span></div>
            <input type="range" className="expl-slider" min="80" max="99.9" step="0.1" defaultValue="95" id="ec-a" aria-label="Per-stage accuracy percentage" />
          </div>

          <div className="expl-ec-pills-lbl">The chain, stage by stage</div>
          <div className="expl-ec-pills" id="ec-pills"></div>
        </div>

        <div className="expl-readout">
          <div className="expl-scores">
            <div className="expl-scorebox">
              <div className="expl-scorelabel">End-to-end accuracy</div>
              <div className="expl-scorenum" id="ec-num" data-val="77.4" style={{ color: 'var(--warm)' }}>77.4<span className="expl-pct">%</span></div>
            </div>
          </div>

          <div className="expl-ec-facts">
            <div className="expl-ec-fact"><span className="expl-ec-fact-lbl">Full-run failure odds</span><span id="ec-wrong"></span></div>
            <div className="expl-ec-fact"><span className="expl-ec-fact-lbl">4 clean demos in a row</span><span id="ec-demos"></span></div>
          </div>

          <div className="expl-verdict" id="ec-verdict" style={{ marginTop: '18px' }}></div>
        </div>
      </div>

      <div className="expl-take">
        End-to-end accuracy is <b>the product, not the average</b>. Deleting a stage is usually cheaper than improving one — and PMs almost never propose it.
      </div>
    </div>
  )
}
