// ================================================================
//  BESTENLISTE für die Spielbibliothek
//  Hier deine Supabase-Daten eintragen (Supabase > Project Settings > API):
// ================================================================
const BL_URL = "https://hibfzyxbmbspfhpughim.supabase.co";
const BL_KEY = "sb_publishable_w4PzkJlkAo5WN2PrFftWvg_iN2b_Rz0";      // der öffentliche "anon" bzw. "publishable" Key

// Welche Spiele eine Bestenliste haben und wo das Spiel seine Siege speichert:
const BL_SPIELE = {
      "fussball-3d": { speicher: "fnStats", feld: "wins", titel: "Siege" }
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
      async function laden(spiel) {
              const u = BL_URL.replace(/\/$/, "") + "/rest/v1/rangliste?select=name,siege,kennung&spiel=eq." + encodeURIComponent(spiel) +
                        "&order=siege.desc,aktualisiert.asc&limit=10";
              const r = await fetch(u, { headers: headers() });
              if (!r.ok) throw new Error("laden " + r.status);
              return r.json();
      }

   // ---------- Darstellung im Detailfenster ----------
   const css = document.createElement("style");
      css.textContent = `
        .bl{border:1px solid var(--line);border-radius:12px;background:rgba(0,0,0,.15);padding:14px}
          .bl h4{margin:0 0 10px;font-family:var(--display);font-size:17px;display:flex;align-items:center;gap:8px}
            .bl table{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}
              .bl td{padding:6px 4px;border-top:1px solid var(--line)}
                .bl tr:first-child td{border-top:0}
                  .bl td.p{width:34px;color:var(--dim);font-family:var(--mono);font-size:12px}
                    .bl td.s{text-align:right;font-weight:700}
                      .bl tr.me td{color:var(--coin)}
                        .bl .medal{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;font-size:11px;font-weight:700;color:#1b1200}
                          .bl .m1{background:#ffcf4a}.bl .m2{background:#cfd6e4}.bl .m3{background:#e0975a}
                            .bl .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px}
                              .bl input{flex:1;min-width:140px;height:36px;border:1px solid var(--line);background:var(--ink);border-radius:10px;padding:0 12px;outline:none}
                                .bl input:focus{border-color:var(--coin)}
                                  .bl .info{font-size:12px;color:var(--dim);margin-top:8px}
                                    .bl .leer{color:var(--dim);font-size:14px;padding:4px 0}
                                      .bl .err{color:var(--danger);font-size:13px;margin-top:6px}`;
      document.head.appendChild(css);

   function aktuellesSpiel() {
           const id = decodeURIComponent((location.hash || "").slice(1));
           return BL_SPIELE[id] ? id : null;
   }

   async function einbauen(modal, spiel) {
           if (modal.querySelector(".bl")) return;
           const cfg = BL_SPIELE[spiel];
           const box = document.createElement("div");
           box.className = "bl";
           const facts = modal.querySelector(".facts");
           (facts ? facts.parentNode : modal.querySelector(".mbody")).insertBefore(box, facts || null);

        if (!ready) { box.innerHTML = `<h4>🏆 Bestenliste</h4><div class="leer">Die Bestenliste wird gerade eingerichtet.</div>`; return; }

        const kennung = await eigeneKennung();
           const render = (liste, fehler, hinweis) => {
                     const name = getName();
                     const rows = (liste || []).map((e, i) => {
                                 const p = i < 3 ? `<span class="medal m${i + 1}">${i + 1}</span>` : (i + 1) + ".";
                                 const me = kennung && e.kennung === kennung ? " me" : "";
                                 return `<tr class="${me}"><td class="p">${p}</td><td>${esc(e.name)}</td><td class="s">${Number(e.siege) || 0}</td></tr>`;
                     }).join("");
                     box.innerHTML = `<h4>🏆 Bestenliste · ${esc(cfg.titel)}</h4>
                             ${fehler ? `<div class="err">Die Bestenliste konnte gerade nicht geladen werden. Versuch es später noch einmal.</div>` :
                                         rows ? `<table>${rows}</table>` : `<div class="leer">Noch keine Einträge – sei der Erste!</div>`}
                                                 <div class="row">
                                                           <input id="blName" maxlength="16" placeholder="Dein Name für die Bestenliste" value="${esc(name)}" aria-label="Dein Name für die Bestenliste">
                                                                     <button class="btn sm" id="blSave" type="button">${name ? "Namen ändern" : "Mitmachen"}</button>
                                                                             </div>
                                                                                     <div class="err" id="blErr">${hinweis ? esc(hinweis) : ""}</div>
                                                                                             <div class="info">Deine Siege auf diesem Gerät: <b>${eigeneSiege(cfg)}</b>. Sie werden automatisch übertragen, wenn du das Spiel schließt.</div>`;
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
                     inp.addEventListener("keydown", e => { if (e.key === "Enter") save(); e.stopPropagation(); });
           };
           box.innerHTML = `<h4>🏆 Bestenliste · ${esc(cfg.titel)}</h4><div class="leer">Lade Bestenliste …</div>`;
           let hinweis = "";
           try { await melden(spiel); } catch (e) { if (e && e.vergeben) hinweis = "Dein Name ist inzwischen vergeben – bitte wähle einen anderen."; }
           try { render(await laden(spiel), false, hinweis); } catch (_) { render(null, true, hinweis); }
   }

   function start() {
           const root = document.getElementById("modalRoot");
           const player = document.getElementById("player");
           if (!root || !player) return;
           new MutationObserver(() => {
                     const modal = root.querySelector(".modal");
                     const spiel = aktuellesSpiel();
                     if (modal && modal.querySelector(".detail") && spiel) einbauen(modal, spiel);
           }).observe(root, { childList: true, subtree: false });
           // Nach dem Spielen Siege melden
        let zuletzt = null;
           new MutationObserver(() => {
                     if (!player.hidden) { zuletzt = aktuellesSpiel() || zuletzt; return; }
                     const spiele = zuletzt ? [zuletzt] : Object.keys(BL_SPIELE);
                     spiele.forEach(s => melden(s).catch(() => {}).then(() => {
                                 const m = root.querySelector(".modal"), b = m && m.querySelector(".bl");
                                 if (b && aktuellesSpiel() === s) { b.remove(); einbauen(m, s); }
                     }));
           }).observe(player, { attributes: true, attributeFilter: ["hidden"] });
           // Beim Öffnen der Website ebenfalls abgleichen
        Object.keys(BL_SPIELE).forEach(s => melden(s).catch(() => {}));
           const modal = root.querySelector(".modal"), spiel = aktuellesSpiel();
           if (modal && spiel) einbauen(modal, spiel);
   }
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
