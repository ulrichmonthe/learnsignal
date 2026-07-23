// ── Shared explainer shell ──────────────────────────────────────────────────
// Base chrome + motion tokens for every course explainer, so the family reads
// as one system. A component prepends EXPLAINER_CSS to its own viz-specific CSS
// in a single scoped <style>. All base classes are `.expl-*` and scoped by
// `.expl-wrap`; components add their own `.expl-<name>-*` rules.
//
// Motion tokens (use these, never the weak built-ins):
//   --e-out    strong ease-out for entrances / UI feedback
//   --e-drawer iOS-style ease for on-track movement (bars, markers)
//   --e-pop    slight overshoot for hero "pop in" moments (the reveal)
//
// Palette: --acc (lime, the single accent) · --warm (clay, for "bad"/failure)
//   · --warn (amber, optional third state) · neutrals --t1/--t2/--t3.
//
// Every explainer MUST: open with a visually-hidden <h2 class="sr-only">,
// give pressable controls an :active scale, and respect prefers-reduced-motion.

export const EXPLAINER_CSS = `
  .expl-wrap{
    --acc:#C8F040; --pass:#C8F040; --warm:#CE9079; --fail:#E8785A; --warn:#F0C24B;
    --bg:#100f0c; --line:rgba(255,255,255,0.10); --line2:rgba(255,255,255,0.05);
    --t1:rgba(255,255,255,0.92); --t2:rgba(255,255,255,0.62); --t3:rgba(255,255,255,0.38);
    --e-out:cubic-bezier(0.23,1,0.32,1);
    --e-drawer:cubic-bezier(0.32,0.72,0,1);
    --e-pop:cubic-bezier(0.34,1.56,0.64,1);
    background:var(--bg); border:0.5px solid rgba(200,240,64,0.22); border-radius:14px;
    padding:22px 22px 20px; color:var(--t1); position:relative;
    font-family:"DM Sans",ui-sans-serif,system-ui,-apple-system,sans-serif;
    max-width:100%; box-sizing:border-box;
  }
  .expl-wrap *{box-sizing:border-box}
  .expl-wrap .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  .expl-wrap .hidden{display:none!important}
  .expl-eyebrow,.expl-count,.expl-scorelabel,.expl-presets-label,.expl-preset,.expl-hint,.expl-legend,.expl-verdict,.expl-scorenum,.expl-btn,.expl-col-h{font-family:ui-monospace,"SF Mono",Menlo,monospace}

  .expl-eyebrow{font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--acc);margin-bottom:8px}
  .expl-title{font-size:23px;font-weight:600;font-style:italic;letter-spacing:-0.01em;margin-bottom:7px;font-family:"DM Sans",sans-serif}
  .expl-sub{font-size:13.5px;line-height:1.55;color:var(--t2);max-width:640px}
  .expl-sub em{color:var(--t1);font-style:normal;font-weight:600}

  .expl-presets{display:flex;align-items:center;gap:8px;margin:18px 0 4px;flex-wrap:wrap}
  .expl-presets-label{font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:var(--t3)}
  .expl-preset{background:transparent;border:0.5px solid var(--line);color:var(--t2);font-size:11px;padding:6px 11px;border-radius:20px;cursor:pointer;
    transition:border-color .18s var(--e-out),color .18s var(--e-out),background .18s var(--e-out),transform .12s var(--e-out)}
  .expl-preset:hover{border-color:rgba(200,240,64,0.5);color:var(--t1)}
  .expl-preset:active{transform:scale(0.97)}
  .expl-preset.active{background:rgba(200,240,64,0.10);border-color:var(--acc);color:var(--acc)}

  .expl-body{display:grid;grid-template-columns:1.05fr 0.95fr;gap:26px;margin-top:16px;align-items:start}
  @media(max-width:640px){.expl-body{grid-template-columns:1fr;gap:22px}}

  .expl-ctl{margin-bottom:15px}
  .expl-ctl-top{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--t2);margin-bottom:8px}
  .expl-hint{font-size:9.5px;color:var(--t3);letter-spacing:0.02em}
  .expl-count{margin-left:auto;font-size:13px;color:var(--t1);min-width:22px;text-align:right;font-variant-numeric:tabular-nums}
  .expl-slider{-webkit-appearance:none;appearance:none;width:100%;height:3px;border-radius:3px;background:rgba(255,255,255,0.12);outline:none}
  .expl-slider::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;background:var(--acc);cursor:pointer;border:2px solid var(--bg);transition:transform .12s var(--e-out)}
  .expl-slider::-webkit-slider-thumb:active{transform:scale(1.15)}
  .expl-slider::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:var(--acc);cursor:pointer;border:2px solid var(--bg)}

  .expl-readout{border-left:0.5px solid var(--line);padding-left:24px}
  @media(max-width:640px){.expl-readout{border-left:none;padding-left:0;border-top:0.5px solid var(--line);padding-top:18px}}
  .expl-scores{display:flex;align-items:flex-end;gap:14px}
  .expl-scorebox{flex:1;position:relative}
  .expl-scorelabel{font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:var(--t3);margin-bottom:4px}
  .expl-scorenum{font-size:42px;font-weight:600;line-height:1;letter-spacing:-0.02em;font-variant-numeric:tabular-nums;transition:color .25s var(--e-out)}
  .expl-pct{font-size:18px;opacity:0.55;margin-left:1px}
  .expl-vs{font-size:10px;color:var(--t3);text-transform:uppercase;padding-bottom:11px}

  .expl-btn{margin-top:3px;background:rgba(200,240,64,0.08);border:0.5px solid var(--acc);color:var(--acc);font-size:11px;padding:7px 12px;border-radius:7px;cursor:pointer;
    transition:background .18s var(--e-out),transform .16s var(--e-out),opacity .18s var(--e-out);letter-spacing:0.03em}
  .expl-btn:hover{background:rgba(200,240,64,0.16)}
  .expl-btn:active{transform:scale(0.97)}
  .expl-btn.leaving{opacity:0;transform:scale(0.95)}

  .expl-bar{margin:18px 0 12px}
  .expl-bartrack{position:relative;height:8px;background:rgba(255,255,255,0.06);border-radius:5px}
  .expl-barfill{position:absolute;left:0;top:0;height:100%;border-radius:5px;background:var(--acc);width:0;
    transition:width .5s var(--e-drawer),background .3s var(--e-out)}
  .expl-mark{position:absolute;top:-4px;width:2px;height:16px;background:var(--t1);border-radius:2px;transform-origin:bottom center;
    transition:left .55s var(--e-drawer) .05s,opacity .35s var(--e-out) .05s,transform .4s var(--e-pop) .05s}
  .expl-mark.hidden{opacity:0;transform:scaleY(0.4)}
  .expl-mark span{position:absolute;top:-15px;left:50%;transform:translateX(-50%);font-size:8px;font-family:ui-monospace,Menlo,monospace;color:var(--t2);text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap}

  .expl-verdict{font-size:12px;line-height:1.55;letter-spacing:0.01em;min-height:34px;transition:opacity .16s var(--e-out),filter .16s var(--e-out)}

  .expl-legend{display:flex;gap:16px;align-items:center;margin-top:14px;font-size:10px;color:var(--t3);flex-wrap:wrap}
  .expl-legend>span{display:flex;align-items:center;gap:6px}
  .expl-sq{width:8px;height:8px;border-radius:2px;display:inline-block}

  .expl-take{margin-top:18px;padding:13px 15px;border-radius:9px;background:rgba(200,240,64,0.05);border:0.5px solid rgba(200,240,64,0.22);font-size:13px;line-height:1.55;color:var(--t1);
    transition:opacity .16s var(--e-out),filter .16s var(--e-out)}
  .expl-take b{color:var(--acc);font-weight:600}

  .expl-tip{position:absolute;z-index:20;pointer-events:none;opacity:0;transform:translateY(3px) scale(0.97);transform-origin:top left;
    transition:opacity .14s var(--e-out),transform .14s var(--e-out);
    background:#1c1b16;border:0.5px solid var(--line);border-left:2px solid var(--warm);border-radius:6px;padding:7px 10px;font-size:11px;line-height:1.4;color:var(--t1);max-width:220px;font-family:"DM Sans",sans-serif;box-shadow:0 6px 20px rgba(0,0,0,0.4);font-weight:300}
  .expl-tip.show{opacity:1;transform:translateY(0) scale(1)}
  .expl-tip b{color:var(--warm);font-family:ui-monospace,Menlo,monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:2px;font-weight:400}

  @media(prefers-reduced-motion:reduce){.expl-wrap *{transition-duration:0.01ms!important;animation-duration:0.01ms!important}}
`

/** True when the viewer asked for reduced motion — skip count-ups/transitions. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches
}
