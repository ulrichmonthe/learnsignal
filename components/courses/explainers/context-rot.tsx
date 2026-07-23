'use client'

import { useEffect, useRef } from 'react'
import { EXPLAINER_CSS, prefersReducedMotion } from './shell'

// ── Context Rot ─────────────────────────────────────────────────────────────
// Dynamic explainer for PCE · Lesson 2 ("Your context window is a budget.
// Attention is the currency."). The learner drags one slider — how much context
// they stuff in — and watches task accuracy trace an inverted-U: helping up to a
// sweet spot near 10k, then ROTTING as extra tokens dilute attention, all while
// cost and latency climb the whole way.
//
// Same shape as the honesty-gap gold reference: static markup in JSX, one scoped
// stylesheet (shared chrome + this viz's own rules), and the interaction wired
// imperatively in an effect via an AbortController signal + a cancelled raf list.
// Chrome selectors are `.expl-*`; this component's own rules are `.expl-cr-*`.

const OWN_CSS = `
  .expl-cr-scale{display:flex;justify-content:space-between;margin-top:9px;font-size:9px;color:var(--t3);font-family:ui-monospace,Menlo,monospace;letter-spacing:0.04em}
  .expl-cr-note{margin-top:16px;font-size:11px;line-height:1.5;color:var(--t3);font-family:"DM Sans",sans-serif;max-width:260px}
  .expl-cr-note em{color:var(--t2);font-style:normal}

  .expl-cr-needle{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;letter-spacing:0.04em;margin-top:14px;transition:color .25s var(--e-out)}
  .expl-cr-figs{display:flex;gap:26px;margin-top:16px}
  .expl-cr-fig{display:flex;flex-direction:column;gap:4px}
  .expl-cr-figlabel{font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:var(--t3);font-family:ui-monospace,Menlo,monospace}
  .expl-cr-figval{font-size:17px;color:var(--t2);font-family:ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;letter-spacing:-0.01em}
`

