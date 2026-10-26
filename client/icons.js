/**
 * Inline SVG icons for the worktree UI.
 *
 * Branch geometry is the official GitHub Octicons `git-branch` glyph (the same
 * shape Codex and VS Code render for a Git branch): filled 16x16 path, no
 * invented strokes. Worktree and remote-tracking variants reuse that geometry
 * with one distinguishing mark so all three read as members of one family.
 * @module dsh-worktree/client/icons
 */
import { jsx } from 'react/jsx-runtime';

function Svg({ size = 16, children, ...rest }) {
  return jsx('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'currentColor',
    'aria-hidden': true,
    ...rest,
    children,
  });
}

/** Octicons `git-branch` (16px): trunk with a fork into the branch head. */
const GIT_BRANCH_PATH = 'M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z';

/**
 * VS Code codicon `worktree` (16px), copied verbatim from
 * `@vscode/codicons` `src/icons/worktree.svg` (MIT).
 *
 * This is the only widely shipped "worktree" glyph: a trunk that leaves the
 * main line and turns through an arrow, i.e. a checkout that branches off the
 * repository. Using it means the mark reads as "worktree" to anyone coming from
 * VS Code, instead of being an invented shape.
 */
const VSCODE_WORKTREE_PATH = 'M12.854 14.8542L14.854 12.8542C15.049 12.6592 15.049 12.3422 14.854 12.1472L12.854 10.1472C12.659 9.95223 12.342 9.95223 12.147 10.1472C11.952 10.3422 11.952 10.6592 12.147 10.8542L13.293 12.0002H8.5C8.225 12.0002 8 11.7752 8 11.5002V5.50023C8 5.22523 8.225 5.00023 8.5 5.00023H13.293L12.147 6.14623C12.049 6.24423 12.001 6.37223 12.001 6.50023C12.001 6.62823 12.05 6.75623 12.147 6.85423C12.342 7.04923 12.659 7.04923 12.854 6.85423L14.854 4.85423C15.049 4.65923 15.049 4.34223 14.854 4.14723L12.854 2.14723C12.659 1.95223 12.342 1.95223 12.147 2.14723C11.952 2.34223 11.952 2.65923 12.147 2.85423L13.293 4.00023H8.5C7.673 4.00023 7 4.67323 7 5.50023V8.00023H1.5C1.224 8.00023 1 8.22423 1 8.50023C1 8.77623 1.224 9.00023 1.5 9.00023H7V11.5002C7 12.3272 7.673 13.0002 8.5 13.0002H13.293L12.147 14.1462C12.049 14.2442 12.001 14.3722 12.001 14.5002C12.001 14.6282 12.05 14.7562 12.147 14.8542C12.342 15.0492 12.659 15.0492 12.854 14.8542Z';

/** The Git branch mark every branch-shaped row uses: the main checkout. */
export function BranchIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: GIT_BRANCH_PATH }) });
}

/** A linked worktree: VS Code's own worktree glyph, visually distinct at 14px. */
export function WorktreeIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: VSCODE_WORKTREE_PATH }) });
}

/** A remote-tracking branch: the branch mark with a dotted trunk. */
export function RemoteBranchIcon(props) {
  return jsx(Svg, {
    ...props,
    children: [
      jsx('path', { d: GIT_BRANCH_PATH, opacity: 0.55 }, 'branch'),
      jsx('rect', { x: 3.1, y: 5.6, width: 1.5, height: 1.2, rx: 0.3 }, 'dash-a'),
      jsx('rect', { x: 3.1, y: 7.9, width: 1.5, height: 1.2, rx: 0.3 }, 'dash-b'),
    ],
  });
}

export function CheckIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: 'M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z' }) });
}

/**
 * Chevron whose point names a direction.
 *
 * The base path is Octicons `chevron-down-16`, so no rotation points down. The
 * trigger uses `direction="up"` while its panel sits above it and `"down"` when
 * the panel is closed or flipped below, which is the opposite of "rotate when
 * open": the arrow shows where the panel is, not whether it exists.
 * @param props.direction - `up` or `down`; the way the chevron points.
 */
export function ChevronIcon({ direction = 'down', ...props }) {
  return jsx(Svg, {
    ...props,
    style: {
      transform: direction === 'up' ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform var(--dswt-dur-fast) var(--dswt-ease-out)',
      ...(props.style ?? {}),
    },
    children: jsx('path', { d: 'M12.78 6.22a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 7.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L8 9.94l3.72-3.72a.75.75 0 0 1 1.06 0Z' }),
  });
}

export function PlusIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: 'M7.75 2.5a.75.75 0 0 1 .75.75v4h4a.75.75 0 0 1 0 1.5h-4v4a.75.75 0 0 1-1.5 0v-4h-4a.75.75 0 0 1 0-1.5h4v-4a.75.75 0 0 1 .75-.75Z' }) });
}

export function WarningIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: 'M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM8 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z' }) });
}

export function TrashIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: 'M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z' }) });
}

export function SearchIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: 'M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z' }) });
}

export function SpinnerIcon({ size = 14 }) {
  return jsx('span', {
    className: 'dsh-wt-spinner',
    role: 'status',
    style: { width: size, height: size },
    'aria-hidden': true,
  });
}

/** Directory mark for the pool section header (Octicons `file-directory`). */
export function FolderIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: 'M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1Z' }) });
}
