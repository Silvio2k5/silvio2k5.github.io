// Spielbibliothek als App: Manifest, App-Symbol, Service Worker und "App installieren"-Button.
(() => {
  const head = document.head;
  const add = (tag, attrs) => { const el = document.createElement(tag); for (const k in attrs) el.setAttribute(k, attrs[k]); head.appendChild(el); };
  add('link', { rel: 'manifest', href: '/manifest.webmanifest' });
  add('link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' });
  add('meta', { name: 'theme-color', content: '#141327' });
  add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'apple-mobile-web-app-title', content: 'Spiele' });
  add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' });

  if ('serviceWorker' in navigator) {
    addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }

  // Handy: Spiel ohne Website-Leiste (und auf Android im echten Vollbild); das Vollbild-Symbol im Spiel schaltet um
  const touch = matchMedia('(pointer:coarse)').matches;
  const immCss = document.createElement('style');
  immCss.textContent = '#player.imm .pbar{display:none}#player.imm{background:#000}';
  head.appendChild(immCss);
  const player = document.getElementById('player');
  let fsByUs = false;
  function setImm(on) {
    if (!player) return;
    player.classList.toggle('imm', on);
    try {
      if (on && !document.fullscreenElement && player.requestFullscreen) { fsByUs = true; player.requestFullscreen().catch(() => { fsByUs = false; }); }
      else if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (_) {}
  }
  if (player) {
    new MutationObserver(() => { if (player.hidden) { player.classList.remove('imm'); fsByUs = false; } else if (touch) setImm(true); })
      .observe(player, { attributes: true, attributeFilter: ['hidden'] });
  }
  addEventListener('message', e => {
    if (e.origin !== location.origin || !e.data || e.data.fb !== 'imm' || !player || player.hidden) return;
    setImm(!player.classList.contains('imm'));
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && fsByUs) { fsByUs = false; if (player) player.classList.remove('imm'); }
  });

  // Abzeichen für Spiele mit Online-Multiplayer und Crossplay (PC & Handy)
  const ONLINE_SPIELE = ['fussball-3d', 'basketball-3d', 'handball-3d', 'volleyball-3d', 'tennis-3d'];
  const badgeCss = document.createElement('style');
  badgeCss.textContent = '.xbadge{display:inline-flex;align-items:center;gap:5px;align-self:flex-start;font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#7fe0a0;border:1px solid rgba(127,224,160,.45);border-radius:99px;padding:2px 9px;white-space:nowrap}';
  head.appendChild(badgeCss);
  const xBadge = () => { const s = document.createElement('span'); s.className = 'xbadge'; s.textContent = '🌐 Online · Crossplay PC & Handy'; s.title = 'Online 1 gegen 1 – PC und Handy können gegeneinander spielen'; return s; };
  function badges() {
    for (const id of ONLINE_SPIELE) {
      document.querySelectorAll('.card[data-open="' + id + '"] .cbody').forEach(b => {
        if (b.querySelector('.xbadge')) return;
        const t = b.querySelector('.tag'); if (t) t.after(xBadge()); else b.prepend(xBadge());
      });
      const hero = document.querySelector('.hero');
      if (hero && hero.querySelector('[data-open="' + id + '"]')) { const m = hero.querySelector('.metarow'); if (m && !m.querySelector('.xbadge')) m.appendChild(xBadge()); }
      const det = document.querySelector('#modalRoot .detail');
      if (det && decodeURIComponent((location.hash || '').slice(1)) === id) { const d = det.querySelector('.dtitle > div'); if (d && !d.querySelector('.xbadge')) d.appendChild(xBadge()); }
    }
  }
  new MutationObserver(badges).observe(document.body, { childList: true, subtree: true });
  badges();

  // Aufrufe pro Spiel: wird beim Spielstart gezählt (pro Gerät höchstens alle 30 Minuten) und mit Augensymbol angezeigt
  const SB_URL = 'https://hibfzyxbmbspfhpughim.supabase.co', SB_KEY = 'sb_publishable_w4PzkJlkAo5WN2PrFftWvg_iN2b_Rz0';
  const views = {};
  window.SB_VIEWS = views;
  const viewCss = document.createElement('style');
  viewCss.textContent = '.vcount{display:inline-flex;align-items:center;gap:5px;color:var(--dim);font-size:13px;font-variant-numeric:tabular-nums;white-space:nowrap}.vcount svg{flex:none;opacity:.85}.cbody .vcount{margin-top:auto;padding-top:4px}';
  head.appendChild(viewCss);
  const EYE = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const viewText = id => { const n = views[id] || 0; return n.toLocaleString('de-DE') + (n === 1 ? ' Aufruf' : ' Aufrufe'); };
  function viewEl(id, tag) {
    const e = document.createElement(tag || 'span'); e.className = 'vcount'; e.dataset.vid = id;
    e.innerHTML = EYE + '<span></span>'; e.lastChild.textContent = viewText(id); return e;
  }
  function showViews() {
    document.querySelectorAll('.card[data-open]').forEach(c => {
      const id = c.dataset.open, b = c.querySelector('.cbody');
      if (b && !b.querySelector('.vcount')) b.appendChild(viewEl(id));
    });
    const hero = document.querySelector('.hero'), hid = hero && hero.querySelector('[data-open]');
    if (hid) { const m = hero.querySelector('.metarow'); if (m && !m.querySelector('.vcount')) m.appendChild(viewEl(hid.dataset.open)); }
    const det = document.querySelector('#modalRoot .detail'), did = decodeURIComponent((location.hash || '').slice(1));
    if (det && did) { const f = det.querySelector('.facts'); if (f && !f.querySelector('.vcount')) f.prepend(viewEl(did)); }
    document.querySelectorAll('.vcount[data-vid]').forEach(e => { const t = viewText(e.dataset.vid); if (e.lastChild.textContent !== t) e.lastChild.textContent = t; });
  }
  async function loadViews() {
    try {
      const r = await fetch(SB_URL + '/rest/v1/aufrufe?select=spiel,anzahl', { headers: { apikey: SB_KEY } });
      if (!r.ok) return;
      for (const x of await r.json()) views[x.spiel] = Number(x.anzahl) || 0;
      showViews();
      const so = document.getElementById('sort'); if (so && so.value === 'pop') so.dispatchEvent(new Event('change'));
    } catch (_) {}
  }
  async function countView(id) {
    if (!/^[a-z0-9-]{1,40}$/.test(id || '')) return;
    let last = 0; try { last = +localStorage.getItem('sb-aufruf-' + id) || 0; } catch (_) {}
    if (Date.now() - last < 30 * 60 * 1000) return;
    try { localStorage.setItem('sb-aufruf-' + id, String(Date.now())); } catch (_) {}
    try {
      const r = await fetch(SB_URL + '/rest/v1/rpc/zaehle_aufruf', { method: 'POST', headers: { apikey: SB_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_spiel: id }) });
      if (r.ok) { views[id] = Number(await r.json()) || views[id] || 0; showViews(); }
    } catch (_) {}
  }
  document.addEventListener('click', e => {
    const p = e.target.closest && e.target.closest('[data-play]');
    if (p) { countView(p.dataset.play); return; }
    if (e.target.closest && e.target.closest('[data-dplay]')) countView(decodeURIComponent((location.hash || '').slice(1)));
  }, true);
  new MutationObserver(showViews).observe(document.body, { childList: true, subtree: true });
  showViews(); loadViews();

  const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  if (standalone()) return;

  const css = document.createElement('style');
  css.textContent = `
  #installBtn{flex:none}
  .ins-steps{margin:0;padding-left:22px;display:flex;flex-direction:column;gap:10px}
  .ins-steps b{color:var(--coin)}
  .ins-ic{display:inline-flex;vertical-align:-3px;margin:0 2px}
  .ins-head{display:flex;gap:14px;align-items:center}
  .ins-head img{width:56px;height:56px;border-radius:13px;flex:none}
  .ins-head p{margin:0;color:var(--dim);font-size:14px}
  @media (max-width:520px){#installBtn .lbl{display:none}#installBtn{width:40px;padding:0}}`;
  head.appendChild(css);

  const btn = document.createElement('button');
  btn.id = 'installBtn';
  btn.className = 'btn primary';
  btn.title = 'Als App installieren';
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></svg><span class="lbl">App installieren</span>';
  const top = document.querySelector('.topin');
  if (top) top.appendChild(btn);

  let deferred = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });
  addEventListener('appinstalled', () => { deferred = null; btn.remove(); closeIns(); });

  const ua = navigator.userAgent;
  const iOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const SHARE = '<span class="ins-ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg></span>';

  function steps() {
    if (iOS) return `<ol class="ins-steps">
      <li>Öffne diese Seite in <b>Safari</b>.</li>
      <li>Tippe unten (oder oben) auf <b>Teilen</b> ${SHARE}. Falls du es nicht siehst, tippe zuerst auf <b>•••</b>.</li>
      <li>Wähle <b>Zum Home-Bildschirm</b> und tippe auf <b>Hinzufügen</b>.</li>
      <li>Starte die Spielbibliothek ab jetzt über das neue Symbol – ohne Safari-Leisten.</li></ol>`;
    if (android) return `<ol class="ins-steps">
      <li>Tippe in Chrome oben rechts auf <b>⋮</b>.</li>
      <li>Wähle <b>App installieren</b> oder <b>Zum Startbildschirm hinzufügen</b>.</li>
      <li>Bestätige mit <b>Installieren</b>.</li></ol>`;
    return `<ol class="ins-steps">
      <li>Nutze <b>Chrome</b> oder <b>Edge</b>.</li>
      <li>Klicke rechts in der Adressleiste auf das Installations-Symbol oder im Menü auf <b>App installieren</b>.</li></ol>`;
  }
  function closeIns() { const r = document.getElementById('modalRoot'); if (r && r.querySelector('.ins-modal')) r.innerHTML = ''; }
  function showIns() {
    const root = document.getElementById('modalRoot'); if (!root) return;
    root.innerHTML = `<div class="backdrop"><div class="modal small ins-modal" role="dialog" aria-modal="true">
      <div class="mhead"><h2>App installieren</h2><button class="x" data-insx aria-label="Schließen"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="mbody"><div class="ins-head"><img src="/apple-touch-icon.png" alt=""><p>Mit der App startest du deine Spiele direkt vom Home-Bildschirm, im Vollbild und ohne Browserleisten.</p></div>${steps()}</div>
      <div class="mfoot"><button class="btn primary" data-insx>Verstanden</button></div></div></div>`;
    const bd = root.firstElementChild;
    bd.addEventListener('mousedown', e => { if (e.target === bd) closeIns(); });
    root.querySelectorAll('[data-insx]').forEach(b => b.addEventListener('click', closeIns));
  }
  btn.addEventListener('click', async () => {
    if (deferred) {
      const p = deferred; deferred = null;
      p.prompt();
      try { const r = await p.userChoice; if (r && r.outcome === 'accepted') btn.remove(); } catch (_) {}
      return;
    }
    showIns();
  });
})();
