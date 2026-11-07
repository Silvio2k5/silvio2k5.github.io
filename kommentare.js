// ================================================================
//  KOMMENTARE für die Spielbibliothek: Rezensionen und Verbesserungsvorschläge
//  – einmal für die ganze Website (unten auf der Startseite)
//  – und für jedes Spiel im Fenster „Details“
//  Gespeichert wird im gleichen Supabase-Projekt wie die Bestenliste.
// ================================================================
(function () {
  const URL_ = "https://hibfzyxbmbspfhpughim.supabase.co";
  const KEY = "sb_publishable_w4PzkJlkAo5WN2PrFftWvg_iN2b_Rz0";
  const MAXLEN = 800, ERSTE = 5;

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  };
  // gleiche Spieler-Kennung wie die Bestenliste, damit man eigene Beiträge wiedererkennt
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
  let meinHash = null;
  async function kennung() {
    if (meinHash !== null) return meinHash;
    try {
      const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(spielerId()));
      meinHash = [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
    } catch (_) { meinHash = ""; }
    return meinHash;
  }
  const H = () => ({ apikey: KEY, "Content-Type": "application/json" });

  async function laden(bereich) {
    const u = URL_ + "/rest/v1/kommentare?select=id,art,sterne,name,text,antwort,kennung,erstellt" +
      "&bereich=eq." + encodeURIComponent(bereich) + "&order=erstellt.desc&limit=200";
    const r = await fetch(u, { headers: { apikey: KEY } });
    if (!r.ok) throw new Error("laden " + r.status);
    return r.json();
  }
  async function rpc(fn, body) {
    const r = await fetch(URL_ + "/rest/v1/rpc/" + fn, { method: "POST", headers: H(), body: JSON.stringify(body) });
    if (!r.ok) { const t = await r.text().catch(() => ""); const e = new Error(fn); e.code = (t.match(/filter_kontakt|filter_beleidigung|zu_schnell|zu_viele|ungueltig/) || [""])[0]; throw e; }
    return r.json().catch(() => null);
  }

  // ---------- Aussehen (passt zum Rest der Bibliothek) ----------
  const css = document.createElement("style");
  css.textContent = `
  .kb{display:flex;flex-direction:column;gap:14px}
  .kb-site{border:1px solid var(--line);background:var(--shelf);border-radius:20px;padding:clamp(18px,3vw,28px)}
  .kb-detail{border-top:1px solid var(--line);padding-top:18px}
  .kb-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap}
  .kb-head h2,.kb-head h3{font-family:var(--display);font-weight:800;letter-spacing:-.01em}
  .kb-head h2{font-size:clamp(22px,2.6vw,28px)}.kb-head h3{font-size:20px}
  .kb-sub{color:var(--dim);font-size:14px;margin:2px 0 0}
  .kb-avg{display:inline-flex;align-items:center;gap:8px;font-size:14px;color:var(--dim);white-space:nowrap}
  .kb-avg b{font-family:var(--display);font-size:22px;color:var(--paper)}
  .kb-st{color:var(--coin);letter-spacing:1px}
  .kb-st i{font-style:normal;color:#4a4680}
  .kb-form{border:1px solid var(--line);border-radius:14px;padding:14px;background:rgba(0,0,0,.15);display:flex;flex-direction:column;gap:10px}
  .kb-seg{display:flex;gap:4px;padding:4px;border:1px solid var(--line);border-radius:99px;width:max-content;max-width:100%;flex-wrap:wrap}
  .kb-seg button{border:0;background:transparent;height:30px;padding:0 14px;border-radius:99px;color:var(--dim);font-size:13px;font-weight:700}
  .kb-seg button.on{background:var(--paper);color:var(--ink)}
  .kb-stars{display:flex;align-items:center;gap:2px}
  .kb-stars button{border:0;background:none;padding:0 2px;font-size:28px;line-height:1;color:#4a4680;transition:transform .1s}
  .kb-stars button.on{color:var(--coin)}
  .kb-stars button:hover{transform:scale(1.12)}
  .kb-stars span{margin-left:8px;color:var(--dim);font-size:13px}
  .kb-form input,.kb-form textarea{width:100%;border:1px solid var(--line);background:var(--ink);border-radius:10px;padding:10px 12px;outline:none}
  .kb-form input:focus,.kb-form textarea:focus{border-color:var(--coin)}
  .kb-form textarea{resize:vertical;min-height:84px}
  .kb-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .kb-row input{flex:1;min-width:150px;max-width:260px}
  .kb-cnt{margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--dim)}
  .kb-note{font-size:12px;color:var(--dim)}
  .kb-err{color:var(--danger);font-size:13px;min-height:1em}
  .kb-ok{color:#7fe0a0}
  .kb-filter{display:flex;gap:8px;flex-wrap:wrap}
  .kb-list{display:flex;flex-direction:column;gap:10px}
  .kb-item{border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:6px;background:rgba(255,255,255,.02)}
  .kb-item.me{border-color:rgba(255,181,71,.45)}
  .kb-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;color:var(--dim)}
  .kb-meta .n{color:var(--paper);font-weight:700;font-size:14px}
  .kb-art{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;border-radius:99px;padding:1px 8px;border:1px solid}
  .kb-art.r{color:var(--coin);border-color:rgba(255,181,71,.45)}
  .kb-art.v{color:#8fc8ff;border-color:rgba(143,200,255,.45)}
  .kb-art.i{color:#7fe0a0;border-color:rgba(127,224,160,.45)}
  .kb-text{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font-size:15px}
  .kb-ans{border-left:3px solid var(--coin);padding:6px 10px;background:rgba(255,181,71,.07);border-radius:0 8px 8px 0;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere}
  .kb-ans b{display:block;font-size:12px;color:var(--coin);margin-bottom:2px}
  .kb-del{margin-left:auto;background:none;border:0;padding:0;color:var(--dim);font-size:12px;text-decoration:underline;text-underline-offset:3px}
  .kb-del:hover,.kb-del.arm{color:var(--danger)}
  .kb-leer{color:var(--dim);font-size:14px;padding:4px 0}
  @media (max-width:520px){.kb-row input{max-width:none}}`;
  document.head.appendChild(css);

  const sterne = n => { n = Math.round(n); return `<span class="kb-st" aria-label="${n} von 5 Sternen">${"★".repeat(n)}<i>${"★".repeat(5 - n)}</i></span>`; };
  const datum = t => { const d = new Date(t); return isNaN(d) ? "" : d.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" }); };
  const zahl = x => x.toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

  // ---------- Ein Kommentarbereich ----------
  function bereichBauen(box, bereich, art) {
    const S = { liste: null, fehler: false, filter: "", alle: false, typ: "rezension", sterne: 0, meinH: "", senden: false, msg: "", ok: false };
    const titel = art === "site"
      ? `<div><h2>💬 Feedback zur Spielbibliothek</h2><p class="kb-sub">Wie gefällt dir die Website? Was sollen wir verbessern? Welches Spiel wünschst du dir?</p></div>`
      : `<div><h3>💬 Rezensionen &amp; Vorschläge</h3></div>`;
    box.classList.add("kb", art === "site" ? "kb-site" : "kb-detail");
    box.innerHTML = `<div class="kb-head">${titel}<div class="kb-avg" data-kavg></div></div>
      <form class="kb-form" novalidate>
        <div class="kb-seg" role="group" aria-label="Art des Beitrags">
          <button type="button" data-ktyp="rezension" class="on">★ Rezension</button>
          <button type="button" data-ktyp="vorschlag">💡 Verbesserungsvorschlag</button>
          ${art === "site" ? `<button type="button" data-ktyp="spielidee">🎮 Spielidee</button>` : ""}
        </div>
        <div class="kb-stars" data-kstars role="group" aria-label="Sterne vergeben">
          ${[1, 2, 3, 4, 5].map(i => `<button type="button" data-kstern="${i}" aria-label="${i} Stern${i > 1 ? "e" : ""}">★</button>`).join("")}<span data-ksl>Tippe auf die Sterne</span>
        </div>
        <textarea maxlength="${MAXLEN}" rows="3" data-ktext placeholder="Was gefällt dir? Was fehlt dir?" aria-label="Dein Text"></textarea>
        <div class="kb-row">
          <input maxlength="16" data-kname placeholder="Dein Name" aria-label="Dein Name" autocomplete="nickname">
          <button class="btn primary sm" type="submit" data-ksend>Absenden</button>
          <span class="kb-cnt" data-kcnt>0 / ${MAXLEN}</span>
        </div>
        <div class="kb-note" data-knote></div>
        <div class="kb-err" data-kerr></div>
      </form>
      <div class="kb-filter" data-kfilter></div>
      <div class="kb-list" data-klist><div class="kb-leer">Lade Beiträge …</div></div>`;

    const $ = s => box.querySelector(s);
    const nameIn = $("[data-kname]"), textIn = $("[data-ktext]");
    nameIn.value = (ls.get("bl-name") || "").trim();
    // Tasten in den Feldern nicht an die Seite weitergeben (z. B. „/“ für die Suche)
    for (const el of [nameIn, textIn]) el.addEventListener("keydown", e => { if (e.key !== "Escape") e.stopPropagation(); });
    textIn.addEventListener("input", () => { $("[data-kcnt]").textContent = textIn.value.length + " / " + MAXLEN; });

    const eigeneRez = () => (S.liste || []).find(k => k.art === "rezension" && S.meinH && k.kennung === S.meinH);

    function formZeichnen() {
      box.querySelectorAll("[data-ktyp]").forEach(b => b.classList.toggle("on", b.dataset.ktyp === S.typ));
      $("[data-kstars]").hidden = S.typ !== "rezension";
      box.querySelectorAll("[data-kstern]").forEach(b => b.classList.toggle("on", +b.dataset.kstern <= S.sterne));
      $("[data-ksl]").textContent = S.sterne ? ["", "Schlecht", "Geht so", "Okay", "Gut", "Super!"][S.sterne] : "Tippe auf die Sterne";
      textIn.placeholder = S.typ === "rezension" ? "Was gefällt dir? Was nicht?"
        : S.typ === "spielidee" ? "Welches Spiel wünschst du dir? Beschreib kurz, wie es funktionieren soll."
        : "Was sollen wir verbessern oder neu einbauen?";
      const mine = eigeneRez();
      $("[data-knote]").textContent = S.typ === "rezension" && mine
        ? "Du hast hier schon eine Rezension geschrieben. Wenn du absendest, wird sie ersetzt."
        : "Beiträge sind für alle sichtbar. Keine Beleidigungen, Links oder Kontaktdaten – solche Beiträge werden nicht veröffentlicht.";
      const err = $("[data-kerr]"); err.textContent = S.msg; err.classList.toggle("kb-ok", S.ok);
      const sb = $("[data-ksend]"); sb.disabled = S.senden; sb.textContent = S.senden ? "Sende …" : "Absenden";
    }

    function listeZeichnen() {
      const L = S.liste, liste = $("[data-klist]"), filt = $("[data-kfilter]"), avg = $("[data-kavg]");
      if (S.fehler) { liste.innerHTML = `<div class="kb-leer">Die Beiträge konnten gerade nicht geladen werden. Versuch es später noch einmal.</div>`; filt.innerHTML = ""; avg.innerHTML = ""; return; }
      if (!L) return;
      const rez = L.filter(k => k.art === "rezension" && k.sterne), vor = L.filter(k => k.art === "vorschlag"), ide = L.filter(k => k.art === "spielidee");
      avg.innerHTML = rez.length
        ? `<b>${zahl(rez.reduce((a, k) => a + k.sterne, 0) / rez.length)}</b>${sterne(rez.reduce((a, k) => a + k.sterne, 0) / rez.length)}<span>${rez.length} ${rez.length === 1 ? "Bewertung" : "Bewertungen"}</span>`
        : "";
      filt.innerHTML = L.length ? [["", "Alle", L.length], ["rezension", "Rezensionen", rez.length], ["vorschlag", "Vorschläge", vor.length], ...(art === "site" || ide.length ? [["spielidee", "Spielideen", ide.length]] : [])]
        .map(([k, t, n]) => `<button type="button" class="chip ${S.filter === k ? "on" : ""}" data-kfilt="${k}">${t} · ${n}</button>`).join("") : "";
      const sicht = L.filter(k => !S.filter || k.art === S.filter);
      if (!sicht.length) { liste.innerHTML = `<div class="kb-leer">${L.length ? "Hier gibt es noch nichts." : "Noch keine Beiträge – schreib den ersten!"}</div>`; return; }
      const zeige = S.alle ? sicht : sicht.slice(0, ERSTE);
      liste.innerHTML = zeige.map(k => {
        const me = S.meinH && k.kennung === S.meinH;
        return `<article class="kb-item${me ? " me" : ""}">
          <div class="kb-meta"><span class="n">${esc(k.name)}${me ? " (du)" : ""}</span>
            ${k.art === "rezension" ? (k.sterne ? sterne(k.sterne) : "") + `<span class="kb-art r">Rezension</span>` : k.art === "spielidee" ? `<span class="kb-art i">Spielidee</span>` : `<span class="kb-art v">Vorschlag</span>`}
            <span>${esc(datum(k.erstellt))}</span>
            ${me ? `<button type="button" class="kb-del" data-kdel="${Number(k.id)}">Löschen</button>` : ""}</div>
          <p class="kb-text">${esc(k.text)}</p>
          ${k.antwort ? `<div class="kb-ans"><b>Antwort von Silvio2k5</b>${esc(k.antwort)}</div>` : ""}
        </article>`;
      }).join("") + (sicht.length > zeige.length ? `<button type="button" class="btn sm" data-kmehr style="align-self:flex-start">Alle ${sicht.length} anzeigen</button>` : "");
    }

    async function neuLaden() {
      try { S.meinH = await kennung(); S.liste = await laden(bereich); S.fehler = false; }
      catch (_) { S.fehler = true; }
      if (!box.isConnected) return;
      listeZeichnen(); formZeichnen();
    }

    box.addEventListener("click", async e => {
      const t = e.target.closest("button"); if (!t || !box.contains(t)) return;
      e.stopPropagation();
      if (t.dataset.ktyp) { S.typ = t.dataset.ktyp; S.msg = ""; formZeichnen(); return; }
      if (t.dataset.kstern) {
        S.sterne = +t.dataset.kstern; S.msg = "";
        const mine = eigeneRez(); if (mine && !textIn.value.trim()) textIn.value = mine.text, textIn.dispatchEvent(new Event("input"));
        formZeichnen(); return;
      }
      if (t.dataset.kfilt !== undefined) { S.filter = t.dataset.kfilt; S.alle = false; listeZeichnen(); return; }
      if (t.dataset.kmehr !== undefined) { S.alle = true; listeZeichnen(); return; }
      if (t.dataset.kdel) {
        if (!t.classList.contains("arm")) { t.classList.add("arm"); t.textContent = "Wirklich löschen?"; setTimeout(() => { if (t.isConnected) { t.classList.remove("arm"); t.textContent = "Löschen"; } }, 4000); return; }
        t.disabled = true; t.textContent = "Lösche …";
        try { await rpc("kommentar_loeschen", { p_spieler: spielerId(), p_id: +t.dataset.kdel }); } catch (_) {}
        neuLaden();
      }
    });

    $("form").addEventListener("submit", async e => {
      e.preventDefault(); e.stopPropagation();
      if (S.senden) return;
      const name = nameIn.value.replace(/\s+/g, " ").trim(), text = textIn.value.trim();
      S.ok = false;
      if (S.typ === "rezension" && !S.sterne) S.msg = "Bitte vergib zuerst 1 bis 5 Sterne.";
      else if (text.length < 3) S.msg = "Bitte schreib ein paar Worte (mindestens 3 Zeichen).";
      else if (name.length < 2) S.msg = "Bitte gib einen Namen mit mindestens 2 Zeichen ein.";
      else S.msg = "";
      if (S.msg) { formZeichnen(); return; }
      S.senden = true; formZeichnen();
      try {
        await rpc("kommentar_schreiben", { p_spieler: spielerId(), p_bereich: bereich, p_art: S.typ, p_sterne: S.typ === "rezension" ? S.sterne : null, p_name: name, p_text: text });
        if (!(ls.get("bl-name") || "").trim()) ls.set("kb-name", name);
        textIn.value = ""; textIn.dispatchEvent(new Event("input")); S.sterne = 0;
        S.msg = "Danke für deinen Beitrag!"; S.ok = true; S.filter = ""; S.alle = false;
        await neuLaden();
      } catch (err) {
        S.msg = err.code === "filter_kontakt" ? "Links, E-Mail-Adressen, Telefonnummern, IP-Adressen und @Namen sind nicht erlaubt. Bitte entferne sie (auch aus deinem Namen)."
          : err.code === "filter_beleidigung" ? "Dein Beitrag enthält Wörter, die hier nicht erlaubt sind. Bitte formuliere ihn freundlich."
          : err.code === "zu_schnell" ? "Nicht so schnell – warte kurz, bevor du den nächsten Beitrag schreibst."
          : err.code === "zu_viele" ? "Du hast heute schon sehr viele Beiträge geschrieben. Versuch es morgen wieder."
          : err.code === "ungueltig" ? "Der Beitrag konnte nicht gespeichert werden. Prüfe Name und Text."
          : "Senden hat nicht geklappt. Prüfe deine Internetverbindung.";
      }
      S.senden = false; formZeichnen();
    });

    if (!nameIn.value) nameIn.value = (ls.get("kb-name") || "").trim();
    formZeichnen(); neuLaden();
  }

  // ---------- Einbauen: Startseite + Detail-Fenster ----------
  function startseite() {
    const main = document.querySelector("main");
    if (!main || document.getElementById("kbSite")) return;
    const sec = document.createElement("section");
    sec.id = "kbSite";
    main.appendChild(sec);
    bereichBauen(sec, "website", "site");
  }
  function detail() {
    const det = document.querySelector("#modalRoot .detail");
    if (!det || det.querySelector(".kb")) return;
    const id = decodeURIComponent((location.hash || "").slice(1));
    if (!/^[a-z0-9-]{1,40}$/.test(id)) return;
    const body = det.querySelector(".mbody"); if (!body) return;
    const sec = document.createElement("section");
    body.appendChild(sec);
    bereichBauen(sec, id, "detail");
  }
  function start() {
    startseite();
    const root = document.getElementById("modalRoot");
    if (root) new MutationObserver(detail).observe(root, { childList: true });
    detail();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
