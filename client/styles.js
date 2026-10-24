/**
 * Plugin-owned stylesheet. Inserted once per client run as a scoped
 * `<style data-plugin="dsh-worktree">` tag and removed with it.
 *
 * Aesthetic direction — "instrument panel": a compact developer tool that reads
 * like a piece of measuring equipment. Monospaced section labels and branch
 * names give the surface a mechanical, scannable rhythm; the current branch is
 * the single loud element (brand-tinted row + check), everything else is
 * quiet. Depth comes from a hairline border plus a two-layer shadow rather
 * than heavy translucency, so the panel stays legible over the conversation.
 *
 * Opacity policy: opaque surface first (`--dsw-alias-bg-layer-2`), never a bare
 * translucent overlay. Hover fills are stronger than the host's faint wash
 * because a 5% black wash is invisible on the dark composer area.
 *
 * Density policy: 4/6/8px rhythm, 32px rows, no decorative gaps.
 * @module dsh-worktree/client/styles
 */

export const CSS = `
.dsh-wt-spinner{display:inline-block;border:1.5px solid var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));border-top-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));border-radius:50%;animation:dsh-wt-spin .7s linear infinite;flex:none}
@keyframes dsh-wt-spin{to{transform:rotate(360deg)}}

@keyframes dsh-wt-enter{from{opacity:0;transform:translateY(4px) scale(.985)}to{opacity:1;transform:none}}
@keyframes dsh-wt-row-in{from{opacity:0;transform:translateX(-3px)}to{opacity:1;transform:none}}

/* ---- composer toolbar trigger ---- */
/* Keeps the toolbar's width stable while the first repository lookup runs, so the
   row does not jump once the trigger is either drawn or dropped. */
.dsh-wt-trigger-placeholder{display:inline-block;width:0;height:28px;flex:none}
.dsh-wt-trigger{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 5px 0 7px;border:none;background:transparent;border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;line-height:20px;cursor:pointer;max-width:190px;transition:background .12s ease,color .12s ease}
.dsh-wt-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary)}
.dsh-wt-trigger:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-trigger:active:not(:disabled){transform:translateY(.5px)}
.dsh-wt-trigger:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:default}
.dsh-wt-trigger .dsh-wt-trigger-icon{display:inline-flex;flex:none;opacity:.9}
.dsh-wt-trigger .dsh-wt-trigger-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-trigger .dsh-wt-trigger-chevron{display:inline-flex;flex:none;opacity:.65}
.dsh-wt-trigger[data-variant="worktree"]{color:var(--dsw-alias-label-primary)}
.dsh-wt-trigger[data-variant="worktree"] .dsh-wt-trigger-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}
@container (width<=460px){.dsh-wt-trigger .dsh-wt-trigger-label{display:none}}

/* ---- anchored panel ---- */
.dsh-wt-panel{position:fixed;z-index:1100;width:352px;max-width:calc(100vw - 16px);background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-overlay,Canvas));border:1px solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.28),0 14px 34px -8px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.045);display:flex;flex-direction:column;height:min(260px,calc(100vh - 88px));overflow:hidden;color:var(--dsw-alias-label-primary,CanvasText);font-size:13px;animation:dsh-wt-enter .14s cubic-bezier(.22,1,.36,1)}
.dsh-wt-panel-search{display:flex;align-items:center;gap:7px;padding:8px 11px;border-bottom:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));flex:none}
.dsh-wt-panel-search input{flex:1;min-width:0;border:none;background:transparent;color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:12.5px;line-height:18px;letter-spacing:-.01em;outline:none}
.dsh-wt-panel-search input::placeholder{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-family:inherit}
.dsh-wt-panel-body{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:4px 0;min-height:0;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2,color-mix(in srgb,CanvasText 22%,Canvas)) transparent}
.dsh-wt-panel-body::-webkit-scrollbar{width:9px}
.dsh-wt-panel-body::-webkit-scrollbar-track{background:transparent}
.dsh-wt-panel-body::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2,color-mix(in srgb,CanvasText 22%,Canvas));border-radius:5px;border:2px solid transparent;background-clip:padding-box}
.dsh-wt-panel-body::-webkit-scrollbar-thumb:hover{background:var(--dsw-alias-label-dimmed,color-mix(in srgb,CanvasText 34%,Canvas));background-clip:padding-box}

/* section label: instrument-panel caption */
.dsh-wt-panel .dsh-wt-section{margin:2px 0 0}
.dsh-wt-panel .dsh-wt-section:first-child{margin-top:0}
.dsh-wt-panel .dsh-wt-section-title{display:flex;align-items:center;gap:6px;padding:7px 11px 4px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;user-select:none;line-height:14px}
.dsh-wt-panel .dsh-wt-section-title::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--dsw-alias-border-l1),transparent)}
.dsh-wt-panel .dsh-wt-section-title .dsh-wt-section-extra{margin-left:0;font-family:inherit;font-weight:400;text-transform:none;letter-spacing:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:150px;font-size:10px;opacity:.75}

/* branch rows: icon colour only; the label keeps full contrast */
.dsh-wt-panel .dsh-wt-row[data-kind="worktree"] .dsh-wt-row-icon,.dsh-wt-panel .dsh-wt-row-icon[data-variant="worktree"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}

/* rows */
.dsh-wt-panel .dsh-wt-row{display:flex;align-items:center;gap:8px;width:100%;padding:5px 11px;margin:0;border:none;background:transparent;color:var(--dsw-alias-label-primary);font-size:13px;line-height:18px;text-align:left;cursor:pointer;border-radius:0;animation:dsh-wt-row-in .16s ease both}
.dsh-wt-panel .dsh-wt-row:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07))}
.dsh-wt-panel .dsh-wt-row:focus-visible{outline:none;box-shadow:inset 0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-panel .dsh-wt-row:disabled{cursor:default;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-panel .dsh-wt-row[aria-disabled="true"]{cursor:default;color:var(--dsw-alias-label-primary)}
.dsh-wt-panel .dsh-wt-row[data-current="true"]{color:var(--dsw-alias-label-primary);background:transparent;box-shadow:none;cursor:default}
.dsh-wt-panel .dsh-wt-row[data-current="true"]:hover{background:transparent}
.dsh-wt-panel .dsh-wt-row .dsh-wt-row-icon{display:inline-flex;flex:none;opacity:.78}
.dsh-wt-panel .dsh-wt-row[data-current="true"] .dsh-wt-row-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}
.dsh-wt-panel .dsh-wt-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.dsh-wt-panel .dsh-wt-row-title{display:flex;align-items:center;gap:6px;min-width:0;line-height:17px}
.dsh-wt-panel .dsh-wt-row-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;letter-spacing:-.005em}
.dsh-wt-panel .dsh-wt-row-sub{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums}
.dsh-wt-panel .dsh-wt-row-sub[data-tone="warn"]{color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 72%,var(--dsw-alias-label-primary,#0f1115))}
.dsh-wt-panel .dsh-wt-row-check{display:inline-flex;flex:none;color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-panel .dsh-wt-row-here{flex:none;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9.5px;letter-spacing:.06em;text-transform:uppercase}
.dsh-wt-panel .dsh-wt-badge{flex:none;display:inline-flex;align-items:center;height:15px;padding:0 5px;border-radius:4px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9.5px;font-weight:600;line-height:15px;letter-spacing:.04em;background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.09));color:var(--dsw-alias-label-secondary)}
.dsh-wt-panel .dsh-wt-badge[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-panel .dsh-wt-badge[data-tone="brand"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}

/* empty / notice */
.dsh-wt-panel .dsh-wt-note{padding:9px 11px;margin:4px 8px;border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-label-primary,#fff) 4%,transparent);color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px;border:1px solid var(--dsw-alias-border-l1)}

/* footer: two atomic actions */
.dsh-wt-footer{border-top:1px solid var(--dsw-alias-border-l1);padding:3px;flex:none;background:color-mix(in srgb,var(--dsw-alias-label-primary,#fff) 2.5%,transparent)}
.dsh-wt-panel .dsh-wt-create-rows{display:flex;gap:4px}
.dsh-wt-panel .dsh-wt-create-toggle{display:flex;align-items:center;justify-content:center;gap:5px;flex:1;min-width:0;padding:5px 8px;border:1px solid transparent;background:transparent;border-radius:7px;color:var(--dsw-alias-label-secondary);font-size:12.5px;font-weight:500;line-height:17px;cursor:pointer;transition:background .12s ease,color .12s ease,border-color .12s ease}
.dsh-wt-panel .dsh-wt-create-toggle:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07));color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l1)}
.dsh-wt-panel .dsh-wt-create-toggle:active:not(:disabled){transform:translateY(.5px)}
.dsh-wt-panel .dsh-wt-create-toggle:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-panel .dsh-wt-create-toggle:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:default}
/* create form: one compact row — name, start point, submit */
.dsh-wt-panel .dsh-wt-create-form{display:flex;align-items:center;gap:5px;padding:5px 6px 4px;animation:dsh-wt-enter .14s cubic-bezier(.22,1,.36,1)}
.dsh-wt-panel .dsh-wt-create-form input[type=text]{flex:1;min-width:0;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-base,Canvas);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:12.5px;line-height:18px;outline:none;transition:border-color .12s ease,box-shadow .12s ease}
.dsh-wt-panel .dsh-wt-create-form input[type=text]::placeholder{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-family:inherit}
.dsh-wt-panel .dsh-wt-create-form input[type=text]:focus{border-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary,#4d8dff) 18%,transparent)}
.dsh-wt-panel .dsh-wt-create-form select{flex:none;width:96px;height:28px;padding:0 4px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-base,Canvas);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:11.5px;line-height:18px;outline:none}
.dsh-wt-panel .dsh-wt-create-form select:focus-visible{outline:none;border-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-panel .dsh-wt-create-form .dsh-wt-button{flex:none;height:28px;padding:0 10px}
.dsh-wt-panel .dsh-wt-button{display:inline-flex;align-items:center;gap:5px;height:27px;padding:0 11px;border:none;border-radius:6px;font-size:12.5px;font-weight:500;line-height:18px;cursor:pointer;transition:background .12s ease,filter .12s ease,transform .08s ease}
.dsh-wt-panel .dsh-wt-button:active:not(:disabled){transform:translateY(.5px)}
.dsh-wt-panel .dsh-wt-button:disabled{cursor:default;opacity:.5}
.dsh-wt-panel .dsh-wt-button:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-panel .dsh-wt-button[data-variant="primary"]{background:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));color:#fff;box-shadow:0 1px 2px rgba(0,0,0,.3)}
.dsh-wt-panel .dsh-wt-button[data-variant="primary"]:hover:not(:disabled){filter:brightness(1.1)}
.dsh-wt-panel .dsh-wt-button[data-variant="plain"]{background:transparent;color:var(--dsw-alias-label-secondary)}
.dsh-wt-panel .dsh-wt-button[data-variant="plain"]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07));color:var(--dsw-alias-label-primary)}
.dsh-wt-panel .dsh-wt-button[data-variant="danger"]{background:transparent;color:var(--dsw-alias-state-error-primary)}
.dsh-wt-panel .dsh-wt-button[data-variant="danger"]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07))}

/* inline confirm / error / toast */
.dsh-wt-panel .dsh-wt-confirm{margin:6px 8px 2px;padding:8px 10px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 55%,transparent);border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 9%,transparent);display:flex;flex-direction:column;gap:6px}
.dsh-wt-panel .dsh-wt-confirm-title{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-state-warn-primary);font-weight:600;font-size:12px;line-height:16px}
.dsh-wt-panel .dsh-wt-confirm-body{color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px}
.dsh-wt-panel .dsh-wt-confirm-body .dsh-wt-confirm-detail{display:block;margin-top:4px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;white-space:pre-wrap;word-break:break-all;max-height:60px;overflow-y:auto}
.dsh-wt-panel .dsh-wt-confirm-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.dsh-wt-panel .dsh-wt-error{margin:6px 8px 2px;padding:8px 10px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 55%,transparent);border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 9%,transparent);display:flex;flex-direction:column;gap:6px}
.dsh-wt-panel .dsh-wt-error-title{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-state-error-primary);font-weight:600;font-size:12px;line-height:16px}
.dsh-wt-panel .dsh-wt-error-body{color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px}
.dsh-wt-panel .dsh-wt-error-body .dsh-wt-confirm-detail{display:block;margin-top:4px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;white-space:pre-wrap;word-break:break-all;max-height:60px;overflow-y:auto}
.dsh-wt-panel .dsh-wt-toast{margin:6px 8px 2px;padding:6px 10px;border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#30a46c) 10%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-state-success-primary,#30a46c) 40%,transparent);color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px;display:flex;align-items:center;gap:6px}
.dsh-wt-panel .dsh-wt-toast .dsh-wt-row-check{color:var(--dsw-alias-state-success-primary)}

/* ---- sidebar decorations ---- */
.dsh-wt-leading{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-leading[data-variant="worktree"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-hover{display:flex;align-items:center;gap:5px;color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px}
.dsh-wt-hover .dsh-wt-hover-icon{display:inline-flex;flex:none;opacity:.85}
.dsh-wt-hover[data-variant="worktree"] .dsh-wt-hover-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}
.dsh-wt-hover .dsh-wt-hover-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-hover .dsh-wt-hover-dirty{flex:none;color:var(--dsw-alias-state-warn-primary);font-size:10.5px}

@media (prefers-reduced-motion:reduce){
  .dsh-wt-panel,.dsh-wt-panel .dsh-wt-row,.dsh-wt-panel .dsh-wt-create-form{animation:none}
  .dsh-wt-trigger:active:not(:disabled),.dsh-wt-panel .dsh-wt-create-toggle:active:not(:disabled),.dsh-wt-panel .dsh-wt-button:active:not(:disabled){transform:none}
}
`;
