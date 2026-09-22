# agentfeeder

Convert HTML pages to clean Markdown from the command line: no browser, no
install beyond Node. Built for AI agents that need to read a tool's or
library's docs without burning context on nav bars, scripts, and ads.

Wraps a small Rust/WASM HTML→Markdown converter; the compiled module ships
in this repo (`wasm/`), so there's nothing to build.

## Why a CLI, not the website?

The same converter already runs at
[html-to-markdown-ai.com](https://www.html-to-markdown-ai.com/), entirely
in-browser via WebAssembly, by design. There's no API and no backend to call:
files never leave the browser, which is the whole privacy point of that app.
That's great for a person with a browser, but it leaves agents with nothing
to hit. This CLI ships the same converter as a standalone tool instead, so
an agent can download pages itself and convert them locally without going
through the website or a network round trip.

## Installation

Install with the Skills CLI:

```bash
npx skills add SlashGordon/agentfeeder --global
```

Leave off `--global` to install only in the current project.

Claude Code 2.1.142 or newer can install the plugin instead:

```text
/plugin marketplace add SlashGordon/agentfeeder
/plugin install agentfeeder@agentfeeder
```

For a manual install, copy this repository's contents into the agent's
skill folder (it only needs Node — no build step).

## Usage

```bash
# Single page, straight to stdout:
node bin/html2md.mjs page.html --stdout

# A whole downloaded site, recursively, keeping its folder structure:
node bin/html2md.mjs docs-dl/ --out docs-md/
```

See [SKILL.md](SKILL.md) for the full agent-facing workflow (download →
convert → read) and current limits (HTML only; no JS rendering).

## Development

The Rust source and the browser app that also uses it live in this
project's source repo. `npm run build:wasm:node` there rebuilds `wasm/`
here after any change to the converter.

## License

MIT © [SlashGordon](https://www.slashgordon.link).

## Support

If this integration saves you time, consider buying me a coffee. It helps keep
the maintenance going.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-SlashGordon-FFDD00?logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/SlashGordon)
