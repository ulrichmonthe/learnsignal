'use client'

import { useEffect, useRef } from 'react'

// ── The Honesty Gap ─────────────────────────────────────────────────────────
// Dynamic explainer for Evals · Lesson 3 ("Your eval set is only as honest as
// the inputs you put into it"). Compose an eval set from production / stress /
// edge inputs, then reveal how the score it reports diverges from the agent's
// true quality. Predict-then-reveal, on-brand motion (Emil easing tokens).
//
// Ported verbatim from the approved prototype: static markup in JSX, one scoped
// stylesheet, and the interaction wired imperatively in an effect so behaviour
// matches the prototype exactly. All selectors are prefixed `hg-` and scoped by
// `.hg-wrap`; nothing leaks.

const CSS = `
  .hg-wrap{
    --acc:#C8F040; --pass:#C8F040; --fail:#E8785A; --warn:#F0C24B;
    --bg:#100f0c; --line:rgba(255,255,255,0.10);
    --t1:rgba(255,255,255,0.92); --t2:rgba(255,255,255,0.62); --t3:rgba(255,255,255,0.38);
    --e-out:cubic-bezier(0.23,1,0.32,1);
    --e-drawer:cubic-bezier(0.32,0.72,0,1);
    --e-pop:cubic-bezier(0.34,1.56,0.64,1);
    background:var(--bg); border:0.5px solid rgba(200,240,64,0.22); border-radius:14px;
    padding:22px 22px 20px; color:var(--t1); position:relative;
    font-family:"DM Sans",ui-sans-serif,system-ui,-apple-system,sans-serif;
    max-width:100%; box-sizing:border-box;
  }
  .hg-wrap *{box-sizing:border-box}
  .hg-wrap .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  .hg-wrap .hidden{display:none!important}
  .hg-eyebrow,.hg-count,.hg-scorelabel,.hg-presets-label,.hg-preset,.hg-hint,.hg-legend,.hg-verdict,.hg-scorenum,.hg-reveal-btn,.hg-traffic-lbl,.hg-traffic-key,.hg-col-h{font-family:ui-monospace,"SF Mono",Menlo,monospace}
  .hg-eyebrow{font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--acc);margin-bottom:8px}
  .hg-title{font-size:23px;font-weight:600;font-style:italic;letter-spacing:-0.01em;margin-bottom:7px;font-family:"DM Sans",sans-serif}
  .hg-sub{font-size:13.5px;line-height:1.55;color:var(--t2);max-width:640px}
  .hg-sub em{color:var(--t1);font-style:normal;font-weight:600}

  .hg-presets{display:flex;align-items:center;gap:8px;margin:18px 0 4px;flex-wrap:wrap}
  .hg-presets-label{font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:var(--t3)}
  .hg-preset{background:transparent;border:0.5px solid var(--line);color:var(--t2);font-size:11px;padding:6px 11px;border-radius:20px;cursor:pointer;
    transition:border-color .18s var(--e-out),color .18s var(--e-out),background .18s var(--e-out),transform .12s var(--e-out)}
  .hg-preset:hover{border-color:rgba(200,240,64,0.5);color:var(--t1)}
  .hg-preset:active{transform:scale(0.97)}
  .hg-preset.active{background:rgba(200,240,64,0.10);border-color:var(--acc);color:var(--acc)}

  .hg-body{display:grid;grid-template-columns:1.05fr 0.95fr;gap:26px;margin-top:16px;align-items:start}
  @media(max-width:640px){.hg-body{grid-template-columns:1fr;gap:22px}}

  .hg-ctl{margin-bottom:15px}
  .hg-ctl-top{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--t2);margin-bottom:8px}
  .hg-hint{font-size:9.5px;color:var(--t3);letter-spacing:0.02em}
  .hg-count{margin-left:auto;font-size:13px;color:var(--t1);min-width:22px;text-align:right}
  .hg-dot{width:9px;height:9px;border-radius:2px;display:inline-block;flex:0 0 auto}
  .hg-dot-p{background:var(--pass)}.hg-dot-s{background:var(--warn)}.hg-dot-e{background:var(--fail)}
  .hg-ctl input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:3px;border-radius:3px;background:rgba(255,255,255,0.12);outline:none}
  .hg-ctl input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;background:var(--acc);cursor:pointer;border:2px solid var(--bg)}
  .hg-ctl input[type=range]::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:var(--acc);cursor:pointer;border:2px solid var(--bg)}

  .hg-traffic{margin-top:22px;padding-top:16px;border-top:0.5px dashed var(--line)}
  .hg-traffic-lbl{font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:var(--t3);margin-bottom:7px}
  .hg-traffic-bar{display:flex;height:8px;border-radius:5px;overflow:hidden;gap:1.5px}
  .hg-traffic-bar span{display:block;height:100%}
  .hg-tp{background:var(--pass);opacity:.85}.hg-ts{background:var(--warn);opacity:.85}.hg-te{background:var(--fail);opacity:.85}
  .hg-traffic-key{display:flex;justify-content:space-between;margin-top:6px;font-size:9px;color:var(--t3)}

  .hg-readout{border-left:0.5px solid var(--line);padding-left:24px}
  @media(max-width:640px){.hg-readout{border-left:none;padding-left:0;border-top:0.5px solid var(--line);padding-top:18px}}
  .hg-scores{display:flex;align-items:flex-end;gap:14px}
  .hg-scorebox{flex:1;position:relative}
  .hg-scorelabel{font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:var(--t3);margin-bottom:4px}
  .hg-scorenum{font-size:42px;font-weight:600;line-height:1;letter-spacing:-0.02em;transition:color .25s var(--e-out)}
  .hg-true{color:var(--t2);transform-origin:left center;opacity:0;transform:scale(0.9)}
  .hg-true.hg-in{opacity:1;transform:scale(1);transition:opacity .4s var(--e-out),transform .5s var(--e-pop)}
  .hg-pct{font-size:18px;opacity:0.55;margin-left:1px}
  .hg-vs{font-size:10px;color:var(--t3);text-transform:uppercase;padding-bottom:11px}
  .hg-reveal-btn{margin-top:3px;background:rgba(200,240,64,0.08);border:0.5px solid var(--acc);color:var(--acc);font-size:11px;padding:7px 12px;border-radius:7px;cursor:pointer;
    transition:background .18s var(--e-out),transform .16s var(--e-out),opacity .18s var(--e-out);letter-spacing:0.03em}
  .hg-reveal-btn:hover{background:rgba(200,240,64,0.16)}
  .hg-reveal-btn:active{transform:scale(0.97)}
  .hg-reveal-btn.leaving{opacity:0;transform:scale(0.95)}

  .hg-gapbar{margin:18px 0 12px}
  .hg-gaptrack{position:relative;height:8px;background:rgba(255,255,255,0.06);border-radius:5px}
  .hg-gapband{position:absolute;top:0;height:100%;background:rgba(232,120,90,0.22);border-radius:2px;width:0;left:0;opacity:0;
    transition:width .55s var(--e-drawer) .12s,left .55s var(--e-drawer) .12s,opacity .3s var(--e-out) .12s}
  .hg-gapfill{position:absolute;left:0;top:0;height:100%;border-radius:5px;background:var(--acc);width:92%;
    transition:width .5s var(--e-drawer),background .3s var(--e-out)}
  .hg-truthmark{position:absolute;top:-4px;width:2px;height:16px;background:var(--t1);border-radius:2px;transform-origin:bottom center;
    transition:left .55s var(--e-drawer) .05s,opacity .35s var(--e-out) .05s,transform .4s var(--e-pop) .05s}
  .hg-truthmark.hidden{opacity:0;transform:scaleY(0.4)}
  .hg-truthmark span{position:absolute;top:-15px;left:50%;transform:translateX(-50%);font-size:8px;font-family:ui-monospace,Menlo,monospace;color:var(--t2);text-transform:uppercase;letter-spacing:0.08em}
  .hg-verdict{font-size:12px;line-height:1.55;letter-spacing:0.01em;min-height:34px;transition:opacity .16s var(--e-out),filter .16s var(--e-out)}

  .hg-field{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:22px;padding-top:18px;border-top:0.5px solid var(--line)}
  @media(max-width:640px){.hg-field{gap:9px}}
  .hg-col-h{font-size:9.5px;text-transform:uppercase;letter-spacing:0.08em;color:var(--t3);margin-bottom:8px;display:flex;justify-content:space-between}
  .hg-col-rate{color:var(--t2)}
  .hg-dots{display:flex;flex-wrap:wrap;gap:3px;min-height:34px;align-content:flex-start}
  .hg-cell{width:8px;height:8px;border-radius:2px}
  .hg-cell.hg-fail{cursor:help}
  .hg-pass{background:var(--pass)}.hg-fail{background:var(--fail)}
  .hg-empty{font-size:10px;color:var(--t3);font-style:italic;font-family:"DM Sans",sans-serif}

  .hg-legend{display:flex;gap:16px;align-items:center;margin-top:14px;font-size:10px;color:var(--t3);flex-wrap:wrap}
  .hg-lg{display:flex;align-items:center;gap:6px}
  .hg-legend-hint{color:var(--t3);opacity:.7}
  .hg-sq{width:8px;height:8px;border-radius:2px;display:inline-block}
  .hg-lg-note{margin-left:auto;color:var(--t3);font-style:italic}

  .hg-take{margin-top:18px;padding:13px 15px;border-radius:9px;background:rgba(200,240,64,0.05);border:0.5px solid rgba(200,240,64,0.22);font-size:13px;line-height:1.55;color:var(--t1);
    transition:opacity .16s var(--e-out),filter .16s var(--e-out)}
  .hg-take b{color:var(--acc);font-weight:600}

  .hg-tip{position:absolute;z-index:20;pointer-events:none;opacity:0;transform:translateY(3px) scale(0.97);transform-origin:top left;
    transition:opacity .14s var(--e-out),transform .14s var(--e-out);
    background:#1c1b16;border:0.5px solid var(--line);border-left:2px solid var(--fail);border-radius:6px;padding:7px 10px;font-size:11px;line-height:1.4;color:var(--t1);max-width:210px;font-family:"DM Sans",sans-serif;box-shadow:0 6px 20px rgba(0,0,0,0.4)}
  .hg-tip.show{opacity:1;transform:translateY(0) scale(1)}
  .hg-tip b{color:var(--fail);font-family:ui-monospace,Menlo,monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:2px}

  @media(prefers-reduced-motion:reduce){
    .hg-wrap *{transition-duration:0.01ms!important;animation-duration:0.01ms!important}
  }
`

