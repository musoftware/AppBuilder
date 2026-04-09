/**
 * One-off style script: rewrite English locale VALUES only (keys unchanged)
 * for MU product branding. Run from repo root:
 *   node scripts/patch-en-mu-branding.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, '../packages/cli/src/i18n/locales/en.js');

let s = fs.readFileSync(p, 'utf8');

function patchValue(val) {
  let v = val;
  v = v.replace(/Qwen OAuth/g, 'MU OAuth');
  v = v.replace(/Qwen Code/g, 'MU Code');
  v = v.replace(/ask Qwen Code/g, 'ask MU Code');
  v = v.replace(/ask Qwen\./g, 'ask MU Code.');
  v = v.replace(/ask Qwen to help/g, 'ask MU Code to help');
  v = v.replace(/shown to Qwen/g, 'shown to MU Code');
  v = v.replace(/How is Qwen doing/g, 'How is MU Code doing');
  v = v.replace(/Configure Qwen authentication/g, 'Configure MU Code authentication');
  v = v.replace(/Qwen-OAuth/g, 'MU-OAuth');
  return v;
}

const singleRe = /^(\s*)'((?:\\.|[^'\\])*)':\s*'((?:\\.|[^'\\])*)',?\s*$/;
const lines = s.split('\n');
const out = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const m = line.match(singleRe);
  if (m) {
    const val = m[3];
    const newVal = patchValue(val);
    if (newVal !== val) {
      const trailing = line.endsWith(',') ? ',' : '';
      out.push(
        `${m[1]}'${m[2]}': '${newVal}'${trailing}`,
      );
      continue;
    }
  }
  const km = line.match(/^(\s*)'((?:\\.|[^'\\])*)':\s*$/);
  if (km && i + 1 < lines.length) {
    const next = lines[i + 1];
    const vm = next.match(/^(\s*)'((?:\\.|[^'\\])*)',?\s*$/);
    if (vm) {
      const val = vm[2];
      const newVal = patchValue(val);
      if (newVal !== val) {
        out.push(line);
        const trailing = next.endsWith(',') ? ',' : '';
        out.push(`${vm[1]}'${newVal}'${trailing}`);
        i++;
        continue;
      }
    }
  }
  out.push(line);
}

fs.writeFileSync(p, out.join('\n'));
console.log('Updated', p);
