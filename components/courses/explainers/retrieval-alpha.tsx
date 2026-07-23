'use client'

import { useEffect, useRef } from 'react'
import { EXPLAINER_CSS, prefersReducedMotion } from './shell'

// ── Retrieval alpha ─────────────────────────────────────────────────────────
// Dynamic explainer for RAG · Lesson 5 ("Dense, sparse, and hybrid retrieval:
// when each wins"). One knob — the hybrid alpha — with a real tradeoff: pure
// lexical nails an exact identifier but is blind to a paraphrase; pure vectors
// understand the paraphrase but can't match the identifier. Hybrid abandons
// neither. Static markup in JSX, one scoped stylesheet (shared chrome +
// viz-specific CSS), interaction wired imperatively in an effect. Chrome
// selectors are `.expl-*`; this viz adds `.expl-ra-*` and nothing leaks.

const OWN_CSS = `
  .expl-ra-endpoints{display:flex;justify-content:space-between;margin-top:9px;font-size:9.5px;color:var(--t3);
    font-family:ui-monospace,"SF Mono",Menlo,monospace;text-transform:uppercase;letter-spacing:0.08em}
  .expl-ra-endpoints b{color:var(--t2);font-weight:400}

  .expl-ra-queries{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:22px;padding-top:18px;border-top:0.5px solid var(--line)}
  @media(max-width:640px){.expl-ra-queries{grid-template-columns:1fr;gap:12px}}
  .expl-ra-q{border:0.5px solid var(--line);border-radius:10px;padding:13px 14px;background:var(--line2)}
  .expl-ra-qtag{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:var(--t3);margin-bottom:7px;display:flex;justify-content:space-between}
  .expl-ra-qtext{font-size:13px;line-height:1.4;color:var(--t1);font-weight:600;margin-bottom:5px;font-family:"DM Sans",sans-serif}
  .expl-ra-qwhy{font-size:11px;line-height:1.45;color:var(--t2);margin-bottom:12px}
  .expl-ra-qstat{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
  .expl-ra-status{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:11px;letter-spacing:0.02em;transition:color .25s var(--e-out)}
  .expl-ra-score{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:11px;color:var(--t2);font-variant-numeric:tabular-nums}
  .expl-ra-qtrack{position:relative;height:6px;background:rgba(255,255,255,0.06);border-radius:4px}
  .expl-ra-qfill{position:absolute;left:0;top:0;height:100%;border-radius:4px;width:0;
    transition:width .5s var(--e-drawer),background .3s var(--e-out)}
  .expl-ra-thresh{position:absolute;top:-3px;left:55%;width:1.5px;height:12px;background:var(--t3);border-radius:2px}
  .expl-ra-thresh span{position:absolute;top:-13px;left:50%;transform:translateX(-50%);font-size:7.5px;
    font-family:ui-monospace,Menlo,monospace;color:var(--t3);text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap}
`

