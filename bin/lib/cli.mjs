// bin/lib/cli.mjs
// Pure argument-parsing and filesystem-planning helpers for bin/html2md.mjs,
// split out so they're unit-testable without the Node WASM build present.

import fs from 'node:fs';
import path from 'node:path';

export const HELP = `html2md — convert HTML files to Markdown (Node, no browser)

Usage:
  html2md <file-or-dir> [<file-or-dir> ...] [options]

Arguments:
  <file-or-dir>   One or more .html/.htm files, or directories to scan
                   recursively for .html/.htm files (e.g. a downloaded site).

Options:
  --out <dir>     Write .md files under <dir> instead of next to the source.
                   Directory inputs keep their subpath under <dir>.
  --stdout        Print the converted Markdown to stdout instead of writing
                   a file. Only valid with exactly one input file.
  -h, --help      Show this help.

Examples:
  html2md page.html
  html2md docs/ --out out/
  html2md page.html --stdout > page.md

HTML only for now — Word/PDF/PPT/etc. still go through the browser app.
`;

/** Parses argv (already stripped of `node script.mjs`) into CLI options. */
export function parseArgs(argv) {
  const inputs = [];
  let outDir;
  let toStdout = false;
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      help = true;
    } else if (arg === '--stdout') {
      toStdout = true;
    } else if (arg === '--out') {
      i++;
      if (argv[i] === undefined) throw new Error('--out requires a directory argument');
      outDir = argv[i];
    } else {
      inputs.push(arg);
    }
  }

  return { inputs, outDir, toStdout, help };
}

/** True for a filename ending in .html or .htm, case-insensitive. */
export function isHtmlFile(name) {
  return /\.html?$/i.test(name);
}

/**
 * Recursively collects .html/.htm files under `dir`, skipping hidden
 * entries (dotfiles/dotdirs) and node_modules.
 */
export function collectHtmlFiles(dir) {
  const results = [];
  const stack = [dir];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && isHtmlFile(entry.name)) {
        results.push(full);
      }
    }
  }

  return results.sort();
}

/** Replaces a .html/.htm extension with .md. Assumes isHtmlFile(filePath). */
export function toMarkdownPath(filePath) {
  return filePath.replace(/\.html?$/i, '.md');
}

/**
 * Resolves the output path for one converted file.
 * - No --out: write the .md next to the source file.
 * - --out with a directory root: keep the file's subpath under that root.
 * - --out with a direct file input: flatten to the file's basename.
 */
export function outputPathFor(file, root, outDir, rootIsDirectory) {
  if (!outDir) return toMarkdownPath(file);
  const rel = rootIsDirectory ? path.relative(root, file) : path.basename(file);
  return toMarkdownPath(path.join(outDir, rel));
}
