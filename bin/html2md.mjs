#!/usr/bin/env node
// bin/html2md.mjs
// Node CLI for the agentfeeder HTML→Markdown converter (see
// bin/lib/node-wasm-bridge.mjs) — a terminal/agent-friendly alternative to
// loading the same WASM module via a browser's fetch. Self-contained: the
// compiled WASM ships in ../wasm, so this works standalone wherever it's
// checked out. HTML only for now; other formats (Word/PDF/PPT/etc.) aren't
// covered by this skill.

import fs from 'node:fs';
import path from 'node:path';
import { HELP, parseArgs, collectHtmlFiles, isHtmlFile, outputPathFor } from './lib/cli.mjs';
import { convertHtml, isBuilt, BUILD_HINT } from './lib/node-wasm-bridge.mjs';

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`html2md: ${err.message}`);
    process.exit(1);
  }

  if (args.help || args.inputs.length === 0) {
    process.stdout.write(HELP);
    process.exit(args.help ? 0 : 1);
  }

  if (!isBuilt()) {
    console.error(`html2md: ${BUILD_HINT}`);
    process.exit(1);
  }

  // Resolve every input arg (file or directory) to a flat list of HTML files,
  // each paired with the input root it came from (for --out subpath layout).
  const resolved = [];
  let hadInputError = false;
  for (const input of args.inputs) {
    if (!fs.existsSync(input)) {
      console.error(`html2md: no such file or directory: ${input}`);
      hadInputError = true;
      continue;
    }
    const stat = fs.statSync(input);
    if (stat.isDirectory()) {
      const files = collectHtmlFiles(input);
      if (files.length === 0) {
        console.error(`html2md: no .html/.htm files found under ${input}`);
      }
      for (const file of files) resolved.push({ file, root: input, rootIsDirectory: true });
    } else if (isHtmlFile(input)) {
      resolved.push({ file: input, root: input, rootIsDirectory: false });
    } else {
      console.error(`html2md: skipping non-HTML file: ${input}`);
    }
  }

  if (resolved.length === 0) {
    console.error('html2md: nothing to convert.');
    process.exit(1);
  }

  if (args.toStdout && resolved.length > 1) {
    console.error(
      `html2md: --stdout only works with a single file (got ${resolved.length}). Use --out <dir> instead.`,
    );
    process.exit(1);
  }

  let converted = 0;
  let failed = 0;
  for (const { file, root, rootIsDirectory } of resolved) {
    let markdown;
    try {
      const html = fs.readFileSync(file, 'utf-8');
      markdown = convertHtml(html);
    } catch (err) {
      failed++;
      console.error(`html2md: failed to convert ${file}: ${err instanceof Error ? err.message : err}`);
      continue;
    }

    if (args.toStdout) {
      process.stdout.write(markdown);
      converted++;
      continue;
    }

    const outPath = outputPathFor(file, root, args.outDir, rootIsDirectory);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, markdown);
    converted++;
    console.error(`${file} -> ${outPath}`);
  }

  if (!args.toStdout) {
    console.error(`html2md: converted ${converted} file(s)${failed ? `, ${failed} failed` : ''}.`);
  }

  process.exit(failed > 0 || hadInputError ? 1 : 0);
}

main();
