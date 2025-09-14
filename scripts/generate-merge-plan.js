#!/usr/bin/env node
/*
  Generate MERGE_PLAN.txt listing every tracked file with a default action:
  - KEEP  = keep from current branch (e.g., frontend)
  - REPLACE = replace from other branch (e.g., backend)

  Usage: node scripts/generate-merge-plan.js <currentBranch> <otherBranch>
  Example: node scripts/generate-merge-plan.js frontend backend

  The plan is heuristic: paths focused on checkout/scanner/customer UX default to KEEP,
  backend/dashboard/api/supabase paths default to REPLACE. Adjust as needed.
*/

const { execSync } = require('child_process');
const { writeFileSync } = require('fs');

const currentBranch = process.argv[2] || 'frontend';
const otherBranch = process.argv[3] || 'backend';

function listFiles() {
  try {
    const out = execSync('git ls-files', { encoding: 'utf8' });
    return out.split('\n').filter(Boolean);
  } catch (e) {
    console.error('Failed to list files via git ls-files');
    process.exit(1);
  }
}

const preferFrontend = [
  'app/cart/',
  'app/checkout/',
  'components/cart/',
  'components/camera-scanner.tsx',
  'components/layout/navbar/',
  'components/layout/search/',
  'components/product/',
  'components/grid/',
  'app/product/',
  'app/search/'
];

const preferBackend = [
  'app/dashboard/',
  'components/dashboard/',
  'app/api/minlp/',
  'app/api/revalidate/',
  'app/api/sync-products/',
  'app/api/products/',
  'services/',
  'supabase/',
  'lib/supabase.ts',
  'packages/shared/',
  'scripts/',
  'docs/'
];

function classify(path) {
  // skip VCS and build artifacts even if tracked
  if (path.startsWith('.next/') || path.startsWith('node_modules/')) return null;
  if (preferFrontend.some((p) => path === p || path.startsWith(p))) return 'KEEP';
  if (preferBackend.some((p) => path === p || path.startsWith(p))) return 'REPLACE';
  return 'KEEP'; // default conservative choice
}

const files = listFiles();

const header = `# MERGE_PLAN.txt\n# Current branch kept: ${currentBranch}\n# Other branch to replace from: ${otherBranch}\n# Action meanings:\n#   KEEP <path>     -> keep file contents from ${currentBranch}\n#   REPLACE <path>  -> replace file with version from ${otherBranch}\n#\n# Review and edit as needed, then apply with:\n#   bash scripts/apply-merge-plan.sh ${currentBranch} ${otherBranch}\n#\n`;

const lines = [];
for (const f of files) {
  const action = classify(f);
  if (!action) continue;
  lines.push(`${action} ${f}`);
}

writeFileSync('MERGE_PLAN.txt', header + lines.join('\n') + '\n', 'utf8');
console.log(`Wrote MERGE_PLAN.txt with ${lines.length} entries.`);

