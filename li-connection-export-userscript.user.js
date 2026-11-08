// ==UserScript==
// @name         LinkedIn Connection Export
// @namespace    https://github.com/chirag127
// @version      1.0.0
// @description  Exports your LinkedIn connections to CSV or JSON with name, headline and profile URL, paging the Voyager API and deduping by profile id.
// @author       chirag127
// @license      MIT
// @match        https://www.linkedin.com/mynetwork/*
// @icon         https://www.linkedin.com/favicon.ico
// @homepageURL  https://github.com/chirag127/li-connection-export-userscript
// @supportURL   https://github.com/chirag127/li-connection-export-userscript/issues
// @downloadURL  https://github.com/chirag127/li-connection-export-userscript/raw/main/li-connection-export-userscript.user.js
// @updateURL    https://github.com/chirag127/li-connection-export-userscript/raw/main/li-connection-export-userscript.user.js
// @grant        none
// @noframes
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  /**
   * LinkedIn's own SPA uses the Voyager API. We call the same endpoints with the page's session:
   * the `csrf-token` header is the JSESSIONID cookie value without quotes or the `ajax:` prefix.
   */
  const PAGE = 40;
  const MAX = 4000;

  function csrf() {
    const raw = (document.cookie.match(/JSESSIONID="?([^";]+)"?/) || [])[1] || "";
    return raw.replace(/^ajax:/, "");
  }

  function headers() {
    return {
      "csrf-token": csrf(),
      "x-restli-protocol-version": "2.0.0",
      accept: "application/vnd.linkedin.normalized+json+2.1",
    };
  }

  const rows = [];
  let running = false;
  let stop = false;
  let ui = null;

  async function page(start) {
    const url = "/voyager/api/relationships/connections?count=" + PAGE + "&start=" + start + "&includeInsights=true";
    const r = await fetch(url, { credentials: "include", headers: headers() });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    const els = (j.data && j.data.elements) || j.elements || [];
    const out = [];
    for (const e of els) {
      const p = e.miniProfile || e;
      if (!p) continue;
      const id = p.entityUrn || p.publicIdentifier || p.firstName + p.lastName;
      const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || p.name || "";
      const url = p.publicIdentifier ? "https://www.linkedin.com/in/" + p.publicIdentifier : "";
      out.push({ id, name, headline: p.occupation || p.headline || "", url });
    }
    return out;
  }

  async function run() {
    if (running) return;
    running = true; stop = false;
    const seen = new Set(rows.map((r) => r.id));
    let start = 0, added = 0;
    try {
      while (!stop && start < MAX) {
        const batch = await page(start);
        if (!batch.length) break;
        for (const b of batch) {
          if (seen.has(b.id)) continue;
          seen.add(b.id); rows.push(b); added++;
        }
        start += PAGE;
        paint(added);
        await new Promise((r) => setTimeout(r, 120 + Math.random() * 180));
      }
      say("done: " + rows.length + " connections");
    } catch (e) {
      say("stopped: " + e.message + " (use the DOM fallback below)");
    }
    running = false;
    paint(added);
  }

  /** Fallback when Voyager changes: scroll the page and read the cards. */
  async function domFallback() {
    let last = 0;
    for (let i = 0; i < 200 && !stop; i++) {
      scrollTo(0, document.documentElement.scrollHeight);
      await new Promise((r) => setTimeout(r, 500));
      const seen = new Set(rows.map((r) => r.id));
      for (const a of document.querySelectorAll('a[href*="/in/"]')) {
        const url = a.href.split("?")[0];
        if (seen.has(url)) continue;
        const card = a.closest("li, div");
        rows.push({ id: url, name: (a.textContent || "").trim(), headline: (card && card.innerText || "").split("\n").slice(1, 2).join(" "), url });
      }
      paint(0);
      if (document.documentElement.scrollHeight === last) break;
      last = document.documentElement.scrollHeight;
    }
    say("DOM fallback finished: " + rows.length);
  }

  // ---------- ui ----------
  function el(tag, css, text) {
    const n = document.createElement(tag);
    if (css) Object.assign(n.style, css);
    if (text != null) n.textContent = text;
    return n;
  }
  function say(m) { if (ui) ui.status.textContent = m; }
  function paint(added) {
    if (!ui) return;
    ui.count.textContent = rows.length + " connections" + (added ? " (+" + added + ")" : "");
    ui.body.textContent = "";
    for (const r of rows.slice(-200).reverse()) {
      ui.body.appendChild(el("div", { padding: "3px 6px", borderBottom: "1px solid #262626", color: "#ddd" }, r.name + " — " + r.headline));
    }
  }
  function csv() {
    const esc = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    return ["name,headline,url", ...rows.map((r) => [esc(r.name), esc(r.headline), esc(r.url)].join(","))].join("\n");
  }
  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; a.click(); URL.revokeObjectURL(a.href);
  }

  function panel() {
    if (ui) { ui.root.remove(); ui = null; return; }
    const root = el("div", { position: "fixed", right: "18px", bottom: "18px", width: "380px", height: "56vh", zIndex: 2147483647, background: "#181818", color: "#fff", font: "12px Roboto, Arial", border: "1px solid #3a3a3a", borderRadius: "10px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,.65)" });
    const head = el("div", { padding: "8px", background: "#242424", display: "flex", gap: "6px", alignItems: "center", cursor: "move" });
    const count = el("strong", { flex: "1" }, "0 connections");
    const btn = (l, fn, bg) => { const b = el("button", { background: bg || "#333", color: "#fff", border: "0", borderRadius: "5px", padding: "3px 7px", cursor: "pointer" }, l); b.onclick = fn; return b; };
    head.append(count, btn("Run", run, "#065fd4"), btn("Stop", () => (stop = true)), btn("×", panel));
    const body = el("div", { overflow: "auto", flex: "1" });
    const foot = el("div", { padding: "6px", display: "flex", gap: "6px", borderTop: "1px solid #333", flexWrap: "wrap" });
    foot.append(btn("CSV", () => download("connections.csv", csv(), "text/csv")), btn("JSON", () => download("connections.json", JSON.stringify(rows, null, 2), "application/json")), btn("Copy", () => navigator.clipboard.writeText(rows.map((r) => r.url).join("\n"))), btn("DOM fallback", domFallback));
    const status = el("div", { padding: "0 8px 6px", color: "#9aa" }, "open My Network → Connections first");
    root.append(head, body, foot, status);
    document.body.appendChild(root);
    ui = { root, count, body, status };
    let dx = 0, dy = 0, drag = false;
    head.addEventListener("pointerdown", (e) => { if (e.target.tagName === "BUTTON") return; drag = true; dx = e.clientX; dy = e.clientY; head.setPointerCapture(e.pointerId); });
    head.addEventListener("pointermove", (e) => {
      if (!drag) return;
      root.style.right = "auto"; root.style.bottom = "auto";
      root.style.left = Math.max(0, root.offsetLeft + e.clientX - dx) + "px";
      root.style.top = Math.max(0, root.offsetTop + e.clientY - dy) + "px";
      dx = e.clientX; dy = e.clientY;
    });
    head.addEventListener("pointerup", () => (drag = false));
    paint(0);
  }

  addEventListener("keydown", (e) => { if (e.altKey && e.key.toLowerCase() === "e" && !/input|textarea/i.test(document.activeElement.tagName)) panel(); });
  const chip = el("button", { position: "fixed", right: "18px", bottom: "18px", zIndex: 2147483646, background: "#065fd4", color: "#fff", border: "0", borderRadius: "18px", padding: "6px 12px", cursor: "pointer", font: "12px Roboto, Arial" }, "⤓");
  chip.title = "Export connections (Alt+E)";
  chip.onclick = panel;
  document.body.appendChild(chip);
})();
