// Runs after every tsup build (onSuccess). The bundle inlines pdfmake, but two
// of its dependencies read data files from disk at runtime via
// `fs.readFileSync(__dirname + '/<file>.trie')` — those files must sit next to
// the bundle inside the zip, and the tsup banner points __dirname there.
import { createRequire } from 'node:module';
import { copyFileSync, cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(apiDir, 'dist');
mkdirSync(distDir, { recursive: true });

// pnpm keeps transitive deps out of our node_modules, so resolve them the way
// Node would: from pdfmake's own location, then from pdfkit's.
const require = createRequire(join(apiDir, 'noop.js'));
const pdfmakePkg = require.resolve('pdfmake/package.json');
const fromPdfmake = createRequire(pdfmakePkg);
const linebreakDir = dirname(fromPdfmake.resolve('@foliojs-fork/linebreak/package.json'));
const pdfkitPkg = fromPdfmake.resolve('@foliojs-fork/pdfkit/package.json');
const fontkitDir = dirname(createRequire(pdfkitPkg).resolve('@foliojs-fork/fontkit/package.json'));

copyFileSync(join(linebreakDir, 'src', 'classes.trie'), join(distDir, 'classes.trie'));
for (const trie of ['data.trie', 'indic.trie', 'use.trie']) {
  copyFileSync(join(fontkitDir, trie), join(distDir, trie));
}

// The Roboto fonts the invoice template renders with.
cpSync(join(apiDir, 'fonts'), join(distDir, 'fonts'), { recursive: true });

console.log('copy-assets: fonts + trie data copied into dist/');
