/**
 * ITMS Bug Tracking Agent — Display / Formatter
 * Renders bugs, tables, and banners to the terminal.
 */

import chalk from 'chalk';
import { format } from 'date-fns';
import { STATUS, PRIORITY, SEVERITY } from './constants.js';

// ─── Color maps ───────────────────────────────────────────────────────────────

const statusColor = {
  [STATUS.OPEN]:     chalk.blue.bold,
  [STATUS.ASSIGNED]: chalk.yellow.bold,
  [STATUS.FIXED]:    chalk.cyan.bold,
  [STATUS.CLOSED]:   chalk.green.bold,
  [STATUS.REOPENED]: chalk.red.bold,
};

const priorityColor = {
  [PRIORITY.LOW]:      chalk.gray,
  [PRIORITY.MEDIUM]:   chalk.yellow,
  [PRIORITY.HIGH]:     chalk.red,
  [PRIORITY.CRITICAL]: chalk.bgRed.white.bold,
};

const severityColor = {
  [SEVERITY.MINOR]:   chalk.gray,
  [SEVERITY.MAJOR]:   chalk.yellow,
  [SEVERITY.BLOCKER]: chalk.bgRed.white.bold,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function colorStatus(s)   { return (statusColor[s]   ?? chalk.white)(s); }
export function colorPriority(p) { return (priorityColor[p] ?? chalk.white)(p); }
export function colorSeverity(s) { return (severityColor[s] ?? chalk.white)(s); }

export function fmt(dateStr) {
  return dateStr ? format(new Date(dateStr), 'dd MMM yyyy, HH:mm') : '—';
}

// ─── Banner ───────────────────────────────────────────────────────────────────

export function printBanner() {
  console.log(chalk.bgBlue.white.bold('\n  ITMS Bug Tracking Agent  '));
  console.log(chalk.dim('  IT Management System | Bug Lifecycle Manager\n'));
}

// ─── Bug card ─────────────────────────────────────────────────────────────────

export function printBugCard(bug, users) {
  const reporter = users.find(u => u.id === bug.reportedBy);
  const assignee = bug.assignedTo ? users.find(u => u.id === bug.assignedTo) : null;

  console.log(chalk.bold('\n┌─────────────────────────────────────────────────────'));
  console.log(chalk.bold(`│ ${bug.id}`) + '  ' + colorStatus(bug.status));
  console.log(chalk.bold(`│ ${bug.title}`));
  console.log('├─────────────────────────────────────────────────────');
  console.log(`│ Priority : ${colorPriority(bug.priority)}  │  Severity: ${colorSeverity(bug.severity)}`);
  console.log(`│ Reporter : ${reporter?.name ?? bug.reportedBy}`);
  console.log(`│ Assignee : ${assignee?.name ?? chalk.dim('Unassigned')}`);
  console.log(`│ Created  : ${fmt(bug.createdAt)}  │  Updated: ${fmt(bug.updatedAt)}`);
  console.log('├─────────────────────────────────────────────────────');
  console.log(`│ ${chalk.italic(bug.description)}`);
  console.log('└─────────────────────────────────────────────────────\n');
}

// ─── Bug list table ───────────────────────────────────────────────────────────

export function printBugList(bugs, users) {
  if (bugs.length === 0) {
    console.log(chalk.dim('  No bugs found.\n'));
    return;
  }

  const colW = [10, 36, 12, 10, 10, 18];
  const header = [
    'ID'.padEnd(colW[0]),
    'Title'.padEnd(colW[1]),
    'Status'.padEnd(colW[2]),
    'Priority'.padEnd(colW[3]),
    'Severity'.padEnd(colW[4]),
    'Assignee'.padEnd(colW[5]),
  ];
  const sep = header.map((_, i) => '─'.repeat(colW[i])).join('─┼─');

  console.log('\n ' + chalk.bold(header.join(' │ ')));
  console.log(' ' + sep);

  for (const b of bugs) {
    const assignee = b.assignedTo ? (users.find(u => u.id === b.assignedTo)?.name ?? b.assignedTo) : '—';
    const row = [
      chalk.bold(b.id).padEnd(colW[0] + 10),   // extra for ANSI codes
      b.title.substring(0, 34).padEnd(colW[1]),
      colorStatus(b.status).padEnd(colW[2] + 10),
      colorPriority(b.priority).padEnd(colW[3] + 10),
      colorSeverity(b.severity).padEnd(colW[4] + 10),
      assignee.padEnd(colW[5]),
    ];
    console.log(' ' + row.join(' │ '));
  }
  console.log('');
}

// ─── History ─────────────────────────────────────────────────────────────────

export function printHistory(history, comments, users) {
  console.log(chalk.bold('\n── Audit Trail ──────────────────────────────────────'));
  for (const h of history) {
    const actor = users.find(u => u.id === h.by);
    const arrow = h.from ? `${colorStatus(h.from)} → ${colorStatus(h.to)}` : colorStatus(h.to);
    console.log(`  ${chalk.dim(fmt(h.at))}  ${arrow}`);
    console.log(`  ${chalk.dim('by')} ${actor?.name ?? h.by}: ${chalk.italic(h.comment)}`);
    console.log('');
  }

  if (comments.length > 0) {
    console.log(chalk.bold('── Comments ─────────────────────────────────────────'));
    for (const c of comments) {
      const actor = users.find(u => u.id === c.by);
      console.log(`  ${chalk.dim(fmt(c.at))}  ${chalk.bold(actor?.name ?? c.by)}`);
      console.log(`  ${c.text}\n`);
    }
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function printDashboard(stats, total) {
  console.log(chalk.bold('\n── ITMS Bug Dashboard ───────────────────────────────'));
  const statuses = Object.values(import.meta.resolve ? [] : []);

  const rows = [
    [STATUS.OPEN,     stats[STATUS.OPEN]     ?? 0],
    [STATUS.ASSIGNED, stats[STATUS.ASSIGNED] ?? 0],
    [STATUS.FIXED,    stats[STATUS.FIXED]    ?? 0],
    [STATUS.CLOSED,   stats[STATUS.CLOSED]   ?? 0],
    [STATUS.REOPENED, stats[STATUS.REOPENED] ?? 0],
  ];

  for (const [s, count] of rows) {
    const bar = '█'.repeat(count);
    console.log(`  ${colorStatus(s).padEnd(20)}  ${String(count).padStart(4)}  ${chalk.dim(bar)}`);
  }
  console.log(chalk.bold(`\n  Total bugs: ${total}\n`));
}
