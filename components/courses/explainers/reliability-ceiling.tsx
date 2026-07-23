'use client'

import { useEffect, useRef } from 'react'

import { EXPLAINER_CSS, prefersReducedMotion } from './shell'

// ── The Reliability Ceiling ──────────────────────────────────────────────────
// Dynamic explainer for Harness · Lesson 2 ("Probabilistic vs deterministic").
// The learner hardens an agent that must never leak a secret: adding prompt
// rules pushes reliability up a diminishing-returns curve that asymptotes toward
// ~99% but never touches 100 — until a deterministic gate snaps it to 100 "by
// construction". A live dial with a hard ceiling, not predict-then-reveal.
//
// Same shape as the gold reference (honesty-gap): static markup in JSX, one
// scoped stylesheet composed of the shared EXPLAINER_CSS chrome plus viz-only
// rules, and the interaction wired imperatively in an effect. Base chrome uses
// `.expl-*`; everything bespoke is prefixed `.expl-rc-*` and scoped by
// `.expl-wrap`, so nothing leaks.

const OWN_CSS = `
  .expl-rc-glabel{margin-top:16px}
  .expl-rc-gains{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0 4px;min-height:24px;align-items:center}
  .expl-rc-gain{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10.5px;padding:3px 7px;border-radius:5px;border:0.5px solid var(--line);font-variant-numeric:tabular-nums;
    transition:opacity .18s var(--e-out),transform .18s var(--e-out),color .18s var(--e-out),border-color .18s var(--e-out)}
  .expl-rc-gain[data-tone=big]{color:var(--acc);border-color:rgba(200,240,64,0.4);background:rgba(200,240,64,0.08)}
  .expl-rc-gain[data-tone=mid]{color:var(--t1)}
  .expl-rc-gain[data-tone=small]{color:var(--warm);border-color:rgba(206,144,121,0.35)}
  .expl-rc-gain[data-tone=off]{color:var(--t3);opacity:0.4}
  .expl-rc-gnote{font-family:"DM Sans",sans-serif;font-size:11px;color:var(--t3);font-style:italic}

  .expl-rc-gaterow{margin-top:16px;padding-top:14px;border-top:0.5px dashed var(--line)}
  .expl-rc-gatehint{font-family:"DM Sans",sans-serif;font-size:11px;color:var(--t3);line-height:1.5;margin-top:9px;max-width:340px}
  .expl-rc-lock{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9.5px;color:var(--warn);letter-spacing:0.02em;margin-top:8px;opacity:0;transition:opacity .2s var(--e-out)}
  .expl-rc-lock.on{opacity:0.9}
  .expl-btn.on{background:var(--acc);color:var(--bg);font-weight:600}

  .expl-rc-leaks{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:12.5px;color:var(--t2);margin-top:11px;letter-spacing:0.01em;transition:color .25s var(--e-out)}
  .expl-rc-leaks b{color:var(--warm);font-weight:600;font-variant-numeric:tabular-nums}
  .expl-rc-leaks.rc-safe{color:var(--t1)}
  .expl-rc-leaks.rc-safe b{color:var(--acc)}

  .expl-rc-track{height:14px}
  .expl-rc-lastpct{position:absolute;top:0;right:0;width:7%;height:100%;pointer-events:none;border-radius:0 5px 5px 0;
    background:linear-gradient(90deg,rgba(206,144,121,0) 0%,rgba(206,144,121,0.22) 100%);transition:opacity .3s var(--e-out)}
  .expl-rc-lastpct.rc-met{opacity:0}
  .expl-rc-ceiling{position:absolute;top:0;right:0;height:100%;border-right:2px dashed var(--warm);transition:border-color .3s var(--e-out)}
  .expl-rc-ceiling span{position:absolute;top:-15px;right:-1px;font-size:8px;font-family:ui-monospace,"SF Mono",Menlo,monospace;color:var(--t3);
    text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap;transition:color .3s var(--e-out)}
  .expl-rc-ceiling.rc-met{border-right-color:var(--acc)}
  .expl-rc-ceiling.rc-met span{color:var(--acc)}
  .expl-barfill.rc-gated{background:var(--pass);box-shadow:0 0 12px rgba(200,240,64,0.35)}
`

