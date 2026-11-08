---
type: Script
title: LinkedIn Connection Export
description: Exports connections to CSV or JSON with name, headline and profile URL, paging the Voyager API.
repo: https://github.com/chirag127/li-connection-export-userscript
install: https://github.com/chirag127/li-connection-export-userscript/raw/main/li-connection-export-userscript.user.js
version: "1.0.0"
tags: [userscript, li]
timestamp: 2026-11-09T00:00:00Z
---

# LinkedIn Connection Export

Exports connections to CSV or JSON with name, headline and profile URL, paging the Voyager API.

## Method

`/voyager/api/relationships/connections` with the `csrf-token` header derived from the JSESSIONID cookie, dedupe by entity URN.

## Limits

- Voyager shapes change; a DOM fallback button is included
- Capped at 4000 rows
- Headlines are whatever the card exposes
