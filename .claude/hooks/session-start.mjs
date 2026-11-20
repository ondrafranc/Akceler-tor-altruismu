#!/usr/bin/env node
/**
 * SessionStart hook: prints environment drift that prose rules cannot enforce.
 * Stdout is added to Claude's context; silent when everything matches.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root =
  process.env.CLAUDE_PROJECT_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const app = path.join(root, 'akcelerator-landing-page');
const notes = [];

const wanted = fs.existsSync(path.join(app, '.nvmrc')) ? fs.readFileSync(path.join(app, '.nvmrc'), 'utf8').trim() : '';
const actual = process.versions.node.split('.')[0];
if (wanted && actual !== wanted) {
  notes.push(
    `Lokální Node je ${process.versions.node}, cíl projektu (CI, Vercel) je ${wanted}. Výsledky testů a buildu se mohou lišit od CI.`
  );
}

for (const stray of ['node_modules', '.svelte-kit']) {
  if (fs.existsSync(path.join(root, stray))) {
    notes.push(`V kořeni repozitáře je \`${stray}/\`. Je to artefakt spuštění mimo akcelerator-landing-page/ a patří smazat.`);
  }
}

if (!fs.existsSync(path.join(app, 'node_modules'))) {
  notes.push('Chybí akcelerator-landing-page/node_modules. Spusť tam `npm ci`.');
}

if (notes.length) console.log(`Stav prostředí:\n- ${notes.join('\n- ')}`);
