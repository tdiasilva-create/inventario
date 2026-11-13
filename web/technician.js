// SEMED Técnico — frontend do app do técnico (WebView Android e navegador).
// Mesmas APIs (/api/auth/*, /api/technician/*) e mesma ponte SemedNative do APK 1.0.0.
// Regras do servidor não mudam aqui: este arquivo só apresenta, confirma e repete comandos.

const $ = (s, root = document) => root.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name, cls = '') => `<svg aria-hidden="true"${cls ? ` class="${cls}"` : ''}><use href="#i-${name}"/></svg>`;
const native = () => window.SemedNative;
const fmtTime = ms => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const fmtDate = ms => new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const CONFIRMED = { accept: 'Atendimento iniciado.', complete: 'Demanda concluída.', note: 'Observação registrada.', blocked: 'Impedimento registrado.', pause: 'Atendimento pausado. Para retomar, aceite de novo.' };
const LABELS = {
 accept: 'Aceitar e iniciar', complete: 'Concluir atendimento', team: 'Concluir pela equipe',
 note: 'Observação', blocked: 'Impedimento', pause: 'Pausar', route: 'Traçar rota'
};

let user = null, data = null, items = [], mode = 'queue';
let busy = false, loading = false, watch = null, attendance = null, pending = null, timer = null, positionSending = false, nativeLocation = null;
let lastUpdated = null, bannerHoldUntil = 0, agoraId = null, agoraSig = '', notifiedThrough = null;
const expanded = new Set();   // cartões abertos na sequência
const ops = new Map();        // id da demanda -> {action, phase, message, retry}
const pages = new Map(), drafts = new Map();
let extrasStale = false, readEpoch = 0, readController = new AbortController(), accountId = null;
function invalidateReads() { readEpoch++; readController.abort(); readController = new AbortController(); loading = false; }
function currentRead(epoch, view = mode) { return epoch === readEpoch && view === mode && !!user; }
function rebuildPages() {
 const ordered = [...pages.values()].sort((a, b) => a.offset - b.offset), seen = new Set();
 items = ordered.flatMap(page => page.items.map(r => ({ ...r, stale: extrasStale && page.offset > 0 }))).filter(r => !seen.has(r.id) && seen.add(r.id));
 data = { ...ordered[0], nextOffset: ordered.at(-1)?.nextOffset ?? null };
}

/* ---------------------------------------------------------------- rede */
async function api(path, payload, signal) {
 let r;
 try {
  r = await fetch(path, {
   method: payload ? 'POST' : 'GET',
   headers: payload ? { 'Content-Type': 'application/json', 'X-CSRF-Token': user?.csrf || '' } : {},
   body: payload ? JSON.stringify(payload) : undefined,
   signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000)
  });
 } catch (e) {
  throw Error(e.name === 'TimeoutError' || e.name === 'AbortError' ? 'O servidor não respondeu a tempo.' : 'Sem conexão com o servidor.');
 }
 const v = await r.json().catch(() => { throw Error('Resposta inválida do servidor.'); });
 if (!r.ok) { const e = Error(v.error || 'Não foi possível comunicar com o servidor.'); e.status = r.status; throw e; }
 if (payload && v.ok === false) throw Error(v.error || 'O servidor não confirmou a operação.');
 return v;
}

/* ---------------------------------------------------------------- faixa de estado (#status) */
function banner(text, kind = '', { hold = 0 } = {}) {
 const el = $('#status');
 el.className = kind;
 const ic = kind === 'error' ? icon('alert') : kind === 'ok' ? icon('check') : kind === 'wait' ? '<span class="spinner dark" aria-hidden="true"></span>' : '';
 el.innerHTML = text ? `${ic}<span>${esc(text)}</span>` : '';
 bannerHoldUntil = hold ? Date.now() + hold : 0;
}
function bannerUpdated() {
 $('#updated').textContent = lastUpdated ? 'Atualizado às ' + fmtTime(lastUpdated) : '';
 if (Date.now() < bannerHoldUntil) return;
 banner('');
}

