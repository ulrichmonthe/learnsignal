'use client'

import { useEffect, useRef } from 'react'
import { EXPLAINER_CSS, prefersReducedMotion } from './shell'

// ── Reranking Lift ──────────────────────────────────────────────────────────
// Dynamic explainer for RAG · Lesson 6 ("When to add a reranking layer").
// Widening top-K raises recall but buries the answer deep in the list; a
// reranker floats the relevant docs to the top *without touching the embedding*.
// Same predict-then-reveal shape as the honesty-gap gold reference: static
// markup in JSX, one scoped stylesheet (base EXPLAINER_CSS + this viz's CSS),
// and the interaction wired imperatively in one effect so behaviour is exact.
// Chrome uses the shared `.expl-*` classes; the ranked-list viz uses `.expl-rr-*`
// and is scoped by `.expl-wrap`; nothing leaks.

// Deterministic model: a fixed pool of 20 candidates, ranked by the embedding's
// raw similarity (positions 1..20). Exactly 3 are truly relevant, and the
// embedding ranks them mediocrely at positions 3, 11, 17.
const REL = [3, 11, 17]
const POOL = 20
const ROW_H = 26 // px per ranked row (22px row + 4px gap)

const OWN_CSS = `
  .expl-rr-slnote{font-size:9.5px;color:var(--t3);letter-spacing:0.02em;margin-top:7px;font-family:ui-monospace,Menlo,monospace}
  .expl-rr-listwrap{margin-top:2px}
  .expl-rr-listhead{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px}
  .expl-rr-listlbl{font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:var(--t3);font-family:ui-monospace,Menlo,monospace}
  .expl-rr-reads{font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:var(--t3);font-family:ui-monospace,Menlo,monospace}
  .expl-rr-list{position:relative;transition:height .45s var(--e-drawer)}
  .expl-rr-row{position:absolute;left:0;right:0;height:22px;display:flex;align-items:center;gap:10px;padding:0 10px;border-radius:6px;
    background:rgba(255,255,255,0.03);border:0.5px solid var(--line2);
    transition:transform .55s var(--e-drawer),background .3s var(--e-out),border-color .3s var(--e-out),opacity .28s var(--e-out)}
  .expl-rr-row.rel{background:rgba(200,240,64,0.10);border-color:rgba(200,240,64,0.35)}
  .expl-rr-row.top3{box-shadow:inset 2px 0 0 var(--acc)}
  .expl-rr-rank{font-family:ui-monospace,Menlo,monospace;font-size:10px;color:var(--t3);width:18px;text-align:right;font-variant-numeric:tabular-nums;flex:0 0 auto}
  .expl-rr-row.rel .expl-rr-rank{color:var(--acc)}
  .expl-rr-barwrap{flex:1;height:4px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden;min-width:24px}
  .expl-rr-bar{display:block;height:100%;border-radius:3px;background:var(--t3);opacity:0.5}
  .expl-rr-row.rel .expl-rr-bar{background:var(--acc);opacity:1}
  .expl-rr-tag{font-family:ui-monospace,Menlo,monospace;font-size:9px;color:var(--t3);white-space:nowrap;width:132px;text-align:right;text-transform:uppercase;letter-spacing:0.05em;flex:0 0 auto}
  .expl-rr-row.rel .expl-rr-tag{color:var(--acc)}
  @media(max-width:640px){.expl-rr-tag{width:104px}}
  .expl-rr-cut{position:absolute;left:0;right:0;height:0;border-top:0.5px dashed rgba(255,255,255,0.14);pointer-events:none;
    transition:top .45s var(--e-drawer),opacity .3s var(--e-out)}
  .expl-rr-cut span{position:absolute;right:0;top:-8px;font-size:8px;font-family:ui-monospace,Menlo,monospace;color:var(--t3);text-transform:uppercase;letter-spacing:0.08em;background:var(--bg);padding-left:6px}
  .expl-rr-note{font-size:9.5px;color:var(--t3);margin-top:6px;font-family:ui-monospace,Menlo,monospace;line-height:1.5}
  .expl-rr-den{font-size:18px;opacity:0.5;margin-left:1px}
`

