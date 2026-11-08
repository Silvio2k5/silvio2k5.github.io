// ================================================================
//  FREUNDE für die Spielbibliothek
//  – Freundescode zum Kopieren und Weiterleiten (Link öffnet direkt die Freundschaftsanfrage)
//  – Freundesliste mit Online-Anzeige im Profil (Klick auf den Namen oben rechts)
//  – Freunde direkt zum Online-Spiel einladen; Einladungen erscheinen als Hinweis unten rechts
// ================================================================
(function () {
  const URL_ = "https://hibfzyxbmbspfhpughim.supabase.co";
  const KEY = "sb_publishable_w4PzkJlkAo5WN2PrFftWvg_iN2b_Rz0";
  const ONLINE = ["fussball-3d", "basketball-3d"];          // Spiele mit Online 1 gegen 1
  const H = { apikey: KEY, "Content-Type": "application/json" };

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } } };
  const spieler = () => { const id = ls.get("bl-spieler"); return /^[0-9a-f-]{36}$/.test(id || "") ? id : null; };
  const hatName = () => !!(ls.get("bl-name") || "").trim();
  const spiel = id => (Array.isArray(window.SPIELE) ? window.SPIELE : []).find(g => g && g.id === id);
  const titel = id => (spiel(id) || {}).titel || id;

  async function rpc(fn, body) {
    const r = await fetch(URL_ + "/rest/v1/rpc/" + fn, { method: "POST", headers: H, body: JSON.stringify(Object.assign({ p_spieler: spieler() }, body || {})) });
    const t = await r.text().catch(() => "");
    if (!r.ok) { const e = new Error(fn); e.code = (t.match(/"message":"([a-z_]+)"/) || [])[1] || "netz"; throw e; }
    return t ? JSON.parse(t) : null;
  }
  const FEHLER = {
    code_unbekannt: "Diesen Freundescode gibt es nicht. Prüfe ihn nochmal.",
    selbst: "Das ist dein eigener Freundescode 🙂",
    schon_freunde: "Ihr seid schon befreundet.",
    zu_viele: "Du hast heute schon sehr viele Anfragen verschickt.",
    kein_name: "Wähle zuerst deinen Spielernamen.",
    nicht_befreundet: "Ihr seid (noch) nicht befreundet.",
    zu_schnell: "Einen Moment bitte, dann nochmal versuchen.",
    netz: "Das hat nicht geklappt. Prüfe deine Internetverbindung."
  };

  // ---------- Aussehen ----------
  const css = document.createElement("style");
  css.textContent = `
  .pp{max-height:calc(100vh - 84px);overflow:auto}
  .fr{display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:12px 0}
  .fr-code{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;color:var(--dim)}
  .fr-code b{font-family:var(--mono);font-size:18px;letter-spacing:2px;color:var(--coin)}
  .fr-code .sp{flex:1}
  .fr-add{display:flex;gap:8px}
  .fr-add input{flex:1;min-width:0;height:34px;border:1px solid var(--line);background:var(--ink);border-radius:10px;padding:0 10px;outline:none;font-family:var(--mono);letter-spacing:2px;text-transform:uppercase}
  .fr-add input:focus{border-color:var(--coin)}
  .fr-msg{font-size:12px;min-height:1em;color:var(--danger)}
  .fr-msg.ok{color:#7fe0a0}
  .fr-sub{font-size:11px;font-family:var(--mono);text-transform:uppercase;letter-spacing:.06em;color:var(--dim)}
  .fr-row{display:flex;align-items:center;gap:8px;font-size:14px;min-height:34px}
  .fr-row .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .fr-dot{width:9px;height:9px;border-radius:50%;background:#59567a;flex:none}
  .fr-dot.on{background:#7fe0a0;box-shadow:0 0 0 3px rgba(127,224,160,.18)}
  .fr-row .btn.sm{height:30px;padding:0 10px;font-size:12px}
  .fr-x{background:none;border:0;color:var(--dim);font-size:15px;padding:0 4px;line-height:1}
  .fr-x:hover,.fr-x.arm{color:var(--danger)}
  .fr-x.arm{font-size:11px;font-weight:700}
  .fr-leer{font-size:13px;color:var(--dim)}
  .fr-ein{position:fixed;right:16px;bottom:16px;z-index:400;width:min(340px,calc(100vw - 32px));background:var(--shelf);border:1px solid var(--coin);border-radius:16px;box-shadow:0 24px 60px -16px rgba(0,0,0,.8);padding:14px 16px;display:flex;flex-direction:column;gap:10px;animation:frIn .25s ease-out}
  .fr-ein p{margin:0;font-size:15px}
  .fr-ein .acts{display:flex;gap:8px;justify-content:flex-end}
  .fr-wahl{position:fixed;inset:0;z-index:500;background:rgba(5,4,15,.6);display:flex;align-items:center;justify-content:center;padding:16px}
  .fr-wahl .k{width:min(380px,100%);background:var(--shelf);border:1px solid var(--line);border-radius:18px;box-shadow:0 24px 60px -16px rgba(0,0,0,.8);padding:18px;display:flex;flex-direction:column;gap:10px;animation:frIn .2s ease-out}
  .fr-wahl h3{margin:0;font-size:18px}
  .fr-wahl .u{margin:0;font-size:13px;color:var(--dim)}
  .fr-wahl .g{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:var(--ink);border:1px solid var(--line);border-radius:12px;padding:8px;color:inherit;font:inherit;font-size:15px;font-weight:600;cursor:pointer}
  .fr-wahl .g:hover,.fr-wahl .g:focus-visible{border-color:var(--coin);outline:none}
  .fr-wahl .g:disabled{opacity:.6;cursor:default}
  .fr-wahl .g img,.fr-wahl .g .sy{width:72px;height:40px;border-radius:8px;object-fit:cover;flex:none}
  .fr-wahl .g .sy{display:flex;align-items:center;justify-content:center;font-size:22px;background:var(--shelf)}
  .fr-wahl .m{font-size:12px;min-height:1em;color:var(--danger)}
  .fr-wahl .acts{display:flex;justify-content:flex-end}
  @keyframes frIn{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}`;
  document.head.appendChild(css);

  // ---------- Daten ----------
  let D = null, ladeLaeuft = false, box = null;
  async function laden() {
    if (ladeLaeuft || !spieler() || !hatName()) return;
    ladeLaeuft = true;
    try { D = await rpc("freunde_laden"); } catch (_) {}
    ladeLaeuft = false;
    zeichnen(); hinweise();
  }

  // ---------- Bereich im Profil ----------
  function zeichnen(msg, ok) {
    if (!box || !box.isConnected) return;
    const ich = D && D.ich;
    const fr = (D && D.freunde) || [], ein = (D && D.eingehend) || [], aus = (D && D.ausgehend) || [];
    const altMsg = box.querySelector(".fr-msg"), m = msg !== undefined ? msg : (altMsg ? altMsg.textContent : ""), mok = msg !== undefined ? ok : (altMsg && altMsg.classList.contains("ok"));
    const inpAlt = box.querySelector(".fr-add input"), wert = inpAlt ? inpAlt.value : "";
    box.innerHTML = `
      <div class="pp-lbl"><span>Freunde</span><b>${fr.length}</b></div>
      <div class="fr-code">Dein Freundescode <b>${ich ? esc(ich.code) : "…"}</b><span class="sp"></span>
        <button class="btn sm" type="button" data-frcopy ${ich ? "" : "disabled"}>Kopieren</button>
        <button class="btn sm" type="button" data-frshare ${ich ? "" : "disabled"}>Teilen</button></div>
      <div class="fr-add"><input maxlength="7" placeholder="Code eines Freundes" aria-label="Freundescode eingeben" autocomplete="off" spellcheck="false" value="${esc(wert)}"><button class="btn sm" type="button" data-fradd>Hinzufügen</button></div>
      <div class="fr-msg${mok ? " ok" : ""}">${esc(m)}</div>
      ${ein.length ? `<div class="fr-sub">Freundschaftsanfragen</div>` + ein.map(x => `<div class="fr-row"><span class="n">${esc(x.name)}</span>
          <button class="btn sm primary" type="button" data-frja="${esc(x.code)}">Annehmen</button><button class="fr-x" type="button" data-frnein="${esc(x.code)}" title="Ablehnen">✕</button></div>`).join("") : ""}
      ${fr.length ? fr.map(x => `<div class="fr-row"><span class="fr-dot${x.online ? " on" : ""}" title="${x.online ? "online" : "offline"}"></span><span class="n">${esc(x.name)}</span>
          <button class="btn sm" type="button" data-frwahl="${esc(x.code)}" data-frname="${esc(x.name)}" title="Zu einem Online-Spiel einladen">🎮 Einladen</button>
          <button class="fr-x" type="button" data-frweg="${esc(x.code)}" title="Freund entfernen">✕</button></div>`).join("")
        : (D ? `<div class="fr-leer">Noch keine Freunde. Teile deinen Code oder gib den Code eines Freundes ein.</div>` : `<div class="fr-leer">Lade Freunde …</div>`)}
      ${aus.length ? `<div class="fr-leer">Wartet auf Bestätigung: ${aus.map(x => `${esc(x.name)} <button class="fr-x" type="button" data-frweg="${esc(x.code)}" title="Anfrage zurückziehen">✕</button>`).join(", ")}</div>` : ""}`;
    const inp = box.querySelector(".fr-add input");
    inp.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") hinzufuegen(); });
    inp.addEventListener("input", () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6); });
  }
  const meldung = (t, ok) => { const m = box && box.querySelector(".fr-msg"); if (m) { m.textContent = t; m.classList.toggle("ok", !!ok); } };

  async function hinzufuegen(codeVonLink) {
    const inp = box && box.querySelector(".fr-add input");
    const c = (codeVonLink || (inp ? inp.value : "")).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length !== 6) { meldung("Ein Freundescode hat 6 Zeichen."); return; }
    try {
      const r = await rpc("freund_anfragen", { p_code: c });
      if (inp) inp.value = "";
      const t = r && r.status === "ok" ? "Ihr seid jetzt Freunde: " + r.name + " 🎉" : "Anfrage an " + (r ? r.name : "") + " gesendet. Sobald sie angenommen ist, seid ihr Freunde.";
      meldung(t, true); toast(t);
      await laden(); meldung(t, true);
    } catch (e) { meldung(FEHLER[e.code] || FEHLER.netz); if (codeVonLink) toast(FEHLER[e.code] || FEHLER.netz, true); }
  }

  function linkVon(code) { return location.origin + location.pathname + "?freund=" + encodeURIComponent(code); }

  document.addEventListener("click", async e => {
    const t = e.target.closest && e.target.closest("button");
    if (!t || !t.closest(".fr")) return;
    e.stopPropagation();
    const ich = D && D.ich;
    if (t.hasAttribute("data-frcopy") && ich) {
      try { await navigator.clipboard.writeText(ich.code); meldung("Code kopiert!", true); } catch (_) { meldung("Kopieren ging nicht – merk dir den Code: " + ich.code); }
    } else if (t.hasAttribute("data-frshare") && ich) {
      const text = "Spiel mit mir in der Spielbibliothek! Mein Freundescode: " + ich.code;
      const url = linkVon(ich.code);
      if (navigator.share) { try { await navigator.share({ title: "Spielbibliothek", text, url }); } catch (_) {} }
      else { try { await navigator.clipboard.writeText(text + "\n" + url); meldung("Einladungslink kopiert – schick ihn deinem Freund!", true); } catch (_) { meldung(url); } }
    } else if (t.hasAttribute("data-fradd")) hinzufuegen();
    else if (t.dataset.frja || t.dataset.frnein) {
      const ja = !!t.dataset.frja; t.disabled = true;
      try { await rpc("freund_antworten", { p_code: t.dataset.frja || t.dataset.frnein, p_ja: ja }); } catch (_) {}
      await laden();
    } else if (t.dataset.frweg) {
      if (!t.classList.contains("arm")) { t.classList.add("arm"); t.textContent = "Entfernen?"; setTimeout(() => { if (t.isConnected) { t.classList.remove("arm"); t.textContent = "✕"; } }, 4000); return; }
      try { await rpc("freund_entfernen", { p_code: t.dataset.frweg }); } catch (_) {}
      await laden();
    } else if (t.dataset.frwahl) spielWahl(t.dataset.frwahl, t.dataset.frname || "");
    else if (t.dataset.frein) einladen(t.dataset.frein, t.dataset.frspiel, t);
  }, true);

  // ---------- Fenster: Spiel für die Einladung auswählen ----------
  function spielWahl(code, name) {
    const alt = document.querySelector(".fr-wahl"); if (alt) alt.remove();
    const w = document.createElement("div");
    w.className = "fr-wahl";
    w.innerHTML = `<div class="k" role="dialog" aria-modal="true" aria-labelledby="frWT">
      <h3 id="frWT">🎮 Mit ${esc(name)} spielen</h3>
      <p class="u">Wähle ein Spiel – ${esc(name)} bekommt sofort eine Einladung.</p>
      ${ONLINE.filter(id => spiel(id)).map(id => { const g = spiel(id);
        return `<button class="g" type="button" data-wspiel="${esc(id)}">${g.titelbild ? `<img src="${esc(g.titelbild)}" alt="">` : `<span class="sy">${esc(g.symbol || "🎮")}</span>`}<span class="t">${esc(titel(id))}</span></button>`; }).join("")}
      <div class="m"></div>
      <div class="acts"><button class="btn sm" type="button" data-wzu>Abbrechen</button></div></div>`;
    document.body.appendChild(w);
    const zu = () => { w.remove(); document.removeEventListener("keydown", esc_); };
    const esc_ = e => { if (e.key === "Escape") { e.stopPropagation(); zu(); } };
    document.addEventListener("keydown", esc_);
    w.addEventListener("mousedown", e => e.stopPropagation());
    w.addEventListener("click", async e => {
      e.stopPropagation();
      if (e.target === w || e.target.closest("[data-wzu]")) { zu(); return; }
      const b = e.target.closest("[data-wspiel]"); if (!b) return;
      const id = b.dataset.wspiel, t = b.querySelector(".t"), alt = t.textContent;
      w.querySelectorAll(".g").forEach(x => x.disabled = true); t.textContent = "Lade ein …";
      try {
        const raum = raumCode();
        await rpc("einladung_senden", { p_code: code, p_spiel: id, p_raum: raum });
        zu(); spielStarten(id, raum, "host");
      } catch (err) {
        w.querySelectorAll(".g").forEach(x => x.disabled = false); t.textContent = alt;
        w.querySelector(".m").textContent = FEHLER[err.code] || FEHLER.netz;
      }
    });
    const erst = w.querySelector(".g"); if (erst) erst.focus();
  }

  // ---------- Einladen und Spiel starten ----------
  const raumCode = () => { const z = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let c = ""; for (let i = 0; i < 4; i++) c += z[Math.floor(Math.random() * z.length)]; return c; };
  async function einladen(code, id, btn) {
    const raum = raumCode();
    if (btn) { btn.disabled = true; btn.textContent = "Lade ein …"; }
    try {
      await rpc("einladung_senden", { p_code: code, p_spiel: id, p_raum: raum });
      spielStarten(id, raum, "host");
    } catch (e) { meldung(FEHLER[e.code] || FEHLER.netz); if (btn) { btn.disabled = false; btn.textContent = "🎮 Einladen"; } }
  }
  function spielStarten(id, raum, rolle) {
    const g = spiel(id); if (!g) return;
    document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));   // Profil schließen
    const modal = document.getElementById("modalRoot"); if (modal) modal.innerHTML = "";
    const b = document.createElement("button"); b.hidden = true; b.dataset.play = id; document.body.appendChild(b); b.click(); b.remove();
    const fr = document.querySelector("#pStage iframe");
    if (fr) fr.src = g.datei + (g.datei.includes("?") ? "&" : "?") + "einladung=" + raum + "&rolle=" + rolle;
  }

  // ---------- Hinweis bei Einladungen ----------
  const gezeigt = new Set();
  let hinweisEl = null;
  function hinweise() {
    const liste = ((D && D.einladungen) || []).filter(x => !gezeigt.has(x.id));
    if (hinweisEl || !liste.length) return;
    const x = liste[0]; gezeigt.add(x.id);
    hinweisEl = document.createElement("div");
    hinweisEl.className = "fr-ein"; hinweisEl.setAttribute("role", "alertdialog");
    hinweisEl.innerHTML = `<p>🎮 <b>${esc(x.name)}</b> lädt dich zu <b>${esc(titel(x.spiel))}</b> ein!</p>
      <div class="acts"><button class="btn sm" type="button" data-nein>Ablehnen</button><button class="btn sm primary" type="button" data-ja>Mitspielen</button></div>`;
    document.body.appendChild(hinweisEl);
    const weg = () => { if (hinweisEl) { hinweisEl.remove(); hinweisEl = null; } setTimeout(hinweise, 300); };
    hinweisEl.querySelector("[data-nein]").addEventListener("click", async () => { weg(); try { await rpc("einladung_antworten", { p_id: x.id, p_ja: false }); } catch (_) {} });
    hinweisEl.querySelector("[data-ja]").addEventListener("click", async () => {
      let r = null; try { r = await rpc("einladung_antworten", { p_id: x.id, p_ja: true }); } catch (_) {}
      weg();
      if (r && r.raum) spielStarten(r.spiel, r.raum, "gast"); else toast("Die Einladung ist leider abgelaufen.", true);
    });
  }
  function toast(t, bad) {
    const el = document.createElement("div"); el.className = "toast" + (bad ? " bad" : ""); el.textContent = t;
    document.body.appendChild(el); setTimeout(() => el.remove(), 3500);
  }

  // ---------- Einbinden ----------
  window.addEventListener("sb-profil", e => {
    const pop = e.detail; if (!pop) return;
    box = document.createElement("div"); box.className = "fr";
    const zeit = pop.querySelector(".pp-lbl");   // vor „Gespielte Zeit“ einfügen
    if (zeit) pop.insertBefore(box, zeit); else pop.appendChild(box);
    zeichnen(); laden();
  });
  // Link mit ?freund=CODE: Anfrage automatisch senden (sobald ein Name gewählt ist)
  let linkCode = (new URLSearchParams(location.search).get("freund") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (linkCode) history.replaceState(null, "", location.pathname + location.hash);
  function linkPruefen() { if (linkCode && hatName() && spieler()) { const c = linkCode; linkCode = ""; hinzufuegen(c); } }
  window.addEventListener("sb-name", () => setTimeout(() => { linkPruefen(); laden(); }, 500));

  setInterval(() => { if (document.visibilityState === "visible") laden(); }, 20000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") laden(); });
  setTimeout(() => { linkPruefen(); laden(); }, 1500);
})();