/* ---------------------------------------------------------------- localização */
function stop() {
 if (watch !== null) { navigator.geolocation.clearWatch(watch); watch = null; }
 native()?.stopTracking();
 attendance = null;
}
window.semedReceiveLocation = value => {
 if (!nativeLocation) return;
 const p = nativeLocation; nativeLocation = null;
 if (value.error) p.reject(Error(value.error)); else p.resolve(value);
};
function locate() {
 if (native()) return new Promise((resolve, reject) => {
  const request = { resolve, reject }; nativeLocation = request;
  native().requestLocation();
  setTimeout(() => { if (nativeLocation === request) { nativeLocation = null; reject(Error('Localização indisponível. Confira a permissão e tente novamente.')); } }, 25000);
 });
 return new Promise((resolve, reject) => {
  if (!navigator.geolocation) { reject(Error('Este navegador não oferece localização.')); return; }
  navigator.geolocation.getCurrentPosition(
   p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy, observedAt: p.timestamp }),
   e => reject(Error(e.code === 1 ? 'Permita a localização para aceitar e iniciar.' : 'Não foi possível obter a localização. Confira o GPS e tente novamente.')),
   { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
 });
}
async function tracking(epoch = readEpoch) {
 try {
  const { attendance: a } = await api('/api/technician/active', undefined, readController.signal);
  if (!currentRead(epoch)) return;
  if (!a) { stop(); return; }
  if (attendance === a.id) { if (native()) native().startTracking(a.id, user.csrf); return; }
  stop(); attendance = a.id;
  if (native()) { native().startTracking(a.id, user.csrf); return; }
  watch = navigator.geolocation.watchPosition(async p => {
   if (!attendance || positionSending) return;
   positionSending = true;
   try {
    await api('/api/technician/position', { attendanceId: attendance, position: { latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy, observedAt: p.timestamp } });
   } catch (e) {
    banner('Localização não atualizada: ' + e.message, 'error', { hold: 8000 });
    if ([401, 403, 409].includes(e.status)) stop();
   } finally { positionSending = false; }
  }, () => banner('Localização indisponível. Confira a permissão. O painel não mostrará uma posição antiga como atual.', 'error', { hold: 8000 }),
  { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
 } catch (e) { if (currentRead(epoch)) { stop(); banner(e.message, 'error', { hold: 8000 }); } }
}

/* ---------------------------------------------------------------- diálogo (folha inferior) */
// Fica aberto até o servidor confirmar: sucesso fecha; falha mostra o erro e conserva o texto.
function sheet({ title, body = '', note = false, confirmLabel = 'Confirmar', danger = false, draftKey = '', run }) {
 return new Promise(resolve => {
  const d = document.createElement('dialog');
  d.setAttribute('aria-labelledby', 'sheet-title');
  d.innerHTML = `<div class="sheet-top"></div><div class="sheet"><h2 id="sheet-title">${esc(title)}</h2>${body}` +
   (note ? `<label class="field"><span>Descreva o que aconteceu</span><textarea name="note" maxlength="2000" rows="4" required></textarea><small class="counter"><span data-count>0</span> / 2000</small></label>` : '') +
   `<div class="feedback error" data-feedback hidden></div><div class="sheet-actions"><button type="button" class="secondary-wide" data-cancel>Cancelar</button><button type="button" class="primary${danger ? ' danger' : ''}" data-ok>${esc(confirmLabel)}</button></div></div>`;
  document.body.append(d);
  const ok = $('[data-ok]', d), cancel = $('[data-cancel]', d), fb = $('[data-feedback]', d), ta = $('textarea', d);
  const opener = document.activeElement;
  let running = false;
  if (ta) {
   ta.value = pending?.payload.note ?? drafts.get(draftKey) ?? '';
   ta.readOnly = !!pending;
   $('[data-count]', d).textContent = ta.value.length;
   ta.addEventListener('input', () => { drafts.set(draftKey, ta.value); $('[data-count]', d).textContent = ta.value.length; });
  }
  const setBusy = (on, label) => {
   running = on; ok.disabled = on; cancel.disabled = on;
   if (ta) ta.readOnly = on || !!pending;
   ok.innerHTML = on ? `<span class="spinner" aria-hidden="true"></span>${esc(label || 'Enviando…')}` : esc(confirmLabel);
   ok.classList.toggle('is-sending', on);
  };
  const fail = (message, retry) => {
   fb.hidden = false;
   fb.innerHTML = `${icon('alert')}<span class="msg">${esc(message)}</span>`;
   confirmLabel = retry ? 'Reenviar' : 'Tentar novamente';
   setBusy(false);
   ok.focus();
  };
  cancel.onclick = () => { if (!running) d.close(); };
  d.addEventListener('cancel', e => { if (running) e.preventDefault(); });
  ok.onclick = async () => {
   if (running) return;
   const text = ta ? ta.value.trim() : '';
   if (note && !text) { fail('Descreva a observação ou impedimento.'); ta.focus(); return; }
   fb.hidden = true;
   setBusy(true, 'Enviando…');
   try { await run(text, label => setBusy(true, label)); drafts.delete(draftKey); d.close('ok'); }
   catch (e) { fail(e.message, !!pending); }
  };
  d.onclose = () => { d.remove(); resolve(d.returnValue === 'ok'); if (opener && document.contains(opener)) opener.focus(); };
  d.semedClose = () => { if (!running) d.close(); };
  d.showModal();
  if (ta) ta.focus();
 });
}

/* ---------------------------------------------------------------- modelo de apresentação */
function ownAssignment(r) { return r.assignments.find(a => a.userId === user.id); }
function colleagueActive(r) { return r.assignments.find(a => a.userId !== user.id && a.accepted); }
function routeUrl(r) {
 return typeof r.latitude === 'number' && typeof r.longitude === 'number'
  ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(r.latitude + ',' + r.longitude) + '&travelmode=driving' : null;
}
function chip(r, own) {
 if (r.status === 'Concluída') return `<span class="chip done">Concluída</span>`;
 if (own?.accepted) return `<span class="chip live">Em atendimento</span>`;
 if (r.status === 'Aberta') return `<span class="chip neutral">Aberta</span>`;
 return `<span class="chip">${esc(r.status)}</span>`;
}
function signature(r, i) {
 const own = ownAssignment(r), op = ops.get(r.id);
 return JSON.stringify([i, r.version, r.status, r.updated_at, r.current_unit_name, r.description, r.latitude, r.longitude,
  r.assignments.map(a => [a.userId, a.accepted, a.name]), !!own?.accepted, op && [op.action, op.phase, op.message], !!native(), mode, busy, r.stale]);
}

function facts(r, extra = '', extraIcon = 'hash') {
 const eq = [r.context?.hostname, r.context?.environment, r.context?.position].filter(Boolean).join(' · ');
 const team = r.assignments.map(a => a.name).join(', ');
 const colleague = colleagueActive(r);
 return `<ul class="facts">` +
  (extra ? `<li>${icon(extraIcon)}<span>${extra}</span></li>` : '') +
  (eq ? `<li>${icon('monitor')}<span>${esc(eq)}</span></li>` : '') +
  (team ? `<li>${icon('users')}<span>Equipe: ${esc(team)}</span></li>` : '') +
  (colleague && r.status !== 'Concluída' ? `<li class="colleague">${icon('locate')}<span>Em atendimento por ${esc(colleague.name)}</span></li>` : '') +
  `</ul>`;
}
function feedback(r) {
 const op = ops.get(r.id);
 if (!op || !['failed', 'confirmed'].includes(op.phase)) return '';
 if (op.phase === 'confirmed' && op.action === 'accept' && ownAssignment(r)?.accepted) return ''; // a linha de localização já diz isso
 if (op.phase === 'confirmed') return `<div class="feedback ok">${icon('check')}<span class="msg">${esc(CONFIRMED[op.action] || 'Ação confirmada pelo servidor.')}</span></div>`;
 return `<div class="feedback error" role="alert">${icon('alert')}<span class="msg">${esc(op.message)}</span><span class="actions">` +
  (op.retry ? `<button type="button" class="link-button" data-action="retry">Reenviar</button>` : '') +
  `<button type="button" class="link-button" data-action="dismiss">Fechar</button></span></div>`;
}
function primaryButton(action, label, r) {
 const op = ops.get(r.id), sending = op && ['sending', 'locating'].includes(op.phase) && op.action === action;
 const text = sending ? (op.phase === 'locating' ? 'Obtendo localização…' : 'Enviando…') : label;
 return `<button type="button" class="primary${sending ? ' is-' + op.phase : ''}" data-action="${action}"${busy ? ' disabled' : ''}>` +
  (sending ? '<span class="spinner" aria-hidden="true"></span>' : '') + `${esc(text)}</button>`;
}
function secondaryRow(r, own) {
 const route = routeUrl(r), op = ops.get(r.id), pausing = op && op.action === 'pause' && op.phase === 'sending';
 const dis = busy ? ' disabled' : '';
 return `<div class="secondary-row${own?.accepted ? ' four' : ''}">` +
  (route ? `<a class="action" href="${route}" target="_blank" rel="noopener">${icon('route')}<span>Rota</span></a>` : `<button type="button" class="action" aria-disabled="true" title="Unidade sem coordenadas cadastradas">${icon('route')}<span>Rota</span></button>`) +
  `<button type="button" class="action" data-action="note"${dis}>${icon('note')}<span>${LABELS.note}</span></button>` +
  `<button type="button" class="action" data-action="blocked"${dis}>${icon('blocked')}<span>${LABELS.blocked}</span></button>` +
  (own?.accepted ? `<button type="button" class="action" data-action="pause"${dis}>${pausing ? '<span class="spinner dark" aria-hidden="true"></span>' : icon('pause')}<span>${pausing ? 'Pausando…' : LABELS.pause}</span></button>` : '') +
  `</div>`;
}
function actionsBlock(r) {
 const own = ownAssignment(r), colleague = colleagueActive(r);
 if (r.status === 'Concluída') return '';
 let html = feedback(r) + secondaryRow(r, own);
 if (own?.accepted) html += primaryButton('complete', LABELS.complete, r);
 else {
  html += primaryButton('accept', LABELS.accept, r);
  if (colleague) html += `<button type="button" class="secondary-wide" data-action="complete"${busy ? ' disabled' : ''}>${icon('check')}${LABELS.team}</button>`;
 }
 if (!routeUrl(r)) html += `<p class="note">Unidade sem coordenadas cadastradas. Não é possível traçar rota.</p>`;
 return html;
}
function tracked(r, own) {
 if (!own?.accepted) return '';
 const op = ops.get(r.id), started = op && op.phase === 'confirmed' && op.action === 'accept';
 return `<div class="tracking"><span class="dot" aria-hidden="true"></span><div>${started ? 'Atendimento iniciado · acompanhamento solicitado.' : 'Atendimento em andamento.'}<small>${native() ? 'Mantenha a localização permitida. Confira a notificação de acompanhamento do Android.' : 'Mantenha esta página aberta e a localização permitida.'}</small></div></div>`;
}

/* ---------------------------------------------------------------- cartões */
function agoraCard(r, position) {
 const own = ownAssignment(r), active = !!own?.accepted;
 const long = (r.description || '').length > 160;
 return `<article class="task agora${active ? ' active' : ''}" data-id="${r.id}">` +
  `<div class="task-head"><span class="tile" aria-label="Posição ${position}">${String(position).padStart(2, '0')}</span><span class="band-label">${active ? 'Agora' : 'Próxima parada'}</span>${chip(r, own)}</div>` +
  `<h3 class="task-unit">${esc(r.current_unit_name || r.context?.unit_name)}</h3>` +
  `<p class="task-desc${long ? ' is-clamped' : ''}" data-desc>${esc(r.description)}</p>` +
  (long ? `<button type="button" class="link-button" data-action="more-text" aria-expanded="false">Ver tudo</button>` : '') +
  facts(r, `Demanda #${esc(r.number)}`) + tracked(r, own) + actionsBlock(r) + `</article>`;
}
function rowCard(r, position) {
 const own = ownAssignment(r), done = r.status === 'Concluída', open = expanded.has(r.id);
 return `<article class="task row${done ? ' done' : ''}${own?.accepted ? ' active' : ''}${open ? ' is-open' : ''}" data-id="${r.id}">` +
  `<button type="button" class="row-head" data-action="toggle" aria-expanded="${open}">` +
  `<span class="tile" aria-hidden="true">${done ? icon('check') : String(position).padStart(2, '0')}</span>` +
  `<span class="row-text"><span class="row-unit">${esc(r.current_unit_name || r.context?.unit_name)}</span><span class="row-line">${chip(r, own)}<span class="row-desc">${esc(r.description)}</span></span></span>` +
  `${icon('chevron', 'chevron')}<span class="sr-only">Demanda #${esc(r.number)}</span></button>` +
  `<div class="row-body"${open ? '' : ' inert'}><div class="row-body-inner"><div class="row-body-content">` +
  `<p class="task-desc">${esc(r.description)}</p>` + facts(r, done ? `Demanda #${esc(r.number)} · concluída em ${fmtDate(r.updated_at)}` : `Demanda #${esc(r.number)}`, done ? 'calendar' : 'hash') + actionsBlock(r) +
  `</div></div></div></article>`;
}
function noticeCard(n) {
 const linked = n.request_id;
 return `<article class="notice${n.read_at ? '' : ' unread'}" data-id="${n.id}"><span class="notice-mark" aria-hidden="true"></span><div class="notice-body">` +
  `<p class="notice-msg">${n.read_at ? '' : '<span class="sr-only">Não lido. </span>'}${esc(n.message)}</p><time datetime="${new Date(n.created_at).toISOString()}">${fmtDate(n.created_at)}</time>` +
  (linked ? `<button type="button" class="link-button" data-goto="${n.request_id}">Ver demanda</button>` : '') + `</div></article>`;
}

/* ---------------------------------------------------------------- render (sem substituir #app inteiro) */
function shell() {
 $('#app').className = '';
 $('#app').innerHTML = `<div id="pending-command" hidden role="status"></div><div id="extra-pages" hidden role="status"></div><section class="region" id="agora" hidden></section><section class="region" id="list"><h2 class="region-title" id="list-title"></h2><div id="rows"></div><div class="more" id="more"></div></section><p class="download" id="download" hidden><a href="/tecnico/SEMED-Tecnico.apk" download>Baixar aplicativo Android</a></p>`;
 $('#tabs').hidden = false; $('#logout').hidden = false; $('#refresh').hidden = false;
}
let tabsSig = '';
function renderTabs() {
 const unread = data?.unread || 0, queued = mode === 'queue' ? items.length : null;
 const sig = JSON.stringify([mode, unread, queued]); if (sig === tabsSig) return; tabsSig = sig;
 $('#tabs').innerHTML =
  `<button type="button" class="tab" data-mode="queue" aria-pressed="${mode === 'queue'}" aria-label="Fila${queued !== null ? `, ${queued} ${queued === 1 ? 'demanda' : 'demandas'}` : ''}">${icon('list')}<span>Fila</span>${queued ? `<span class="badge quiet" aria-hidden="true">${queued}</span>` : ''}</button>` +
  `<button type="button" class="tab" data-mode="history" aria-pressed="${mode === 'history'}">${icon('done')}<span>Concluídos</span></button>` +
  `<button type="button" class="tab" data-mode="notices" aria-pressed="${mode === 'notices'}" aria-label="Avisos${unread ? `, ${unread} não ${unread === 1 ? 'lido' : 'lidos'}` : ''}">${icon('bell')}<span>Avisos</span>${unread ? `<span class="badge" aria-hidden="true">${unread > 99 ? '99+' : unread}</span>` : ''}</button>`;
}
function reconcile(container, entries) {
 // entries: [{key, sig, html}] — só troca o que mudou; preserva ordem, foco, rolagem e cartões abertos.
 const focused = document.activeElement, focusKey = focused?.closest('[data-id]')?.dataset.id, focusAction = focused?.dataset.action;
 const existing = new Map([...container.children].map(el => [el.dataset.id, el]));
 if (!entries.length) { container.innerHTML = ''; return; }
 if (!existing.size) container.innerHTML = '';
 let cursor = container.firstElementChild;
 for (const e of entries) {
  let el = existing.get(e.key);
  existing.delete(e.key);
  if (!el || el.dataset.sig !== e.sig) {
   const tpl = document.createElement('template'); tpl.innerHTML = e.html;
   const fresh = tpl.content.firstElementChild; fresh.dataset.sig = e.sig;
   if (el) { el.replaceWith(fresh); if (cursor === el) cursor = fresh; }
   el = fresh;
   if (focusKey === e.key && focusAction) el.querySelector(`[data-action="${focusAction}"]`)?.focus();
  }
  if (el.parentNode !== container || el !== cursor) container.insertBefore(el, cursor); // novo ou fora de ordem
  else cursor = cursor.nextElementSibling;                                              // já no lugar
 }
 for (const el of existing.values()) el.remove();
}
function render() {
 if (!$('#agora')) return;
 renderTabs();
 const unresolved = $('#pending-command'); unresolved.hidden = !pending;
 unresolved.innerHTML = pending ? `<p>Há um envio sem confirmação. Confira a mesma ação antes de iniciar outra.</p><button type="button" class="secondary-wide" data-pending>Conferir envio pendente</button>` : '';
 const extra = $('#extra-pages'); extra.hidden = !extrasStale;
 extra.innerHTML = extrasStale ? `<p>Páginas extras preservadas. Somente a primeira página foi atualizada; os itens adicionais podem ter mudado.</p><button type="button" class="secondary-wide" data-refresh-all>Atualizar páginas carregadas</button>` : '';
 const agora = $('#agora'), title = $('#list-title'), rows = $('#rows'), more = $('#more');
 $('#download').hidden = !!native() || mode !== 'queue';
 title.hidden = false;
 if (mode === 'notices') {
  agora.hidden = true; agoraId = null; agoraSig = '';
  const list = data?.notifications || [];
  title.innerHTML = `<b>Avisos</b><span class="count">${list.length ? `${list.length} recentes` : ''}</span>`;
  if (!list.length) { rows.innerHTML = `<div class="empty">${icon('bell')}<strong>Nenhum aviso.</strong><span>Avisos de atribuição e organização da fila aparecem aqui.</span></div>`; }
  else reconcile(rows, list.map(n => ({ key: String(n.id), sig: JSON.stringify([n.read_at, n.message, items.some(r => r.id === n.request_id)]), html: noticeCard(n) })));
  more.innerHTML = ''; return;
 }
 if (mode === 'history') {
  agora.hidden = true; agoraId = null; agoraSig = '';
  title.innerHTML = `<b>Concluídos</b><span class="count">${items.length ? `${data?.total ?? items.length} ${(data?.total ?? items.length) === 1 ? 'concluída' : 'concluídas'}` : ''}</span>`;
  if (!items.length) rows.innerHTML = `<div class="empty">${icon('done')}<strong>Nenhuma demanda nesta lista.</strong><span>As demandas que você ou a equipe concluírem ficam aqui enquanto estiverem atribuídas a você.</span></div>`;
  else reconcile(rows, items.map((r, i) => ({ key: r.id, sig: signature(r, i) + (expanded.has(r.id) ? 'o' : 'c'), html: rowCard(r, i + 1) })));
 } else {
  const first = items.find(r => ownAssignment(r)?.accepted) || items.find(r => r.status !== 'Concluída') || null;
  const rest = items.filter(r => r !== first);
  if (first) {
   const i = items.indexOf(first), sig = signature(first, i) + ((first.description || '').length > 160 && expanded.has('desc:' + first.id) ? 'd' : '');
   agora.hidden = false;
   const own = ownAssignment(first);
   if (first.id !== agoraId || sig !== agoraSig) {
    const focusAction = agora.contains(document.activeElement) ? document.activeElement.dataset.action : null;
    const changedItem = first.id !== agoraId;
    agora.innerHTML = `<h2 class="sr-only">${own?.accepted ? 'Agora, em atendimento' : 'Próxima parada'}</h2>` + agoraCard(first, i + 1);
    if (expanded.has('desc:' + first.id)) { const d = $('[data-desc]', agora); d?.classList.remove('is-clamped'); const b = $('[data-action="more-text"]', agora); if (b) { b.textContent = 'Ver menos'; b.setAttribute('aria-expanded', 'true'); } }
    if (changedItem && agoraId) { const card = $('.task', agora); card.classList.add('is-new'); card.addEventListener('animationend', () => card.classList.remove('is-new'), { once: true }); }
    agoraId = first.id; agoraSig = sig;
    if (focusAction) agora.querySelector(`[data-action="${focusAction}"]`)?.focus();
   }
  } else {
   agora.hidden = false; agoraId = null; agoraSig = '';
   agora.innerHTML = `<div class="empty">${icon('pin')}<strong>Nenhuma demanda nesta lista.</strong><span>Quando a coordenação atribuir um atendimento a você, ele aparece aqui na ordem definida.</span><button type="button" class="secondary-wide" data-refresh>${icon('refresh')}Atualizar agora</button></div>`;
  }
  title.innerHTML = `<b>Na sequência</b><span class="count">${rest.length ? `${rest.length} ${rest.length === 1 ? 'demanda' : 'demandas'}` : ''}</span>`;
  title.hidden = !rest.length;
  reconcile(rows, rest.map(r => { const i = items.indexOf(r); return { key: r.id, sig: signature(r, i) + (expanded.has(r.id) ? 'o' : 'c'), html: rowCard(r, i + 1) }; }));
 }
 more.innerHTML = data && data.nextOffset !== null ? `<button type="button" class="secondary-wide" data-more${extrasStale ? ' disabled' : ''}>Mostrar mais</button>` : '';
}

/* ---------------------------------------------------------------- leitura */
async function refresh(more = false, allPages = false, force = false) {
 if (!user || busy || loading || (!force && $('dialog[open]'))) return;
 const epoch = readEpoch, view = mode, signal = readController.signal;
 loading = true; $('#refresh').classList.add('is-spinning');
 try {
  if (view === 'notices') {
   const notices = await api('/api/technician/notifications', undefined, signal);
   if (!currentRead(epoch, view)) return;
   data = notices; lastUpdated = Date.now();
  } else {
   const offset = more ? data?.nextOffset : 0;
   if (offset == null) return;
   const readPage = n => api('/api/technician/queue?' + new URLSearchParams({ history: view === 'history' ? '1' : '0', offset: n }), undefined, signal);
   const page = await readPage(offset);
   if (!currentRead(epoch, view)) return;
   const freshPages = new Map([[offset, page]]);
   if (allPages) for (const n of [...pages.keys()].filter(n => n > 0 && n < page.total).sort((a,b) => a-b)) {
    freshPages.set(n, await readPage(n));
    if (!currentRead(epoch, view)) return;
   }
   if (allPages) { pages.clear(); extrasStale = false; }
   else if (!more && pages.size > 1) extrasStale = true;
   for (const [n, p] of freshPages) pages.set(n, p);
   rebuildPages(); lastUpdated = page.serverTime || Date.now();
  }
  for (const [id, op] of ops) if (op.phase === 'confirmed' && Date.now() - op.at > 6000) ops.delete(id);
  render();
  await tracking(epoch);
  if (!currentRead(epoch, view)) return;
  if (view === 'notices' && data.notifications?.length) {
   const through = data.notifications[0].id;
   if (through !== notifiedThrough) { await api('/api/technician/notifications-read', { through }); if (!currentRead(epoch, view)) return; notifiedThrough = through; }
  }
  bannerUpdated();
 } catch (e) {
  if (!currentRead(epoch, view)) return;
  if (e.status === 401) { stop(); login('Sessão encerrada. Entre novamente para continuar.'); return; }
  banner(e.message + ' A leitura anterior foi preservada.', 'error', { hold: 8000 });
  if (!items.length) {
   $('#agora').hidden = true; agoraId = null; agoraSig = '';
   $('#rows').innerHTML = `<div class="empty">${icon('alert')}<strong>Não foi possível consultar a fila.</strong><span>${esc(e.message)}</span><button type="button" class="secondary-wide" data-refresh>${icon('refresh')}Tentar novamente</button></div>`;
  }
 } finally { if (currentRead(epoch, view)) { loading = false; $('#refresh').classList.remove('is-spinning'); } }
}

function changeMode(next) {
 if (busy || next === mode) return;
 invalidateReads(); mode = next; pages.clear(); extrasStale = false; items = []; data = null;
 $('#rows').innerHTML = '<p class="loading">Carregando…</p>'; $('#more').innerHTML = ''; $('#list-title').hidden = true;
 $('#extra-pages').hidden = true; renderTabs(); $('#agora').hidden = true; agoraId = null; agoraSig = '';
 refresh();
}

async function openNotice(id, button) {
 if (busy || $('dialog[open]')) return;
 const epoch = readEpoch; button.disabled = true;
 try {
  const {item:r} = await api('/api/technician/request?id=' + encodeURIComponent(id), undefined, readController.signal);
  if (!currentRead(epoch)) return;
  await sheet({ title: `Demanda #${r.number}`, confirmLabel: 'Fechar', body: `<h3>${esc(r.current_unit_name || r.context?.unit_name)}</h3>${chip(r, ownAssignment(r))}<p class="task-desc">${esc(r.description)}</p>${facts(r)}<p class="note">Consulta atualizada ao abrir. Alterações de atribuição são verificadas pelo servidor.</p>`, run: async () => {} });
 } catch (e) { if (currentRead(epoch)) banner(e.message, 'error', {hold:10000}); }
 finally { button.disabled = false; }
}

/* ---------------------------------------------------------------- escrita */
function setOp(id, op) { if (op) ops.set(id, { ...op, at: Date.now() }); else ops.delete(id); render(); }
async function perform(name, id, note, progress) {
 // Uma intenção = um operationId. Reenvio reaproveita o mesmo payload; 4xx descarta; rede/5xx conserva.
 const retrying = pending?.action === name && pending.payload.id === id;
 if (pending && !retrying) throw Error('Confira primeiro o envio pendente.');
 const row = items.find(r => r.id === id) || (retrying ? pending.row : null); if (!row) throw Error('A demanda não está mais na sua fila. Atualize a lista.');
 invalidateReads();
 busy = true;
 setOp(id, { action: name, phase: name === 'accept' && !(pending && pending.action === name && pending.payload.id === id) ? 'locating' : 'sending' });
 try {
  let payload;
  if (pending && pending.action === name && pending.payload.id === id) payload = pending.payload;
  else {
   payload = { id, version: row.version, note, operationId: crypto.randomUUID() };
   if (name === 'accept') { progress?.('Obtendo localização…'); payload.position = await locate(); }
   pending = { action: name, payload, row, ownerId: user.id };
  }
  progress?.('Enviando…');
  setOp(id, { action: name, phase: 'sending' });
  const result = await api('/api/technician/' + name, payload);
  if (result.ok !== true) throw Error('O servidor não confirmou o envio.');
  pending = null;
  if (['complete', 'pause'].includes(name)) stop();
  setOp(id, { action: name, phase: 'confirmed' });
  banner('');
 } catch (e) {
  if (e.status && e.status < 500) pending = null;
  const retry = !!(pending && pending.action === name && pending.payload.id === id);
  if (retry) e.message += ' O envio não foi confirmado. O texto permanece protegido: reenvie a mesma ação para confirmar sem duplicar; depois poderá registrar outra observação.';
  if (e.status === 409) { e.message += ' A fila mudou; confira os dados antes de tentar de novo.'; setTimeout(() => refresh(false, false, true), 0); }
  setOp(id, { action: name, phase: 'failed', message: e.message, retry });
  if (!progress) banner(e.message, 'error', { hold: 10000 });
  busy = false; render();
  throw e;
 }
 busy = false; render();
}
async function action(name, id) {
 if (busy) return;
 const retrying = pending && pending.action === name && pending.payload.id === id;
 if (pending && !retrying) { banner('Confira primeiro o envio pendente.', 'error', {hold:10000}); return; }
 let row = items.find(r => r.id === id) || (retrying ? pending.row : null); if (!row) return;
 if (row.stale && !retrying) {
  const epoch = readEpoch; busy = true;
  try {
   const {item} = await api('/api/technician/request?id=' + encodeURIComponent(id), undefined, readController.signal);
   if (!currentRead(epoch)) return;
   row = item; items = items.map(r => r.id === id ? item : r);
   if (row.status === 'Concluída') { banner('Esta demanda já foi concluída. Atualize as páginas carregadas.', 'ok', {hold:10000}); render(); return; }
  } catch(e) { if (currentRead(epoch)) banner(e.message, 'error', {hold:10000}); return; }
  finally { busy = false; }
 }
 if (name === 'accept') {
  await sheet({ title: 'Aceitar e iniciar?', confirmLabel: retrying ? 'Reenviar' : 'Aceitar e iniciar',
   body: `<p>O app vai pedir sua localização atual para registrar o início do atendimento em <strong>${esc(row.current_unit_name || row.context?.unit_name)}</strong>. ${native() ? 'O Android mostra uma notificação enquanto o acompanhamento durar.' : 'No navegador, mantenha esta página aberta durante o atendimento.'}</p>`,
   run: (_, progress) => perform('accept', id, '', progress) }).catch(() => {});
  await refresh(); return;
 }
 if (name === 'complete') {
  const own = ownAssignment(row), team = !own?.accepted;
  await sheet({ title: team ? 'Concluir pela equipe?' : 'Concluir atendimento?', confirmLabel: retrying ? 'Reenviar' : 'Confirmar',
   body: `<p>A conclusão será registrada em seu nome e encerrará o acompanhamento desta demanda para toda a equipe.</p>`,
   run: (_, progress) => perform('complete', id, '', progress) }).catch(() => {});
  await refresh(); return;
 }
 if (name === 'note' || name === 'blocked') {
  await sheet({ title: name === 'note' ? 'Registrar observação' : 'Registrar impedimento', note: true, draftKey: `${id}:${name}`, confirmLabel: retrying ? 'Reenviar' : 'Confirmar',
   body: name === 'blocked' ? `<p>O impedimento fica registrado no histórico da demanda. Ele não pausa o atendimento nem muda o status.</p>` : '',
   run: (text, progress) => perform(name, id, text, progress) }).catch(() => {});
  await refresh(); return;
 }
 if (name === 'pause') { await perform('pause', id, '').catch(() => {}); await refresh(); }
}

/* ---------------------------------------------------------------- telas de acesso */
function formStatus(form, text, kind) {
 const el = $('.form-status', form); el.className = 'form-status ' + (kind || '');
 el.innerHTML = text ? `${kind === 'error' ? icon('alert') : kind === 'ok' ? icon('check') : '<span class="spinner dark" aria-hidden="true"></span>'}<span>${esc(text)}</span>` : '';
}
function passwordField(name, label, auto, extra = '') {
 return `<label class="field"><span>${label}</span><div class="field-password"><input name="${name}" type="password" autocomplete="${auto}" required${extra}><button type="button" class="icon-button" data-toggle-password aria-label="Mostrar senha" aria-pressed="false">${icon('eye')}</button></div></label>`;
}
function login(message) {
 invalidateReads(); clearInterval(timer); stop(); user = null;
 $('#logout').hidden = true; $('#refresh').hidden = true; $('#tabs').hidden = true;
 banner(''); $('#updated').textContent = '';
 $('#app').className = 'auth-mode';
 $('#app').innerHTML = `<section class="auth"><div class="auth-mark">${icon('shield')}</div><h1>Atendimento técnico</h1><p class="lead">Entre com a conta de técnico habilitada pela SEMED.</p>` +
  `<form class="login card" novalidate><label class="field"><span>Usuário</span><input name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>${passwordField('password', 'Senha', 'current-password')}` +
  `<p class="form-status" role="alert"></p><button type="submit" class="primary">Entrar ${icon('arrow')}</button></form>` +
  `<p class="auth-help">Sem acesso? A habilitação e a senha provisória são feitas pela coordenação da SEMED.</p></section>`;
 const form = $('#app form');
 if (message) formStatus(form, message, 'error');
 form.onsubmit = async e => {
  e.preventDefault();
  const b = $('button[type=submit]', form);
  if (!form.username.value.trim() || !form.password.value) { formStatus(form, 'Informe usuário e senha.', 'error'); return; }
  b.disabled = true; formStatus(form, 'Verificando acesso…', 'wait');
  try {
   await api('/api/auth/login', { username: form.username.value, password: form.password.value, application: 'technician' });
   form.password.value = '';
   await init();
  } catch (err) { formStatus(form, err.message, 'error'); b.disabled = false; }
 };
}
function passwordForm() {
 $('#app').className = 'auth-mode'; $('#tabs').hidden = true; $('#refresh').hidden = true; $('#logout').hidden = false;
 $('#app').innerHTML = `<section class="auth"><div class="auth-mark">${icon('shield')}</div><h1>Defina sua senha</h1><p class="lead">Sua senha provisória precisa ser trocada antes de ver as demandas.</p>` +
  `<form class="card" novalidate>${passwordField('currentPassword', 'Senha provisória', 'current-password')}${passwordField('password', 'Nova senha', 'new-password', ' minlength="6" maxlength="256"')}<span class="field hint">De 6 a 256 caracteres, diferente da provisória.</span>` +
  `<p class="form-status" role="alert"></p><button type="submit" class="primary">Salvar senha ${icon('arrow')}</button></form></section>`;
 const form = $('#app form');
 form.onsubmit = async e => {
  e.preventDefault();
  const b = $('button[type=submit]', form), pw = form.password.value;
  if (!form.currentPassword.value || !pw) { formStatus(form, 'Preencha a senha provisória e a nova senha.', 'error'); return; }
  if (pw.length < 6 || pw.length > 256) { formStatus(form, 'A nova senha precisa ter de 6 a 256 caracteres.', 'error'); return; }
  b.disabled = true; formStatus(form, 'Salvando…', 'wait');
  try { await api('/api/auth/password', { currentPassword: form.currentPassword.value, password: pw }); login(); banner('Senha definida. Entre novamente com a nova senha.', 'ok', { hold: 15000 }); }
  catch (err) { formStatus(form, err.message, 'error'); b.disabled = false; }
 };
}
function accessError(message) {
 invalidateReads(); clearInterval(timer); stop(); banner(''); $('#tabs').hidden = true; $('#refresh').hidden = true; $('#logout').hidden = false;
 $('#app').className = 'auth-mode';
 $('#app').innerHTML = `<section class="auth"><div class="screen-error">${icon('alert')}<h1>Acesso técnico</h1><p>${esc(message)}</p><button type="button" class="secondary-wide" data-init>${icon('refresh')}Tentar novamente</button></div></section>`;
}

/* ---------------------------------------------------------------- eventos */
$('#logout').onclick = async () => {
 if (busy) return;
 invalidateReads(); clearInterval(timer); busy = true; stop();
 try { await api('/api/auth/logout', {}); user = null; accountId = null; items = []; data = null; pending = null; ops.clear(); drafts.clear(); pages.clear(); expanded.clear(); native()?.signedOut(); login(); banner('Você saiu.', 'ok', { hold: 6000 }); }
 catch (e) { banner(e.message + ' A sessão pode continuar ativa no servidor.', 'error', { hold: 10000 }); }
 finally { busy = false; if(user) timer = setInterval(() => {if(!document.hidden)refresh();},15000); }
};
$('#refresh').onclick = () => refresh();
$('#tabs').addEventListener('click', e => {
 const b = e.target.closest('[data-mode]'); if (!b || b.dataset.mode === mode) return;
 changeMode(b.dataset.mode);
});
$('#app').addEventListener('click', e => {
 const b = e.target.closest('button'); if (!b) return;
 if (b.hasAttribute('data-refresh')) { refresh(); return; }
 if (b.hasAttribute('data-init')) { init(); return; }
 if (b.hasAttribute('data-more')) { refresh(true); return; }
 if (b.hasAttribute('data-refresh-all')) { refresh(false, true); return; }
 if (b.hasAttribute('data-pending') && pending) { action(pending.action, pending.payload.id); return; }
 if (b.hasAttribute('data-toggle-password')) {
  const input = b.parentElement.querySelector('input'), show = input.type === 'password';
  input.type = show ? 'text' : 'password'; b.setAttribute('aria-pressed', String(show)); b.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha'); b.innerHTML = icon(show ? 'eye-off' : 'eye'); input.focus();
  return;
 }
 if (b.dataset.goto) { openNotice(b.dataset.goto, b); return; }
 const card = b.closest('[data-id]'); if (!card) return;
 const id = card.dataset.id, a = b.dataset.action;
 if (a === 'toggle') { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); card.classList.toggle('is-open', expanded.has(id)); $('.row-body',card).inert = !expanded.has(id); b.setAttribute('aria-expanded', String(expanded.has(id))); card.dataset.sig = (card.dataset.sig || '').replace(/[oc]$/, expanded.has(id) ? 'o' : 'c'); return; }
 if (a === 'more-text') { const d = $('[data-desc]', card), open = d.classList.toggle('is-clamped'); b.textContent = open ? 'Ver tudo' : 'Ver menos'; b.setAttribute('aria-expanded', String(!open)); if (open) expanded.delete('desc:' + id); else expanded.add('desc:' + id); return; }
 if (a === 'dismiss') { ops.delete(id); render(); return; }
 if (a === 'retry') { const op = ops.get(id); if (op) action(op.action, id); return; }
 if (a) action(a, id);
});
document.addEventListener('visibilitychange', () => { if (!document.hidden && user && !user.mustChange) refresh(); });
// APK 1.0.1 uses this before leaving the WebView. No extra Android permission.
window.semedHandleBack = () => {
 const dialog = $('dialog[open]');
 if (dialog) { dialog.semedClose?.(); return true; }
 if (user && mode !== 'queue' && $('#rows')) { changeMode('queue'); return true; }
 return false;
};

/* ---------------------------------------------------------------- início */
async function init() {
 clearInterval(timer); invalidateReads(); const epoch = readEpoch;
 try {
  const signed = await api('/api/auth/me', undefined, readController.signal);
  if (epoch !== readEpoch) return;
  if (accountId !== signed.id) { pending = null; ops.clear(); drafts.clear(); expanded.clear(); }
  user = signed; accountId = signed.id; mode = 'queue'; pages.clear(); extrasStale = false; items = []; data = null;
  tabsSig = ''; notifiedThrough = null; agoraId = null; agoraSig = ''; lastUpdated = null;
  if (user.mustChange) { passwordForm(); return; }
  shell(); banner('Carregando a fila…', 'wait');
  const queue = await api('/api/technician/queue', undefined, readController.signal);
  if (!currentRead(epoch)) return;
  pages.set(0, {...queue, offset:0}); rebuildPages(); lastUpdated = queue.serverTime || Date.now();
  render(); bannerUpdated();
  await tracking(epoch);
  if (!currentRead(epoch)) return;
  native()?.signedIn(user.username);
  timer = setInterval(() => { if (!document.hidden) refresh(); }, 15000);
 } catch (e) {
  if (epoch !== readEpoch) return;
  if (e.status === 401) login();
  else accessError(e.message);
 }
}
init();
