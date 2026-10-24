/**
 * Inline SVG icons for the worktree UI. All icons inherit `currentColor` and
 * default to 16px so they sit inside the composer toolbar and sidebar cells.
 * @module dsh-worktree/client/icons
 */
import { jsx } from 'react/jsx-runtime';

function Svg({ size = 16, children, ...rest }) {
  return jsx('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...rest,
    children,
  });
}

/** One branch leaving the trunk: the plain-branch mark. */
export function BranchIcon(props) {
  return jsx(Svg, {
    ...props,
    children: jsx('path', {
      d: 'M4.5 4.2v7.6M4.5 6.2c0-1.2 1-2.2 2.2-2.2h1.1c1.5 0 2.7 1.2 2.7 2.7v0c0 1.5-1.2 2.7-2.7 2.7H7.6',
    }),
  });
}

/** A branch that owns its own checkout: the worktree mark. */
export function WorktreeIcon(props) {
  return jsx(Svg, {
    ...props,
    children: jsx('path', {
      d: 'M3.5 3.8v8.4M3.5 5.4c0-.9.7-1.6 1.6-1.6h1.4c1.4 0 2.5 1.1 2.5 2.5v3.9c0 .9.7 1.6 1.6 1.6h.4',
    }),
  });
}

/** Remote-tracking mark. */
export function RemoteBranchIcon(props) {
  return jsx(Svg, {
    ...props,
    children: jsx('path', {
      d: 'M4.5 4.2v7.6M4.5 6.2c0-1.2 1-2.2 2.2-2.2h1.1c1.5 0 2.7 1.2 2.7 2.7v0c0 1.5-1.2 2.7-2.7 2.7H7.6M2.2 11.8h1.2M12.2 11.8h1.2',
    }),
  });
}

export function CheckIcon(props) {
  return jsx(Svg, { ...props, strokeWidth: 1.8, children: jsx('path', { d: 'M3 8.5l3 3 7-7' }) });
}

export function ChevronIcon({ open, ...props }) {
  return jsx(Svg, {
    ...props,
    style: { transform: open === true ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform .12s ease', ...(props.style ?? {}) },
    children: jsx('path', { d: 'M3 6.2l5 4.5 5-4.5' }),
  });
}

export function PlusIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: 'M8 3.5v9M3.5 8h9' }) });
}

export function WarningIcon(props) {
  return jsx(Svg, {
    ...props,
    children: jsx('path', { d: 'M8 2.8l5.4 9.4H2.6L8 2.8zM8 6.6v3M8 11.4v.2' }),
  });
}

export function TrashIcon(props) {
  return jsx(Svg, {
    ...props,
    children: jsx('path', { d: 'M3 4.6h10M6.4 4.6V3.4h3.2v1.2M4.2 4.6l.6 8h6.4l.6-8M6.6 7v3.4M9.4 7v3.4' }),
  });
}

export function SearchIcon(props) {
  return jsx(Svg, {
    ...props,
    children: jsx('path', { d: 'M7 11.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM10.4 10.4L13.5 13.5' }),
  });
}

export function SpinnerIcon({ size = 14 }) {
  return jsx('span', {
    className: 'dsh-wt-spinner',
    role: 'status',
    style: { width: size, height: size },
    'aria-hidden': true,
  });
}

/** Directory/folder mark for the pool section headers. */
export function FolderIcon(props) {
  return jsx(Svg, {
    ...props,
    children: jsx('path', { d: 'M2.2 12.6V4.4h4l1.4 1.6h6.2v6.6H2.2z' }),
  });
}
