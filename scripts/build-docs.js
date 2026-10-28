'use strict';
/*
 * Builds docs/app.js from docs/app.template.js by embedding the shared
 * question bank (server/questions.seed.json) at the __QUESTION_BANK__
 * placeholder. Run after editing the seed bank:  node scripts/build-docs.js
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const bank = JSON.parse(fs.readFileSync(path.join(root, 'server', 'questions.seed.json'), 'utf8'));
const template = fs.readFileSync(path.join(root, 'docs', 'app.template.js'), 'utf8');
const marker = '__QUESTION_BANK__';
if (!template.includes(marker)) {
  console.error('Template is missing the __QUESTION_BANK__ marker.');
  process.exit(1);
}
const out = template.replace(marker, () => JSON.stringify(bank, null, 1));
fs.writeFileSync(path.join(root, 'docs', 'app.js'), out);
console.log(`docs/app.js built with ${bank.length} embedded questions.`);
