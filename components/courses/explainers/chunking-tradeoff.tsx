'use client'

import { useEffect, useRef } from 'react'
import { EXPLAINER_CSS, prefersReducedMotion } from './shell'

// ── Chunking: the tradeoff ──────────────────────────────────────────────────
// Dynamic explainer for RAG · Lesson 4 ("Chunking: the decision nobody takes
// seriously enough"). One slider sets chunk size over a fixed 8-sentence
// passage where a key fact — who announced the 60-day refund window — depends
// on two sentences (the speaker's NAME and the CLAIM) landing in the SAME
// chunk. Too small and the name splits off; too large and the chunk drowns the
// fact in unrelated topics. There is a doc-dependent sweet spot at size 3.
//
// Same shape as the approved honesty-gap prototype: static markup in JSX, one
// scoped stylesheet (base EXPLAINER_CSS chrome + our own `.expl-ck-*` viz), the
// interaction wired imperatively in a single effect. All custom selectors are
// `.expl-ck-*` and scoped by `.expl-wrap`; nothing leaks.

const OWN_CSS = `
  .expl-ck-query{font-family:ui-monospace,Menlo,monospace;font-size:10.5px;line-height:1.5;color:var(--t2);margin-bottom:11px;padding:8px 11px;border-radius:7px;background:rgba(255,255,255,0.03);border:0.5px solid var(--line)}
  .expl-ck-query b{color:var(--acc);font-weight:400}

  .expl-ck-passage{display:flex;flex-direction:column;gap:3px}
  .expl-ck-row{display:flex;align-items:center;gap:9px;padding:7px 10px;border-left:2px solid var(--line2);border-radius:0 7px 7px 0;background:rgba(255,255,255,0.02);
    transition:background .25s var(--e-out),border-color .25s var(--e-out)}
  .expl-ck-sep{margin-top:8px}
  .expl-ck-cn{font-family:ui-monospace,Menlo,monospace;font-size:9px;color:var(--t3);min-width:14px;text-align:center;flex:0 0 auto;transition:color .25s var(--e-out)}
  .expl-ck-txt{font-size:12px;line-height:1.4;color:var(--t2);flex:1;transition:color .25s var(--e-out)}
  .expl-ck-best{background:rgba(200,240,64,0.09);border-left-color:var(--acc)}
  .expl-ck-best .expl-ck-txt{color:var(--t1)}
  .expl-ck-best .expl-ck-cn{color:var(--acc)}
  .expl-ck-split{border-left-color:var(--warm);background:rgba(206,144,121,0.11)}
  .expl-ck-split .expl-ck-txt{color:var(--t1)}
  .expl-ck-tag{font-family:ui-monospace,Menlo,monospace;font-size:8px;text-transform:uppercase;letter-spacing:0.07em;padding:2px 7px;border-radius:20px;border:0.5px solid var(--line);color:var(--t3);white-space:nowrap;flex:0 0 auto}
  .expl-ck-tag.acc{color:var(--acc);border-color:rgba(200,240,64,0.4)}
  .expl-ck-tag.warm{color:var(--warm);border-color:rgba(206,144,121,0.4)}

  .expl-ck-chunks{font-family:ui-monospace,Menlo,monospace;font-size:9.5px;color:var(--t3);margin-top:10px}

  .expl-ck-status{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;line-height:1.45;margin:12px 0 2px;min-height:16px;transition:color .25s var(--e-out)}
`

const SENTENCES = [
  "Acme's Q3 refund policy was revised last spring.",
  'The revision was announced by the VP of Support, Jane Okafor.',
  'It extends the refund window from 30 to 60 days.',
  'Enterprise accounts are exempt from the change.',
  'The policy applies to purchases made after April 1.',
  'Customers must request refunds through the billing portal.',
  'Partial refunds are not supported under the new rule.',
  'The change was piloted with a small cohort before rollout.',
]

// Base retrieval quality by chunk size (inverted-U). The same-chunk penalty
// (name idx 1 vs claim idx 2 splitting apart) is applied on top in quality().
const QUAL: Record<number, number> = { 1: 45, 2: 62, 3: 88, 4: 80, 5: 72, 6: 66, 7: 58, 8: 52 }

