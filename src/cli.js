/**
 * ITMS Bug Tracking Agent — Interactive CLI
 * Drives the agent via inquirer prompts.
 */

import inquirer from 'inquirer';
import chalk from 'chalk';

import {
  reportBug, assignBug, fixBug, closeBug, reopenBug,
  commentOnBug, getBug, listBugs, getDashboard, getBugHistory,
} from './agent.js';
import { getAllUsers, getDevelopers } from './store.js';
import { STATUS, PRIORITY, SEVERITY } from './constants.js';
import {
  printBanner, printBugCard, printBugList,
  printHistory, printDashboard,
} from './display.js';

// ─── Main menu ────────────────────────────────────────────────────────────────

const MAIN_ACTIONS = {
  REPORT:   '📝  Report a new bug',
  ASSIGN:   '👤  Assign bug to developer',
  FIX:      '🔧  Mark bug as Fixed',
  CLOSE:    '✅  Close bug',
  REOPEN:   '🔁  Reopen bug',
  COMMENT:  '💬  Add a comment',
  VIEW:     '🔍  View bug details',
  LIST:     '📋  List bugs',
  HISTORY:  '📜  Bug audit trail',
  DASH:     '📊  Dashboard',
  EXIT:     '🚪  Exit',
};

export async function runCLI() {
  printBanner();

  while (true) {
    const { action } = await inquirer.prompt([
      {
        type:    'list',
        name:    'action',
        message: 'What would you like to do?',
        choices: Object.values(MAIN_ACTIONS),
        pageSize: 12,
      },
    ]);

    console.log('');

    try {
      if (action === MAIN_ACTIONS.REPORT)   await handleReport();
      else if (action === MAIN_ACTIONS.ASSIGN)   await handleAssign();
      else if (action === MAIN_ACTIONS.FIX)      await handleFix();
      else if (action === MAIN_ACTIONS.CLOSE)    await handleClose();
      else if (action === MAIN_ACTIONS.REOPEN)   await handleReopen();
      else if (action === MAIN_ACTIONS.COMMENT)  await handleComment();
      else if (action === MAIN_ACTIONS.VIEW)     await handleView();
      else if (action === MAIN_ACTIONS.LIST)     await handleList();
      else if (action === MAIN_ACTIONS.HISTORY)  await handleHistory();
      else if (action === MAIN_ACTIONS.DASH)     await handleDashboard();
      else if (action === MAIN_ACTIONS.EXIT) {
        console.log(chalk.green('Goodbye! 👋\n'));
        process.exit(0);
      }
    } catch (err) {
      console.log(chalk.red(`\n  ✖ Error: ${err.message}\n`));
    }
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleReport() {
  const users = getAllUsers();
  const { title, description, priority, severity, reportedBy } = await inquirer.prompt([
    {
      type: 'input', name: 'title',
      message: 'Bug title:',
      validate: v => v.trim() ? true : 'Title is required.',
    },
    {
      type: 'editor', name: 'description',
      message: 'Bug description (opens editor):',
      default: 'Describe the bug, steps to reproduce, and expected vs actual behaviour.',
    },
    {
      type: 'list', name: 'priority',
      message: 'Priority:',
      choices: Object.values(PRIORITY),
      default: PRIORITY.MEDIUM,
    },
    {
      type: 'list', name: 'severity',
      message: 'Severity:',
      choices: Object.values(SEVERITY),
      default: SEVERITY.MAJOR,
    },
    {
      type: 'list', name: 'reportedBy',
      message: 'Reported by:',
      choices: users.map(u => ({ name: `${u.name} (${u.role})`, value: u.id })),
    },
  ]);

  const result = reportBug({ title, description: description.trim(), priority, severity, reportedBy });
  console.log(chalk.green(`\n  ✔ ${result.message}`));
  printBugCard(result.bug, users);
}

async function handleAssign() {
  const users = getAllUsers();
  const devs  = getDevelopers();
  const openBugs = listBugs().bugs.filter(b => [STATUS.OPEN, STATUS.REOPENED].includes(b.status));

  if (openBugs.length === 0) {
    console.log(chalk.yellow('  No Open or Reopened bugs available to assign.\n'));
    return;
  }

  const { bugId, assignedTo, byUserId, comment } = await inquirer.prompt([
    {
      type: 'list', name: 'bugId',
      message: 'Select bug to assign:',
      choices: openBugs.map(b => ({ name: `${b.id} — ${b.title} [${b.status}]`, value: b.id })),
    },
    {
      type: 'list', name: 'assignedTo',
      message: 'Assign to developer:',
      choices: devs.map(d => ({ name: d.name, value: d.id })),
    },
    {
      type: 'list', name: 'byUserId',
      message: 'Action performed by:',
      choices: users.map(u => ({ name: `${u.name} (${u.role})`, value: u.id })),
    },
    {
      type: 'input', name: 'comment',
      message: 'Optional comment:',
      default: '',
    },
  ]);

  const result = assignBug({ bugId, assignedTo, byUserId, comment: comment || undefined });
  console.log(chalk.green(`\n  ✔ ${result.message}`));
  printBugCard(result.bug, users);
}

async function handleFix() {
  const users      = getAllUsers();
  const fixableBugs = listBugs().bugs.filter(b => b.status === STATUS.ASSIGNED);

  if (fixableBugs.length === 0) {
    console.log(chalk.yellow('  No bugs in Assigned state available to fix.\n'));
    return;
  }

  const { bugId, byUserId, comment } = await inquirer.prompt([
    {
      type: 'list', name: 'bugId',
      message: 'Select bug to mark as Fixed:',
      choices: fixableBugs.map(b => ({ name: `${b.id} — ${b.title}`, value: b.id })),
    },
    {
      type: 'list', name: 'byUserId',
      message: 'Fixed by:',
      choices: users.map(u => ({ name: `${u.name} (${u.role})`, value: u.id })),
    },
    {
      type: 'input', name: 'comment',
      message: 'Fix description / comment:',
      default: 'Bug has been fixed.',
    },
  ]);

  const result = fixBug({ bugId, byUserId, comment });
  console.log(chalk.green(`\n  ✔ ${result.message}`));
  printBugCard(result.bug, users);
}

async function handleClose() {
  const users = getAllUsers();
  const closableBugs = listBugs().bugs.filter(b =>
    [STATUS.FIXED, STATUS.OPEN, STATUS.REOPENED].includes(b.status)
  );

  if (closableBugs.length === 0) {
    console.log(chalk.yellow('  No bugs available to close.\n'));
    return;
  }

  const { bugId, byUserId, comment } = await inquirer.prompt([
    {
      type: 'list', name: 'bugId',
      message: 'Select bug to Close:',
      choices: closableBugs.map(b => ({ name: `${b.id} — ${b.title} [${b.status}]`, value: b.id })),
    },
    {
      type: 'list', name: 'byUserId',
      message: 'Closed by:',
      choices: users.map(u => ({ name: `${u.name} (${u.role})`, value: u.id })),
    },
    {
      type: 'input', name: 'comment',
      message: 'Closing note:',
      default: 'Bug verified and closed.',
    },
  ]);

  const result = closeBug({ bugId, byUserId, comment });
  console.log(chalk.green(`\n  ✔ ${result.message}`));
  printBugCard(result.bug, users);
}

async function handleReopen() {
  const users = getAllUsers();
  const reopenableBugs = listBugs().bugs.filter(b =>
    [STATUS.FIXED, STATUS.CLOSED, STATUS.ASSIGNED].includes(b.status)
  );

  if (reopenableBugs.length === 0) {
    console.log(chalk.yellow('  No bugs available to reopen.\n'));
    return;
  }

  const { bugId, byUserId, comment } = await inquirer.prompt([
    {
      type: 'list', name: 'bugId',
      message: 'Select bug to Reopen:',
      choices: reopenableBugs.map(b => ({ name: `${b.id} — ${b.title} [${b.status}]`, value: b.id })),
    },
    {
      type: 'list', name: 'byUserId',
      message: 'Reopened by:',
      choices: users.map(u => ({ name: `${u.name} (${u.role})`, value: u.id })),
    },
    {
      type: 'input', name: 'comment',
      message: 'Reason for reopening:',
      default: 'Bug recurred after fix verification.',
    },
  ]);

  const result = reopenBug({ bugId, byUserId, comment });
  console.log(chalk.red(`\n  ✔ ${result.message}`));
  printBugCard(result.bug, users);
}

async function handleComment() {
  const users  = getAllUsers();
  const allBugs = listBugs().bugs;

  if (allBugs.length === 0) {
    console.log(chalk.yellow('  No bugs found.\n'));
    return;
  }

  const { bugId, userId, text } = await inquirer.prompt([
    {
      type: 'list', name: 'bugId',
      message: 'Select bug to comment on:',
      choices: allBugs.map(b => ({ name: `${b.id} — ${b.title} [${b.status}]`, value: b.id })),
    },
    {
      type: 'list', name: 'userId',
      message: 'Comment by:',
      choices: users.map(u => ({ name: `${u.name} (${u.role})`, value: u.id })),
    },
    {
      type: 'input', name: 'text',
      message: 'Comment:',
      validate: v => v.trim() ? true : 'Comment cannot be empty.',
    },
  ]);

  const result = commentOnBug({ bugId, userId, text });
  console.log(chalk.green(`\n  ✔ ${result.message}\n`));
}

async function handleView() {
  const users   = getAllUsers();
  const allBugs = listBugs().bugs;

  if (allBugs.length === 0) {
    console.log(chalk.yellow('  No bugs found.\n'));
    return;
  }

  const { bugId } = await inquirer.prompt([
    {
      type: 'list', name: 'bugId',
      message: 'Select bug to view:',
      choices: allBugs.map(b => ({ name: `${b.id} — ${b.title} [${b.status}]`, value: b.id })),
    },
  ]);

  const { bug } = getBug(bugId);
  printBugCard(bug, users);
}

async function handleList() {
  const users = getAllUsers();
  const { filter } = await inquirer.prompt([
    {
      type: 'list', name: 'filter',
      message: 'Filter by status:',
      choices: ['All', ...Object.values(STATUS)],
      default: 'All',
    },
  ]);

  const result = listBugs(filter === 'All' ? null : filter);
  console.log(chalk.bold(`\n  ${result.total} bug(s) found${filter !== 'All' ? ` with status: ${filter}` : ''}.\n`));
  printBugList(result.bugs, users);
}

async function handleHistory() {
  const users   = getAllUsers();
  const allBugs = listBugs().bugs;

  if (allBugs.length === 0) {
    console.log(chalk.yellow('  No bugs found.\n'));
    return;
  }

  const { bugId } = await inquirer.prompt([
    {
      type: 'list', name: 'bugId',
      message: 'Select bug for audit trail:',
      choices: allBugs.map(b => ({ name: `${b.id} — ${b.title} [${b.status}]`, value: b.id })),
    },
  ]);

  const result = getBugHistory(bugId);
  printHistory(result.history, result.comments, users);
}

async function handleDashboard() {
  const result = getDashboard();
  printDashboard(result.stats, result.total);
}
