/**
 * Plugin-owned stylesheet. Inserted once per client run as a scoped
 * `<style data-plugin="dsh-worktree">` tag and removed with it. Only theme
 * tokens (`--dsw-alias-*`, radii, elevations) reference the host theme; every
 * class is prefixed `dsh-wt-` so nothing leaks into host components.
 * @module dsh-worktree/client/styles
 */

export const CSS = `
.dsh-wt-spinner{display:inline-block;border:1.5px solid var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));border-top-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));border-radius:50%;animation:dsh-wt-spin .7s linear infinite;flex:none}
@keyframes dsh-wt-spin{to{transform:rotate(360deg)}}

/* ---- composer toolbar trigger ---- */
.dsh-wt-trigger{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 4px 0 8px;border:none;background:transparent;border-radius:var(--dsw-radius-sm,8px);color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;line-height:20px;cursor:pointer;max-width:180px}
.dsh-wt-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));color:var(--dsw-alias-label-primary)}
.dsh-wt-trigger:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-trigger:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:default}
.dsh-wt-trigger .dsh-wt-trigger-icon{display:inline-flex;flex:none;color:var(--dsw-alias-label-secondary)}
.dsh-wt-trigger .dsh-wt-trigger-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-trigger .dsh-wt-trigger-chevron{display:inline-flex;flex:none;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-trigger[data-variant="worktree"] .dsh-wt-trigger-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
@container (width<=460px){.dsh-wt-trigger .dsh-wt-trigger-label{display:none}}

/* ---- anchored panel ---- */
.dsh-wt-panel{position:fixed;z-index:1100;width:380px;max-width:calc(100vw - 24px);background:var(--dsw-specific-menu,var(--dsw-alias-bg-overlay));border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg,12px);box-shadow:var(--dsw-elevation-prominent,0 12px 32px rgba(0,0,0,.18));display:flex;flex-direction:column;max-height:min(520px,calc(100vh - 32px));overflow:hidden;color:var(--dsw-alias-label-primary);font-size:13px}
.dsh-wt-panel-search{display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-panel-search input{flex:1;min-width:0;border:none;background:transparent;color:var(--dsw-alias-label-primary);font-size:13px;outline:none}
.dsh-wt-panel-search input::placeholder{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-panel-body{overflow-y:auto;overscroll-behavior:contain;padding:4px 0 6px}
.dsh-wt-section{margin-top:6px}
.dsh-wt-section-title{display:flex;align-items:center;gap:6px;padding:4px 12px 2px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;user-select:none}
.dsh-wt-section-title .dsh-wt-section-extra{margin-left:auto;font-weight:400;text-transform:none;letter-spacing:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
.dsh-wt-row{display:flex;align-items:center;gap:8px;width:100%;padding:5px 12px;border:none;background:transparent;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;text-align:left;cursor:pointer}
.dsh-wt-row:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))}
.dsh-wt-row:focus-visible{outline:none;box-shadow:inset 0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-row:disabled{cursor:default;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-row .dsh-wt-row-icon{display:inline-flex;flex:none;color:var(--dsw-alias-label-secondary)}
.dsh-wt-row[data-kind="worktree"] .dsh-wt-row-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-row-main{flex:1;min-width:0;display:flex;flex-direction:column}
.dsh-wt-row-title{display:flex;align-items:center;gap:6px;min-width:0}
.dsh-wt-row-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.dsh-wt-row-sub{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11.5px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-row-sub[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-row-check{display:inline-flex;flex:none;color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-row-actions{display:inline-flex;flex:none;gap:2px;opacity:0;transition:opacity .1s}
.dsh-wt-row:hover .dsh-wt-row-actions,.dsh-wt-row:focus-within .dsh-wt-row-actions{opacity:1}
.dsh-wt-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:none;background:transparent;border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:pointer}
.dsh-wt-iconbtn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));color:var(--dsw-alias-label-primary)}
.dsh-wt-iconbtn[data-tone="danger"]:hover{color:var(--dsw-alias-state-error-primary)}
.dsh-wt-badge{flex:none;display:inline-flex;align-items:center;height:16px;padding:0 6px;border-radius:8px;font-size:10.5px;font-weight:600;background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-badge[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-badge[data-tone="brand"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}

/* current-checkout status block */
.dsh-wt-current{display:flex;align-items:flex-start;gap:8px;padding:8px 12px;margin:6px 10px 2px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.03))}
.dsh-wt-current-icon{display:inline-flex;flex:none;margin-top:1px;color:var(--dsw-alias-label-secondary)}
.dsh-wt-current-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.dsh-wt-current-title{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-current-sub{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11.5px;line-height:16px}
.dsh-wt-current-sub[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-note{padding:8px 12px;margin:6px 10px;border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.03));color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.dsh-wt-meta{padding:2px 12px 4px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* footer: create form */
.dsh-wt-footer{border-top:1px solid var(--dsw-alias-border-l1);padding:6px 8px}
.dsh-wt-create-toggle{display:flex;align-items:center;gap:8px;width:100%;padding:6px 6px;border:none;background:transparent;border-radius:var(--dsw-radius-sm,8px);color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;cursor:pointer}
.dsh-wt-create-toggle:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))}
.dsh-wt-create-form{display:flex;flex-direction:column;gap:8px;padding:8px 6px 4px}
.dsh-wt-create-form .dsh-wt-field{display:flex;flex-direction:column;gap:4px}
.dsh-wt-create-form label{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11.5px}
.dsh-wt-create-form input[type=text]{height:30px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;outline:none}
.dsh-wt-create-form input[type=text]:focus{border-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-create-form select{height:30px;padding:0 6px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;outline:none}
.dsh-wt-checkbox{display:flex;align-items:center;gap:8px;color:var(--dsw-alias-label-primary);font-size:12.5px;cursor:pointer;user-select:none}
.dsh-wt-checkbox input{accent-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-create-actions{display:flex;justify-content:flex-end;gap:8px}
.dsh-wt-button{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:none;border-radius:var(--dsw-radius-sm,8px);font-size:13px;font-weight:500;cursor:pointer}
.dsh-wt-button:disabled{cursor:default;opacity:.6}
.dsh-wt-button[data-variant="primary"]{background:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));color:#fff}
.dsh-wt-button[data-variant="plain"]{background:transparent;color:var(--dsw-alias-label-secondary)}
.dsh-wt-button[data-variant="plain"]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));color:var(--dsw-alias-label-primary)}
.dsh-wt-button[data-variant="danger"]{background:transparent;color:var(--dsw-alias-state-error-primary)}
.dsh-wt-button[data-variant="danger"]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))}

/* inline confirm / error area */
.dsh-wt-confirm{margin:6px 10px;padding:8px 10px;border:1px solid var(--dsw-alias-state-warn-primary);border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.03));display:flex;flex-direction:column;gap:6px}
.dsh-wt-confirm-title{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-state-warn-primary);font-weight:600;font-size:12.5px}
.dsh-wt-confirm-body{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.dsh-wt-confirm-body .dsh-wt-confirm-detail{display:block;margin-top:4px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11px;white-space:pre-wrap;word-break:break-all;max-height:72px;overflow-y:auto}
.dsh-wt-confirm-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.dsh-wt-error{margin:6px 10px;padding:8px 10px;border:1px solid var(--dsw-alias-state-error-primary);border-radius:var(--dsw-radius-sm,8px);display:flex;flex-direction:column;gap:6px}
.dsh-wt-error-title{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-state-error-primary);font-weight:600;font-size:12.5px}
.dsh-wt-error-body{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.dsh-wt-error-body .dsh-wt-confirm-detail{display:block;margin-top:4px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11px;white-space:pre-wrap;word-break:break-all;max-height:72px;overflow-y:auto}
.dsh-wt-toast{margin:6px 10px;padding:6px 10px;border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));color:var(--dsw-alias-label-secondary);font-size:12px;display:flex;align-items:center;gap:6px}
.dsh-wt-toast .dsh-wt-row-check{color:var(--dsw-alias-state-success-primary)}

/* ---- session header chip ---- */
.dsh-wt-chip{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;max-width:260px;white-space:nowrap;overflow:hidden}
.dsh-wt-chip .dsh-wt-chip-icon{display:inline-flex;flex:none}
.dsh-wt-chip[data-variant="worktree"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));border-color:var(--dsw-alias-border-l2)}
.dsh-wt-chip .dsh-wt-chip-label{overflow:hidden;text-overflow:ellipsis}

/* ---- sidebar decorations ---- */
.dsh-wt-leading{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-leading[data-variant="worktree"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-hover{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.dsh-wt-hover .dsh-wt-hover-icon{display:inline-flex;flex:none}
.dsh-wt-hover[data-variant="worktree"] .dsh-wt-hover-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-hover .dsh-wt-hover-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-hover .dsh-wt-hover-dirty{flex:none;color:var(--dsw-alias-state-warn-primary);font-size:11px}
`;
