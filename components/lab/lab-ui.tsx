'use client'

// ── Orchestration Lab — shared UI kit ────────────────────────────────────────
// House aesthetic ported from the honesty-gap explainer: dark #100f0c panels,
// lime accent, clay for "bad", amber for "caught", mono eyebrows + tabular
// numbers, hairline borders, Emil easing tokens. One scoped stylesheet keyed on
// `.lab`; nothing leaks into the platform shell.

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export const LAB_CSS = `
  .lab{
    --acc:#C8F040; --clay:#CE9079; --amber:#F0C24B; --bad:#E8785A;
    --panel:#100f0c; --panel2:#15140f;
    --line:rgba(255,255,255,0.10); --line2:rgba(255,255,255,0.06);
    --t1:rgba(255,255,255,0.92); --t2:rgba(255,255,255,0.62); --t3:rgba(255,255,255,0.38);
    --e-out:cubic-bezier(0.23,1,0.32,1);
    --e-drawer:cubic-bezier(0.32,0.72,0,1);
    --e-pop:cubic-bezier(0.34,1.56,0.64,1);
    --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
    --sans:"DM Sans",var(--font-dm-sans),ui-sans-serif,system-ui,sans-serif;
    color:var(--t1); font-family:var(--sans);
  }
  .lab *{box-sizing:border-box}
  .lab .mono{font-family:var(--mono);font-variant-numeric:tabular-nums}
  .lab .num{font-variant-numeric:tabular-nums;font-family:var(--mono)}
  .lab .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

  /* ── header ── */
  .lab-eyebrow{font-family:var(--mono);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:var(--acc)}
  .lab-title{font-family:var(--sans);font-size:clamp(24px,4vw,34px);font-weight:600;font-style:italic;letter-spacing:-0.015em;margin-top:9px;color:var(--t1)}
  .lab-frame{font-size:14px;color:var(--t2);margin-top:8px;line-height:1.5;max-width:640px}
  .lab-frame em{color:var(--t1);font-style:normal;font-weight:600}
  .lab-foot{font-family:var(--mono);font-size:10px;letter-spacing:0.04em;color:var(--t3);margin-top:14px;line-height:1.6}

  /* ── panels / sections ── */
  .lab-panel{background:var(--panel);border:0.5px solid var(--line);border-radius:14px;padding:18px 18px 20px}
  .lab-seclabel{font-family:var(--mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--t3);margin-bottom:12px}

  /* ── tabs ── */
  .lab-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:22px 0 16px}
  .lab-tab{font-family:var(--mono);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;background:transparent;border:0.5px solid var(--line);color:var(--t2);padding:8px 14px;border-radius:8px;cursor:pointer;
    transition:border-color .18s var(--e-out),color .18s var(--e-out),background .18s var(--e-out),transform .12s var(--e-out)}
  .lab-tab:hover{border-color:rgba(200,240,64,0.45);color:var(--t1)}
  .lab-tab:active{transform:scale(0.97)}
  .lab-tab[aria-selected=true]{background:rgba(200,240,64,0.10);border-color:var(--acc);color:var(--acc)}
  .lab-tab:disabled{opacity:0.35;cursor:not-allowed}

  /* ── preset picker ── */
  .lab-presets{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
  .lab-preset{text-align:left;background:var(--panel);border:0.5px solid var(--line);border-radius:12px;padding:15px 15px 16px;cursor:pointer;
    transition:border-color .18s var(--e-out),background .18s var(--e-out),transform .12s var(--e-out)}
  .lab-preset:hover{border-color:rgba(200,240,64,0.45);background:var(--panel2)}
  .lab-preset:active{transform:scale(0.99)}
  .lab-preset[aria-pressed=true]{border-color:var(--acc);background:rgba(200,240,64,0.06)}
  .lab-preset-name{font-size:15px;font-weight:600;color:var(--t1);letter-spacing:-0.01em}
  .lab-preset-blurb{font-size:12.5px;color:var(--t2);line-height:1.5;margin-top:6px}

  /* ── badges / chips ── */
  .lab-badge{display:inline-flex;align-items:center;gap:4px;font-family:var(--mono);font-size:9.5px;letter-spacing:0.06em;text-transform:uppercase;
    padding:2.5px 7px;border-radius:20px;border:0.5px solid var(--line);color:var(--t2);white-space:nowrap;line-height:1.2}
  .lab-badge-acc{color:var(--acc);border-color:rgba(200,240,64,0.4);background:rgba(200,240,64,0.08)}
  .lab-badge-clay{color:var(--clay);border-color:rgba(206,144,121,0.4);background:rgba(206,144,121,0.08)}
  .lab-badge-amber{color:var(--amber);border-color:rgba(240,194,75,0.4);background:rgba(240,194,75,0.08)}
  .lab-badge-bad{color:var(--bad);border-color:rgba(232,120,90,0.5);background:rgba(232,120,90,0.12)}

  /* ── horizontal super-step columns ── */
  .lab-scroll{overflow-x:auto;overflow-y:hidden;padding-bottom:8px;-webkit-overflow-scrolling:touch}
  .lab-scroll::-webkit-scrollbar{height:8px}
  .lab-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:8px}
  .lab-cols{display:flex;gap:12px;align-items:stretch;min-width:min-content}
  .lab-col{flex:0 0 auto;width:210px;display:flex;flex-direction:column;gap:8px}
  .lab-col-h{font-family:var(--mono);font-size:9.5px;letter-spacing:0.10em;text-transform:uppercase;color:var(--t3);
    display:flex;justify-content:space-between;align-items:baseline;padding-bottom:6px;border-bottom:0.5px dashed var(--line)}
  .lab-arrow{align-self:center;color:var(--t3);flex:0 0 auto;font-family:var(--mono);font-size:14px;padding-top:22px}

  .lab-node{border:0.5px solid var(--line);border-radius:10px;padding:11px 12px;background:var(--panel2)}
  .lab-node-label{font-size:13px;font-weight:600;color:var(--t1);line-height:1.3}
  .lab-node-badges{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
  .lab-node-acc{font-family:var(--mono);font-size:11px;font-variant-numeric:tabular-nums;color:var(--t2);margin-top:9px;display:flex;align-items:center;gap:6px}
  .lab-node-acc .lab-accnum{color:var(--t1)}
  .lab-unmeasured{color:var(--clay);font-family:var(--mono);font-size:10px;letter-spacing:0.08em;font-weight:600}

  /* ── channels ── */
  .lab-chans{display:flex;flex-direction:column;gap:8px}
  .lab-chan{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:0.5px solid var(--line);border-radius:9px;padding:9px 11px;background:var(--panel2)}
  .lab-chan-flag{border-color:rgba(232,120,90,0.45);background:rgba(232,120,90,0.06)}
  .lab-chan-key{font-family:var(--mono);font-size:12px;color:var(--t1);font-weight:600}
  .lab-chan-note{font-size:11.5px;color:var(--t2);line-height:1.4}
  .lab-chan-note.bad{color:var(--bad);font-weight:500}
  .lab-chan-note.subtle{color:var(--t3);font-style:italic}
  .lab-chan-spacer{margin-left:auto}

  /* ── run controls / buttons ── */
  .lab-ctl{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px}
  .lab-field{display:flex;align-items:center;gap:8px}
  .lab-field label{font-family:var(--mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--t3)}
  .lab-input{width:70px;background:var(--panel2);border:0.5px solid var(--line);border-radius:7px;color:var(--t1);
    font-family:var(--mono);font-size:13px;padding:7px 9px;font-variant-numeric:tabular-nums}
  .lab-input:focus{outline:none;border-color:var(--acc)}
  .lab-btn{font-family:var(--mono);font-size:11.5px;letter-spacing:0.05em;background:var(--acc);color:#0b0b07;border:0.5px solid var(--acc);
    padding:9px 16px;border-radius:8px;cursor:pointer;font-weight:600;
    transition:transform .14s var(--e-out),filter .18s var(--e-out),opacity .18s var(--e-out)}
  .lab-btn:hover{filter:brightness(1.06)}
  .lab-btn:active{transform:scale(0.96)}
  .lab-btn:disabled{opacity:0.5;cursor:not-allowed}
  .lab-btn-ghost{background:rgba(200,240,64,0.08);color:var(--acc)}
  .lab-btn-ghost:hover{background:rgba(200,240,64,0.16);filter:none}

  /* ── run timeline ── */
  .lab-tlcol{flex:0 0 auto;width:220px;display:flex;flex-direction:column;gap:8px}
  .lab-exec{border:0.5px solid var(--line);border-radius:10px;padding:10px 11px;background:var(--panel2)}
  .lab-exec.taint{border-color:rgba(206,144,121,0.45);background:rgba(206,144,121,0.05)}
  .lab-exec.detect{border-color:rgba(240,194,75,0.45);background:rgba(240,194,75,0.05)}
  .lab-exec-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
  .lab-exec-label{font-size:12.5px;font-weight:600;color:var(--t1);line-height:1.3}
  .lab-exec-badges{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
  .lab-exec-margin{display:flex;justify-content:space-between;font-family:var(--mono);font-size:10.5px;font-variant-numeric:tabular-nums;color:var(--t3);margin-top:9px;padding-top:8px;border-top:0.5px dashed var(--line)}
  .lab-exec-margin b{color:var(--t2);font-weight:400}

  /* ── result banner ── */
  .lab-banner{border-radius:12px;padding:15px 16px;margin-top:18px;border:0.5px solid var(--line);animation:lab-fade .28s var(--e-out)}
  .lab-banner-correct{border-color:rgba(200,240,64,0.4);background:rgba(200,240,64,0.06)}
  .lab-banner-silent{border-color:rgba(206,144,121,0.5);background:rgba(206,144,121,0.08)}
  .lab-banner-caught{border-color:rgba(240,194,75,0.5);background:rgba(240,194,75,0.08)}
  .lab-banner-failed{border-color:rgba(232,120,90,0.6);background:rgba(232,120,90,0.10)}
  .lab-banner-head{display:flex;align-items:center;gap:10px;font-family:var(--mono);font-size:12px;letter-spacing:0.06em;text-transform:uppercase;font-weight:600}
  .lab-banner-body{font-size:13px;color:var(--t1);line-height:1.55;margin-top:8px}
  .lab-banner-err{font-family:var(--mono);font-size:12.5px;color:var(--bad);line-height:1.6;margin-top:8px;padding:10px 12px;border-radius:8px;background:rgba(0,0,0,0.28);border:0.5px solid rgba(232,120,90,0.35)}
  .lab-banner-teach{font-size:12px;color:var(--t2);line-height:1.5;margin-top:10px;font-style:italic}
  .lab-banner-teach b{color:var(--clay);font-style:normal}

  .lab-runmetrics{display:flex;gap:22px;flex-wrap:wrap;margin-top:14px}
  .lab-runmetric .k{font-family:var(--mono);font-size:9.5px;letter-spacing:0.10em;text-transform:uppercase;color:var(--t3)}
  .lab-runmetric .v{font-family:var(--mono);font-size:20px;font-variant-numeric:tabular-nums;color:var(--t1);margin-top:3px}
  .lab-runmetric .v small{font-size:12px;color:var(--t3);margin-left:5px}

  /* ── simulate ── */
  .lab-hero{border:0.5px solid rgba(200,240,64,0.28);background:rgba(200,240,64,0.04);border-radius:14px;padding:20px 20px 22px;text-align:center}
  .lab-hero-k{font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--acc)}
  .lab-hero-num{font-family:var(--mono);font-weight:600;font-size:clamp(48px,13vw,84px);line-height:0.95;letter-spacing:-0.03em;color:var(--acc);font-variant-numeric:tabular-nums;margin-top:8px}
  .lab-hero-sub{font-size:12.5px;color:var(--t2);margin-top:10px;line-height:1.5}
  .lab-hero-sub b{color:var(--t1)}

  .lab-gap{display:flex;align-items:stretch;gap:14px;margin-top:16px;flex-wrap:wrap}
  .lab-gapbox{flex:1;min-width:130px;border:0.5px solid var(--line);border-radius:12px;padding:14px 15px;background:var(--panel2)}
  .lab-gapbox .k{font-family:var(--mono);font-size:9.5px;letter-spacing:0.10em;text-transform:uppercase;color:var(--t3)}
  .lab-gapbox .v{font-family:var(--mono);font-size:34px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1;margin-top:8px}
  .lab-gapbox .note{font-size:11px;color:var(--t3);margin-top:6px;line-height:1.4}
  .lab-gapcall{align-self:center;text-align:center;flex:0 0 auto;min-width:96px}
  .lab-gapcall .d{font-family:var(--mono);font-size:26px;font-weight:600;color:var(--clay);font-variant-numeric:tabular-nums}
  .lab-gapcall .l{font-family:var(--mono);font-size:9px;letter-spacing:0.08em;text-transform:uppercase;color:var(--t3);margin-top:4px}

  .lab-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-top:16px}
  .lab-stat{border:0.5px solid var(--line);border-radius:11px;padding:12px 13px;background:var(--panel2)}
  .lab-stat .k{font-family:var(--mono);font-size:9px;letter-spacing:0.09em;text-transform:uppercase;color:var(--t3)}
  .lab-stat .v{font-family:var(--mono);font-size:22px;font-variant-numeric:tabular-nums;color:var(--t1);margin-top:6px;line-height:1}
  .lab-stat .sub{font-family:var(--mono);font-size:10px;color:var(--t3);margin-top:6px;font-variant-numeric:tabular-nums}
  .lab-stat.clay .v{color:var(--clay)}
  .lab-stat.amber .v{color:var(--amber)}

  /* ── demo-luck widget ── */
  .lab-demo{border:0.5px solid rgba(200,240,64,0.28);background:linear-gradient(180deg,rgba(200,240,64,0.05),rgba(200,240,64,0.02));border-radius:14px;padding:18px 18px 20px;margin-top:18px}
  .lab-demo-title{font-family:var(--sans);font-size:16px;font-weight:600;font-style:italic;color:var(--t1)}
  .lab-demo-sub{font-size:12.5px;color:var(--t2);line-height:1.5;margin-top:6px;max-width:520px}
  .lab-demo-chips{display:flex;gap:10px;margin:16px 0 4px;flex-wrap:wrap;min-height:56px;align-items:center}
  .lab-demochip{width:52px;height:56px;border-radius:11px;border:0.5px solid var(--line);background:var(--panel2);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;opacity:0;transform:scale(0.8) translateY(6px)}
  .lab-demochip.in{opacity:1;transform:scale(1) translateY(0);transition:opacity .3s var(--e-out),transform .42s var(--e-pop)}
  .lab-demochip .mark{font-size:20px;line-height:1}
  .lab-demochip .sd{font-family:var(--mono);font-size:8.5px;color:var(--t3);letter-spacing:0.04em}
  .lab-demochip.ok{border-color:rgba(200,240,64,0.45)}
  .lab-demochip.ok .mark{color:var(--acc)}
  .lab-demochip.no{border-color:rgba(232,120,90,0.5)}
  .lab-demochip.no .mark{color:var(--bad)}
  .lab-demo-reveal{margin-top:14px;padding-top:15px;border-top:0.5px dashed var(--line);opacity:0;transform:translateY(6px);
    transition:opacity .45s var(--e-out),transform .5s var(--e-drawer)}
  .lab-demo-reveal.in{opacity:1;transform:translateY(0)}
  .lab-demo-punch{font-size:15px;line-height:1.55;color:var(--t1)}
  .lab-demo-punch b{color:var(--acc);font-family:var(--mono);font-variant-numeric:tabular-nums}
  .lab-demo-truth{font-size:13px;color:var(--t2);line-height:1.55;margin-top:10px}
  .lab-demo-truth b{color:var(--clay);font-family:var(--mono);font-variant-numeric:tabular-nums}

  @keyframes lab-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
  @media (max-width:440px){
    .lab-col,.lab-tlcol{width:180px}
  }
  @media (prefers-reduced-motion:reduce){
    .lab *{animation-duration:0.01ms!important;transition-duration:0.01ms!important}
  }
`

export function LabStyles() {
  return <style dangerouslySetInnerHTML={{ __html: LAB_CSS }} />
}

// ── small presentational helpers ─────────────────────────────────────────────
export type BadgeTone = 'neutral' | 'acc' | 'clay' | 'amber' | 'bad'

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  const cls = tone === 'neutral' ? 'lab-badge' : `lab-badge lab-badge-${tone}`
  return <span className={cls}>{children}</span>
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return reduced
}

// ── formatters (tabular, honest about tiny magnitudes) ───────────────────────
export function fmtUsd(n: number): string {
  if (!isFinite(n)) return '—'
  if (n === 0) return '$0'
  if (n < 0.01) return '$' + n.toFixed(4)
  if (n < 1) return '$' + n.toFixed(3)
  return '$' + n.toFixed(2)
}

export function fmtMs(n: number): string {
  return Math.round(n).toLocaleString('en-US') + ' ms'
}

export function fmtSecs(ms: number): string {
  return (ms / 1000).toFixed(1) + 's'
}

export function pct(n: number, digits = 1): string {
  return (n * 100).toFixed(digits) + '%'
}
