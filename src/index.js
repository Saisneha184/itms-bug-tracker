/**
 * ITMS Bug Tracking Agent — Entry Point
 */

import { runCLI } from './cli.js';

runCLI().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
