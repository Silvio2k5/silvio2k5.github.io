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
  #nameBtn{flex:none;max-width:180px}
  #nameBtn span{overflow:hidden;text-overflow:ellipsis}
  .kb-wer{font-size:13px;color:var(--dim)}
  .kb-wer b{color:var(--paper)}
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

  // ---------- Knopf oben in der Leiste ----------
  function knopf() {
    const top = document.querySelector(".topin"); if (!top) return;
    let b = document.getElementById("nameBtn");
    if (!b) {
      b = document.createElement("button");
      b.id = "nameBtn"; b.type = "button"; b.className = "btn";
      b.addEventListener("click", () => fenster(false));
      const s = top.querySelector(".search");
      if (s) s.after(b); else top.appendChild(b);
    }
    const n = getName();
    b.title = n ? "Spielername: " + n + " (ändern)" : "Spielername wählen";
    b.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg><span class="lbl">${esc(n || "Name")}</span>`;
  }

  window.SB_NAME = { get: getName, aendern: () => fenster(false) };

  function start() {
    knopf();
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
