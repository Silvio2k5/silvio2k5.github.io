// ================================================================
//  SPIELERNAME für die ganze Spielbibliothek
//  – beim ersten Besuch muss man einen Namen wählen (ohne geht es nicht weiter)
//  – der Name gilt für Bestenliste, Online-Spiele und Rezensionen
//  – oben in der Leiste kann man ihn jederzeit ändern
// ================================================================
(function () {
  const URL_ = "https://hibfzyxbmbspfhpughim.supabase.co";
  const KEY = "sb_publishable_w4PzkJlkAo5WN2PrFftWvg_iN2b_Rz0";
  // gleiche Schlüssel wie „Spielstand übertragen“ im Spiel
  const SY_KEYS = ["fnStats", "fnOutfit", "fnUnl", "fnClaimed", "fnBase", "fnRound", "fnLeague", "fnNum", "fnCol", "bl-spieler", "bl-name"];

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
    del(k) { try { localStorage.removeItem(k); } catch (_) {} }
  };
  function spielerId() {
    let id = ls.get("bl-spieler");
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      id = crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16);
      });
      ls.set("bl-spieler", id);
    }
    return id;
  }
  const getName = () => (ls.get("bl-name") || "").trim();
  const H = { apikey: KEY, "Content-Type": "application/json" };
  async function rpc(fn, body) {
    const r = await fetch(URL_ + "/rest/v1/rpc/" + fn, { method: "POST", headers: H, body: JSON.stringify(body) });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      const e = new Error(fn); e.code = (t.match(/name_vergeben|filter_kontakt|filter_beleidigung|ungueltig/) || ["netz"])[0]; throw e;
    }
    return r.json().catch(() => null);
  }
  const FEHLER = {
    ungueltig: "Der Name braucht 2 bis 16 Zeichen: Buchstaben, Zahlen, Leerzeichen, Punkt, Strich oder Unterstrich.",
    filter_kontakt: "Bitte keine Links, E-Mails, Telefonnummern oder @ im Namen.",
    filter_beleidigung: "Dieser Name ist nicht erlaubt. Bitte wähle einen freundlichen Namen.",
    name_vergeben: "Dieser Name ist schon vergeben – bitte wähle einen anderen.",
    netz: "Das hat nicht geklappt. Prüfe deine Internetverbindung und versuch es nochmal."
  };

  // ---------- Aussehen ----------
  const css = document.createElement("style");
  css.textContent = `
  .nm-back{position:fixed;inset:0;z-index:300;background:rgba(6,5,16,.86);backdrop-filter:blur(6px);display:grid;place-items:center;padding:16px;overflow:auto}
  .nm{width:min(440px,100%);background:var(--shelf);border:1px solid var(--line);border-radius:20px;box-shadow:0 30px 80px -20px rgba(0,0,0,.7);padding:24px;display:flex;flex-direction:column;gap:14px}
  .nm .ic{width:52px;height:52px;border-radius:14px;background:var(--coin);color:var(--coin-ink);display:grid;place-items:center;font-size:26px}
  .nm h2{font-family:var(--display);font-size:26px;font-weight:800;letter-spacing:-.02em}
  .nm p{margin:0;color:var(--dim);font-size:15px}
  .nm input{width:100%;height:46px;border:1px solid var(--line);background:var(--ink);border-radius:12px;padding:0 14px;outline:none;font-size:17px}
  .nm input:focus{border-color:var(--coin)}
  .nm .row{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
  .nm .err{color:var(--danger);font-size:13px;min-height:1em}
  .nm .hint{font-size:12px;color:var(--dim)}
  .nm .alt{border-top:1px solid var(--line);padding-top:12px;font-size:13px;color:var(--dim);display:flex;flex-direction:column;gap:8px}
  .nm .alt input{font-family:var(--mono);letter-spacing:3px;text-transform:uppercase;text-align:center;font-size:18px}
  .nm .ok{color:#7fe0a0}
  .nm .code{font:bold 26px var(--mono);letter-spacing:3px;color:var(--coin);min-height:34px}
  .nm .stp{font-weight:700;font-size:14px;color:var(--paper)}
  #nameBtn{flex:none;max-width:180px}
  #nameBtn span{overflow:hidden;text-overflow:ellipsis}
  .kb-wer{font-size:13px;color:var(--dim)}
  .kb-wer b{color:var(--paper)}
  .pp{position:fixed;z-index:60;width:min(320px,calc(100vw - 24px));background:var(--shelf);border:1px solid var(--line);border-radius:16px;box-shadow:0 24px 60px -16px rgba(0,0,0,.7);padding:16px;display:flex;flex-direction:column;gap:12px}
  .pp-head{display:flex;align-items:center;gap:12px}
  .pp-av{width:44px;height:44px;border-radius:50%;background:var(--coin);color:var(--coin-ink);display:grid;place-items:center;font-family:var(--display);font-weight:800;font-size:20px;flex:none}
  .pp-head b{font-family:var(--display);font-size:19px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px}
  .pp-head span{font-size:12px;color:var(--dim)}
  .pp-lbl{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--dim);display:flex;justify-content:space-between}
  .pp-lbl b{color:var(--coin);font-family:var(--mono)}
  .pp-list{display:flex;flex-direction:column;gap:10px;max-height:min(50vh,320px);overflow:auto}
  .pp-row{display:flex;flex-direction:column;gap:4px;font-size:14px}
  .pp-row div{display:flex;justify-content:space-between;gap:10px}
  .pp-row div span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pp-row div span:last-child{font-variant-numeric:tabular-nums;color:var(--paper);font-weight:700;white-space:nowrap}
  .pp-bar{height:4px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}
  .pp-bar i{display:block;height:100%;background:var(--coin);border-radius:2px}
  .pp-leer{color:var(--dim);font-size:14px}
  .pp-note{font-size:11px;color:var(--dim)}
  @media (max-width:760px){#nameBtn .lbl{display:none}#nameBtn{width:40px;padding:0}}`;
  document.head.appendChild(css);

  function melden(n) { window.dispatchEvent(new CustomEvent("sb-name", { detail: n })); knopf(); }

  // ---------- Das Fenster ----------
  let offen = false;
  function fenster(pflicht, hinweis) {
    if (offen) return; offen = true;
    const alt = getName();
    const back = document.createElement("div");
    back.className = "nm-back";
    back.innerHTML = `<div class="nm" role="dialog" aria-modal="true" aria-labelledby="nmT">
      <div class="ic">🎮</div>
      <h2 id="nmT">${pflicht ? "Willkommen in der Spielbibliothek!" : "Spielername ändern"}</h2>
      <p>${pflicht ? "Wähle zuerst deinen Spielernamen." : "Dein neuer Name wird überall übernommen."} Er erscheint in den Bestenlisten, bei Online-Spielen und bei deinen Rezensionen.</p>
      <input id="nmIn" maxlength="16" placeholder="Dein Spielername" autocomplete="nickname" spellcheck="false" value="${esc(alt)}" aria-label="Dein Spielername">
      <div class="err" id="nmErr">${hinweis ? esc(hinweis) : ""}</div>
      <div class="hint">2–16 Zeichen. Der Name muss einzigartig sein.</div>
      <div class="row">${pflicht ? "" : `<button class="btn" type="button" id="nmX">Abbrechen</button>`}<button class="btn primary" type="button" id="nmOk">${pflicht ? "Los geht's" : "Speichern"}</button></div>
      ${pflicht ? `<div class="alt"><button class="linkbtn" type="button" id="nmSync" style="align-self:flex-start">Schon auf einem anderen Gerät gespielt? Spielstand-Code eingeben</button>
        <div id="nmSyncBox" hidden>
          <div>Erstelle auf dem anderen Gerät im Spiel unter <b>„📲 Spielstand übertragen“</b> einen Code und gib ihn hier ein. Dann bekommst du deinen Namen und Spielstand.</div>
          <div class="row" style="justify-content:stretch;margin-top:8px"><input id="nmCode" maxlength="9" placeholder="XXXX-XXXX" autocomplete="off" spellcheck="false" style="flex:1"><button class="btn" type="button" id="nmLoad">Laden</button></div>
          <div class="err" id="nmSyncErr"></div>
        </div></div>` : ""}
    </div>`;
    document.body.appendChild(back);
    const $ = s => back.querySelector(s);
    const inp = $("#nmIn"), ok = $("#nmOk"), err = $("#nmErr");
    setTimeout(() => { inp.focus(); inp.select(); }, 50);
    // Tasten nicht an die Seite oder ein laufendes Spiel weitergeben
    back.addEventListener("keydown", e => {
      e.stopPropagation();
      if (e.key === "Escape" && !pflicht) zu();
      if (e.key === "Enter" && e.target === inp) speichern();
      if (e.key === "Enter" && e.target.id === "nmCode") codeLaden();
    });
    const zu = () => { back.remove(); offen = false; };
    if (!pflicht) { $("#nmX").addEventListener("click", zu); back.addEventListener("mousedown", e => { if (e.target === back) zu(); }); }

    async function speichern() {
      const v = inp.value.replace(/\s+/g, " ").trim();
      if (v.length < 2) { err.textContent = FEHLER.ungueltig; return; }
      if (!pflicht && v === alt) { zu(); return; }
      ok.disabled = true; ok.textContent = "Prüfe …"; err.textContent = "";
      try {
        const n = await rpc("name_festlegen", { p_spieler: spielerId(), p_name: v });
        ls.set("bl-name", String(n || v));
        for (const k of Object.keys(localStorage)) if (k.startsWith("bl-gemeldet-")) ls.del(k);
        zu(); melden(getName());
      } catch (e) {
        err.textContent = FEHLER[e.code] || FEHLER.netz;
        ok.disabled = false; ok.textContent = pflicht ? "Los geht's" : "Speichern";
      }
    }
    ok.addEventListener("click", speichern);

    if (pflicht) {
      $("#nmSync").addEventListener("click", () => { const b = $("#nmSyncBox"); b.hidden = !b.hidden; if (!b.hidden) $("#nmCode").focus(); });
      const code = $("#nmCode");
      code.addEventListener("input", () => { const c = code.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8); code.value = c.length > 4 ? c.slice(0, 4) + "-" + c.slice(4) : c; });
      $("#nmLoad").addEventListener("click", codeLaden);
    }
    async function codeLaden() {
      const se = $("#nmSyncErr"), b = $("#nmLoad"), c = $("#nmCode").value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      se.classList.remove("ok");
      if (c.length !== 8) { se.textContent = "Der Code hat 8 Zeichen, z. B. K7XQ-P2MD."; return; }
      b.disabled = true; se.textContent = "Lade …";
      try {
        const r = await fetch(URL_ + "/rest/v1/rpc/spielstand_laden", { method: "POST", headers: H, body: JSON.stringify({ p_code: c }) });
        if (!r.ok) throw 0;
        const d = await r.json();
        if (!d || typeof d !== "object" || d.v !== 1) { b.disabled = false; se.textContent = "Code ungültig, abgelaufen oder schon benutzt."; return; }
        for (const k of SY_KEYS) { if (typeof d[k] === "string") ls.set(k, d[k]); else ls.del(k); }
        for (const k of Object.keys(localStorage)) if (k.startsWith("bl-gemeldet-")) ls.del(k);
        se.classList.add("ok"); se.textContent = "Spielstand geladen! Starte neu …";
        setTimeout(() => location.reload(), 800);
      } catch (_) { b.disabled = false; se.textContent = FEHLER.netz; }
    }
  }

  // ---------- Spielstand übertragen (Code erstellen / Code eingeben) ----------
  function uebertragen() {
    if (offen) return; offen = true;
    const back = document.createElement("div");
    back.className = "nm-back";
    back.innerHTML = `<div class="nm" role="dialog" aria-modal="true" aria-labelledby="suT">
      <div class="ic">📲</div>
      <h2 id="suT">Spielstand übertragen</h2>
      <p>Nimm deinen Namen, deine Spielzeit und deinen Spielstand auf ein anderes Gerät mit – zum Beispiel vom PC aufs Handy.</p>
      <div class="stp">1. Auf diesem Gerät: Code erstellen</div>
      <div class="row" style="justify-content:space-between;align-items:center"><span class="code" id="suCode">– – – –</span><button class="btn sm" type="button" id="suMake">Code erstellen</button></div>
      <div class="hint" id="suMakeSt">Der Code gilt 24 Stunden und nur einmal.</div>
      <div class="alt">
        <div class="stp">2. Auf dem anderen Gerät: Code eingeben</div>
        <div class="row" style="justify-content:stretch"><input id="suIn" maxlength="9" placeholder="XXXX-XXXX" autocomplete="off" spellcheck="false" style="flex:1"><button class="btn" type="button" id="suLoad">Laden</button></div>
        <div class="err" id="suErr"></div>
        <div class="hint">Achtung: Der Spielstand auf dem Gerät, auf dem du den Code eingibst, wird dabei ersetzt.</div>
      </div>
      <div class="row"><button class="btn primary" type="button" id="suX">Fertig</button></div>
    </div>`;
    document.body.appendChild(back);
    const $ = s => back.querySelector(s);
    const zu = () => { back.remove(); offen = false; };
    $("#suX").addEventListener("click", zu);
    back.addEventListener("mousedown", e => { if (e.target === back) zu(); });
    back.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Escape") zu(); if (e.key === "Enter" && e.target.id === "suIn") laden(); });

    let code = "";
    $("#suMake").addEventListener("click", async () => {
      const b = $("#suMake"), st = $("#suMakeSt");
      if (code) {   // zweiter Klick: kopieren
        try { await navigator.clipboard.writeText(code); st.className = "hint ok"; st.textContent = "Kopiert! Jetzt auf dem anderen Gerät eingeben."; } catch (_) {}
        return;
      }
      b.disabled = true; st.className = "hint"; st.textContent = "Erstelle Code …";
      await zeitSenden();
      const d = { v: 1 }; for (const k of SY_KEYS) { const v = ls.get(k); if (v !== null) d[k] = v; }
      try {
        const r = await fetch(URL_ + "/rest/v1/rpc/spielstand_speichern", { method: "POST", headers: H, body: JSON.stringify({ p_daten: d }) });
        if (!r.ok) throw 0;
        const c = String(await r.json());
        code = c.slice(0, 4) + "-" + c.slice(4);
        $("#suCode").textContent = code;
        b.disabled = false; b.textContent = "Kopieren";
        st.className = "hint ok"; st.textContent = "Gib diesen Code auf dem anderen Gerät ein. Er gilt 24 Stunden und nur einmal.";
      } catch (_) { b.disabled = false; st.className = "err"; st.textContent = FEHLER.netz; }
    });

    const inp = $("#suIn");
    let scharf = false;
    inp.addEventListener("input", () => {
      scharf = false; $("#suLoad").textContent = "Laden";
      const c = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8); inp.value = c.length > 4 ? c.slice(0, 4) + "-" + c.slice(4) : c;
    });
    $("#suLoad").addEventListener("click", laden);
    async function laden() {
      const b = $("#suLoad"), er = $("#suErr"), c = inp.value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      er.className = "err";
      if (c.length !== 8) { er.textContent = "Der Code hat 8 Zeichen, z. B. K7XQ-P2MD."; return; }
      if (!scharf) { scharf = true; b.textContent = "Ja, ersetzen"; er.textContent = "Dein Spielstand auf diesem Gerät wird überschrieben. Nochmal tippen zum Bestätigen."; return; }
      b.disabled = true; er.textContent = "Lade …";
      try {
        const r = await fetch(URL_ + "/rest/v1/rpc/spielstand_laden", { method: "POST", headers: H, body: JSON.stringify({ p_code: c }) });
        if (!r.ok) throw 0;
        const d = await r.json();
        if (!d || typeof d !== "object" || d.v !== 1) { b.disabled = false; scharf = false; b.textContent = "Laden"; er.textContent = "Code ungültig, abgelaufen oder schon benutzt."; return; }
        await zeitSenden();
        for (const k of SY_KEYS) { if (typeof d[k] === "string") ls.set(k, d[k]); else ls.del(k); }
        for (const k of Object.keys(localStorage)) if (k.startsWith("bl-gemeldet-")) ls.del(k);
        ls.del("sb-name-ok");
        er.className = "err ok"; er.textContent = "Spielstand geladen! Starte neu …";
        setTimeout(() => location.reload(), 800);
      } catch (_) { b.disabled = false; er.textContent = FEHLER.netz; }
    }
  }

  // ---------- Knopf oben in der Leiste ----------
  function knopf() {
    const top = document.querySelector(".topin"); if (!top) return;
    let b = document.getElementById("nameBtn");
    if (!b) {
      b = document.createElement("button");
      b.id = "nameBtn"; b.type = "button"; b.className = "btn";
      b.addEventListener("click", e => { e.stopPropagation(); profil(); });
      const s = top.querySelector(".search");
      if (s) s.after(b); else top.appendChild(b);
    }
    const n = getName();
    b.title = n ? "Profil von " + n + ": Spielzeit und Name" : "Spielername wählen";
    b.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg><span class="lbl">${esc(n || "Name")}</span>`;
  }

  // ---------- Gespielte Zeit pro Spiel (pro Spieler-Konto, über alle Geräte) ----------
  // Lokal werden nur noch nicht übertragene Sekunden gemerkt ("sb-zeit"), die Summe liegt in Supabase.
  const ZK = "sb-zeit";
  let server = null;   // { spiel: sekunden } vom Server
  function offen_() { try { const v = JSON.parse(ls.get(ZK) || "{}"); return v && typeof v === "object" ? v : {}; } catch (_) { return {}; } }
  function zeiten() { const z = Object.assign({}, server || {}), o = offen_(); for (const k in o) z[k] = (Number(z[k]) || 0) + (Number(o[k]) || 0); return z; }
  function dauer(sek) {
    sek = Math.floor(sek || 0);
    if (sek < 60) return sek > 0 ? "< 1 Min" : "0 Min";
    const h = Math.floor(sek / 3600), m = Math.floor(sek % 3600 / 60);
    return h ? h + " Std " + String(m).padStart(2, "0") + " Min" : m + " Min";
  }
  async function zeitLaden() {
    try {
      const r = await fetch(URL_ + "/rest/v1/rpc/zeit_laden", { method: "POST", headers: H, body: JSON.stringify({ p_spieler: spielerId() }) });
      if (r.ok) { const d = await r.json(); server = d && typeof d === "object" ? d : {}; }
    } catch (_) {}
    if (pop) profilZeichnen();
  }
  let sendet = false;
  async function zeitSenden(keep) {
    if (sendet) return;
    const o = offen_(), jobs = Object.keys(o).filter(k => /^[a-z0-9-]{1,40}$/.test(k) && Math.floor(o[k]) >= 1);
    if (!jobs.length) return;
    sendet = true;
    for (const k of jobs) {
      const sek = Math.floor(o[k]);
      try {
        const r = await fetch(URL_ + "/rest/v1/rpc/zeit_melden", { method: "POST", headers: H, keepalive: !!keep, body: JSON.stringify({ p_spieler: spielerId(), p_spiel: k, p_sek: sek }) });
        if (!r.ok) { if (r.status === 400) { const n = offen_(); delete n[k]; ls.set(ZK, JSON.stringify(n)); } continue; }
        const n = offen_(); n[k] = Math.max(0, (Number(n[k]) || 0) - sek); if (n[k] < 0.05) delete n[k]; ls.set(ZK, JSON.stringify(n));
        const neu = Number(await r.json()); if (server && isFinite(neu)) server[k] = neu;
      } catch (_) {}
    }
    sendet = false;
    if (pop) profilZeichnen();
  }
  let laeuft = null, letzt = 0, seit = 0;
  // merken, welches Spiel gestartet wurde (Spielen-Knopf auf Karte, Banner oder in den Details)
  document.addEventListener("click", e => {
    const p = e.target.closest && e.target.closest("[data-play]");
    if (p) { laeuft = p.dataset.play; return; }
    if (e.target.closest && e.target.closest("[data-dplay]")) laeuft = decodeURIComponent((location.hash || "").slice(1));
  }, true);
  setInterval(() => {
    const pl = document.getElementById("player"), jetzt = Date.now();
    const aktiv = pl && !pl.hidden && laeuft && document.visibilityState === "visible";
    if (aktiv && letzt) {
      const z = offen_(), d = Math.min(5, (jetzt - letzt) / 1000);
      z[laeuft] = Math.round(((Number(z[laeuft]) || 0) + d) * 10) / 10;
      ls.set(ZK, JSON.stringify(z));
      seit += d;
      if (seit >= 60) { seit = 0; zeitSenden(); }   // jede Minute übertragen
    }
    if (pl && pl.hidden) { if (laeuft) zeitSenden(); laeuft = null; }   // Spiel geschlossen
    letzt = aktiv ? jetzt : 0;
  }, 1000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") zeitSenden(true); });
  addEventListener("pagehide", () => zeitSenden(true));

  // ---------- Profil-Fenster am Namensknopf ----------
  let pop = null;
  function profilZu() { if (pop) { pop.remove(); pop = null; } }
  function profilZeichnen() {
    if (!pop) return;
    const n = getName();
    const z = zeiten(), spiele = (Array.isArray(window.SPIELE) ? window.SPIELE : []).map(g => ({ id: String(g.id || ""), t: String(g.titel || "Spiel") }));
    for (const id in z) if (!spiele.some(g => g.id === id) && z[id] >= 1) spiele.push({ id, t: id });
    spiele.forEach(g => g.s = Number(z[g.id]) || 0);
    spiele.sort((a, c) => c.s - a.s || a.t.localeCompare(c.t, "de"));
    const sum = spiele.reduce((a, g) => a + g.s, 0), max = Math.max(1, ...spiele.map(g => g.s));
    pop.innerHTML = `<div class="pp-head"><div class="pp-av">${esc(n.charAt(0).toUpperCase())}</div><div><b>${esc(n)}</b><span>Dein Spielername</span></div></div>
      <button class="btn sm" type="button" data-ppname>✏️ Namen ändern</button>
      <button class="btn sm" type="button" data-ppsync>📲 Spielstand übertragen</button>
      <div class="pp-lbl"><span>Gespielte Zeit</span><b>${server ? esc(dauer(sum)) : "…"}</b></div>
      <div class="pp-list">${spiele.length ? spiele.map(g => `<div class="pp-row"><div><span>${esc(g.t)}</span><span>${server ? esc(dauer(g.s)) : "…"}</span></div><div class="pp-bar"><i style="width:${(g.s / max * 100).toFixed(1)}%"></i></div></div>`).join("") : `<div class="pp-leer">Noch keine Spiele.</div>`}</div>
      <div class="pp-note">Gezählt wird, solange ein Spiel offen ist – zusammen auf allen Geräten mit deinem Spielstand.</div>`;
    pop.querySelector("[data-ppname]").addEventListener("click", () => { profilZu(); fenster(false); });
    pop.querySelector("[data-ppsync]").addEventListener("click", () => { profilZu(); uebertragen(); });
    window.dispatchEvent(new CustomEvent("sb-profil", { detail: pop }));   // z. B. Freundesliste anhängen
  }
  function profil() {
    if (pop) { profilZu(); return; }
    const n = getName();
    if (!n) { fenster(true); return; }
    const b = document.getElementById("nameBtn"), r = b.getBoundingClientRect();
    pop = document.createElement("div");
    pop.className = "pp"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Profil");
    pop.style.top = (r.bottom + 8) + "px";
    pop.style.right = Math.max(12, innerWidth - r.right) + "px";
    document.body.appendChild(pop);
    profilZeichnen();
    zeitSenden().then(zeitLaden);
  }
  document.addEventListener("mousedown", e => { if (pop && !pop.contains(e.target) && !e.target.closest("#nameBtn")) profilZu(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") profilZu(); });
  addEventListener("resize", profilZu);
  addEventListener("scroll", profilZu, { passive: true });

  window.SB_NAME = { get: getName, aendern: () => fenster(false), zeiten };

  function start() {
    knopf();
    zeitSenden().then(zeitLaden);
    const n = getName();
    if (!n) { fenster(true); return; }
    // Wer schon einen Namen hat: einmal zentral eintragen. Ist er vergeben oder nicht erlaubt, muss ein neuer her.
    if (ls.get("sb-name-ok") === n) return;
    rpc("name_festlegen", { p_spieler: spielerId(), p_name: n })
      .then(() => ls.set("sb-name-ok", n))
      .catch(e => { if (e.code !== "netz") { ls.del("bl-name"); fenster(true, FEHLER[e.code] ? "Dein bisheriger Name „" + n + "“ geht leider nicht: " + FEHLER[e.code] : ""); } });
  }
  window.addEventListener("sb-name", e => ls.set("sb-name-ok", e.detail || ""));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
