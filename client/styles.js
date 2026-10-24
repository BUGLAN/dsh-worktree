/**
 * Plugin-owned stylesheet. Inserted once per client run as a scoped
 * `<style data-plugin="dsh-worktree">` tag and removed with it.
 *
 * Opacity policy: the panel is an opaque surface (`--dsw-alias-bg-layer-2`
 * first, never a bare translucent overlay) so text keeps contrast over the
 * conversation behind it. Hover/subtle fills use a stronger mix than the host's
 * faint `interactive-bg-hover`, because a 5% black wash is invisible on the
 * dark composer area.
 *
 * Density policy: 6/8px rhythm, 28px rows, no decorative gaps between sections.
 * @module dsh-worktree/client/styles
 */

export const CSS = `
.dsh-wt-spinner{display:inline-block;border:1.5px solid var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));border-top-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));border-radius:50%;animation:dsh-wt-spin .7s linear infinite;flex:none}
@keyframes dsh-wt-spin{to{transform:rotate(360deg)}}

/* ---- composer toolbar trigger ---- */
.dsh-wt-trigger{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 5px 0 7px;border:none;background:transparent;border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;line-height:20px;cursor:pointer;max-width:190px}
.dsh-wt-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary)}
.dsh-wt-trigger:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-trigger:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:default}
.dsh-wt-trigger .dsh-wt-trigger-icon{display:inline-flex;flex:none;opacity:.9}
.dsh-wt-trigger .dsh-wt-trigger-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-trigger .dsh-wt-trigger-chevron{display:inline-flex;flex:none;opacity:.65}
.dsh-wt-trigger[data-variant="worktree"] .dsh-wt-trigger-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}
@container (width<=460px){.dsh-wt-trigger .dsh-wt-trigger-label{display:none}}

/* ---- anchored panel ---- */
.dsh-wt-panel{position:fixed;z-index:1100;width:360px;max-width:calc(100vw - 16px);background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-overlay,Canvas));border:1px solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:var(--dsw-radius-lg,10px);box-shadow:0 12px 28px rgba(0,0,0,.45),0 0 0 1px rgba(0,0,0,.25);display:flex;flex-direction:column;max-height:min(460px,calc(100vh - 96px));overflow:hidden;color:var(--dsw-alias-label-primary,CanvasText);font-size:13px}
.dsh-wt-panel-search{display:flex;align-items:center;gap:6px;padding:7px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));flex:none}
.dsh-wt-panel-search input{flex:1;min-width:0;border:none;background:transparent;color:var(--dsw-alias-label-primary);font-size:13px;line-height:18px;outline:none}
.dsh-wt-panel-search input::placeholder{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-panel-body{overflow-y:auto;overscroll-behavior:contain;padding:2px 0 4px;min-height:0}

/* section: no extra outer gap, title sits tight on its rows */
.dsh-wt-panel .dsh-wt-section{margin:4px 0 0}
.dsh-wt-panel .dsh-wt-section:first-child{margin-top:0}
.dsh-wt-panel .dsh-wt-section-title{display:flex;align-items:center;gap:5px;padding:4px 10px 3px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;user-select:none;line-height:14px}
.dsh-wt-panel .dsh-wt-section-title .dsh-wt-section-extra{margin-left:auto;font-weight:400;text-transform:none;letter-spacing:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:168px;font-size:10.5px;opacity:.85}

/* rows: 28px, 4px vertical padding */
.dsh-wt-panel .dsh-wt-row{display:flex;align-items:center;gap:7px;width:100%;padding:3px 10px;margin:0;border:none;background:transparent;color:var(--dsw-alias-label-primary);font-size:13px;line-height:18px;text-align:left;cursor:pointer;border-radius:0}
.dsh-wt-panel .dsh-wt-row:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07))}
.dsh-wt-panel .dsh-wt-row:focus-visible{outline:none;box-shadow:inset 0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-panel .dsh-wt-row:disabled{cursor:default;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-panel .dsh-wt-row .dsh-wt-row-icon{display:inline-flex;flex:none;opacity:.85}
.dsh-wt-panel .dsh-wt-row[data-kind="worktree"] .dsh-wt-row-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}
.dsh-wt-panel .dsh-wt-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:0}
.dsh-wt-panel .dsh-wt-row-title{display:flex;align-items:center;gap:5px;min-width:0;line-height:16px}
.dsh-wt-panel .dsh-wt-row-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.dsh-wt-panel .dsh-wt-row-sub{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-panel .dsh-wt-row-sub[data-tone="warn"]{color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 72%,var(--dsw-alias-label-primary,#0f1115))}
.dsh-wt-panel .dsh-wt-row-here{flex:none;color:var(--dsw-alias-label-secondary);font-size:10.5px;line-height:15px;opacity:.9}
.dsh-wt-panel .dsh-wt-row-check{display:inline-flex;flex:none;color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-panel .dsh-wt-row-actions{display:inline-flex;flex:none;gap:0;opacity:0;transition:opacity .1s}
.dsh-wt-panel .dsh-wt-row:hover .dsh-wt-row-actions,.dsh-wt-panel .dsh-wt-row:focus-within .dsh-wt-row-actions{opacity:1}
.dsh-wt-panel .dsh-wt-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border:none;background:transparent;border-radius:var(--dsw-radius-sm,5px);color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:pointer}
.dsh-wt-panel .dsh-wt-iconbtn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.1));color:var(--dsw-alias-label-primary)}
.dsh-wt-panel .dsh-wt-iconbtn[data-tone="danger"]:hover{color:var(--dsw-alias-state-error-primary)}
.dsh-wt-panel .dsh-wt-badge{flex:none;display:inline-flex;align-items:center;height:15px;padding:0 5px;border-radius:7px;font-size:10px;font-weight:600;line-height:15px;background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.09));color:var(--dsw-alias-label-secondary)}
.dsh-wt-panel .dsh-wt-badge[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-panel .dsh-wt-badge[data-tone="brand"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}

/* current-checkout block */
.dsh-wt-panel .dsh-wt-current{display:flex;align-items:flex-start;gap:7px;padding:6px 9px;margin:6px 8px 2px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm,7px);background:var(--dsw-alias-bg-layer-1,color-mix(in srgb,CanvasText 5%,Canvas))}
.dsh-wt-panel .dsh-wt-current-icon{display:inline-flex;flex:none;margin-top:1px;opacity:.9}
.dsh-wt-panel .dsh-wt-current-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.dsh-wt-panel .dsh-wt-current-title{font-weight:600;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-panel .dsh-wt-current-sub{color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:15px}
.dsh-wt-panel .dsh-wt-current-sub[data-tone="warn"]{color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 72%,var(--dsw-alias-label-primary,#0f1115))}
.dsh-wt-panel .dsh-wt-note{padding:6px 9px;margin:6px 8px;border-radius:var(--dsw-radius-sm,7px);background:var(--dsw-alias-bg-layer-1,color-mix(in srgb,CanvasText 5%,Canvas));color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px;border:1px solid var(--dsw-alias-border-l1)}
.dsh-wt-panel .dsh-wt-meta{padding:2px 10px 3px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:10.5px;line-height:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* footer: create form */
.dsh-wt-panel .dsh-wt-footer{border-top:1px solid var(--dsw-alias-border-l1);padding:4px;flex:none;background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-overlay))}
.dsh-wt-panel .dsh-wt-create-toggle{display:flex;align-items:center;gap:7px;width:100%;padding:5px 7px;border:none;background:transparent;border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:18px;cursor:pointer}
.dsh-wt-panel .dsh-wt-create-toggle:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07))}
.dsh-wt-panel .dsh-wt-create-toggle:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:default}
.dsh-wt-panel .dsh-wt-create-form{display:flex;flex-direction:column;gap:6px;padding:6px 6px 2px}
.dsh-wt-panel .dsh-wt-create-form .dsh-wt-field{display:flex;flex-direction:column;gap:3px}
.dsh-wt-panel .dsh-wt-create-form label{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11px;line-height:14px}
.dsh-wt-panel .dsh-wt-create-form input[type=text]{height:28px;padding:0 7px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-bg-base,Canvas);color:var(--dsw-alias-label-primary,CanvasText);font-size:13px;line-height:18px;outline:none}
.dsh-wt-panel .dsh-wt-create-form input[type=text]::placeholder{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-panel .dsh-wt-create-form input[type=text]:focus{border-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-panel .dsh-wt-create-form select{height:28px;padding:0 5px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-bg-base,Canvas);color:var(--dsw-alias-label-primary,CanvasText);font-size:12.5px;line-height:18px;outline:none}
.dsh-wt-panel .dsh-wt-checkbox{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-label-primary);font-size:12.5px;line-height:16px;cursor:pointer;user-select:none}
.dsh-wt-panel .dsh-wt-checkbox input{margin:0;accent-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-panel .dsh-wt-create-actions{display:flex;justify-content:flex-end;gap:6px}
.dsh-wt-panel .dsh-wt-button{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 10px;border:none;border-radius:var(--dsw-radius-sm,6px);font-size:12.5px;font-weight:500;line-height:18px;cursor:pointer}
.dsh-wt-panel .dsh-wt-button:disabled{cursor:default;opacity:.55}
.dsh-wt-panel .dsh-wt-button[data-variant="primary"]{background:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));color:#fff}
.dsh-wt-panel .dsh-wt-button[data-variant="primary"]:hover:not(:disabled){filter:brightness(1.08)}
.dsh-wt-panel .dsh-wt-button[data-variant="plain"]{background:transparent;color:var(--dsw-alias-label-secondary)}
.dsh-wt-panel .dsh-wt-button[data-variant="plain"]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07));color:var(--dsw-alias-label-primary)}
.dsh-wt-panel .dsh-wt-button[data-variant="danger"]{background:transparent;color:var(--dsw-alias-state-error-primary)}
.dsh-wt-panel .dsh-wt-button[data-variant="danger"]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07))}

/* inline confirm / error / toast */
.dsh-wt-panel .dsh-wt-confirm{margin:6px 8px 2px;padding:6px 9px;border:1px solid var(--dsw-alias-state-warn-primary);border-radius:var(--dsw-radius-sm,7px);background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-overlay));display:flex;flex-direction:column;gap:5px}
.dsh-wt-panel .dsh-wt-confirm-title{display:flex;align-items:center;gap:5px;color:var(--dsw-alias-state-warn-primary);font-weight:600;font-size:12px;line-height:16px}
.dsh-wt-panel .dsh-wt-confirm-body{color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px}
.dsh-wt-panel .dsh-wt-confirm-body .dsh-wt-confirm-detail{display:block;margin-top:3px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:10.5px;white-space:pre-wrap;word-break:break-all;max-height:60px;overflow-y:auto}
.dsh-wt-panel .dsh-wt-confirm-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.dsh-wt-panel .dsh-wt-error{margin:6px 8px 2px;padding:6px 9px;border:1px solid var(--dsw-alias-state-error-primary);border-radius:var(--dsw-radius-sm,7px);background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-overlay));display:flex;flex-direction:column;gap:5px}
.dsh-wt-panel .dsh-wt-error-title{display:flex;align-items:center;gap:5px;color:var(--dsw-alias-state-error-primary);font-weight:600;font-size:12px;line-height:16px}
.dsh-wt-panel .dsh-wt-error-body{color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px}
.dsh-wt-panel .dsh-wt-error-body .dsh-wt-confirm-detail{display:block;margin-top:3px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:10.5px;white-space:pre-wrap;word-break:break-all;max-height:60px;overflow-y:auto}
.dsh-wt-panel .dsh-wt-toast{margin:6px 8px 2px;padding:5px 9px;border-radius:var(--dsw-radius-sm,7px);background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-overlay));border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px;display:flex;align-items:center;gap:5px}
.dsh-wt-panel .dsh-wt-toast .dsh-wt-row-check{color:var(--dsw-alias-state-success-primary)}

/* ---- session header chip ---- */
.dsh-wt-chip{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 7px;border:1px solid var(--dsw-alias-border-l1);border-radius:11px;color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px;max-width:240px;white-space:nowrap;overflow:hidden;background:var(--dsw-alias-bg-layer-1,transparent)}
.dsh-wt-chip .dsh-wt-chip-icon{display:inline-flex;flex:none;opacity:.85}
.dsh-wt-chip[data-variant="worktree"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));border-color:var(--dsw-alias-border-l2)}
.dsh-wt-chip[data-variant="worktree"] .dsh-wt-chip-icon{opacity:1}
.dsh-wt-chip .dsh-wt-chip-label{overflow:hidden;text-overflow:ellipsis}

/* ---- sidebar decorations ---- */
.dsh-wt-leading{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-leading[data-variant="worktree"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-hover{display:flex;align-items:center;gap:5px;color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px}
.dsh-wt-hover .dsh-wt-hover-icon{display:inline-flex;flex:none;opacity:.85}
.dsh-wt-hover[data-variant="worktree"] .dsh-wt-hover-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}
.dsh-wt-hover .dsh-wt-hover-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-hover .dsh-wt-hover-dirty{flex:none;color:var(--dsw-alias-state-warn-primary);font-size:10.5px}
`;
