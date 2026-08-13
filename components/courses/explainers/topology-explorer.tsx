'use client'

import { useEffect, useRef } from 'react'

// ── The Five Patterns — n8n-style topology explorer ─────────────────────────
// Agent Orchestration · Module 2. Switch topology, then "Run a request" to
// animate the flow through the graph; cost/latency/failure formula updates per
// pattern. Self-contained: static SVG scaffold in JSX, interaction wired in an
// effect (AbortController + cancelled rafs), one scoped <style>.

type Kind = 'in' | 'out' | 'llm' | 'ctrl'
interface GNode { id: string; label: string; x: number; y: number; kind: Kind }
interface Info { cost: string; lat: string; reli: string; fail: string; safe: string }
interface Pattern {
  name: string
  nodes: GNode[]
  edges: [string, string][]
  waves: number[][]
  bi?: number[]
  info: Info
}

const CSS = `
  .tp-wrap{
    --acc:#C8F040; --warm:#CE9079; --bg:#100f0c; --line:rgba(255,255,255,0.10);
    --t1:rgba(255,255,255,0.92); --t2:rgba(255,255,255,0.58); --t3:rgba(255,255,255,0.34);
    --e-out:cubic-bezier(0.23,1,0.32,1);
    background:var(--bg); border:0.5px solid rgba(200,240,64,0.22); border-radius:14px;
    padding:22px 22px 20px; color:var(--t1); position:relative;
    font-family:"DM Sans",ui-sans-serif,system-ui,-apple-system,sans-serif; max-width:100%; box-sizing:border-box;
  }
  .tp-wrap *{box-sizing:border-box}
  .tp-wrap .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
  .tp-eyebrow,.tp-tab,.tp-run,.tp-k,.tp-formula{font-family:ui-monospace,"SF Mono",Menlo,monospace}
  .tp-eyebrow{font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--acc);margin-bottom:8px}
  .tp-title{font-size:23px;font-weight:600;font-style:italic;letter-spacing:-0.01em;margin-bottom:7px}
  .tp-sub{font-size:13.5px;line-height:1.55;color:var(--t2);max-width:640px}
  .tp-sub em{color:var(--t1);font-style:normal;font-weight:600}

  .tp-tabs{display:flex;gap:6px;margin:18px 0 10px;flex-wrap:wrap}
  .tp-tab{background:transparent;border:0.5px solid var(--line);color:var(--t2);font-size:11px;padding:6px 12px;border-radius:20px;cursor:pointer;letter-spacing:0.02em;
    transition:border-color .18s var(--e-out),color .18s var(--e-out),background .18s var(--e-out),transform .12s var(--e-out)}
  .tp-tab:hover{border-color:rgba(200,240,64,0.5);color:var(--t1)}
  .tp-tab:active{transform:scale(0.97)}
  .tp-tab.active{background:rgba(200,240,64,0.10);border-color:var(--acc);color:var(--acc)}

  .tp-stage{position:relative;margin-top:6px;border:0.5px solid var(--line);border-radius:10px;background:rgba(255,255,255,0.015);overflow:hidden}
  .tp-svg{display:block;width:100%;height:auto}
  .tp-run{position:absolute;right:12px;bottom:12px;background:rgba(200,240,64,0.10);border:0.5px solid var(--acc);color:var(--acc);font-size:11px;padding:7px 13px;border-radius:7px;cursor:pointer;letter-spacing:0.04em;
    transition:background .18s var(--e-out),transform .16s var(--e-out)}
  .tp-run:hover{background:rgba(200,240,64,0.18)}
  .tp-run:active{transform:scale(0.97)}

  .tp-edge{fill:none;stroke:rgba(255,255,255,0.16);stroke-width:1.5;stroke-dasharray:4 5;animation:tp-flow 1.1s linear infinite}
  .tp-edge.bi{stroke-dasharray:2 6}
  @keyframes tp-flow{to{stroke-dashoffset:-18}}

  .tp-node rect{transition:stroke .3s var(--e-out),fill .3s var(--e-out)}
  .tp-node.lit rect{stroke:var(--acc);fill:rgba(200,240,64,0.12)}
  .tp-nlabel{font-family:ui-monospace,Menlo,monospace;font-size:10px;fill:var(--t1);text-anchor:middle;dominant-baseline:middle;letter-spacing:0.02em}
  .tp-ntype{font-family:ui-monospace,Menlo,monospace;font-size:7px;text-transform:uppercase;letter-spacing:0.1em;text-anchor:middle}

  .tp-info{display:grid;grid-template-columns:1fr 1fr;gap:10px 22px;margin-top:16px}
  @media(max-width:560px){.tp-info{grid-template-columns:1fr}}
  .tp-row{display:flex;flex-direction:column;gap:3px}
  .tp-k{font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:var(--t3)}
  .tp-v{font-size:13px;color:var(--t1);line-height:1.4}
  .tp-formula{font-size:12px;color:var(--acc)}
  .tp-fail{color:var(--warm)}
  .tp-safe{grid-column:1/-1;margin-top:4px;padding-top:12px;border-top:0.5px solid var(--line);font-size:12.5px;color:var(--t2);line-height:1.55}
  .tp-safe b{color:var(--t1);font-weight:600}

  @media(prefers-reduced-motion:reduce){.tp-edge{animation:none;stroke-dasharray:none}}
`

