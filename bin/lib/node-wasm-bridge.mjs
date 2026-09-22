// bin/lib/node-wasm-bridge.mjs
// Loads the agentfeeder WASM module and exposes a single convertHtml()
// function. The compiled module ships inside this skill's own wasm/
// directory (../../wasm relative to this file) — self-contained on purpose,
// so this skill works standalone once checked out from its own repo, with
// no dependency on the html-to-markdown-ai monorepo it originated from.
//
// This is the CLI's counterpart to src/lib/wasm-bridge.ts in that repo: same
// WASM module, but loaded synchronously via require() + fs instead of the
// browser's fetch-a-blob-URL dance, since there is no fetch-able origin to
// load it from in Node. WASM itself is platform-independent, so the same
// compiled module works on any OS/architecture Node runs on — nothing here
// needs rebuilding per-platform.
//
// Rebuilding from source (only needed if you're editing the Rust converter,
// not to use this skill): see the html-to-markdown-ai repo's
// scripts/build-wasm-node.sh, which builds agentfeeder_rust/ and copies its
// output here.

import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WASM_DIR = path.join(HERE, '..', '..', 'wasm');
const GLUE_PATH = path.join(WASM_DIR, 'agentfeeder_wasm.js');

export const BUILD_HINT =
  'HTML→Markdown WASM module missing.\n' +
  `Expected it bundled at: ${GLUE_PATH}\n` +
  'It ships as part of this skill — if it\'s missing, the checkout is incomplete ' +
  '(re-fetch/reinstall the skill). If you are working in the html-to-markdown-ai ' +
  'source repo, run `npm run build:wasm:node` to (re)generate and copy it here.';

let mod = null;

/** True once the WASM build exists on disk. */
export function isBuilt() {
  return existsSync(GLUE_PATH);
}

/**
 * Converts an HTML string to Markdown via the agentfeeder WASM module.
 * Throws with BUILD_HINT if the bundled module is missing.
 */
export function convertHtml(html) {
  if (!mod) {
    if (!isBuilt()) {
      throw new Error(BUILD_HINT);
    }
    mod = require(GLUE_PATH);
  }
  return mod.process_single_html(html);
}
