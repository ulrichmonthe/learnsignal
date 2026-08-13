'use client'

import { useEffect, useRef } from 'react'
import { EXPLAINER_CSS, prefersReducedMotion } from './shell'

// ── Blast radius ─────────────────────────────────────────────────────────────
// Dynamic explainer for Agent Orchestration · Lesson 9 ("Autonomy and least
// agency" — headline: "Reversibility justifies autonomy more than accuracy
// does."). Framed by the real scenario: a support agent issuing refunds directly
// under £50, median refund £23, and — if nobody looks until Monday — a 55-hour
// detection window. Drag the cap, the rate, and the detection latency to watch
// the blast radius explode; then flip the reversibility switch to see the SAME
// number go from "fine" to "unacceptable".
//
// Same shape as the approved honesty-gap prototype: static markup in JSX, one
// scoped stylesheet (shared EXPLAINER_CSS + our own), and the interaction wired
// imperatively in an effect so behaviour is exact. Chrome uses `.expl-*`; the
// viz-specific selectors are `.expl-br-*` and scoped by `.expl-wrap`.

const OWN_CSS = `
  .expl-br-scenario{font-size:11px;line-height:1.5;color:var(--t3);margin-top:10px;font-family:ui-monospace,Menlo,monospace}
  .expl-br-scenario b{color:var(--warn);font-weight:400}

  .expl-br-blastlabel{font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:var(--t3);margin-bottom:5px;font-family:ui-monospace,Menlo,monospace}
  .expl-br-blastnum{font-size:44px;font-weight:600;line-height:1;letter-spacing:-0.02em;font-variant-numeric:tabular-nums;transition:color .25s var(--e-out)}
  .expl-br-blastsub{font-size:10px;color:var(--t3);margin-top:6px;font-family:ui-monospace,Menlo,monospace}

  .expl-br-work{font-family:ui-monospace,Menlo,monospace;font-size:12px;line-height:1.6;color:var(--t2);margin-top:16px;letter-spacing:0.01em}
  .expl-br-work b{color:var(--t1);font-weight:600}
  .expl-br-work .expl-br-actions{color:var(--acc);font-weight:600}

  .expl-br-rev{margin-top:20px;padding-top:16px;border-top:0.5px dashed var(--line)}
  .expl-br-rev-label{font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:var(--t3);margin-bottom:9px;font-family:ui-monospace,Menlo,monospace}
  .expl-br-chips{display:flex;gap:7px;flex-wrap:wrap}
  .expl-br-chip{background:transparent;border:0.5px solid var(--line);color:var(--t2);font-size:11px;padding:6px 12px;border-radius:8px;cursor:pointer;font-family:ui-monospace,"SF Mono",Menlo,monospace;
    transition:border-color .18s var(--e-out),color .18s var(--e-out),background .18s var(--e-out),transform .12s var(--e-out)}
  .expl-br-chip:hover{border-color:rgba(200,240,64,0.5);color:var(--t1)}
  .expl-br-chip:active{transform:scale(0.96)}
  .expl-br-chip.active{background:rgba(200,240,64,0.10);border-color:var(--acc);color:var(--acc)}
  .expl-br-chip[data-rev="3"].active{background:rgba(206,144,121,0.14);border-color:var(--warm);color:var(--warm)}

  .expl-br-verdict-tag{font-family:ui-monospace,Menlo,monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;margin-right:6px}
`

type Rev = 0 | 1 | 2 | 3