export function TopologyExplorer() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const ac = new AbortController()
    const sig = ac.signal
    const rafs: number[] = []
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches
    const NS = 'http://www.w3.org/2000/svg'
    const gE = root.querySelector('#tp-edges') as SVGGElement
    const gN = root.querySelector('#tp-nodes') as SVGGElement
    const gD = root.querySelector('#tp-dots') as SVGGElement
    const W = 68, H = 38

    const N = (id: string, label: string, x: number, y: number, kind: Kind = 'llm'): GNode => ({ id, label, x, y, kind })

    const P: Record<string, Pattern> = {
      fanout: {
        name: 'Fan-out',
        nodes: [N('req', 'request', 44, 170, 'in'), N('b1', 'branch 1', 300, 58), N('b2', 'branch 2', 300, 132), N('b3', 'branch 3', 300, 206), N('b4', 'branch 4', 300, 280), N('rec', 'reconciler', 500, 170, 'ctrl'), N('out', 'output', 648, 170, 'out')],
        edges: [['req', 'b1'], ['req', 'b2'], ['req', 'b3'], ['req', 'b4'], ['b1', 'rec'], ['b2', 'rec'], ['b3', 'rec'], ['b4', 'rec'], ['rec', 'out']],
        waves: [[0, 1, 2, 3], [4, 5, 6, 7], [8]],
        info: { cost: 'N × branch', lat: 'max(branch) + reconciler', reli: 'the reconciler', fail: 'cost explosion · unreconciled conflict', safe: 'Safe <b>with caching</b> — genuinely independent subtasks where latency matters more than spend, and you have a real tie-break rule.' },
      },
      pipeline: {
        name: 'Pipeline',
        nodes: [N('req', 'request', 30, 170, 'in'), N('s1', 'stage 1', 140, 170), N('s2', 'stage 2', 240, 170), N('s3', 'stage 3', 340, 170), N('s4', 'stage 4', 440, 170), N('s5', 'stage 5', 540, 170), N('out', 'output', 652, 170, 'out')],
        edges: [['req', 's1'], ['s1', 's2'], ['s2', 's3'], ['s3', 's4'], ['s4', 's5'], ['s5', 'out']],
        waves: [[0], [1], [2], [3], [4], [5]],
        info: { cost: 'Σ stages', lat: 'Σ stages', reli: 'Π accuracy', fail: 'error compounding (5 × 95% = 77%)', safe: 'The <b>safe default</b> — when each stage is cheaply verifiable before the next consumes it, and the stages truly depend on order.' },
      },
      debate: {
        name: 'Debate',
        nodes: [N('req', 'request', 40, 170, 'in'), N('a1', 'agent 1', 190, 64), N('a2', 'agent 2', 190, 170), N('a3', 'agent 3', 190, 276), N('rnd', 'critique ×2', 380, 170, 'ctrl'), N('jdg', 'judge', 520, 170, 'ctrl'), N('out', 'output', 650, 170, 'out')],
        edges: [['req', 'a1'], ['req', 'a2'], ['req', 'a3'], ['a1', 'rnd'], ['a2', 'rnd'], ['a3', 'rnd'], ['rnd', 'jdg'], ['jdg', 'out']],
        waves: [[0, 1, 2], [3, 4, 5], [6], [7]],
        info: { cost: 'rounds × agents + judge', lat: 'rounds × agent', reli: 'agent independence', fail: 'consensus theatre · confident wrong answer wins', safe: '<b>Not</b> a safe default. Only for genuinely contested judgement with an arbiter — and only if the agents differ in model, context, or retrieval.' },
      },
      supervisor: {
        name: 'Supervisor',
        nodes: [N('req', 'request', 36, 170, 'in'), N('sup', 'supervisor', 220, 170, 'ctrl'), N('w1', 'worker 1', 440, 64), N('w2', 'worker 2', 440, 170), N('w3', 'worker 3', 440, 276), N('out', 'output', 652, 170, 'out')],
        edges: [['req', 'sup'], ['sup', 'w1'], ['sup', 'w2'], ['sup', 'w3'], ['w1', 'sup'], ['w2', 'sup'], ['w3', 'sup'], ['sup', 'out']],
        bi: [1, 2, 3, 4, 5, 6],
        waves: [[0], [1, 2, 3], [4, 5, 6], [7]],
        info: { cost: 'workers + coordination overhead (10–25%)', lat: 'delegations × supervisor', reli: 'supervisor quality', fail: 'bottleneck · context bloat · permission concentration', safe: '<b>Sometimes</b> — clear routing between specialists with distinct permission boundaries, where the supervisor needs only a summary to decide.' },
      },
      swarm: {
        name: 'Swarm',
        nodes: [N('req', 'request', 36, 170, 'in'), N('a1', 'agent 1', 250, 86), N('a2', 'agent 2', 470, 86), N('a3', 'agent 3', 250, 254), N('a4', 'agent 4', 470, 254), N('out', 'output?', 656, 170, 'out')],
        edges: [['req', 'a1'], ['a1', 'a2'], ['a2', 'a4'], ['a4', 'a3'], ['a3', 'a1'], ['a2', 'a3'], ['a1', 'a4'], ['a4', 'out']],
        bi: [1, 2, 3, 4, 5, 6],
        waves: [[0], [1], [5], [2], [6], [7]],
        info: { cost: 'unbounded — until you cap it', lat: 'unbounded', reli: 'the cap', fail: 'runaway loops · unexplainability', safe: '<b>Not</b> a safe default. Exploratory work only, and never without all four: step cap, budget cap, full trace, a named human.' },
      },
    }

    const KIND: Record<Kind, { c: string; t: string }> = {
      in: { c: 'var(--t2)', t: 'input' },
      out: { c: 'var(--t2)', t: 'output' },
      llm: { c: 'var(--acc)', t: 'llm call' },
      ctrl: { c: 'var(--warm)', t: 'control' },
    }

    let active = 'pipeline'
    let running = false

    const nodeById = (p: Pattern, id: string) => p.nodes.find((n) => n.id === id) as GNode

    function edgePath(a: GNode, b: GNode): string {
      let x1 = a.x + W / 2, y1 = a.y, x2 = b.x - W / 2, y2 = b.y
      if (Math.abs(a.x - b.x) < W) {
        x1 = a.x; y1 = a.y + (b.y > a.y ? H / 2 : -H / 2)
        x2 = b.x; y2 = b.y + (b.y > a.y ? -H / 2 : H / 2)
      }
      const dx = (x2 - x1) * 0.5
      return 'M' + x1 + ' ' + y1 + ' C' + (x1 + dx) + ' ' + y1 + ' ' + (x2 - dx) + ' ' + y2 + ' ' + x2 + ' ' + y2
    }

    function render(key: string) {
      active = key
      const p = P[key]
      let eh = ''
      p.edges.forEach((e, i) => {
        const a = nodeById(p, e[0]), b = nodeById(p, e[1])
        const bi = p.bi && p.bi.indexOf(i) >= 0 ? ' bi' : ''
        eh += '<path class="tp-edge' + bi + '" id="e' + i + '" d="' + edgePath(a, b) + '"/>'
      })
      gE.innerHTML = eh
      let nh = ''
      p.nodes.forEach((n) => {
        const k = KIND[n.kind]
        nh += '<g class="tp-node" data-id="' + n.id + '">' +
          '<rect x="' + (n.x - W / 2) + '" y="' + (n.y - H / 2) + '" width="' + W + '" height="' + H + '" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>' +
          '<circle cx="' + (n.x - W / 2 + 9) + '" cy="' + (n.y - H / 2 + 9) + '" r="2.5" fill="' + k.c + '"/>' +
          '<text class="tp-nlabel" x="' + n.x + '" y="' + (n.y + 2) + '">' + n.label + '</text>' +
          '<text class="tp-ntype" x="' + n.x + '" y="' + (n.y + H / 2 - 5) + '" fill="' + k.c + '" opacity="0.65">' + k.t + '</text>' +
          '</g>'
      })
      gN.innerHTML = nh
      gD.innerHTML = ''
      const f = p.info
      ;(root!.querySelector('#tp-info') as HTMLElement).innerHTML =
        '<div class="tp-row"><span class="tp-k">Cost / request</span><span class="tp-formula">' + f.cost + '</span></div>' +
        '<div class="tp-row"><span class="tp-k">Latency</span><span class="tp-formula">' + f.lat + '</span></div>' +
        '<div class="tp-row"><span class="tp-k">Reliability driver</span><span class="tp-v">' + f.reli + '</span></div>' +
        '<div class="tp-row"><span class="tp-k">Fails by</span><span class="tp-v tp-fail">' + f.fail + '</span></div>' +
        '<div class="tp-safe">' + f.safe + '</div>'
      root!.querySelectorAll('.tp-tab').forEach((t) => (t as HTMLElement).classList.toggle('active', (t as HTMLElement).dataset.k === key))
    }

    function lit(id: string, on: boolean) {
      const g = gN.querySelector('[data-id="' + id + '"]')
      if (g) g.classList.toggle('lit', on)
    }

    function runWave(p: Pattern, idxs: number[], done: () => void) {
      let pending = idxs.length
      idxs.forEach((ei) => {
        const path = gE.querySelector('#e' + ei) as SVGPathElement | null
        if (!path) { pending--; return }
        const len = path.getTotalLength()
        const dot = document.createElementNS(NS, 'circle')
        dot.setAttribute('r', '3.5'); dot.setAttribute('fill', 'var(--acc)'); gD.appendChild(dot)
        const t0 = performance.now(), dur = reduce ? 1 : 520
        lit(p.edges[ei][0], true)
        const step = (t: number) => {
          const k = Math.min(1, (t - t0) / dur), pt = path.getPointAtLength(len * k)
          dot.setAttribute('cx', String(pt.x)); dot.setAttribute('cy', String(pt.y))
          if (k < 1) { rafs.push(requestAnimationFrame(step)) }
          else { gD.removeChild(dot); lit(p.edges[ei][1], true); if (--pending === 0) done() }
        }
        rafs.push(requestAnimationFrame(step))
      })
      if (pending === 0) done()
    }

    function run() {
      if (running) return
      running = true
      const p = P[active]
      gN.querySelectorAll('.tp-node').forEach((g) => g.classList.remove('lit'))
      lit('req', true)
      let w = 0
      const next = () => {
        if (w >= p.waves.length) {
          running = false
          setTimeout(() => gN.querySelectorAll('.tp-node').forEach((g) => g.classList.remove('lit')), 900)
          return
        }
        runWave(p, p.waves[w++], () => setTimeout(next, reduce ? 0 : 120))
      }
      next()
    }

    ;(root.querySelector('#tp-tabs') as HTMLElement).innerHTML = Object.keys(P)
      .map((k) => '<button class="tp-tab" data-k="' + k + '">' + P[k].name + '</button>')
      .join('')
    root.querySelectorAll('.tp-tab').forEach((t) =>
      t.addEventListener('click', () => render((t as HTMLElement).dataset.k as string), { signal: sig }),
    )
    ;(root.querySelector('#tp-run') as HTMLElement).addEventListener('click', run, { signal: sig })

    render('pipeline')

    return () => { ac.abort(); rafs.forEach((id) => cancelAnimationFrame(id)) }
  }, [])

  return (
    <div className="tp-wrap" ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <h2 className="sr-only">
        Interactive node-graph explorer of the five agent-orchestration topologies — fan-out, pipeline, debate, supervisor, and swarm — each with its cost and latency formula and failure mode, and a button that animates a request flowing through the graph.
      </h2>

      <div className="tp-head">
        <div className="tp-eyebrow">Interactive · Agent Orchestration · Module 2</div>
        <div className="tp-title">The five patterns</div>
        <div className="tp-sub">Every production system is one of these shapes — or two of them composed. Pick a topology, then <em>run a request</em> and watch how it actually moves.</div>
      </div>

      <div className="tp-tabs" id="tp-tabs"></div>

      <div className="tp-stage">
        <svg className="tp-svg" viewBox="0 0 720 340" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <g id="tp-edges"></g>
          <g id="tp-dots"></g>
          <g id="tp-nodes"></g>
        </svg>
        <button className="tp-run" id="tp-run">▶ Run a request</button>
      </div>

      <div className="tp-info" id="tp-info"></div>
    </div>
  )
}
