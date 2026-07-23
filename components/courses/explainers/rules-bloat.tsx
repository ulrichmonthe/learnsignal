'use client'

import { useEffect, useRef } from 'react'
import { EXPLAINER_CSS, prefersReducedMotion } from './shell'

// ── Rules bloat / the over-specification trap ────────────────────────────────
// Dynamic explainer for Harness · Lesson 3 ("Rules files done right: AGENTS.md
// and the over-specification trap"). One slider — the number of rules in
// AGENTS.md — drives an inverted-U: too few and the essentials aren't written;
// too many and the critical rules compete for attention and get diluted out.
//
// Same shape as the gold reference (honesty-gap): 'use client', one useRef, one
// useEffect wired imperatively with an AbortController signal + cancellable
// rafs, static JSX, and a single scoped stylesheet (shared EXPLAINER_CSS +
// this viz's own `.expl-rb-*` rules). Chrome uses the shared `.expl-*` classes.

const OWN_CSS = `
  .expl-rb-file{margin-top:20px;padding-top:16px;border-top:0.5px dashed var(--line)}
  .expl-rb-file-lbl{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:var(--t3);margin-bottom:8px;display:flex;justify-content:space-between;gap:10px}
  .expl-rb-file-meta{color:var(--t2);font-variant-numeric:tabular-nums}
  .expl-rb-filetrack{position:relative;height:8px;background:rgba(255,255,255,0.06);border-radius:5px;overflow:hidden}
  .expl-rb-filefill{position:absolute;left:0;top:0;height:100%;border-radius:5px;background:var(--acc);width:0;
    transition:width .5s var(--e-drawer),background .3s var(--e-out)}
  .expl-rb-honored{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:11px;color:var(--t2);margin-top:9px;font-variant-numeric:tabular-nums}
  .expl-rb-honored b{font-weight:600;transition:color .25s var(--e-out)}

  .expl-rb-chips-wrap{margin-top:22px;padding-top:18px;border-top:0.5px solid var(--line)}
  .expl-rb-chips-lbl{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9.5px;text-transform:uppercase;letter-spacing:0.08em;color:var(--t3);margin-bottom:10px}
  .expl-rb-chips{display:flex;flex-wrap:wrap;gap:8px}
  .expl-rb-chip{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:11px;padding:6px 11px;border-radius:20px;
    border:0.5px solid var(--line);color:var(--t3);background:transparent;position:relative;
    transition:opacity .38s var(--e-out),transform .38s var(--e-pop),color .3s var(--e-out),border-color .3s var(--e-out),background .3s var(--e-out)}
  .expl-rb-chip::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;margin-right:7px;vertical-align:middle;transition:background .3s var(--e-out)}
  .expl-rb-chip.lit{color:var(--acc);border-color:var(--acc);background:rgba(200,240,64,0.10);opacity:1;transform:scale(1)}
  .expl-rb-chip.dropped{color:var(--warm);border-color:rgba(206,144,121,0.35);text-decoration:line-through;opacity:0.42;transform:scale(0.94)}
  .expl-rb-chip.pending{opacity:0.5;transform:scale(0.97)}
`

type Verdict = { honored: number; score: number; color: string }