export function BlastRadiusExplainer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const ac = new AbortController()
    const sig = ac.signal
    const rafs: number[] = []

    const MAX_BLAST = 500 * 100 * 72 // slider ceilings → log-scale reference
    const reduce = prefersReducedMotion()
    const el = (q: string) => root.querySelector(q) as HTMLElement
    const smv = el('#br-mv') as HTMLInputElement
    const srate = el('#br-rate') as HTMLInputElement
    const sdet = el('#br-det') as HTMLInputElement
    let rev: Rev = 1 // default: cheap reversal (a refund)

    const fmt = (n: number) => '£' + Math.round(n).toLocaleString('en-GB')

    function rafCount(node: HTMLElement, to: number, dur: number) {
      if (reduce) { node.textContent = fmt(to); node.dataset.val = String(to); return }
      const from = +(node.dataset.val || 0)
      const t0 = performance.now()
      function step(t: number) {
        const k = Math.min(1, (t - t0) / dur)
        const v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)))
        node.textContent = fmt(v); node.dataset.val = String(v)
        if (k < 1) rafs.push(requestAnimationFrame(step)); else node.dataset.val = String(to)
      }
      rafs.push(requestAnimationFrame(step))
    }
    function swap(node: HTMLElement, html: string, animate: boolean) {
      if (!animate || reduce) { node.innerHTML = html; return }
      node.style.opacity = '0.35'; node.style.filter = 'blur(2px)'
      setTimeout(() => { node.innerHTML = html; node.style.opacity = '1'; node.style.filter = 'none' }, 120)
    }
    function tone(blast: number) {
      return blast < 2000 ? 'var(--acc)' : blast < 25000 ? 'var(--warn)' : 'var(--warm)'
    }

    function render(animate: boolean) {
      const mv = +smv.value, rate = +srate.value, detect = +sdet.value
      const actions = rate * detect
      const blast = mv * actions
      const color = tone(blast)

      el('#br-cmv').textContent = '£' + mv
      el('#br-crate').textContent = rate + '/hr'
      el('#br-cdet').textContent = detect + 'h'

      const big = el('#br-blast')
      big.style.color = blast === 0 ? 'var(--t3)' : color
      if (animate) rafCount(big, blast, 650)
      else { big.textContent = fmt(blast); big.dataset.val = String(blast) }

      el('#br-work').innerHTML =
        '<b>£' + mv + '</b> × <b>' + rate + '/hr</b> × <b>' + detect + 'h</b> = ' +
        '<span class="expl-br-actions">' + actions.toLocaleString('en-GB') + ' actions</span>'

      const w = blast <= 0 ? 0 : Math.max(2, Math.min(100, (Math.log10(blast) / Math.log10(MAX_BLAST)) * 100))
      const fill = el('#br-fill')
      fill.style.width = w + '%'
      fill.style.background = blast === 0 ? 'var(--t3)' : color

      const large = blast >= 2000
      const reversible = rev < 3
      let tag: string, tagc: string, body: string
      if (blast === 0) {
        tag = 'Zero'; tagc = 'var(--t3)'
        body = 'A human executes; the agent only proposes. No value moves without a click — the honest baseline every autonomy decision is measured against.'
      } else if (!reversible) {
        tag = 'Human stays'; tagc = 'var(--warm)'
        body = 'Irreversible actions keep a human, permanently. It does not matter how good the numbers are — when it goes wrong, "the system decided" is not an answer that survives a board.'
      } else if (large) {
        tag = 'Recoverable'; tagc = 'var(--warn)'
        body = 'Recoverable — but do this multiplication BEFORE you grant the permission, not after the incident. And fix detection: a 55-hour window is the real problem, not the model.'
      } else {
        tag = 'Bounded'; tagc = 'var(--acc)'
        body = 'Bounded. A capped, instrumented, audited autonomous system can be safer than an eleven-second human click that provides zero real review.'
      }
      swap(el('#br-verdict'),
        '<span class="expl-br-verdict-tag" style="color:' + tagc + '">' + tag + '</span>' + body,
        animate)

      root!.querySelectorAll('.expl-preset').forEach((b) => {
        const bt = b as HTMLElement
        bt.classList.toggle('active', +bt.dataset.mv! === mv && +bt.dataset.rate! === rate && +bt.dataset.det! === detect)
      })
      root!.querySelectorAll('.expl-br-chip').forEach((b) => {
        const bt = b as HTMLElement
        bt.classList.toggle('active', +bt.dataset.rev! === rev)
      })
    }

    ;[smv, srate, sdet].forEach((x) => x.addEventListener('input', () => render(false), { signal: sig }))
    root.querySelectorAll('.expl-preset').forEach((b) => b.addEventListener('click', function (this: HTMLElement) {
      smv.value = this.dataset.mv!; srate.value = this.dataset.rate!; sdet.value = this.dataset.det!; render(true)
    }, { signal: sig }))
    root.querySelectorAll('.expl-br-chip').forEach((b) => b.addEventListener('click', function (this: HTMLElement) {
      rev = +this.dataset.rev! as Rev; render(true)
    }, { signal: sig }))

    render(false)

    return () => { ac.abort(); rafs.forEach((id) => cancelAnimationFrame(id)) }
  }, [])

  return (
    <div className="expl-wrap" ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: EXPLAINER_CSS + OWN_CSS }} />
      <h2 className="sr-only">
        Interactive explainer: set a support agent&apos;s per-action refund cap, its actions-per-hour rate, and the detection latency in hours; the blast radius is cap times rate times latency. The default £50 cap at 30 actions an hour over a 55-hour weekend window is £82,500. A reversibility selector shows the same blast radius is bounded when reversal is free but unacceptable when the action is irreversible — reversibility justifies autonomy more than accuracy does.
      </h2>

      <div className="expl-head">
        <div className="expl-eyebrow">Interactive · Agent Orchestration · Lesson 9</div>
        <div className="expl-title">Blast radius</div>
        <div className="expl-sub">Your support agent issues refunds directly, no human, under <em>£50</em> each. Median refund is £23. If nobody looks until Monday, that&apos;s a <em>55-hour</em> detection window. So — how much can it move before anyone notices?</div>
        <div className="expl-br-scenario">Autonomy is not free. It is the <b>most value it can move before you catch it</b>.</div>
      </div>

      <div className="expl-presets">
        <span className="expl-presets-label">Try:</span>
        <button className="expl-preset" data-mv="50" data-rate="30" data-det="55">The £50 cap, nobody looks till Monday</button>
        <button className="expl-preset" data-mv="20" data-rate="30" data-det="1">Capped + fast detection</button>
        <button className="expl-preset" data-mv="0" data-rate="30" data-det="55">Human executes (£0)</button>
      </div>

      <div className="expl-body">
        <div className="expl-controls">
          <div className="expl-ctl">
            <div className="expl-ctl-top">Max value per action <span className="expl-hint">the cap you grant</span><span className="expl-count" id="br-cmv">£50</span></div>
            <input className="expl-slider" type="range" min="10" max="500" step="5" defaultValue="50" id="br-mv" aria-label="Maximum value per action in pounds" />
          </div>
          <div className="expl-ctl">
            <div className="expl-ctl-top">Max actions per hour <span className="expl-hint">throughput</span><span className="expl-count" id="br-crate">30/hr</span></div>
            <input className="expl-slider" type="range" min="1" max="100" step="1" defaultValue="30" id="br-rate" aria-label="Maximum actions per hour" />
          </div>
          <div className="expl-ctl">
            <div className="expl-ctl-top">Detection latency <span className="expl-hint">until someone looks</span><span className="expl-count" id="br-cdet">55h</span></div>
            <input className="expl-slider" type="range" min="1" max="72" step="1" defaultValue="55" id="br-det" aria-label="Detection latency in hours" />
          </div>

          <div className="expl-br-rev">
            <div className="expl-br-rev-label">If it goes wrong, reversing one action is…</div>
            <div className="expl-br-chips">
              <button className="expl-br-chip" data-rev="0">Free reversal</button>
              <button className="expl-br-chip" data-rev="1">Cheap reversal</button>
              <button className="expl-br-chip" data-rev="2">Expensive reversal</button>
              <button className="expl-br-chip" data-rev="3">Irreversible</button>
            </div>
          </div>
        </div>

        <div className="expl-readout">
          <div className="expl-br-blastlabel">Blast radius</div>
          <div className="expl-br-blastnum" id="br-blast" data-val="82500">£82,500</div>
          <div className="expl-br-blastsub">value it can move before detection</div>

          <div className="expl-bar">
            <div className="expl-bartrack">
              <div className="expl-barfill" id="br-fill"></div>
            </div>
          </div>

          <div className="expl-br-work" id="br-work"></div>

          <div className="expl-verdict" id="br-verdict"></div>
        </div>
      </div>

      <div className="expl-take">
        <b>Blast radius = max value per action × max actions before someone notices.</b> Reversibility justifies autonomy more than accuracy does — a 90%-accurate agent doing reversible things beats a 99%-accurate one doing irreversible ones.
      </div>
    </div>
  )
}