export function HonestyGapExplainer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const ac = new AbortController()
    const sig = ac.signal
    const rafs: number[] = []

    const RATE: Record<string, number> = { p: 0.92, s: 0.55, e: 0.4 }
    const MIX: Record<string, number> = { p: 0.68, s: 0.17, e: 0.15 }
    const TRUE = Math.round(100 * (RATE.p * MIX.p + RATE.s * MIX.s + RATE.e * MIX.e))
    const BAND = 6
    let revealed = false
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches
    const el = (q: string) => root.querySelector(q) as HTMLElement
    const sp = el('#hg-p') as HTMLInputElement
    const ss = el('#hg-s') as HTMLInputElement
    const se = el('#hg-e') as HTMLInputElement
    const tip = el('#hg-tip')

    const FAILS: Record<string, string[]> = {
      p: ['Confident answer to an ambiguous refund request', 'Missed a policy exception buried in the ticket'],
      s: ['5-word ticket ("Help") → hallucinated the context', '500-word essay → summarized away the actual ask', 'Sarcasm ("Oh GREAT, another bug") read as positive', 'Emoji-only ticket → misrouted', 'Mixed-language ticket → second language dropped'],
      e: ['Multi-issue ticket → second issue silently dropped', 'Prompt-injection line in the ticket → followed it', 'Should-escalate but no trigger keyword → missed', 'Ambiguous intent ("Something seems off") → wrong category'],
    }

    function rafCount(node: HTMLElement, to: number, dur: number) {
      if (reduce) { node.innerHTML = to + '<span class="hg-pct">%</span>'; node.dataset.val = String(to); return }
      const from = +(node.dataset.val || 0)
      const t0 = performance.now()
      function step(t: number) {
        const k = Math.min(1, (t - t0) / dur)
        const v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)))
        node.innerHTML = v + '<span class="hg-pct">%</span>'; node.dataset.val = String(v)
        if (k < 1) rafs.push(requestAnimationFrame(step)); else node.dataset.val = String(to)
      }
      rafs.push(requestAnimationFrame(step))
    }
    function swap(node: HTMLElement, html: string, animate: boolean) {
      if (!animate || reduce) { node.innerHTML = html; return }
      node.style.opacity = '0.35'; node.style.filter = 'blur(2px)'
      setTimeout(() => { node.innerHTML = html; node.style.opacity = '1'; node.style.filter = 'none' }, 120)
    }
    function classify(ev: number) {
      const d = ev - TRUE
      return d > BAND ? { k: 'flat', c: 'var(--warn)' } : d < -BAND ? { k: 'harsh', c: 'var(--fail)' } : { k: 'honest', c: 'var(--pass)' }
    }
    function dots(cat: string, n: number, host: HTMLElement) {
      host.innerHTML = ''
      if (n === 0) { host.innerHTML = '<span class="hg-empty">not tested</span>'; return }
      const shown = Math.min(n, 48), pass = Math.round(shown * RATE[cat])
      for (let i = 0; i < shown; i++) {
        const c = document.createElement('span')
        if (i < pass) { c.className = 'hg-cell hg-pass' }
        else { c.className = 'hg-cell hg-fail'; c.dataset.fail = FAILS[cat][(i - pass) % FAILS[cat].length]; c.dataset.cat = cat }
        host.appendChild(c)
      }
    }

    function render(animate: boolean) {
      const p = +sp.value, s = +ss.value, e = +se.value, tot = p + s + e
      el('#hg-cp').textContent = String(p); el('#hg-cs').textContent = String(s); el('#hg-ce').textContent = String(e)
      const ev = tot ? Math.round(100 * (p * RATE.p + s * RATE.s + e * RATE.e) / tot) : null
      const cls = ev === null ? null : classify(ev)
      const evEl = el('#hg-eval')

      if (ev === null) { evEl.innerHTML = '—'; evEl.dataset.val = '0'; evEl.style.color = 'var(--t3)' }
      else { evEl.style.color = revealed ? cls!.c : 'var(--pass)'; if (animate) rafCount(evEl, ev, 650); else { evEl.innerHTML = ev + '<span class="hg-pct">%</span>'; evEl.dataset.val = String(ev) } }

      el('#hg-gapfill').style.width = (ev === null ? 0 : ev) + '%'
      el('#hg-gapfill').style.background = ev === null ? 'var(--t3)' : (revealed ? cls!.c : 'var(--pass)')
      if (revealed && ev !== null) {
        el('#hg-truthmark').style.left = TRUE + '%'
        const lo = Math.min(ev, TRUE), hi = Math.max(ev, TRUE), band = el('#hg-gapband')
        band.style.left = lo + '%'; band.style.width = (hi - lo) + '%'; band.style.opacity = '1'
      } else { el('#hg-gapband').style.opacity = '0' }

      const v = el('#hg-verdict'), t = el('#hg-take')
      let vh: string, th: string
      if (!revealed) {
        vh = 'You\'d ship this. <b style="color:var(--pass)">' + (ev === null ? '—' : ev + '%') + '</b> looks great — but you only tested the easy column. <span style="color:var(--acc)">Reveal the truth →</span>'
        th = 'An eval set is a <b>sample</b> of reality. Right now you\'re sampling mostly the inputs the agent is already good at.'
      } else if (ev === null) {
        vh = '<span style="color:var(--t3)">Add some inputs to run the eval.</span>'
        th = 'An eval set is a <b>sample</b> of reality. What it measures depends entirely on what you put in it.'
      } else if (cls!.k === 'flat') {
        vh = '<b style="color:var(--warn)">▲ Flattering by ' + (ev - TRUE) + ' points.</b> Your set skips the inputs the agent is worst at.'
        th = 'The agent didn\'t get better — you just stopped testing where it\'s weak. The red failures on stress and edge are <b>still there</b>; your eval never looked.'
      } else if (cls!.k === 'harsh') {
        vh = '<b style="color:var(--fail)">▼ Harsh by ' + (TRUE - ev) + ' points.</b> Real users rarely send this many hard cases.'
        th = 'Over-weighting edge cases turns your eval into an <b>adversarial test</b> — useful for hardening, but it no longer reflects a typical user\'s experience.'
      } else {
        vh = '<b style="color:var(--pass)">✓ Honest.</b> Within ' + BAND + ' points of the truth — this set tells you what\'s real.'
        th = 'This is what the <b>60 / 25 / 15 split</b> buys: enough production to reflect real use, enough stress and edge to keep the eval <b>honest</b>.'
      }
      swap(v, vh, animate); swap(t, th, animate)

      dots('p', p, el('#hg-dp')); dots('s', s, el('#hg-ds')); dots('e', e, el('#hg-de'))
      el('#hg-rp').textContent = Math.round(RATE.p * 100) + '%'
      el('#hg-rs').textContent = Math.round(RATE.s * 100) + '%'
      el('#hg-re').textContent = Math.round(RATE.e * 100) + '%'
      el('#hg-fieldnote').textContent = (e === 0 || s === 0) ? 'columns at 0 = failures you never see' : ''

      root!.querySelectorAll('.hg-preset').forEach((b) => {
        const bt = b as HTMLElement
        bt.classList.toggle('active', +bt.dataset.p! === p && +bt.dataset.s! === s && +bt.dataset.e! === e)
      })
    }

    el('#hg-field').innerHTML =
      '<div><div class="hg-col-h"><span>Production</span><span class="hg-col-rate" id="hg-rp"></span></div><div class="hg-dots" id="hg-dp"></div></div>' +
      '<div><div class="hg-col-h"><span>Stress</span><span class="hg-col-rate" id="hg-rs"></span></div><div class="hg-dots" id="hg-ds"></div></div>' +
      '<div><div class="hg-col-h"><span>Edge</span><span class="hg-col-rate" id="hg-re"></span></div><div class="hg-dots" id="hg-de"></div></div>'

    el('#hg-reveal').addEventListener('click', function (this: HTMLElement) {
      revealed = true; this.classList.add('leaving')
      const btn = this; setTimeout(() => { btn.style.display = 'none' }, 180)
      const tn = el('#hg-truth'); tn.classList.remove('hidden'); void tn.offsetWidth; tn.classList.add('hg-in')
      el('#hg-truthmark').classList.remove('hidden'); rafCount(tn, TRUE, 900); render(true)
    }, { signal: sig })

    const field = el('#hg-field')
    field.addEventListener('mouseover', (ev) => {
      const c = ev.target as HTMLElement
      if (!c.dataset || !c.dataset.fail) return
      const cat = c.dataset.cat, name = cat === 's' ? 'Stress failure' : cat === 'e' ? 'Edge failure' : 'Production miss'
      tip.innerHTML = '<b>' + name + '</b>' + c.dataset.fail
      const wr = root!.getBoundingClientRect(), r = c.getBoundingClientRect()
      let x = r.left - wr.left + 12; const y = r.top - wr.top - 8
      if (x > wr.width - 220) x = wr.width - 220
      tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.classList.add('show')
    }, { signal: sig })
    field.addEventListener('mouseout', (ev) => {
      const c = ev.target as HTMLElement
      if (c.dataset && c.dataset.fail) tip.classList.remove('show')
    }, { signal: sig })

    ;[sp, ss, se].forEach((x) => x.addEventListener('input', () => render(false), { signal: sig }))
    root.querySelectorAll('.hg-preset').forEach((b) => b.addEventListener('click', function (this: HTMLElement) {
      sp.value = this.dataset.p!; ss.value = this.dataset.s!; se.value = this.dataset.e!; render(true)
    }, { signal: sig }))

    render(false)

    return () => { ac.abort(); rafs.forEach((id) => cancelAnimationFrame(id)) }
  }, [])

  return (
    <div className="hg-wrap" ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <h2 className="sr-only">
        Interactive explainer: compose an eval set from happy-path, stress, and edge inputs and see a flattering 92% score; revealing the agent&apos;s true quality of 78% exposes the honesty gap, and the failing inputs you never tested are named on hover.
      </h2>

      <div className="hg-head">
        <div className="hg-eyebrow">Interactive · Evals · Lesson 3</div>
        <div className="hg-title">The honesty gap</div>
        <div className="hg-sub">You grabbed the last 50 support tickets and ran your eval. It says <em>92%</em>. Ship it? Compose the set below — then reveal what&apos;s actually true.</div>
      </div>

      <div className="hg-presets">
        <span className="hg-presets-label">Try:</span>
        <button className="hg-preset" data-p="50" data-s="0" data-e="0">The last 50 tickets</button>
        <button className="hg-preset" data-p="60" data-s="15" data-e="25">The 60 / 25 / 15 split</button>
        <button className="hg-preset" data-p="20" data-s="30" data-e="50">Edge-heavy</button>
      </div>

      <div className="hg-body">
        <div className="hg-controls">
          <div className="hg-ctl">
            <div className="hg-ctl-top"><span className="hg-dot hg-dot-p"></span> Production sample <span className="hg-hint">happy path</span><span className="hg-count" id="hg-cp">50</span></div>
            <input type="range" min="0" max="80" defaultValue="50" id="hg-p" aria-label="Production sample count" />
          </div>
          <div className="hg-ctl">
            <div className="hg-ctl-top"><span className="hg-dot hg-dot-s"></span> Stress <span className="hg-hint">short · long · sarcasm · format</span><span className="hg-count" id="hg-cs">0</span></div>
            <input type="range" min="0" max="80" defaultValue="0" id="hg-s" aria-label="Stress input count" />
          </div>
          <div className="hg-ctl">
            <div className="hg-ctl-top"><span className="hg-dot hg-dot-e"></span> Edge <span className="hg-hint">multi-issue · injection · ambiguous</span><span className="hg-count" id="hg-ce">0</span></div>
            <input type="range" min="0" max="80" defaultValue="0" id="hg-e" aria-label="Edge case count" />
          </div>

          <div className="hg-traffic">
            <div className="hg-traffic-lbl">What real users actually send</div>
            <div className="hg-traffic-bar">
              <span style={{ width: '68%' }} className="hg-tp"></span><span style={{ width: '17%' }} className="hg-ts"></span><span style={{ width: '15%' }} className="hg-te"></span>
            </div>
            <div className="hg-traffic-key"><span>68% production</span><span>17% stress</span><span>15% edge</span></div>
          </div>
        </div>

        <div className="hg-readout">
          <div className="hg-scores">
            <div className="hg-scorebox">
              <div className="hg-scorelabel">Your eval reports</div>
              <div className="hg-scorenum" id="hg-eval" data-val="92">92<span className="hg-pct">%</span></div>
            </div>
            <div className="hg-vs">vs</div>
            <div className="hg-scorebox hg-scorebox-true">
              <div className="hg-scorelabel">True quality</div>
              <div className="hg-scorenum hg-true hidden" id="hg-truth" data-val="0">0<span className="hg-pct">%</span></div>
              <button className="hg-reveal-btn" id="hg-reveal">Reveal&nbsp;→</button>
            </div>
          </div>
          <div className="hg-gapbar">
            <div className="hg-gaptrack">
              <div className="hg-gapband" id="hg-gapband"></div>
              <div className="hg-gapfill" id="hg-gapfill"></div>
              <div className="hg-truthmark hidden" id="hg-truthmark"><span>true</span></div>
            </div>
          </div>
          <div className="hg-verdict" id="hg-verdict">You&apos;d ship this. <b style={{ color: 'var(--pass)' }}>92%</b> looks great — but you only tested the easy column.</div>
        </div>
      </div>

      <div className="hg-field" id="hg-field"></div>
      <div className="hg-legend"><span className="hg-lg"><i className="hg-sq hg-pass"></i> passes</span><span className="hg-lg"><i className="hg-sq hg-fail"></i> fails <span className="hg-legend-hint">(hover a red cell)</span></span><span className="hg-lg-note" id="hg-fieldnote"></span></div>

      <div className="hg-take" id="hg-take">An eval set is a <b>sample</b> of reality. Right now you&apos;re sampling only the inputs the agent is already good at.</div>

      <div className="hg-tip" id="hg-tip"></div>
    </div>
  )
}
