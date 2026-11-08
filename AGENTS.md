# AGENTS.md - li-connection-export-userscript

Single-file userscript. $(System.Collections.Hashtable.n).user.js at repo root IS the product. No build, no deps.

## Method

`/voyager/api/relationships/connections` with the `csrf-token` header derived from the JSESSIONID cookie, dedupe by entity URN.

## Rules

- One file. Bump @version, keep @updateURL/@downloadURL on raw main.
- API first, DOM fallback. Dry run, then one confirm, then run.
- 3 concurrent workers with 150-400 ms jitter. Floating panel, Alt hotkey, never fire while typing.

## Install docs

https://github.com/chirag127/userscript-install-guide - link it, never duplicate install steps.

## Test

sctl install ./li-connection-export-userscript.user.js, open the target page, run the dry run, then sctl debug console --level error.
