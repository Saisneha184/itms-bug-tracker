/**
 * ITMS Bug Tracking Agent — Demo Seed Script
 *
 * Populates the store with realistic sample bugs and walks through
 * the full lifecycle so you can see every status transition.
 *
 * Run with:  node src/seed.js
 */

import {
  reportBug, assignBug, fixBug, closeBug, reopenBug,
  commentOnBug, listBugs, getDashboard, getBugHistory,
} from './agent.js';
import { getAllUsers } from './store.js';
import { printBugList, printDashboard, printHistory, printBanner } from './display.js';
import chalk from 'chalk';

printBanner();
console.log(chalk.bold('Running demo seed...\n'));

const users = getAllUsers();
// u1 = Alice (Manager), u2 = Bob (Dev), u3 = Carol (Dev), u4 = Dave (QA), u5 = Eve (Reporter)

// ── 1. Report 5 bugs ──────────────────────────────────────────────────────────
const b1 = reportBug({
  title:       'Login page crashes on empty password field',
  description: 'When user submits the login form with an empty password, the page throws an uncaught JS error.',
  priority:    'Critical',
  severity:    'Blocker',
  reportedBy:  'u5',
}).bug;

const b2 = reportBug({
  title:       'Dashboard chart not rendering in Safari',
  description: 'The D3 chart on the dashboard page renders correctly in Chrome but is blank in Safari 16.',
  priority:    'High',
  severity:    'Major',
  reportedBy:  'u4',
}).bug;

const b3 = reportBug({
  title:       'Export to CSV strips special characters',
  description: 'Exporting records with accented characters (é, ü, ñ) to CSV produces garbled text.',
  priority:    'Medium',
  severity:    'Major',
  reportedBy:  'u5',
}).bug;

const b4 = reportBug({
  title:       'Tooltip flickers on hover',
  description: 'The info tooltip on the settings page flickers when the mouse moves slowly across the trigger area.',
  priority:    'Low',
  severity:    'Minor',
  reportedBy:  'u4',
}).bug;

const b5 = reportBug({
  title:       'Pagination resets on table sort',
  description: 'Clicking a column header to sort a table resets the page number back to 1.',
  priority:    'Medium',
  severity:    'Major',
  reportedBy:  'u5',
}).bug;

console.log(chalk.cyan('  → 5 bugs created in Open state\n'));

// ── 2. Assign bugs ────────────────────────────────────────────────────────────
assignBug({ bugId: b1.id, assignedTo: 'u2', byUserId: 'u1', comment: 'Highest priority — Bob please handle immediately.' });
assignBug({ bugId: b2.id, assignedTo: 'u3', byUserId: 'u1', comment: 'Carol, please investigate Safari compatibility.' });
assignBug({ bugId: b3.id, assignedTo: 'u2', byUserId: 'u1' });
assignBug({ bugId: b5.id, assignedTo: 'u3', byUserId: 'u1' });
console.log(chalk.cyan('  → Bugs assigned to developers\n'));

// ── 3. Fix some bugs ──────────────────────────────────────────────────────────
fixBug({ bugId: b1.id, byUserId: 'u2', comment: 'Added null-check guard on password field before form submit.' });
fixBug({ bugId: b2.id, byUserId: 'u3', comment: 'Replaced SVG foreignObject with HTML fallback for Safari.' });
fixBug({ bugId: b5.id, byUserId: 'u3', comment: 'Reset page index to 0 in the sort handler.' });
console.log(chalk.cyan('  → Bugs marked as Fixed\n'));

// ── 4. Close one, reopen one ──────────────────────────────────────────────────
closeBug({ bugId: b2.id, byUserId: 'u4', comment: 'Verified on Safari 16 — chart renders correctly.' });
reopenBug({ bugId: b1.id, byUserId: 'u4', comment: 'Still crashes when password field has only whitespace. Reopened.' });
console.log(chalk.cyan('  → Bug closed (b2), bug reopened (b1)\n'));

// ── 5. Re-assign and re-fix reopened bug ──────────────────────────────────────
assignBug({ bugId: b1.id, assignedTo: 'u2', byUserId: 'u1', comment: 'Bob, whitespace edge-case also needs to be handled.' });
fixBug({ bugId: b1.id, byUserId: 'u2', comment: 'Added .trim() to password before the null-check.' });
closeBug({ bugId: b1.id, byUserId: 'u4', comment: 'Whitespace case verified — closing.' });
console.log(chalk.cyan('  → Reopened bug re-assigned, re-fixed, and closed\n'));

// ── 6. Add comments ───────────────────────────────────────────────────────────
commentOnBug({ bugId: b3.id, userId: 'u2', text: 'Looking into the CSV encoder — might be a BOM issue.' });
commentOnBug({ bugId: b4.id, userId: 'u4', text: 'Low priority but noticeable. Will pick up after the sprint.' });

// ── 7. Print final state ──────────────────────────────────────────────────────
console.log(chalk.bold('\n── Final Bug List ───────────────────────────────────'));
const { bugs } = listBugs();
printBugList(bugs, users);

const { stats, total } = getDashboard();
printDashboard(stats, total);

console.log(chalk.bold(`── Audit trail for ${b1.id} ────────────────────────────`));
const { history, comments } = getBugHistory(b1.id);
printHistory(history, comments, users);

console.log(chalk.green('  Demo seed complete! Run `npm start` to use the interactive agent.\n'));