export function ChunkingTradeoffExplainer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const ac = new AbortController()
    const sig = ac.signal
    const rafs: number[] = []
    const reduce = prefersReducedMotion()
    const el = (q: string) => root.querySelector(q) as HTMLElement
    const slider = el('#ck-slider') as HTMLInputElement

    // name idx 1 and claim idx 2 must share a chunk to answer the query.
    const sameChunk = (cs: number) => Math.floor(1 / cs) === Math.floor(2 / cs)
    const quality = (cs: number) => {
      let q = QUAL[cs]
      if (!sameChunk(cs)) q = Math.min(q, 55) // name split from claim → cap
      return Math.round(q)
    }
    const colorFor = (q: number) => (q >= 80 ? 'var(--acc)' : q < 60 ? 'var(--warm)' : 'var(--t2)')

    function setNum(node: HTMLElement, v: number) {
      node.innerHTML = v + '<span class="expl-pct">%</span>'
      node.dataset.val = String(v)
    }
    function rafCount(node: HTMLElement, to: number, dur: number) {
      if (reduce) { setNum(node, to); return }
      const from = +(node.dataset.val || 0)
      const t0 = performance.now()
      function step(t: number) {
        const k = Math.min(1, (t - t0) / dur)
        const v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)))
        setNum(node, v)
        if (k < 1) rafs.push(requestAnimationFrame(step)); else node.dataset.val = String(to)
      }
      rafs.push(requestAnimationFrame(step))
    }
    function swap(node: HTMLElement, html: string, animate: boolean) {
      if (!animate || reduce) { node.innerHTML = html; return }
      node.style.opacity = '0.35'; node.style.filter = 'blur(2px)'
      setTimeout(() => { node.innerHTML = html; node.style.opacity = '1'; node.style.filter = 'none' }, 120)
    }

    function passageHTML(cs: number, claimChunk: number, same: boolean) {
      let html = ''
      let prev = -1
      for (let i = 0; i < SENTENCES.length; i++) {
        const ch = Math.floor(i / cs)
        const sep = i > 0 && ch !== prev ? ' expl-ck-sep' : ''
        const best = ch === claimChunk ? ' expl-ck-best' : ''
        const split = i === 1 && !same ? ' expl-ck-split' : ''
        let tag = ''
        if (i === 1) tag = same
          ? '<span class="expl-ck-tag acc">name</span>'
          : '<span class="expl-ck-tag warm">name · split off</span>'
        else if (i === 2) tag = '<span class="expl-ck-tag acc">claim</span>'
        html += '<div class="expl-ck-row' + sep + best + split + '">' +
          '<span class="expl-ck-cn">' + (ch + 1) + '</span>' +
          '<span class="expl-ck-txt">' + SENTENCES[i] + '</span>' + tag + '</div>'
        prev = ch
      }
      return html
    }

    function render(animate: boolean) {
      const cs = +slider.value
      const same = sameChunk(cs)
      const claimChunk = Math.floor(2 / cs)
      const q = quality(cs)
      const nChunks = Math.ceil(SENTENCES.length / cs)
      const col = colorFor(q)

      el('#ck-count').textContent = String(cs)
      el('#ck-passage').innerHTML = passageHTML(cs, claimChunk, same)
      el('#ck-chunks').textContent = nChunks + ' chunk' + (nChunks === 1 ? '' : 's') +
        ' · ' + cs + ' sentence' + (cs === 1 ? '' : 's') + ' each'

      const num = el('#ck-num')
      num.style.color = col
      if (animate) rafCount(num, q, 600); else setNum(num, q)

      el('#ck-barfill').style.width = q + '%'
      el('#ck-barfill').style.background = col

      const st = el('#ck-status')
      if (same) {
        st.style.color = 'var(--acc)'
        st.textContent = '✓ name + claim in one chunk'
      } else {
        st.style.color = 'var(--warm)'
        st.textContent = "✗ speaker's name split into a different chunk"
      }

      let vh: string
      if (!same) {
        vh = '<b style="color:var(--warm)">Broken.</b> The chunk with the 60-day claim doesn\'t contain Jane Okafor\'s name — retrieval returns the claim, the model can\'t say who announced it, and it may hallucinate a name.'
      } else if (cs <= 4) {
        vh = '<b style="color:var(--acc)">Answerable.</b> Name and claim ride together in one focused chunk. Answerable, and nothing extraneous dilutes the match.'
      } else {
        vh = '<b style="color:var(--warn)">Diluted.</b> The fact is in there, but the chunk now also covers exemptions and the billing portal — the embedding is muddy and retrieval precision drops.'
      }
      swap(el('#ck-verdict'), vh, animate)

      root!.querySelectorAll('.expl-preset').forEach((b) => {
        const bt = b as HTMLElement
        bt.classList.toggle('active', +bt.dataset.cs! === cs)
      })
    }

    slider.addEventListener('input', () => render(false), { signal: sig })
    root.querySelectorAll('.expl-preset').forEach((b) => b.addEventListener('click', function (this: HTMLElement) {
      slider.value = this.dataset.cs!
      render(true)
    }, { signal: sig }))

    render(false)

    return () => { ac.abort(); rafs.forEach((id) => cancelAnimationFrame(id)) }
  }, [])

  return (
    <div className="expl-wrap" ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: EXPLAINER_CSS + OWN_CSS }} />
      <h2 className="sr-only">
        Interactive explainer: a slider sets chunk size over an eight-sentence passage. At size 1 or 2 the speaker&apos;s name splits into a different chunk from the 60-day refund claim and retrieval quality collapses; at size 3 both land in one focused chunk for an 88 percent peak; past size 5 the chunk absorbs unrelated sentences about exemptions and the billing portal, muddying the embedding so quality declines to 52 percent.
      </h2>

      <div className="expl-head">
        <div className="expl-eyebrow">Interactive · RAG · Lesson 4</div>
        <div className="expl-title">Chunking: the decision nobody takes seriously enough</div>
        <div className="expl-sub">The wrong split drops the speaker&apos;s name and breaks the answer. There is <em>no one right size</em> — chunk size is a tradeoff with a sweet spot that depends on the document.</div>
      </div>

      <div className="expl-presets">
        <span className="expl-presets-label">Try:</span>
        <button className="expl-preset" data-cs="1">Too small (1)</button>
        <button className="expl-preset" data-cs="3">Sweet spot (3)</button>
        <button className="expl-preset" data-cs="8">Too large (8)</button>
      </div>

      <div className="expl-body">
        <div className="expl-controls">
          <div className="expl-ctl">
            <div className="expl-ctl-top">Chunk size <span className="expl-hint">sentences per chunk</span><span className="expl-count" id="ck-count">3</span></div>
            <input type="range" min="1" max="8" defaultValue="3" id="ck-slider" className="expl-slider" aria-label="Chunk size in sentences per chunk" />
          </div>

          <div className="expl-ck-query">Query: <b>Who announced the 60-day refund window?</b> — needs the name and the claim in one retrieved chunk.</div>

          <div className="expl-ck-passage" id="ck-passage"></div>
          <div className="expl-ck-chunks" id="ck-chunks"></div>
        </div>

        <div className="expl-readout">
          <div className="expl-scores">
            <div className="expl-scorebox">
              <div className="expl-scorelabel">Retrieval quality</div>
              <div className="expl-scorenum" id="ck-num" data-val="88">88<span className="expl-pct">%</span></div>
            </div>
          </div>

          <div className="expl-ck-status" id="ck-status"></div>

          <div className="expl-bar">
            <div className="expl-bartrack">
              <div className="expl-barfill" id="ck-barfill"></div>
              <div className="expl-mark" style={{ left: '88%' }}><span>peak</span></div>
            </div>
          </div>

          <div className="expl-verdict" id="ck-verdict"></div>
        </div>
      </div>

      <div className="expl-take" id="ck-take">There is <b>no universal chunk size</b> — it&apos;s a function of your document&apos;s structure. Chunk so the facts that must be answered together <b>stay together</b>; test it against real queries, don&apos;t guess.</div>
    </div>
  )
}
