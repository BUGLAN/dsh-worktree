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
 * Motion policy: one strong ease-out token and two durations (120ms for colour
 * hovers and exits, 160ms for entrances and presses) cover every transition.
 * All motion animates transform/opacity only; every anchored surface emerges
 * from its trigger (below-trigger surfaces drop in from -Y, the composer
 * picker above the composer rises from +Y), exits retrace its entrance, and
 * prefers-reduced-motion keeps the fades while dropping the movement.
 * @module dsh-worktree/client/styles
 */

export const CSS = `
/* Motion tokens (plugin-scoped; the host exposes no motion aliases): one
   strong ease-out for every entrance, exit and state change; 120ms for colour
   hovers and exits, 160ms for entrances and presses. Every rule below animates
   transform/opacity only — nothing animates layout. */
:root{--dswt-ease-out:cubic-bezier(.23,1,.32,1);--dswt-dur-fast:120ms;--dswt-dur-open:160ms}
.dsh-wt-spinner{display:inline-block;border:1.5px solid var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));border-top-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));border-radius:50%;animation:dsh-wt-spin .7s linear infinite;flex:none}
@keyframes dsh-wt-spin{to{transform:rotate(360deg)}}
@keyframes dsh-wt-pulse{50%{opacity:.4}}

@keyframes dsh-wt-enter{from{opacity:0;transform:translateY(4px) scale(.985)}to{opacity:1;transform:none}}
@keyframes dsh-wt-fade-in{from{opacity:0}}
@keyframes dsh-wt-row-in{from{opacity:0;transform:translateX(-3px)}to{opacity:1;transform:none}}
@keyframes dsh-wt-menu-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
@keyframes dsh-wt-menu-in-up{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}

/* ---- composer toolbar trigger ---- */
/* Keeps the toolbar's width stable while the first repository lookup runs, so the
   row does not jump once the trigger is either drawn or dropped. */
.dsh-wt-trigger-placeholder{display:inline-block;width:0;height:28px;flex:none}
.dsh-wt-trigger{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 5px 0 7px;border:none;background:transparent;border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;line-height:20px;cursor:pointer;max-width:190px;transition:background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease,transform var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary)}
.dsh-wt-trigger:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-trigger:active:not(:disabled){transform:scale(.97)}
.dsh-wt-trigger:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:default}
.dsh-wt-trigger .dsh-wt-trigger-icon{display:inline-flex;flex:none;opacity:.9}
.dsh-wt-trigger .dsh-wt-trigger-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-trigger .dsh-wt-trigger-chevron{display:inline-flex;flex:none;opacity:.65}
.dsh-wt-trigger[data-variant="worktree"]{color:var(--dsw-alias-label-primary)}
.dsh-wt-trigger[data-variant="worktree"] .dsh-wt-trigger-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}
@container (width<=460px){.dsh-wt-trigger .dsh-wt-trigger-label{display:none}}

/* ---- anchored panel ---- */
.dsh-wt-panel{position:fixed;z-index:1100;width:352px;max-width:calc(100vw - 16px);background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-overlay,Canvas));border:1px solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.28),0 14px 34px -8px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.045);display:flex;flex-direction:column;height:min(260px,calc(100vh - 88px));overflow:hidden;color:var(--dsw-alias-label-primary,CanvasText);font-size:13px;opacity:0;transform:translateY(4px) scale(.985);transform-origin:center bottom;transition:opacity var(--dswt-dur-open) var(--dswt-ease-out),transform var(--dswt-dur-open) var(--dswt-ease-out)}
/* Open/close is a transition driven by data-open (panel.js keeps the portal
   mounted through the exit), so an interrupted close resumes from the panel's
   current on-screen values instead of restarting from the entrance pose. The
   exit is faster than the entrance, the closed state never takes pointers, and
   data-side flips the offset: below the composer the panel drops in from -Y. */
.dsh-wt-panel[data-side="below"]{transform:translateY(-4px) scale(.985);transform-origin:center top}
.dsh-wt-panel[data-open="true"]{opacity:1;transform:none}
.dsh-wt-panel[data-open="false"]{pointer-events:none;transition-duration:var(--dswt-dur-fast)}
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

/* branch rows: icon colour only; the label keeps full contrast; a worktree-held branch keeps its worktree mark, every row means switch */
.dsh-wt-panel .dsh-wt-row-icon[data-variant="worktree"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}

/* rows */
.dsh-wt-panel .dsh-wt-row{display:flex;align-items:center;gap:8px;width:100%;padding:5px 11px;margin:0;border:none;background:transparent;color:var(--dsw-alias-label-primary);font-size:13px;line-height:18px;text-align:left;cursor:pointer;border-radius:0;animation:dsh-wt-row-in var(--dswt-dur-open) var(--dswt-ease-out) both}
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
.dsh-wt-panel .dsh-wt-create-toggle{display:flex;align-items:center;justify-content:center;gap:5px;flex:1;min-width:0;padding:5px 8px;border:1px solid transparent;background:transparent;border-radius:7px;color:var(--dsw-alias-label-secondary);font-size:12.5px;font-weight:500;line-height:17px;cursor:pointer;transition:background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease,border-color var(--dswt-dur-fast) ease,transform var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-panel .dsh-wt-create-toggle:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07));color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l1)}
.dsh-wt-panel .dsh-wt-create-toggle:active:not(:disabled){transform:scale(.97)}
.dsh-wt-panel .dsh-wt-create-toggle:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-panel .dsh-wt-create-toggle:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:default}
/* create form: one compact row — name, start point, submit */
.dsh-wt-panel .dsh-wt-create-form{display:flex;align-items:center;gap:5px;padding:5px 6px 4px;animation:dsh-wt-enter var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-panel .dsh-wt-create-form input[type=text]{flex:1;min-width:0;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-base,Canvas);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:12.5px;line-height:18px;outline:none;transition:border-color var(--dswt-dur-fast) ease,box-shadow var(--dswt-dur-fast) ease}
.dsh-wt-panel .dsh-wt-create-form input[type=text]::placeholder{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-family:inherit}
.dsh-wt-panel .dsh-wt-create-form input[type=text]:focus{border-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary,#4d8dff) 18%,transparent)}
.dsh-wt-panel .dsh-wt-create-form select{flex:none;width:96px;height:28px;padding:0 4px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-base,Canvas);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:11.5px;line-height:18px;outline:none}
.dsh-wt-panel .dsh-wt-create-form select:focus-visible{outline:none;border-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-panel .dsh-wt-create-form .dsh-wt-button{flex:none;height:28px;padding:0 10px}
.dsh-wt-panel .dsh-wt-button{display:inline-flex;align-items:center;gap:5px;height:27px;padding:0 11px;border:none;border-radius:6px;font-size:12.5px;font-weight:500;line-height:18px;cursor:pointer;transition:background var(--dswt-dur-fast) ease,filter var(--dswt-dur-fast) ease,transform var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-panel .dsh-wt-button:active:not(:disabled){transform:scale(.97)}
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
.dsh-wt-panel .dsh-wt-toast{margin:6px 8px 2px;padding:6px 10px;border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#30a46c) 10%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-state-success-primary,#30a46c) 40%,transparent);color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px;display:flex;align-items:center;gap:6px;animation:dsh-wt-fade-in var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-panel .dsh-wt-toast .dsh-wt-row-check{color:var(--dsw-alias-state-success-primary)}

/* ---- sidebar decorations ---- */
.dsh-wt-leading{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-leading[data-variant="worktree"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-hover{display:flex;align-items:center;gap:5px;color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px}
.dsh-wt-hover .dsh-wt-hover-icon{display:inline-flex;flex:none;opacity:.85}
.dsh-wt-hover[data-variant="worktree"] .dsh-wt-hover-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}
.dsh-wt-hover .dsh-wt-hover-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-hover .dsh-wt-hover-dirty{flex:none;color:var(--dsw-alias-state-warn-primary);font-size:10.5px}


/* ---- 工作树 Tab（conversation.view）-------------------------------------
   版式：读数带 / 提交图 | 机架 / 状态行。所有颜色走宿主令牌；泳道用四条
   语义色循环（business/success/warn/混合紫），随主题自动翻转。 */
.dsh-wt-tab{display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px}
.dsh-wt-tab-center{align-items:center;justify-content:center;gap:10px;color:var(--dsw-alias-label-secondary)}
.dsh-wt-empty{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:12.5px;padding:28px 20px;text-align:center;max-width:460px;line-height:1.7}

/* 读数带 */
.dsh-wt-readout{flex:none;display:flex;align-items:stretch;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-wt-ro{padding:8px 16px 9px;border-right:1px solid var(--dsw-alias-border-l1);display:flex;flex-direction:column;gap:2px;justify-content:center;min-width:0}
.dsh-wt-ro-cap{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9px;letter-spacing:.13em;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));text-transform:uppercase;white-space:nowrap}
.dsh-wt-ro-val{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.01em}
.dsh-wt-ro-val[data-tone=warn]{color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-ro-grow{flex:1;border-right:none;align-items:flex-end}
.dsh-wt-ro-grow .dsh-wt-ro-val{color:var(--dsw-alias-label-tertiary);font-size:11px}

/* 主舞台 */
.dsh-wt-stage{flex:1;min-height:0;display:flex}
.dsh-wt-pane{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden}
.dsh-wt-pane-head{flex:none;height:38px;display:flex;align-items:center;gap:8px;padding:0 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-wt-pane-title{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}
.dsh-wt-pane-meta{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));display:flex}
.dsh-wt-pane-meta span+span::before{content:"·";margin:0 8px;color:var(--dsw-alias-border-l2,var(--dsw-alias-border-l1))}
.dsh-wt-grow{flex:1}

/* 提交图 */
.dsh-wt-graph{position:relative;flex:1;min-height:0;overflow-y:auto;padding:6px 16px 10px 6px;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2,var(--dsw-alias-border-l1)) transparent;background-image:repeating-linear-gradient(90deg,color-mix(in srgb,var(--dsw-alias-label-primary) 3%,transparent) 0 1px,transparent 1px 20px)}
.dsh-wt-graph::-webkit-scrollbar{width:9px}
.dsh-wt-graph::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:5px;border:2px solid transparent;background-clip:padding-box}
.dsh-wt-graph-empty{display:flex;align-items:flex-start}
.dsh-wt-crow{position:relative;display:flex;align-items:center;height:42px;border-radius:6px;cursor:pointer;transition:background var(--dswt-dur-fast) ease,box-shadow var(--dswt-dur-fast) ease}
.dsh-wt-crow:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 4%,transparent)}
.dsh-wt-crow-sel{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent);box-shadow:inset 2px 0 0 var(--dsw-alias-state-business-primary)}
.dsh-wt-crow-lane{flex:none;position:relative;height:42px}
.dsh-wt-crow-lane svg{position:absolute;inset:0;overflow:visible}
.dsh-wt-ln{stroke-width:1.5;stroke-opacity:.85}
.dsh-wt-lane-0{stroke:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}
.dsh-wt-lane-1{stroke:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-state-success-primary)}
.dsh-wt-lane-2{stroke:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-lane-3{stroke:color-mix(in srgb,var(--dsw-alias-state-business-primary) 50%,var(--dsw-alias-state-error-primary));color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 50%,var(--dsw-alias-state-error-primary))}
.dsh-wt-node{fill:currentColor;stroke:var(--dsw-alias-bg-base);stroke-width:3px}
.dsh-wt-node-ring{position:absolute;top:21px;width:15px;height:15px;border:1px solid currentColor;border-radius:50%;opacity:.3;transform:translate(-50%,-50%)}
.dsh-wt-node-ring[data-lane="0"]{color:var(--dsw-alias-state-business-primary)}
.dsh-wt-node-ring[data-lane="1"]{color:var(--dsw-alias-state-success-primary)}
.dsh-wt-node-ring[data-lane="2"]{color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-node-ring[data-lane="3"]{color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 50%,var(--dsw-alias-state-error-primary))}
.dsh-wt-topic{display:flex;align-items:center;gap:8px;min-width:0;flex:1;padding-right:12px}
.dsh-wt-subj{font-size:12.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.005em;transition:color var(--dswt-dur-fast) ease}
.dsh-wt-crow-sel .dsh-wt-subj{color:var(--dsw-alias-label-primary)}
.dsh-wt-ref{flex:none;display:inline-flex;align-items:center;height:17px;padding:0 6px;border-radius:4px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10px;white-space:nowrap;color:var(--dsw-alias-label-tertiary);border:1px solid var(--dsw-alias-border-l1)}
.dsh-wt-ref[data-kind=head]{color:var(--dsw-alias-state-business-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 35%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 12%,transparent)}
.dsh-wt-ref[data-kind=tag]{color:var(--dsw-alias-state-warn-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 32%,transparent)}
.dsh-wt-ref[data-kind=remote]{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-hash{flex:none;width:66px;text-align:right;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-variant-numeric:tabular-nums}
.dsh-wt-when{flex:none;width:92px;text-align:right;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-variant-numeric:tabular-nums}

/* 提交详情抽屉 */
.dsh-wt-detail{flex:none;border-top:1px solid var(--dsw-alias-border-l1);padding:9px 16px 11px;background:color-mix(in srgb,var(--dsw-alias-label-primary) 2%,transparent);animation:dsh-wt-menu-in var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-detail-head{display:flex;align-items:center;gap:8px}
.dsh-wt-detail-hash{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:11.5px;color:var(--dsw-alias-state-business-primary);padding:1px 6px;border-radius:4px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 12%,transparent)}
.dsh-wt-detail-subj{font-size:12.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsh-wt-detail-meta{display:flex;gap:16px;margin-top:6px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}

/* 机架（右栏） */
.dsh-wt-rail{width:308px;flex:none;border-left:1px solid var(--dsw-alias-border-l1);display:flex;flex-direction:column;min-height:0;background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base))}
.dsh-wt-rail-head{flex:none;height:38px;display:flex;align-items:center;gap:8px;padding:0 12px 0 14px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-wt-rail-body{flex:1;overflow-y:auto;padding:2px 0 10px;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2,var(--dsw-alias-border-l1)) transparent}
.dsh-wt-rail-body::-webkit-scrollbar{width:9px}
.dsh-wt-rail-body::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:5px;border:2px solid transparent;background-clip:padding-box}

.dsh-wt-card{position:relative;margin:4px 8px;padding:9px 10px;border-radius:8px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-layer-1));border:1px solid var(--dsw-alias-border-l1)}
.dsh-wt-card-here{border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 40%,transparent);box-shadow:inset 2px 0 0 var(--dsw-alias-state-business-primary)}
.dsh-wt-card-top{display:flex;align-items:center;gap:7px;min-width:0}
.dsh-wt-led{width:6px;height:6px;border-radius:50%;flex:none}
.dsh-wt-led[data-tone=ok]{background:var(--dsw-alias-state-success-primary);box-shadow:0 0 0 2.5px color-mix(in srgb,var(--dsw-alias-state-success-primary) 15%,transparent)}
.dsh-wt-led[data-tone=dirty]{background:var(--dsw-alias-state-warn-primary);box-shadow:0 0 0 2.5px color-mix(in srgb,var(--dsw-alias-state-warn-primary) 15%,transparent)}
.dsh-wt-card-name{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:12px;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsh-wt-card-tag{margin-left:auto;flex:none;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9.5px;letter-spacing:.04em;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));text-transform:uppercase}
.dsh-wt-card-branch{margin-left:auto;flex:none;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;color:var(--dsw-alias-state-business-primary)}
.dsh-wt-card-sub{display:flex;align-items:center;gap:8px;margin-top:3px;padding-left:13px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-pin{color:var(--dsw-alias-state-business-primary)}
.dsh-wt-card-path{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-card-dirty[data-tone=warn]{color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-card-acts{display:flex;gap:4px;margin-top:7px;padding-left:13px}

.dsh-wt-mini{height:21px;padding:0 8px;border-radius:5px;border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transition:background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease,border-color var(--dswt-dur-fast) ease,transform var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-mini:active:not(:disabled){transform:scale(.97)}
.dsh-wt-mini:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent);color:var(--dsw-alias-label-primary)}
.dsh-wt-mini:disabled{opacity:.5;cursor:default}
.dsh-wt-mini-pri{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 15%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 32%,transparent);color:var(--dsw-alias-state-business-primary)}
.dsh-wt-mini-pri:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 24%,transparent)}
.dsh-wt-mini-danger{color:var(--dsw-alias-state-error-primary)}
.dsh-wt-mini-danger:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 38%,transparent)}

/* 分支区 */
.dsh-wt-sec{display:flex;align-items:center;gap:7px;padding:12px 14px 4px}
.dsh-wt-sec-title{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-sec-n{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9.5px;color:var(--dsw-alias-label-tertiary)}
.dsh-wt-branch-wrap{position:relative}
.dsh-wt-br{position:relative;display:flex;align-items:center;gap:7px;margin:1px 8px;padding:5px 8px;border-radius:6px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:11.5px;color:var(--dsw-alias-label-secondary);transition:background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease}
.dsh-wt-br:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent);color:var(--dsw-alias-label-primary)}
.dsh-wt-br-icon{display:inline-flex;flex:none;opacity:.65;color:var(--dsw-alias-state-business-primary)}
.dsh-wt-br-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-br-cur .dsh-wt-br-name{color:var(--dsw-alias-label-primary);font-weight:600}
.dsh-wt-br-cur .dsh-wt-br-icon{opacity:1}
.dsh-wt-br-side{margin-left:auto;display:flex;gap:6px;align-items:center;font-size:9.5px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-badge{font-size:9px;padding:1px 4px;border-radius:3px;color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 14%,transparent)}
.dsh-wt-badge[data-tone=wt]{color:var(--dsw-alias-label-tertiary);background:color-mix(in srgb,var(--dsw-alias-label-primary) 7%,transparent)}
.dsh-wt-more{flex:none;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border:none;border-radius:4px;background:transparent;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:13px;line-height:1;cursor:pointer;opacity:.55;transition:opacity var(--dswt-dur-fast) ease,background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease,transform var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-more:active{transform:scale(.97)}
.dsh-wt-br:hover .dsh-wt-more,.dsh-wt-more[aria-expanded=true]{opacity:1;color:var(--dsw-alias-label-secondary);background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent)}
.dsh-wt-br-open{background:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent);color:var(--dsw-alias-label-primary)}

/* 弹出菜单 */
.dsh-wt-menu{position:absolute;right:6px;top:calc(100% + 2px);z-index:30;min-width:196px;padding:4px;border-radius:9px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-layer-1));border:1px solid var(--dsw-alias-border-l1);box-shadow:0 2px 4px rgba(0,0,0,.3),0 14px 30px -10px rgba(0,0,0,.6);animation:dsh-wt-menu-in var(--dswt-dur-open) var(--dswt-ease-out)}
/* An upward-flipped menu rises from below its trigger, mirroring the default. */
.dsh-wt-menu-up{top:auto;bottom:calc(100% + 2px);animation-name:dsh-wt-menu-in-up}
.dsh-wt-menu-item{display:flex;align-items:center;gap:8px;width:100%;height:26px;padding:0 8px;border:none;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:11.5px;font-family:inherit;text-align:left;cursor:pointer;white-space:nowrap;transition:background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease}
.dsh-wt-menu-item:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);color:var(--dsw-alias-label-primary)}
.dsh-wt-menu-item:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-border-l2));cursor:default}
.dsh-wt-menu-danger{color:var(--dsw-alias-state-error-primary)}
.dsh-wt-menu-danger:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent);color:var(--dsw-alias-state-error-primary)}
.dsh-wt-menu-sep{height:1px;border:none;margin:4px 6px;background:var(--dsw-alias-border-l1)}

/* 状态化确认块（删除分支 / 移除工作树 / 脏切换） */
.dsh-wt-cf{position:relative;z-index:2;margin:3px 8px 5px;padding:8px 9px;border-radius:8px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-warn-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 8%,transparent);display:flex;flex-direction:column;gap:6px;animation:dsh-wt-menu-in var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-cf[data-tone=error]{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent)}
.dsh-wt-cf-title{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;line-height:16px;color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-cf[data-tone=error] .dsh-wt-cf-title{color:var(--dsw-alias-state-error-primary)}
.dsh-wt-cf-body{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}
.dsh-wt-cf-acts{display:flex;align-items:center;gap:5px;flex-wrap:wrap;justify-content:flex-end;margin-top:1px}
.dsh-wt-cf-check{display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--dsw-alias-label-secondary);cursor:pointer;margin-right:auto}
.dsh-wt-cf-check input{accent-color:var(--dsw-alias-state-error-primary);margin:0;width:12px;height:12px}

/* 新建表单（三个退出点：✕ / 取消 / Esc） */
.dsh-wt-create{margin:6px 8px 2px;padding:9px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-layer-1));display:flex;flex-direction:column;gap:6px;animation:dsh-wt-menu-in var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-create-head{display:flex;align-items:center;gap:6px}
.dsh-wt-create-title{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}
.dsh-wt-create-x{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;margin-left:auto;border:none;border-radius:4px;background:transparent;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:12px;line-height:1;cursor:pointer;transition:background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease,transform var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-create-x:active{transform:scale(.97)}
.dsh-wt-create-x:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);color:var(--dsw-alias-label-primary)}
.dsh-wt-create-row{display:flex;gap:5px;align-items:center}
.dsh-wt-create input,.dsh-wt-create select{flex:1;min-width:0;height:26px;padding:0 7px;border-radius:5px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:11.5px;outline:none;transition:border-color var(--dswt-dur-fast) ease,box-shadow var(--dswt-dur-fast) ease}
.dsh-wt-create input:focus,.dsh-wt-create select:focus{border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 60%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary) 16%,transparent)}
.dsh-wt-create-foot{display:flex;align-items:center;gap:5px;margin-top:1px}
.dsh-wt-create-hint{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.dsh-wt-create-toggle{margin:4px 8px;height:32px;border:1px dashed var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:11.5px;cursor:pointer;transition:background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease}
.dsh-wt-create-toggle:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 3%,transparent);color:var(--dsw-alias-label-primary)}

/* 状态行 */
.dsh-wt-tabbar{flex:none;height:27px;display:flex;align-items:center;gap:12px;padding:0 16px;border-top:1px solid var(--dsw-alias-border-l1);font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9.5px;letter-spacing:.05em;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-tabbar-note{max-width:50%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;animation:dsh-wt-fade-in var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-tabbar-note[data-tone=error]{color:var(--dsw-alias-state-error-primary)}
.dsh-wt-tabbar-note[data-tone=ok]{color:var(--dsw-alias-state-success-primary)}
.dsh-wt-tabbar-hint{margin-left:auto;flex:none}

@media (prefers-reduced-motion:reduce){
  /* Gentler, not zero: keep opacity fades and colour changes, drop movement.
     The panel keeps a short opacity crossfade so open/close stays legible. */
  .dsh-wt-panel,.dsh-wt-panel[data-side]{transform:none;transition:opacity var(--dswt-dur-fast) ease}
  .dsh-wt-panel .dsh-wt-row,.dsh-wt-panel .dsh-wt-create-form,.dsh-wt-menu,.dsh-wt-menu-up,.dsh-wt-cf,.dsh-wt-create,.dsh-wt-detail{animation:dsh-wt-fade-in var(--dswt-dur-fast) ease both}
  .dsh-wt-trigger .dsh-wt-trigger-chevron svg{transition:none!important}
  .dsh-wt-spinner{animation:dsh-wt-pulse 1.1s ease-in-out infinite}
  .dsh-wt-trigger:active:not(:disabled),.dsh-wt-panel .dsh-wt-create-toggle:active:not(:disabled),.dsh-wt-panel .dsh-wt-button:active:not(:disabled),.dsh-wt-mini:active:not(:disabled),.dsh-wt-more:active,.dsh-wt-create-x:active{transform:none}
}
`;
