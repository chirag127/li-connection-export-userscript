# LinkedIn Connection Export

Exports connections to CSV or JSON with name, headline and profile URL, paging the Voyager API.

## Install

Follow the [install guide](https://github.com/chirag127/userscript-install-guide), then install:

```
https://github.com/chirag127/li-connection-export-userscript/raw/main/li-connection-export-userscript.user.js
```

## Usage

Open My Network → Connections, press the ⤓ chip (Alt+E), Run, then export.

## Limits

- Voyager shapes change; a DOM fallback button is included
- Capped at 4000 rows
- Headlines are whatever the card exposes

## Risk

Gray: reads your own data through the site API.

Part of the [userscript collection](https://github.com/chirag127/userscript-install-guide).
