// ================================================================
//  BESTENLISTE für die Spielbibliothek
//  Hier deine Supabase-Daten eintragen (Supabase > Project Settings > API):
// ================================================================
const BL_URL = "https://hibfzyxbmbspfhpughim.supabase.co";
const BL_KEY = "sb_publishable_w4PzkJlkAo5WN2PrFftWvg_iN2b_Rz0";      // der öffentliche "anon" bzw. "publishable" Key

// Welche Spiele eine Bestenliste haben und wo das Spiel seine Siege speichert:
const BL_SPIELE = {
        "fussball-3d": { speicher: "fnStats", feld: "wins", titel: "Siege" },
        "basketball-3d": { speicher: "bbStats", feld: "wins", titel: "Siege" }
};

// ================================================================
(function () {
        const ready = !/HIER_/.test(BL_URL + BL_KEY);
        const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
        const ls = {
                  get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
                  set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
        };
        function spielerId() {
                  let id = ls.get("bl-spieler");
                  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
                              id = (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
                                            const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16);
                              }));
                              ls.set("bl-spieler", id);
                  }
                  return id;
        }
        const getName = () => (ls.get("bl-name") || "").trim();
        function eigeneSiege(cfg) {
                  try { const s = JSON.parse(ls.get(cfg.speicher) || "{}"); const n = Math.floor(Number(s[cfg.feld]) || 0); return Math.max(0, Math.min(1000000, n)); }
                  catch (_) { return 0; }
        }
        function headers() {
                  const h = { apikey: BL_KEY, "Content-Type": "application/json" };
                  if (BL_KEY.startsWith("eyJ")) h.Authorization = "Bearer " + BL_KEY;
                  return h;
        }
        async function melden(spiel, neuerName) {
                  const cfg = BL_SPIELE[spiel], name = neuerName || getName();
                  if (!ready || !cfg || name.length < 2) return;
                  const siege = eigeneSiege(cfg);
                  const last = ls.get("bl-gemeldet-" + spiel);
                  if (!neuerName && last === name + "|" + siege) return;
                  const r = await fetch(BL_URL.replace(/\/$/, "") + "/rest/v1/rpc/melde_siege", {
                              method: "POST", headers: headers(),
                              body: JSON.stringify({ p_spieler: spielerId(), p_spiel: spiel, p_name: name, p_siege: siege })
                  });
                  if (!r.ok) {
                              const t = await r.text().catch(() => "");
                              const e = new Error("melden " + r.status);
                              e.vergeben = /name_vergeben|siege_name_eindeutig/.test(t);
                              throw e;
                  }
                  ls.set("bl-gemeldet-" + spiel, name + "|" + siege);
        }
        let meinHash = null;
        async function eigeneKennung() {
                  if (meinHash) return meinHash;
                  try {
                              const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(spielerId()));
                              meinHash = [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
                  } catch (_) { meinHash = ""; }
                  return meinHash;
        }
        // Lädt alle Einträge (mit Tore, Pokale, höchster Sieg, Serie, falls die Datenbank sie liefert). Sortiert wird je Statistik hier im Browser.
        async function laden(spiel) {
                  const basis = BL_URL.replace(/\/$/, "") + "/rest/v1/rangliste?spiel=eq." + encodeURIComponent(spiel) + "&order=siege.desc,aktualisiert.asc&limit=1000&select=";
                  let r = await fetch(basis + "name,siege,kennung,tore,pokale,hoechster_sieg,serie", { headers: headers() });
                  if (!r.ok) r = await fetch(basis + "name,siege,kennung", { headers: headers() });
                  if (!r.ok) throw new Error("laden " + r.status);
                  return r.json();
        }

   // ---------- Ranglisten je Statistik ----------
   const sieg = t => { const m = /^\s*(\d+)\s*:\s*(\d+)/.exec(t || ""); return m ? [+m[1] - +m[2], +m[1]] : [-1, -1]; };
   const KAT = [
             { id: "siege", t: "Siege", wert: e => Number(e.siege) || 0, text: v => v + (v === 1 ? " Sieg" : " Siege") },
             { id: "tore", t: "Tore", wert: e => Number(e.tore) || 0, text: v => v + (v === 1 ? " Tor" : " Tore") },
             { id: "pokale", t: "Pokale", wert: e => Number(e.pokale) || 0, text: v => v + (v === 1 ? " Pokal" : " Pokale") },
             { id: "sieg", t: "Höchster Sieg", wert: e => sieg(e.hoechster_sieg), text: (v, e) => e.hoechster_sieg ? esc(e.hoechster_sieg) : "–" },
             { id: "serie", t: "Siegesserie", wert: e => Number(e.serie) || 0, text: v => v + (v === 1 ? " Sieg" : " Siege") + " in Folge" }
   ];
   let kat = "siege";
   function rangliste(liste, id) {
             const k = KAT.find(x => x.id === id) || KAT[0];
             const vgl = (a, b) => { const x = k.wert(a), y = k.wert(b); return Array.isArray(x) ? (y[0] - x[0] || y[1] - x[1]) : y - x; };
             // ohne Wert (0 bzw. kein Sieg) nicht anzeigen, außer bei Siegen; bei Gleichstand entscheiden die Siege
             return liste.filter(e => { const v = k.wert(e); return k.id === "siege" || (Array.isArray(v) ? v[0] >= 0 : v > 0); })
                         .map((e, i) => [e, i]).sort((a, b) => vgl(a[0], b[0]) || (Number(b[0].siege) || 0) - (Number(a[0].siege) || 0) || a[1] - b[1])
                         .slice(0, 10).map(x => x[0]);
   }

   // ---------- Darstellung ----------
   const css = document.createElement("style");
        css.textContent = `
          .blbtn{border-color:rgba(255,181,71,.55)}
            .blbtn:hover{border-color:var(--coin)}
              .blmodal .sub{color:var(--dim);font-size:14px;margin-top:4px}
                .bl table{width:100%;border-collapse:collapse;font-size:15px;font-variant-numeric:tabular-nums}
                  .bl td{padding:8px 4px;border-top:1px solid var(--line)}
                    .bl tr:first-child td{border-top:0}
                      .bl td.p{width:36px;color:var(--dim);font-family:var(--mono);font-size:12px}
                        .bl td.s{text-align:right;font-weight:700}
                          .bl tr.me td{color:var(--coin)}
                            .bl .medal{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;font-size:12px;font-weight:700;color:#1b1200}
                              .bl .m1{background:#ffcf4a}.bl .m2{background:#cfd6e4}.bl .m3{background:#e0975a}
                                .bl .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:16px}
                                  .bl input{flex:1;min-width:140px;height:38px;border:1px solid var(--line);background:var(--ink);border-radius:10px;padding:0 12px;outline:none}
                                    .bl input:focus{border-color:var(--coin)}
                                      .bl .info{font-size:12px;color:var(--dim);margin-top:10px}
                                        .bl .leer{color:var(--dim);font-size:15px;padding:6px 0}
                                          .bl .err{color:var(--danger);font-size:13px;margin-top:6px}
          .bl .bltabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
          .bl .bltabs button{flex:none;height:32px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--dim);font-size:13px;font-weight:600;white-space:nowrap;cursor:pointer}
          .bl .bltabs button.on{background:var(--coin);border-color:var(--coin);color:var(--coin-ink)}
          .bl .tw{overflow-x:auto;-webkit-overflow-scrolling:touch}
          .bl table.blx{font-size:14px}
          .bl table.blx td{padding:8px 3px}
          .bl table.blx th{font-size:11px;font-family:var(--mono);text-transform:uppercase;letter-spacing:.04em;color:var(--dim);font-weight:400;text-align:right;padding:0 3px 6px;white-space:nowrap}
          .bl table.blx th.l{text-align:left}
          .bl table.blx td.n{text-align:right;white-space:nowrap;color:var(--paper)}
          .bl table.blx tr.me td.n{color:var(--coin)}
          .bl table.blx td.blnm{max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}`;
        document.head.appendChild(css);

   const ICON_X = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
        let offen = null;

   async function fuellen(box, spiel) {
             const cfg = BL_SPIELE[spiel];
             if (!ready) { box.innerHTML = `<div class="leer">Die Bestenliste wird gerade eingerichtet.</div>`; return; }
             const kennung = await eigeneKennung();
             const render = (liste, fehler, hinweis) => {
                         const name = getName();
                         const alle = liste || [];
                         const extra = alle.some(e => e && "tore" in e);
                         if (!extra) kat = "siege";
                         const tabelle = () => {
                                       const k = KAT.find(x => x.id === kat) || KAT[0];
                                       const rows = rangliste(alle, kat).map((e, i) => {
                                                       const p = i < 3 ? `<span class="medal m${i + 1}">${i + 1}</span>` : (i + 1) + ".";
                                                       const me = kennung && e.kennung === kennung ? " me" : "";
                                                       return `<tr class="${me}"><td class="p">${p}</td><td>${esc(e.name)}</td><td class="s">${k.text(k.wert(e), e)}</td></tr>`;
                                       }).join("");
                                       return rows ? `<table>${rows}</table>` : `<div class="leer">${alle.length ? "Hier hat noch niemand einen Eintrag." : "Noch keine Einträge – sei der Erste!"}</div>`;
                         };
                         const tabs = extra ? `<div class="bltabs" role="tablist">${KAT.map(k => `<button type="button" role="tab" data-blk="${k.id}" class="${k.id === kat ? "on" : ""}" aria-selected="${k.id === kat}">${k.t}</button>`).join("")}</div>` : "";
                         box.innerHTML = `
                                 ${fehler ? `<div class="err">Die Bestenliste konnte gerade nicht geladen werden. Versuch es später noch einmal.</div>` :
                                             `${tabs}<div id="blListe">${tabelle()}</div>${extra && kat === "pokale" ? `<div class="info">Pokale = gewonnene Turniere, Ligen und Weltmeisterschaften</div>` : ""}`}
                                                     <div class="row">
                                                               <input id="blName" maxlength="16" placeholder="Dein Name für die Bestenliste" value="${esc(name)}" aria-label="Dein Name für die Bestenliste">
                                                                         <button class="btn sm" id="blSave" type="button">${name ? "Namen ändern" : "Mitmachen"}</button>
                                                                                 </div>
                                                                                         <div class="err" id="blErr">${hinweis ? esc(hinweis) : ""}</div>
                                                                                                 <div class="info">Deine ${esc(cfg.titel)} (alle Geräte zusammen): <b>${eigeneSiege(cfg)}</b>. Sie werden automatisch übertragen, wenn du das Spiel schließt.</div>`;
                         const inp = box.querySelector("#blName"), btn = box.querySelector("#blSave");
                         const save = async () => {
                                       const v = inp.value.replace(/\s+/g, " ").trim();
                                       const err = box.querySelector("#blErr");
                                       if (v.length < 2) { err.textContent = "Der Name braucht mindestens 2 Zeichen."; return; }
                                       btn.disabled = true; btn.textContent = "Speichere …"; err.textContent = "";
                                       try {
                                                       await melden(spiel, v);
                                                       ls.set("bl-name", v);
                                                       render(await laden(spiel));
                                       } catch (e) {
                                                       btn.disabled = false; btn.textContent = name ? "Namen ändern" : "Mitmachen";
                                                       err.textContent = e && e.vergeben
                                                         ? "Dieser Name ist schon vergeben – bitte wähle einen anderen."
                                                                         : "Speichern hat nicht geklappt. Prüfe deine Internetverbindung und versuch es erneut.";
                                       }
                         };
                         btn.addEventListener("click", save);
                         box.querySelectorAll("[data-blk]").forEach(b => b.addEventListener("click", () => {
                                       kat = b.dataset.blk;
                                       box.querySelectorAll("[data-blk]").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); });
                                       box.querySelector("#blListe").innerHTML = tabelle();
                                       const inf = box.querySelector("#blListe").nextElementSibling;
                                       if (inf && inf.classList.contains("info") && !inf.textContent.startsWith("Deine")) inf.remove();
                                       if (kat === "pokale") box.querySelector("#blListe").insertAdjacentHTML("afterend", `<div class="info">Pokale = gewonnene Turniere, Ligen und Weltmeisterschaften</div>`);
                         }));
                         inp.addEventListener("keydown", e => { if (e.key === "Enter") save(); if (e.key !== "Escape") e.stopPropagation(); });
             };
             box.innerHTML = `<div class="leer">Lade Bestenliste …</div>`;
             let hinweis = "";
             try { await melden(spiel); } catch (e) { if (e && e.vergeben) hinweis = "Dein Name ist inzwischen vergeben – bitte wähle einen anderen."; }
             try { render(await laden(spiel), false, hinweis); } catch (_) { render(null, true, hinweis); }
   }

   function oeffnen(spiel, titel) {
             const root = document.getElementById("modalRoot");
             if (!root) return;
             const cfg = BL_SPIELE[spiel];
             root.innerHTML = `<div class="backdrop"><div class="modal small blmodal" role="dialog" aria-modal="true" aria-label="Bestenliste">
                   <div class="mhead"><div><h2>🏆 Bestenliste</h2><div class="sub">${esc(titel || "")} · weltweit</div></div>
                         <button class="x" data-blclose aria-label="Schließen">${ICON_X}</button></div>
                               <div class="scroll"><div class="mbody"><div class="bl"></div></div></div></div></div>`;
             const bd = root.firstElementChild;
             bd.addEventListener("mousedown", e => { if (e.target === bd) root.innerHTML = ""; });
             root.querySelector("[data-blclose]").addEventListener("click", () => { root.innerHTML = ""; });
             offen = spiel;
             fuellen(root.querySelector(".bl"), spiel);
   }

   function knopf(titel, spiel, klein) {
             const b = document.createElement("button");
             b.type = "button";
             b.className = "btn blbtn" + (klein ? " sm" : "");
             b.textContent = "🏆 Bestenliste";
             b.addEventListener("click", e => { e.stopPropagation(); oeffnen(spiel, titel()); });
             return b;
   }

   function heroKnopf() {
             const hero = document.getElementById("hero");
             if (!hero) return;
             const det = hero.querySelector(".acts [data-open]");
             if (!det || hero.querySelector(".blbtn")) return;
             const spiel = det.getAttribute("data-open");
             if (!BL_SPIELE[spiel]) return;
             det.after(knopf(() => (hero.querySelector("h2") || {}).textContent, spiel));
   }

   function detailKnopf() {
             const root = document.getElementById("modalRoot");
             const modal = root && root.querySelector(".modal");
             if (!modal || !modal.querySelector(".detail") || modal.querySelector(".blbtn")) return;
             const spiel = decodeURIComponent((location.hash || "").slice(1));
             if (!BL_SPIELE[spiel]) return;
             const foot = modal.querySelector(".mfoot");
             if (foot) foot.prepend(knopf(() => (modal.querySelector(".detail h2") || {}).textContent, spiel));
   }

   function start() {
             const root = document.getElementById("modalRoot");
             const player = document.getElementById("player");
             const hero = document.getElementById("hero");
             if (!root || !player) return;
             new MutationObserver(() => {
                         if (!root.querySelector(".blmodal")) offen = null;
                         detailKnopf();
             }).observe(root, { childList: true });
             if (hero) new MutationObserver(heroKnopf).observe(hero, { childList: true });
             // Nach dem Spielen Siege melden
          new MutationObserver(() => {
                      if (!player.hidden) return;
                      Object.keys(BL_SPIELE).forEach(s => melden(s).catch(() => {}).then(() => {
                                    const b = root.querySelector(".blmodal .bl");
                                    if (b && offen === s) fuellen(b, s);
                      }));
          }).observe(player, { attributes: true, attributeFilter: ["hidden"] });
             // Beim Öffnen der Website ebenfalls abgleichen
          Object.keys(BL_SPIELE).forEach(s => melden(s).catch(() => {}));
             heroKnopf(); detailKnopf();
   }
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