export function RerankingLiftExplainer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const ac = new AbortController()
    const sig = ac.signal
    const rafs: number[] = []
    const reduce = prefersReducedMotion()

    const el = (q: string) => root.querySelector(q) as HTMLElement
    const slider = el('#rr-k') as HTMLInputElement
    const listEl = el('#rr-list')
    const cutEl = el('#rr-cut')
    const recallNum = el('#rr-recall-num')
    const topNum = el('#rr-top-num')
    const topBox = el('#rr-top-box')

    let reranker = false

    // Build the 20 candidate rows once; positions/similarity are fixed.
    for (let pos = 1; pos <= POOL; pos++) {
      const isRel = REL.includes(pos)
      const row = document.createElement('div')
      row.className = 'expl-rr-row' + (isRel ? ' rel' : '')
      row.dataset.pos = String(pos)
      row.style.top = (pos - 1) * ROW_H + 'px'
      const w = Math.max(5, Math.round(((POOL + 1 - pos) / POOL) * 100))
      row.innerHTML =
        '<span class="expl-rr-rank"></span>' +
        '<span class="expl-rr-barwrap"><span class="expl-rr-bar" style="width:' + w + '%"></span></span>' +
        '<span class="expl-rr-tag">' + (isRel ? 'relevant' : 'distractor') + ' · sim #' + pos + '</span>'
      listEl.appendChild(row)
    }
    const rows = Array.from(listEl.querySelectorAll('.expl-rr-row')) as HTMLElement[]

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

    function render(animate: boolean) {
      const topK = +slider.value
      el('#rr-kcount').textContent = String(topK)

      // Retrieved = positions 1..topK. Recall depends only on what's retrieved,
      // never on the reranker — the reranker only reorders the retrieved set.
      const relRetrieved = REL.filter((p) => p <= topK)
      const distRetrieved: number[] = []
      for (let p = 1; p <= topK; p++) if (!REL.includes(p)) distRetrieved.push(p)
      // Reading order: reranker floats the retrieved relevant docs to the top.
      const order = reranker ? [...relRetrieved, ...distRetrieved] : (() => {
        const a: number[] = []; for (let p = 1; p <= topK; p++) a.push(p); return a
      })()

      const recallPct = Math.round((relRetrieved.length / 3) * 100)
      // Without a reranker, only the one relevant doc that happens to sit in the
      // embedding's top 3 (position 3) is read. With the reranker, up to 3 of the
      // retrieved relevant docs are lifted into the top 3 the model reads.
      const relInTop3 = reranker ? Math.min(3, relRetrieved.length) : 1

      if (animate) { rafCount(recallNum, recallPct, 600); rafCount(topNum, relInTop3, 600) }
      else {
        recallNum.textContent = String(recallPct); recallNum.dataset.val = String(recallPct)
        topNum.textContent = String(relInTop3); topNum.dataset.val = String(relInTop3)
      }
      topBox.style.color = relInTop3 >= 3 ? 'var(--acc)' : 'var(--warm)'

      // Lay out the ranked list: show only the first topK, reorder by transform.
      listEl.style.height = topK * ROW_H + 'px'
      rows.forEach((row) => {
        const pos = +row.dataset.pos!
        if (pos > topK) { row.classList.add('hidden'); return }
        row.classList.remove('hidden')
        const ti = order.indexOf(pos)
        const dy = (ti - (pos - 1)) * ROW_H
        row.style.transform = 'translateY(' + dy + 'px)'
        ;(row.querySelector('.expl-rr-rank') as HTMLElement).textContent = String(ti + 1).padStart(2, '0')
        row.classList.toggle('top3', ti < 3 && REL.includes(pos))
      })
      // "reads top 3" cutline sits under the 3rd reading slot.
      cutEl.style.top = Math.min(3, topK) * ROW_H - 4 + 'px'
      cutEl.style.opacity = topK >= 3 ? '1' : '0'

      // Verdict + takeaway copy.
      const v = el('#rr-verdict')
      let vh: string
      if (reranker) {
        vh = '<b style="color:var(--acc)">Same embedding, same candidates</b> — the reranker just reordered them. All three relevant docs are now in the <b style="color:var(--acc)">top 3</b> the model reads. This is usually cheaper and higher-leverage than chasing a better embedding.'
      } else if (recallPct >= 100) {
        vh = '<b style="color:var(--acc)">Recall is 100%</b> — you retrieved all three. But two of them sit at ranks <b style="color:var(--warm)">11 and 17</b>; the model reads the top and never sees them. High recall, buried answer.'
      } else {
        vh = 'You only kept <b>' + topK + '</b> — and missed relevant docs entirely. Widening K is the fix for recall… but watch what it does to <b style="color:var(--warm)">what the model actually reads</b>.'
      }
      swap(v, vh, animate)

      // Reflect active state on the K presets and the reranker toggle.
      root!.querySelectorAll('.expl-preset').forEach((b) => {
        const bt = b as HTMLElement
        bt.classList.toggle('active', +bt.dataset.k! === topK)
      })
      const rb = el('#rr-toggle')
      rb.textContent = reranker ? 'Remove reranker' : 'Add reranker'
      rb.setAttribute('aria-pressed', String(reranker))
      rb.classList.toggle('active', reranker)
    }

    slider.addEventListener('input', () => render(false), { signal: sig })
    root.querySelectorAll('.expl-preset').forEach((b) => b.addEventListener('click', function (this: HTMLElement) {
      slider.value = this.dataset.k!; render(true)
    }, { signal: sig }))
    el('#rr-toggle').addEventListener('click', () => { reranker = !reranker; render(true) }, { signal: sig })

    render(false)

    return () => { ac.abort(); rafs.forEach((id) => cancelAnimationFrame(id)) }
  }, [])

  return (
    <div className="expl-wrap" ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: EXPLAINER_CSS + OWN_CSS }} />
      <h2 className="sr-only">
        Interactive explainer: a 20-document candidate pool where the embedding ranks the three relevant docs mediocrely at positions 3, 11, and 17. Widening top-K raises recall to 100% but leaves two relevant docs buried at ranks 11 and 17, so the model that reads only the top still sees just one. Adding a reranker reorders the already-retrieved candidates so all three relevant docs float into the top 3 the model reads, without changing recall or the embedding.
      </h2>

      <div className="expl-head">
        <div className="expl-eyebrow">Interactive · RAG · Lesson 6</div>
        <div className="expl-title">Retrieve broadly, rank precisely</div>
        <div className="expl-sub">The fix for mediocre results is usually a <em>reranker</em>, not a better embedding. Widen top-K to lift recall — then watch how deep the answer gets buried, and what a reranker does about it.</div>
      </div>

      <div className="expl-presets">
        <span className="expl-presets-label">Try:</span>
        <button className="expl-preset" data-k="3">Narrow (K=3)</button>
        <button className="expl-preset" data-k="20">Wide (K=20)</button>
        <button className="expl-btn" id="rr-toggle" aria-pressed="false">Add reranker</button>
      </div>

      <div className="expl-ctl" style={{ marginTop: '16px' }}>
        <div className="expl-ctl-top">
          <span>Retrieve top-K</span>
          <span className="expl-hint">how many candidates you pass to the model</span>
          <span className="expl-count" id="rr-kcount">3</span>
        </div>
        <input type="range" className="expl-slider" min="3" max="20" defaultValue="3" id="rr-k" aria-label="Retrieve top K candidates" />
        <div className="expl-rr-slnote">20 candidates ranked by embedding similarity · 3 are truly relevant (the embedding ranks them at #3, #11, #17)</div>
      </div>

      <div className="expl-body">
        <div className="expl-rr-listwrap">
          <div className="expl-rr-listhead">
            <span className="expl-rr-listlbl">Retrieved, in reading order</span>
            <span className="expl-rr-reads">model reads the top ↓</span>
          </div>
          <div className="expl-rr-list" id="rr-list">
            <div className="expl-rr-cut" id="rr-cut"><span>reads top 3</span></div>
          </div>
        </div>

        <div className="expl-readout">
          <div className="expl-scores">
            <div className="expl-scorebox">
              <div className="expl-scorelabel">Recall @ K</div>
              <div className="expl-scorenum" id="rr-recall-box" style={{ color: 'var(--acc)' }}><span id="rr-recall-num" data-val="33">33</span><span className="expl-pct">%</span></div>
            </div>
            <div className="expl-vs">vs</div>
            <div className="expl-scorebox" id="rr-top-box" style={{ color: 'var(--warm)' }}>
              <div className="expl-scorelabel">Relevant in top 3</div>
              <div className="expl-scorenum"><span id="rr-top-num" data-val="1">1</span><span className="expl-rr-den">/ 3</span></div>
            </div>
          </div>
          <div className="expl-rr-note">Recall@K is what you <em>retrieved</em>. Relevant-in-top-3 is what the model actually <em>reads</em> — and a reranker leaves Recall@K untouched, it only reorders.</div>
          <div className="expl-verdict" id="rr-verdict" style={{ marginTop: '14px' }}></div>
        </div>
      </div>

      <div className="expl-legend">
        <span><i className="expl-sq" style={{ background: 'var(--acc)' }}></i> relevant</span>
        <span><i className="expl-sq" style={{ background: 'var(--t3)' }}></i> distractor</span>
        <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>bar length = raw embedding similarity</span>
      </div>

      <div className="expl-take">
        <b>Retrieve broadly</b> (high K for recall), then <b>rank precisely</b> (a reranker for what the model actually reads). Mediocre results are usually a <b>ranking problem</b>, not an embedding problem.
      </div>
    </div>
  )
}