export function RulesBloatExplainer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const ac = new AbortController()
    const sig = ac.signal
    const rafs: number[] = []
    const reduce = prefersReducedMotion()

    const CRITICAL = 5
    const MAX = 40
    const el = (q: string) => root.querySelector(q) as HTMLElement
    const slider = el('#rb-slider') as HTMLInputElement

    // ── Deterministic model ────────────────────────────────────────────────
    function criticalHonored(rules: number): number {
      if (rules <= CRITICAL) return Math.min(rules, CRITICAL)
      if (rules <= 12) return CRITICAL
      return Math.max(1, Math.round(CRITICAL - (rules - 12) * 0.18))
    }
    function compute(rules: number): Verdict {
      const honored = criticalHonored(rules)
      const score = Math.round((honored / CRITICAL) * 100)
      const color = honored === CRITICAL ? 'var(--acc)' : honored <= 2 ? 'var(--warm)' : 'var(--t2)'
      return { honored, score, color }
    }

    function rafCount(node: HTMLElement, to: number, dur: number) {
      if (reduce) { node.innerHTML = to + '<span class="expl-pct">%</span>'; node.dataset.val = String(to); return }
      const from = +(node.dataset.val || 0)
      const t0 = performance.now()
      function step(t: number) {
        const k = Math.min(1, (t - t0) / dur)
        const v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)))
        node.innerHTML = v + '<span class="expl-pct">%</span>'; node.dataset.val = String(v)
        if (k < 1) rafs.push(requestAnimationFrame(step)); else node.dataset.val = String(to)
      }
      rafs.push(requestAnimationFrame(step))
    }
    function swap(node: HTMLElement, html: string, animate: boolean) {
      if (!animate || reduce) { node.innerHTML = html; return }
      node.style.opacity = '0.35'; node.style.filter = 'blur(2px)'
      setTimeout(() => { node.innerHTML = html; node.style.opacity = '1'; node.style.filter = 'none' }, 120)
    }

    function render(animate: boolean) {
      const rules = +slider.value
      const { honored, score, color } = compute(rules)
      const zone = rules < 5 ? 'sparse' : rules <= 12 ? 'sweet' : 'bloat'

      // File meter
      el('#rb-count').textContent = String(rules)
      el('#rb-tokens').textContent = '~' + (rules * 22).toLocaleString() + ' tokens'
      const fill = el('#rb-filefill')
      fill.style.width = (rules / MAX) * 100 + '%'
      fill.style.background = zone === 'bloat' ? 'var(--warm)' : 'var(--acc)'

      // Compliance readout
      const num = el('#rb-score')
      num.style.color = score === 0 ? 'var(--t3)' : color
      if (animate) rafCount(num, score, 650)
      else { num.innerHTML = score + '<span class="expl-pct">%</span>'; num.dataset.val = String(score) }

      const hEl = el('#rb-honored-n')
      hEl.textContent = String(honored)
      hEl.style.color = color

      // Chips: lit while written & salient, dropped once diluted out
      root!.querySelectorAll('.expl-rb-chip').forEach((c) => {
        const idx = +(c as HTMLElement).dataset.idx!
        c.classList.remove('lit', 'dropped', 'pending')
        if (idx < honored) c.classList.add('lit')
        else if (rules < 5) c.classList.add('pending') // not written yet
        else c.classList.add('dropped') // present but drowned out
      })

      // Copy
      let vh: string, th: string
      if (zone === 'sparse') {
        vh = '<b style="color:var(--warm)">Under-specified.</b> The essentials aren\'t all written yet — the agent can\'t honor a rule you didn\'t give it.'
        th = 'A rules file starts empty. The first job is to <b>write down</b> the handful of rules the agent must never break.'
      } else if (zone === 'sweet') {
        vh = '<b style="color:var(--acc)">✓ The sweet spot.</b> Every critical rule is present and salient. This is the whole job of a rules file — and you\'re done.'
        th = 'Five rules, all honored. Every one of them still gets the model\'s attention because nothing is competing to drown it out.'
      } else {
        vh = '<b style="color:var(--warm)">▼ Diluted.</b> You kept adding rules, and the critical ones are getting drowned out. <b style="color:var(--warm)">' + honored + ' of 5</b> rules that matter now survive. A longer file bought you a <em style="color:var(--t1);font-style:normal;font-weight:600">LESS</em> obedient agent.'
        th = 'Every rule you add competes for the same finite attention. Past the sweet spot, new rules don\'t add compliance — they <b>steal</b> it from the rules you can\'t afford to lose.'
      }
      swap(el('#rb-verdict'), vh, animate)
      swap(el('#rb-note'), th, animate)

      root!.querySelectorAll('.expl-preset').forEach((b) => {
        const bt = b as HTMLElement
        bt.classList.toggle('active', +bt.dataset.rules! === rules)
      })
    }

    slider.addEventListener('input', () => render(false), { signal: sig })
    root.querySelectorAll('.expl-preset').forEach((b) => b.addEventListener('click', function (this: HTMLElement) {
      slider.value = this.dataset.rules!; render(true)
    }, { signal: sig }))

    render(false)

    return () => { ac.abort(); rafs.forEach((id) => cancelAnimationFrame(id)) }
  }, [])

  return (
    <div className="expl-wrap" ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: EXPLAINER_CSS + OWN_CSS }} />
      <h2 className="sr-only">
        Interactive explainer: a single slider sets how many rules are in your AGENTS.md file. Compliance on the five rules that actually matter follows an inverted U — with too few rules the essentials are never written, and past twelve rules the critical ones compete for attention and wink out one by one, so a bloated 40-rule file honors only one of the five rules that matter.
      </h2>

      <div className="expl-head">
        <div className="expl-eyebrow">Interactive · Harness · Lesson 3</div>
        <div className="expl-title">Rules files done right</div>
        <div className="expl-sub">A longer rules file is not a more obedient agent. It&apos;s usually a <em>worse</em> one. Drag the size of your AGENTS.md and watch what happens to the five rules that actually matter.</div>
      </div>

      <div className="expl-presets">
        <span className="expl-presets-label">Try:</span>
        <button className="expl-preset" data-rules="0">Empty (0)</button>
        <button className="expl-preset" data-rules="8">Tight (8)</button>
        <button className="expl-preset" data-rules="40">Bloated (40)</button>
      </div>

      <div className="expl-body">
        <div className="expl-controls">
          <div className="expl-ctl">
            <div className="expl-ctl-top">
              Rules in AGENTS.md <span className="expl-hint">essentials → bloat</span>
              <span className="expl-count"><span id="rb-count">0</span></span>
            </div>
            <input type="range" min="0" max="40" defaultValue="0" id="rb-slider" className="expl-slider" aria-label="Number of rules in AGENTS.md" />
          </div>

          <div className="expl-rb-file">
            <div className="expl-rb-file-lbl">
              <span>AGENTS.md</span>
              <span className="expl-rb-file-meta" id="rb-tokens">~0 tokens</span>
            </div>
            <div className="expl-rb-filetrack">
              <div className="expl-rb-filefill" id="rb-filefill"></div>
            </div>
          </div>
        </div>

        <div className="expl-readout">
          <div className="expl-scores">
            <div className="expl-scorebox">
              <div className="expl-scorelabel">Compliance on rules that matter</div>
              <div className="expl-scorenum" id="rb-score" data-val="0">0<span className="expl-pct">%</span></div>
              <div className="expl-rb-honored"><b id="rb-honored-n">0</b> of 5 critical rules honored</div>
            </div>
          </div>
          <div className="expl-verdict" id="rb-verdict" style={{ marginTop: 18 }}></div>
        </div>
      </div>

      <div className="expl-rb-chips-wrap">
        <div className="expl-rb-chips-lbl">The 5 rules that actually matter</div>
        <div className="expl-rb-chips">
          <span className="expl-rb-chip pending" data-idx="0">Never force-push</span>
          <span className="expl-rb-chip pending" data-idx="1">Always run tests before commit</span>
          <span className="expl-rb-chip pending" data-idx="2">Never edit prod config</span>
          <span className="expl-rb-chip pending" data-idx="3">Ask before deleting files</span>
          <span className="expl-rb-chip pending" data-idx="4">Stop at the task boundary</span>
        </div>
        <div className="expl-legend">
          <span><i className="expl-sq" style={{ background: 'var(--acc)' }}></i> honored</span>
          <span><i className="expl-sq" style={{ background: 'var(--warm)' }}></i> present but drowned out</span>
        </div>
      </div>

      <div className="expl-take" id="rb-note"></div>

      <div className="expl-take" style={{ marginTop: 10 }}>
        <b>The takeaway:</b> A rules file is a <b>budget</b>, not a wishlist. State the few rules that matter and stop — every extra rule dilutes the ones you can&apos;t afford to lose.
      </div>
    </div>
  )
}
