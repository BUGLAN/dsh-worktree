/**
 * Commit-graph lane layout.
 *
 * Turns a topologically ordered commit list into per-row drawing instructions,
 * the same way `git log --graph` does it: a column is a *pending commit* that a
 * line is still travelling towards. Nothing here knows about pixels — the SVG
 * painter decides how a bend looks; this module only says which column a line
 * occupies at the top and the bottom of each row.
 *
 * Why compute it here instead of drawing straight from parents: a row needs to
 * know about lines that merely *pass through* it (other branches continuing
 * below), which no single commit's parent list can tell you. Only the running
 * column state can.
 *
 * @module dsh-worktree/client/graph-layout
 */

/**
 * Lay out one page of commits.
 *
 * @param {Array<{ hash: string, parents: string[] }>} commits
 *   commits in display order (newest first). Every parent that appears in the
 *   list must come *after* its child. A parent that is *not* in the list keeps
 *   its column open to the bottom edge — that is what a paged history looks
 *   like, and the next page picks the line up again.
 * @returns {Array<{
 *   lane: number,
 *   laneTop: boolean,
 *   pass: number[],
 *   incoming: number[],
 *   outgoing: Array<{ lane: number, kind: 'continue' | 'branch' | 'merge' }>,
 *   root: boolean,
 * }>} one drawing instruction set per commit, in the same order.
 */
export function layoutCommits(commits) {
  /** Column state: the commit each column is still waiting for (`null` = free). */
  const columns = [];
  const rows = [];

  for (const commit of commits) {
    const before = columns.slice();

    // Where does this commit sit? Either a column already waits for it, or it
    // is a branch tip and takes the first free column.
    let lane = columns.indexOf(commit.hash);
    const incoming = [];
    if (lane === -1) {
      lane = columns.indexOf(null);
      if (lane === -1) {
        lane = columns.length;
        columns.push(commit.hash);
      } else {
        columns[lane] = commit.hash;
      }
    } else {
      // Two branches converge on the same commit: the extra columns bend into
      // this node instead of continuing past it.
      for (let index = 0; index < columns.length; index += 1) {
        if (index !== lane && columns[index] === commit.hash) {
          incoming.push(index);
          columns[index] = null;
        }
      }
    }

    // Columns that merely cross this row.
    const pass = [];
    for (let index = 0; index < columns.length; index += 1) {
      if (index === lane || incoming.includes(index)) continue;
      if (columns[index] !== null) pass.push(index);
    }

    // Where does the line leave the node?
    const outgoing = [];
    if (commit.parents.length > 0) {
      for (let index = 0; index < commit.parents.length; index += 1) {
        const parent = commit.parents[index];
        // A parent may already be awaited by another column (a merge whose
        // second parent is an older branch still open below): bend towards it
        // instead of opening a duplicate column for the same commit.
        let waitingAt = -1;
        for (let column = 0; column < columns.length; column += 1) {
          if (column !== lane && columns[column] === parent) waitingAt = column;
        }
        if (waitingAt !== -1) {
          if (index === 0) columns[lane] = null;
          outgoing.push({ lane: waitingAt, kind: 'merge' });
          continue;
        }
        if (index === 0) {
          columns[lane] = parent;
          outgoing.push({ lane, kind: 'continue' });
        } else {
          let free = columns.indexOf(null);
          if (free === -1) {
            free = columns.length;
            columns.push(parent);
          } else {
            columns[free] = parent;
          }
          outgoing.push({ lane: free, kind: 'branch' });
        }
      }
    } else {
      columns[lane] = null;
    }

    const laneTop = before[lane] !== null && before[lane] !== undefined;
    // An incoming column only bends in if it actually carried a line on the
    // previous row; a freshly created column has nothing above it.
    const incomingTop = incoming.filter((index) => before[index] !== null && before[index] !== undefined);

    while (columns.length > 0 && columns[columns.length - 1] === null) columns.pop();

    rows.push({
      lane,
      laneTop,
      pass,
      incoming: incomingTop,
      outgoing,
      root: commit.parents.length === 0,
    });
  }

  return rows;
}

/**
 * Columns a page needs, so the painter can size its gutter.
 * @param {ReturnType<typeof layoutCommits>} rows - laid-out page.
 * @returns {number} column count, at least 1.
 */
export function countLanes(rows) {
  let max = 1;
  for (const row of rows) {
    max = Math.max(max, row.lane + 1);
    for (const lane of row.pass) max = Math.max(max, lane + 1);
    for (const lane of row.incoming) max = Math.max(max, lane + 1);
    for (const edge of row.outgoing) max = Math.max(max, edge.lane + 1);
  }
  return max;
}
