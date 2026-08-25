// Scoped styles for the Weekly Signal surfaces. Shared by the index and the
// issue page so the two can never drift. Uses the house tokens and motion
// easing; everything is namespaced under `.ws` so nothing leaks.

export const WEEKLY_SIGNAL_CSS = `
.ws{
  --acc:#C8F040; --bg:#100f0c; --line:rgba(255,255,255,0.10);
  --t1:rgba(255,255,255,0.92); --t2:rgba(255,255,255,0.62); --t3:rgba(255,255,255,0.38);
  --e-out:cubic-bezier(0.23,1,0.32,1);
  background:var(--bg); color:var(--t1); min-height:100vh; padding:0 20px;
  box-sizing:border-box; font-family:"DM Sans",ui-sans-serif,system-ui,-apple-system,sans-serif;
}
.ws *{box-sizing:border-box}
.ws-inner{max-width:720px;margin:0 auto;padding:44px 0 80px}

.ws-head{padding-bottom:28px;border-bottom:0.5px solid var(--line);margin-bottom:30px}
.ws-eyebrow{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10px;
  letter-spacing:0.16em;text-transform:uppercase;color:var(--acc);margin:0 0 12px}
.ws-title{font-size:clamp(26px,4vw,36px);font-weight:600;line-height:1.15;
  letter-spacing:-0.015em;margin:0 0 14px;text-wrap:balance}
.ws-title em{font-style:italic;color:var(--acc)}
.ws-frame{font-size:14.5px;line-height:1.6;color:var(--t2);max-width:60ch;margin:0}

/* Index */
.ws-list-issues{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}
.ws-card{display:block;text-decoration:none;color:inherit;border:0.5px solid var(--line);
  border-radius:14px;padding:22px;background:rgba(255,255,255,0.015);
  transition:transform .2s var(--e-out),border-color .2s var(--e-out),background .2s var(--e-out)}
.ws-card:hover{transform:translateY(-2px);border-color:rgba(200,240,64,0.35);
  background:rgba(200,240,64,0.02)}
.ws-card:active{transform:translateY(0) scale(0.995)}
.ws-card-meta{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px;
  font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9.5px;
  letter-spacing:0.12em;text-transform:uppercase}
.ws-cat{color:var(--acc);border:0.5px solid rgba(200,240,64,0.35);border-radius:5px;padding:3px 7px}
.ws-date{color:var(--t3)}
.ws-card-title{font-size:19px;font-weight:600;line-height:1.3;letter-spacing:-0.01em;margin:0 0 8px}
.ws-card-dek{font-size:14px;line-height:1.55;color:var(--t2);margin:0 0 12px}
.ws-card-decision{font-size:13px;line-height:1.55;color:var(--t2);margin:0 0 14px;
  padding-left:12px;border-left:2px solid rgba(200,240,64,0.35)}
.ws-card-decision span{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9.5px;
  letter-spacing:0.1em;text-transform:uppercase;color:var(--acc)}
.ws-card-more{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:11px;color:var(--acc)}

/* Empty */
.ws-empty{border:0.5px dashed var(--line);border-radius:14px;padding:48px 24px;text-align:center}
.ws-empty-title{font-size:17px;font-style:italic;margin:0 0 8px;color:var(--t1)}
.ws-empty-body{font-size:13.5px;color:var(--t2);margin:0}
.ws-empty-body a{color:var(--acc);text-decoration:none}
.ws-empty-body a:hover{text-decoration:underline}

/* Issue */
.ws-back{display:inline-block;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:11px;
  color:var(--t3);text-decoration:none;margin-bottom:22px;transition:color .16s var(--e-out)}
.ws-back:hover{color:var(--acc)}
.ws-decision{border:0.5px solid rgba(200,240,64,0.3);background:rgba(200,240,64,0.04);
  border-radius:12px;padding:18px 20px;margin:0 0 30px}
.ws-decision-label{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9.5px;
  letter-spacing:0.14em;text-transform:uppercase;color:var(--acc);margin:0 0 7px}
.ws-decision-text{font-size:15px;line-height:1.6;color:var(--t1);margin:0;font-style:italic}

.ws-body{font-size:15.5px;line-height:1.75;color:var(--t2)}
.ws-h2{font-size:19px;font-weight:600;color:var(--t1);letter-spacing:-0.01em;margin:34px 0 12px}
.ws-h3{font-size:16px;font-weight:600;color:var(--t1);margin:26px 0 10px}
.ws-p{margin:0 0 18px}
.ws-strong{color:var(--t1);font-weight:600}
.ws-list{margin:0 0 18px;padding-left:22px;display:flex;flex-direction:column;gap:8px}
.ws-list li::marker{color:var(--acc)}
.ws-list-ol{list-style:decimal}
.ws-quote{margin:0 0 18px;padding-left:16px;border-left:2px solid var(--line);
  font-style:italic;color:var(--t2)}

.ws-sources{margin-top:38px;padding-top:20px;border-top:0.5px solid var(--line)}
.ws-sources-label{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9.5px;
  letter-spacing:0.14em;text-transform:uppercase;color:var(--t3);margin:0 0 10px}
.ws-sources ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.ws-sources a{font-size:13.5px;color:var(--acc);text-decoration:none;word-break:break-word}
.ws-sources a:hover{text-decoration:underline}

.ws-cta{margin-top:40px;padding:24px;border:0.5px solid rgba(200,240,64,0.22);border-radius:14px;
  background:rgba(200,240,64,0.04);display:flex;flex-wrap:wrap;gap:14px;align-items:center;
  justify-content:space-between}
.ws-cta-text{font-size:14px;color:var(--t1);max-width:440px;line-height:1.5}
.ws-cta-btn{flex:0 0 auto;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:12px;
  letter-spacing:0.03em;color:#100f0c;background:var(--acc);border:0.5px solid var(--acc);
  padding:11px 18px;border-radius:8px;text-decoration:none;
  transition:transform .14s var(--e-out),filter .18s var(--e-out)}
.ws-cta-btn:hover{filter:brightness(1.06)}
.ws-cta-btn:active{transform:scale(0.97)}

@media(prefers-reduced-motion:reduce){
  .ws *{transition-duration:0.01ms!important;animation-duration:0.01ms!important}
  .ws-card:hover,.ws-card:active,.ws-cta-btn:active{transform:none!important}
}
`