export function ReliabilityCeilingExplainer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const ac = new AbortController()
    const sig = ac.signal
    const rafs: number[] = []

    const reduce = prefersReducedMotion()
    const el = (q: string) => root.querySelector(q) as HTMLElement
    const slider = el('#rc-slider') as HTMLInputElement

    // Deterministic model: diminishing returns toward ~99, never 100.
    const rel = (k: number) => 99 - 39 * Math.exp(-0.5 * k)
    const relInt = (k: number) => Math.round(rel(k))
    let gate = false

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
    function gains(host: HTMLElement, n: number, gated: boolean) {
      host.innerHTML = ''
      if (n === 0) { host.innerHTML = '<span class="expl-rc-gnote">baseline 60% — no rules added yet</span>'; return }
      for (let i = 1; i <= n; i++) {
        const g = relInt(i) - relInt(i - 1)
        const chip = document.createElement('span')
        chip.className = 'expl-rc-gain'
        chip.dataset.tone = gated ? 'off' : g >= 8 ? 'big' : g >= 3 ? 'mid' : 'small'
        chip.textContent = '+' + g
        host.appendChild(chip)
      }
    }
    function setGate(on: boolean) {
      gate = on
      const g = el('#rc-gate')
      g.classList.toggle('on', on)
      g.textContent = on ? 'Remove the deterministic gate' : 'Add a deterministic gate'
      el('#rc-lock').classList.toggle('on', on)
    }

    function render(animate: boolean) {
      const n = +slider.value
      el('#rc-n').textContent = String(n)
      const shown = gate ? 100 : relInt(n)

      const num = el('#rc-num')
      num.style.color = gate ? 'var(--pass)' : n >= 6 ? 'var(--warn)' : 'var(--acc)'
      if (animate) rafCount(num, shown, 650)
      else { num.innerHTML = shown + '<span class="expl-pct">%</span>'; num.dataset.val = String(shown) }

      const fill = el('#rc-fill')
      fill.style.width = shown + '%'
      fill.classList.toggle('rc-gated', gate)
      el('#rc-ceiling').classList.toggle('rc-met', gate)
      el('#rc-lastpct').classList.toggle('rc-met', gate)

      const leaks = el('#rc-leaks')
      leaks.classList.toggle('rc-safe', gate)
      if (gate) { leaks.innerHTML = '<b>0</b> — by construction' }
      else { const N = Math.round(100 / (100 - shown)); leaks.innerHTML = '1 leak every ~<b>' + N + '</b> runs' }

      gains(el('#rc-gains'), n, gate)

      let vh: string
      if (gate) {
        vh = '<b style="color:var(--pass)">✓ 100%, by construction.</b> The gate makes the bad output <b style="color:var(--t1)">impossible</b> — not unlikely.'
      } else if (n >= 6) {
        vh = '<b style="color:var(--warn)">You\'re at the wall.</b> ' + shown + '%, and every extra rule buys less. You will never reach 100% this way.'
      } else {
        const N = Math.round(100 / (100 - shown))
        vh = 'At <b style="color:var(--acc)">' + shown + '%</b>, 1 in ' + N + ' runs still leaks — and that run is where the incident lives.'
      }
      swap(el('#rc-verdict'), vh, animate)

      root!.querySelectorAll('.expl-preset').forEach((b) => {
        const bt = b as HTMLElement
        bt.classList.toggle('active', +bt.dataset.n! === n && (bt.dataset.gate === '1') === gate)
      })
    }

    slider.addEventListener('input', () => render(false), { signal: sig })
    el('#rc-gate').addEventListener('click', () => { setGate(!gate); render(true) }, { signal: sig })
    root.querySelectorAll('.expl-preset').forEach((b) => b.addEventListener('click', function (this: HTMLElement) {
      slider.value = this.dataset.n!; setGate(this.dataset.gate === '1'); render(true)
    }, { signal: sig }))

    render(false)

    return () => { ac.abort(); rafs.forEach((id) => cancelAnimationFrame(id)) }
  }, [])

  return (
    <div className="expl-wrap" ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: EXPLAINER_CSS + OWN_CSS }} />
      <h2 className="sr-only">
        Interactive explainer: harden an agent that must never leak a secret. Adding prompt rules lifts reliability from 60% along a diminishing-returns curve that approaches but never reaches 100% — around 98% you are at the wall, with 1 in 50 runs still leaking. Adding a deterministic gate snaps reliability to 100% by construction, dropping leaks to zero, because a code check makes the bad output impossible rather than merely unlikely.
      </h2>

      <div className="expl-head">
        <div className="expl-eyebrow">Interactive · Harness · Lesson 2</div>
        <div className="expl-title">The reliability ceiling</div>
        <div className="expl-sub">You&apos;re hardening an agent that must <em>never</em> leak a secret. Add prompt rules and watch reliability climb — then find the wall it climbs toward but never clears.</div>
      </div>

      <div className="expl-presets">
        <span className="expl-presets-label">Try:</span>
        <button className="expl-preset" data-n="0" data-gate="0">No rules yet</button>
        <button className="expl-preset" data-n="8" data-gate="0">Pile on rules</button>
        <button className="expl-preset" data-n="8" data-gate="1">Add the gate</button>
      </div>

      <div className="expl-body">
        <div className="expl-controls">
          <div className="expl-ctl">
            <div className="expl-ctl-top">Prompt rules added <span className="expl-hint">&ldquo;never reveal&hellip;&rdquo; · &ldquo;refuse if&hellip;&rdquo;</span><span className="expl-count" id="rc-n">0</span></div>
            <input type="range" min="0" max="8" defaultValue="0" id="rc-slider" className="expl-slider" aria-label="Prompt rules added" />
          </div>

          <div className="expl-scorelabel expl-rc-glabel">Marginal gain per rule</div>
          <div className="expl-rc-gains" id="rc-gains"></div>

          <div className="expl-rc-gaterow">
            <button className="expl-btn" id="rc-gate">Add a deterministic gate</button>
            <div className="expl-rc-gatehint">A code check outside the model that refuses any output containing the secret — not another sentence inside the prompt.</div>
            <div className="expl-rc-lock" id="rc-lock">Gate engaged — extra rules change nothing.</div>
          </div>
        </div>

        <div className="expl-readout">
          <div className="expl-scorelabel">Reliability</div>
          <div className="expl-scorenum" id="rc-num" data-val="60">60<span className="expl-pct">%</span></div>
          <div className="expl-rc-leaks" id="rc-leaks">1 leak every ~<b>3</b> runs</div>

          <div className="expl-bar">
            <div className="expl-bartrack expl-rc-track">
              <div className="expl-barfill" id="rc-fill"></div>
              <div className="expl-rc-lastpct" id="rc-lastpct"></div>
              <div className="expl-rc-ceiling" id="rc-ceiling"><span>100% ceiling</span></div>
            </div>
          </div>

          <div className="expl-verdict" id="rc-verdict">At <b style={{ color: 'var(--acc)' }}>60%</b>, 1 in 3 runs still leaks — and that run is where the incident lives.</div>
        </div>
      </div>

      <div className="expl-take">You can prompt your way to 99%. The last percent — the one that actually hurts — needs a <b>deterministic gate</b>, not another sentence.</div>
    </div>
  )
}
