import { defineConfig } from 'tsup';

// Bundle each Lambda entry into its own ESM file. `noExternal` inlines all
// deps so the zip needs no node_modules. One zip, two handlers: the API
// (`index.handler`) and the Cognito trigger (`post-confirmation.handler`).
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'post-confirmation': 'src/triggers/post-confirmation.ts',
  },
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  bundle: true,
  // Inline everything except @aws-sdk/* — the Lambda nodejs22.x runtime ships
  // the AWS SDK v3, so bundling it would only bloat the zip. (noExternal wins
  // over external in tsup, hence the negative lookahead instead of a plain
  // catch-all.)
  noExternal: [/^(?!@aws-sdk\/)/],
  external: [/^@aws-sdk\//],
  outExtension: () => ({ js: '.mjs' }),
  // CommonJS deps inlined into the ESM bundle may still call require() for
  // Node built-ins at runtime, and pdfmake's deps read their .trie data files
  // relative to __dirname — neither exists in ESM, so the banner provides
  // both. __dirname resolves to the bundle's own directory (/var/task in
  // Lambda), which is where copy-assets.mjs places those files.
  banner: {
    js: [
      "import { createRequire } from 'node:module';",
      "import { fileURLToPath as __fileURLToPath } from 'node:url';",
      "import { dirname as __pathDirname } from 'node:path';",
      'const require = createRequire(import.meta.url);',
      'const __dirname = __pathDirname(__fileURLToPath(import.meta.url));',
    ].join(' '),
  },
  clean: true,
  minify: true,
  onSuccess: 'node scripts/copy-assets.mjs',
});
