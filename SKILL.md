---
name: agentfeeder
description: |
  Convert downloaded HTML pages (a doc site, a single page, a whole crawled
  folder) to clean Markdown from the command line, no browser needed. Use
  this whenever you need to read a library's or tool's docs to understand
  it — HTML is noisy (nav, scripts, ads) and wastes context, while Markdown
  keeps headings, links, code blocks, and lists without the boilerplate.
  Triggers: "read the docs for X", "download this site and convert it to
  markdown", "I need to understand this tool's API", or any time raw fetched
  HTML would otherwise go straight into context.
---

# agentfeeder: docs-to-Markdown for agents

A small, self-contained Node CLI (`bin/html2md.mjs`) wrapping a Rust/WASM
HTML→Markdown converter. It ships with the compiled WASM module already
built (`wasm/`), so there is nothing to install or compile — just Node.
Everything this skill needs lives inside this skill's own directory.

Use it whenever you'd otherwise read raw HTML to understand a tool, library,
or API: fetch the page(s), run them through the CLI, then read the
Markdown. It strips nav/scripts/ads/boilerplate and keeps headings, code
blocks, links, and lists — far fewer tokens than raw HTML for the same
content, and much easier to read.

## Workflow

1. **Get the HTML.** Download the page(s) with whatever tool is available.
   Exact command depends on the OS — pick the one that matches.

   **A single page:**
   ```bash
   # macOS / Linux / Windows 10+ (curl.exe ships built-in):
   curl -o page.html <url>
   ```
   ```powershell
   # PowerShell, if curl isn't on PATH:
   Invoke-WebRequest -Uri <url> -OutFile page.html
   ```

   **A whole docs site** (recursive mirror, keeps the folder structure) —
   use `wget`:
   ```bash
   wget --recursive --no-parent --convert-links -P /tmp/docs-dl <url>
   ```
   - macOS: `brew install wget` if it's not already there.
   - Linux: usually preinstalled; otherwise the distro's package manager.
   - Windows doesn't ship `wget` — install it once, then use the same
     command above (from PowerShell or cmd):
     ```powershell
     winget install GNU.Wget2
     # or: choco install wget
     ```
   - If installing `wget` isn't an option, fetch pages individually with
     `curl`/`Invoke-WebRequest` instead — slower for a whole site, but needs
     nothing extra.
2. **Convert**, using the CLI bundled with this skill. `${CLAUDE_PLUGIN_ROOT}`
   points at this skill's own directory when it's installed as a plugin; if
   that's unset (e.g. a manual/project-local install), use the path to
   `bin/html2md.mjs` next to this file instead.
   ```bash
   # Single page, straight to stdout — good for immediately reading it:
   node "${CLAUDE_PLUGIN_ROOT}/bin/html2md.mjs" /tmp/page.html --stdout

   # A directory (recurses into subfolders), writing .md files alongside
   # the source or under --out, keeping the folder structure:
   node "${CLAUDE_PLUGIN_ROOT}/bin/html2md.mjs" /tmp/docs-dl --out /tmp/docs-md
   ```
3. **Read the Markdown**, not the HTML.

## CLI reference

```
html2md <file-or-dir> [<file-or-dir> ...] [options]

  --out <dir>   Write .md files under <dir> instead of next to the source.
                Directory inputs keep their subpath under <dir>.
  --stdout      Print the converted Markdown to stdout instead of writing
                a file. Only valid with exactly one input file.
  -h, --help    Show help.
```

Exits non-zero if any input failed to convert or no HTML was found.

## Current limits

- **HTML only.** `.docx`/`.pdf`/`.pptx`/etc. aren't covered — if you need to
  convert a downloaded PDF or Office doc, say so rather than silently
  skipping it, and fall back to reading it some other way.
- No JS rendering: this converts static HTML as fetched. A page that needs
  client-side JS to produce its content won't convert well — prefer a
  rendered fetch (e.g. a headless-browser tool) as the download step if one
  is available.

## Provenance

This converter originates from a browser app that uses the same Rust code
and covers more formats (Word/PDF/PPT/Excel/etc. via a second WASM module)
at the cost of needing a browser. If you're working in that source repo,
`npm run build:wasm:node` rebuilds `wasm/` here from the Rust converter
after any change to it.