export function ContextRotExplainer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const ac = new AbortController()
    const sig = ac.signal
    const rafs: number[] = []

    const PEAK = 10
    const reduce = prefersReducedMotion()
    const el = (q: string) => root.querySelector(q) as HTMLElement
    const sl = el('#cr-slider') as HTMLInputElement

    // Deterministic model — inverted-U that decays faster on the right (rot).
    function accuracy(k: number): number {
      const a = k <= PEAK ? 60 + (94 - 60) * ((k - 2) / 8) : 94 - 1.15 * (k - PEAK)
      return Math.round(Math.max(30, Math.min(94, a)))
    }
    function accColor(a: number): string {
      return a >= 85 ? 'var(--acc)' : a < 70 ? 'var(--warm)' : 'var(--t2)'
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
      const k = +sl.value
      const a = accuracy(k)
      el('#cr-k').textContent = k + 'k'

      const num = el('#cr-acc')
      num.style.color = accColor(a)
      if (animate) rafCount(num, a, 650)
      else { num.innerHTML = a + '<span class="expl-pct">%</span>'; num.dataset.val = String(a) }

      el('#cr-cost').textContent = '$' + (k * 0.15).toFixed(2)
      el('#cr-lat').textContent = Math.round(300 + k * 45) + ' ms'

      const needle = el('#cr-needle')
      if (a >= 70) { needle.innerHTML = '&#10003;&nbsp; critical instruction found'; needle.style.color = 'var(--acc)' }
      else { needle.innerHTML = '&#10007;&nbsp; buried / ignored'; needle.style.color = 'var(--warm)' }

      const fill = el('#cr-fill')
      fill.style.width = a + '%'
      fill.style.background = accColor(a)

      let vh: string
      if (k < 8) {
        vh = 'More relevant context is still helping — you\'re <b style="color:var(--t1)">under-filling</b>.'
      } else if (k <= 12) {
        vh = '<b style="color:var(--acc)">Peak signal.</b> Every critical token still gets attention.'
      } else {
        vh = '<b style="color:var(--warm)">Past the peak:</b> accuracy is FALLING while cost and latency keep climbing. You didn\'t add capability — you added <b style="color:var(--warm)">noise</b>.'
      }
      swap(el('#cr-verdict'), vh, animate)

      root!.querySelectorAll('.expl-preset').forEach((b) => {
        const bt = b as HTMLElement
        bt.classList.toggle('active', +bt.dataset.k! === k)
      })
    }

    sl.addEventListener('input', () => render(false), { signal: sig })
    root.querySelectorAll('.expl-preset').forEach((b) => b.addEventListener('click', function (this: HTMLElement) {
      sl.value = this.dataset.k!; render(true)
    }, { signal: sig }))

    render(false)

    return () => { ac.abort(); rafs.forEach((id) => cancelAnimationFrame(id)) }
  }, [])

  return (
    <div className="expl-wrap" ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: EXPLAINER_CSS + OWN_CSS }} />
      <h2 className="sr-only">
        Interactive explainer: drag a single slider for how much context you stuff into the window, from 2k to 64k tokens, and watch task accuracy trace an inverted-U — peaking at 94% near a 10k sweet spot, then rotting to 32% at 64k as extra tokens dilute attention, while cost and latency climb the entire way and the one critical instruction goes from found to buried.
      </h2>

      <div className="expl-head">
        <div className="expl-eyebrow">Interactive · PCE · Lesson 2</div>
        <div className="expl-title">Your context window is a budget</div>
        <div className="expl-sub">Attention is the currency. <em>Every token you add makes every other token matter a little less.</em> Drag in more context and watch where helping turns into rotting.</div>
      </div>

      <div className="expl-presets">
        <span className="expl-presets-label">Try:</span>
        <button className="expl-preset" data-k="2">Minimal (2k)</button>
        <button className="expl-preset" data-k="10">Sweet spot (10k)</button>
        <button className="expl-preset" data-k="64">Kitchen sink (64k)</button>
      </div>

      <div className="expl-body">
        <div className="expl-controls">
          <div className="expl-ctl">
            <div className="expl-ctl-top">Context you stuff in <span className="expl-hint">tokens, thousands</span><span className="expl-count" id="cr-k">10k</span></div>
            <input type="range" className="expl-slider" min="2" max="64" step="1" defaultValue="10" id="cr-slider" aria-label="Context stuffed in, thousands of tokens" />
            <div className="expl-cr-scale"><span>2k</span><span>sweet spot ~10k</span><span>64k</span></div>
          </div>
          <div className="expl-cr-note">One <em>critical instruction</em> is hidden in that window. The more you pile in around it, the harder it is for the model to keep paying attention to it.</div>
        </div>

        <div className="expl-readout">
          <div className="expl-scores">
            <div className="expl-scorebox">
              <div className="expl-scorelabel">Task accuracy</div>
              <div className="expl-scorenum" id="cr-acc" data-val="94" style={{ color: 'var(--acc)' }}>94<span className="expl-pct">%</span></div>
            </div>
          </div>
          <div className="expl-cr-needle" id="cr-needle" style={{ color: 'var(--acc)' }}>&#10003;&nbsp; critical instruction found</div>
          <div className="expl-cr-figs">
            <div className="expl-cr-fig"><div className="expl-cr-figlabel">Cost / 1k calls</div><div className="expl-cr-figval" id="cr-cost">$1.50</div></div>
            <div className="expl-cr-fig"><div className="expl-cr-figlabel">Latency</div><div className="expl-cr-figval" id="cr-lat">750 ms</div></div>
          </div>
          <div className="expl-bar">
            <div className="expl-bartrack">
              <div className="expl-barfill" id="cr-fill" style={{ width: '94%', background: 'var(--acc)' }}></div>
              <div className="expl-mark" style={{ left: '94%' }}><span>sweet spot</span></div>
            </div>
          </div>
          <div className="expl-verdict" id="cr-verdict"><b style={{ color: 'var(--acc)' }}>Peak signal.</b> Every critical token still gets attention.</div>
        </div>
      </div>

      <div className="expl-take" id="cr-take">A bigger context window is not more capability past a point — it&apos;s <b>dilution</b>. Aim for the smallest set of high-signal tokens; a full window is slower, pricier, AND dumber at once.</div>
    </div>
  )
}