export function RetrievalAlphaExplainer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const ac = new AbortController()
    const sig = ac.signal
    const rafs: number[] = []
    const reduce = prefersReducedMotion()

    const el = (q: string) => root.querySelector(q) as HTMLElement
    const slider = el('#ra-alpha') as HTMLInputElement

    function rafCount(node: HTMLElement, to: number, dur: number) {
      if (reduce) { node.textContent = String(to); node.dataset.val = String(to); return }
      const from = +(node.dataset.val || 0)
      const t0 = performance.now()
      function step(t: number) {
        const k = Math.min(1, (t - t0) / dur)
        const v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)))
        node.textContent = String(v); node.dataset.val = String(v)
        if (k < 1) rafs.push(requestAnimationFrame(step)); else node.dataset.val = String(to)
      }
      rafs.push(requestAnimationFrame(step))
    }

    function swap(node: HTMLElement, html: string, animate: boolean) {
      if (!animate || reduce) { node.innerHTML = html; return }
      node.style.opacity = '0.35'; node.style.filter = 'blur(2px)'
      setTimeout(() => { node.innerHTML = html; node.style.opacity = '1'; node.style.filter = 'none' }, 120)
    }

    function query(fill: string, statusEl: string, scoreEl: string, score: number) {
      const ok = score >= 55
      const col = ok ? 'var(--acc)' : 'var(--warm)'
      const f = el(fill), st = el(statusEl)
      f.style.width = score + '%'; f.style.background = col
      st.textContent = ok ? '✓ gold retrieved' : '✗ gold missed'
      st.style.color = col
      el(scoreEl).textContent = 'score ' + score
    }

    function render(animate: boolean) {
      const alpha = +slider.value
      const score1 = 100 - alpha
      const score2 = alpha
      const ok1 = score1 >= 55
      const ok2 = score2 >= 55
      const combined = Math.round(((score1 + score2) / 2) - 0.5 * Math.abs(score1 - score2))
      const both = ok1 && ok2
      const col = both ? 'var(--acc)' : 'var(--warm)'

      el('#ra-count').textContent = String(alpha)

      const cEl = el('#ra-combined')
      cEl.style.color = col
      if (animate) rafCount(cEl, combined, 650)
      else { cEl.textContent = String(combined); cEl.dataset.val = String(combined) }

      const bar = el('#ra-barfill')
      bar.style.width = combined + '%'; bar.style.background = col

      query('#ra-q1-fill', '#ra-q1-status', '#ra-q1-score', score1)
      query('#ra-q2-fill', '#ra-q2-status', '#ra-q2-score', score2)

      let vh: string
      if (alpha <= 15) {
        vh = 'Pure lexical nails <b style="color:var(--acc)">Section 420</b> — and is blind to the paraphrase. One query served, one abandoned.'
      } else if (alpha >= 85) {
        vh = 'Pure vectors understand the paraphrase — and can’t match an exact identifier. Same trap, other end.'
      } else if (alpha >= 35 && alpha <= 65) {
        vh = '<b style="color:var(--acc)">Hybrid retrieves BOTH.</b> Neither query is perfectly served, but nothing is abandoned — and that’s the job.'
      } else {
        vh = 'You’re leaning one way; one query is starting to fall out.'
      }
      swap(el('#ra-verdict'), vh, animate)

      root!.querySelectorAll('.expl-preset').forEach((b) => {
        const bt = b as HTMLElement
        bt.classList.toggle('active', +bt.dataset.alpha! === alpha)
      })
    }

    slider.addEventListener('input', () => render(false), { signal: sig })
    root.querySelectorAll('.expl-preset').forEach((b) => b.addEventListener('click', function (this: HTMLElement) {
      slider.value = this.dataset.alpha!; render(true)
    }, { signal: sig }))

    render(false)

    return () => { ac.abort(); rafs.forEach((id) => cancelAnimationFrame(id)) }
  }, [])

  return (
    <div className="expl-wrap" ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: EXPLAINER_CSS + OWN_CSS }} />
      <h2 className="sr-only">
        Interactive explainer: one hybrid-alpha slider trades a pure lexical (BM25) retriever against a pure dense (vector) retriever across two queries — an exact identifier &quot;Section 420(b)&quot; that only lexical matches, and a keyword-free paraphrase of a fraud clause that only vectors match. Each extreme serves one query and abandons the other; the combined score peaks at hybrid, where neither query is perfectly served but nothing is abandoned.
      </h2>

      <div className="expl-head">
        <div className="expl-eyebrow">Interactive · RAG · Lesson 5</div>
        <div className="expl-title">Dense, sparse, and hybrid retrieval</div>
        <div className="expl-sub"><em>&quot;Section 420&quot;</em> must match exactly. <em>&quot;What if someone lies for money?&quot;</em> needs meaning. Neither alone is enough — drag the alpha and watch each query win or fall out.</div>
      </div>

      <div className="expl-presets">
        <span className="expl-presets-label">Try:</span>
        <button className="expl-preset" data-alpha="0">Sparse (BM25)</button>
        <button className="expl-preset" data-alpha="50">Hybrid</button>
        <button className="expl-preset" data-alpha="100">Dense (vectors)</button>
      </div>

      <div className="expl-body">
        <div className="expl-controls">
          <div className="expl-ctl">
            <div className="expl-ctl-top">Hybrid alpha <span className="expl-hint">0 = lexical · 100 = semantic</span><span className="expl-count" id="ra-count">50</span></div>
            <input type="range" min="0" max="100" defaultValue="50" id="ra-alpha" className="expl-slider" aria-label="Hybrid retrieval alpha" />
            <div className="expl-ra-endpoints"><span><b>Sparse</b> — exact terms</span><span>meaning — <b>Dense</b></span></div>
          </div>
        </div>

        <div className="expl-readout">
          <div className="expl-scorebox">
            <div className="expl-scorelabel">Combined retrieval</div>
            <div className="expl-scorenum" id="ra-combined" data-val="50">50</div>
          </div>
          <div className="expl-bar">
            <div className="expl-bartrack">
              <div className="expl-barfill" id="ra-barfill"></div>
            </div>
          </div>
          <div className="expl-verdict" id="ra-verdict"><b style={{ color: 'var(--acc)' }}>Hybrid retrieves BOTH.</b> Neither query is perfectly served, but nothing is abandoned — and that&rsquo;s the job.</div>
        </div>
      </div>

      <div className="expl-ra-queries">
        <div className="expl-ra-q">
          <div className="expl-ra-qtag"><span>Q1 · Lexical</span><span>sparse ✓ · dense ✗</span></div>
          <div className="expl-ra-qtext">&quot;Refund policy — Section 420(b)&quot;</div>
          <div className="expl-ra-qwhy">An exact identifier. BM25 matches the token <em>420</em>; vectors have no keyword to grip.</div>
          <div className="expl-ra-qstat"><span className="expl-ra-status" id="ra-q1-status">✓ gold retrieved</span><span className="expl-ra-score" id="ra-q1-score">score 50</span></div>
          <div className="expl-ra-qtrack"><div className="expl-ra-qfill" id="ra-q1-fill"></div><div className="expl-ra-thresh"><span>≥55 to retrieve</span></div></div>
        </div>
        <div className="expl-ra-q">
          <div className="expl-ra-qtag"><span>Q2 · Semantic</span><span>dense ✓ · sparse ✗</span></div>
          <div className="expl-ra-qtext">&quot;What if someone lies about a purchase to get money back?&quot;</div>
          <div className="expl-ra-qwhy">A paraphrase of a fraud clause with <em>no shared keywords</em>. Only meaning finds it.</div>
          <div className="expl-ra-qstat"><span className="expl-ra-status" id="ra-q2-status">✗ gold missed</span><span className="expl-ra-score" id="ra-q2-score">score 50</span></div>
          <div className="expl-ra-qtrack"><div className="expl-ra-qfill" id="ra-q2-fill"></div><div className="expl-ra-thresh"><span>≥55 to retrieve</span></div></div>
        </div>
      </div>

      <div className="expl-legend">
        <span><i className="expl-sq" style={{ background: 'var(--acc)' }}></i> retrieved (score ≥ 55)</span>
        <span><i className="expl-sq" style={{ background: 'var(--warm)' }}></i> missed</span>
      </div>

      <div className="expl-take">
        Exact identifiers need <b>lexical match</b>; paraphrases need <b>meaning</b>. Vector-only is not a default — most real corpora need hybrid, and the alpha is a <b>product decision</b>.
      </div>
    </div>
  )
}
