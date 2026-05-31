/* ============================================================
   MAVI TRAVERTIN — ADMIN PANEL JS  v2.1
   Server bo'lsa API, bo'lmasa localStorage dan ishlaydi
   ============================================================ */
'use strict';

const API = '/api';

// Offline rejim uchun parol (faqat server yo'q bo'lganda ishlatiladi)
// Server ishlasa bu ishlatilmaydi — parol serverda tekshiriladi
const OFFLINE_USER = 'admin';
const OFFLINE_PASS = 'Mavi@2024#Secure';

/* ============================================================
   STATE
   ============================================================ */
let _orders = [];
let _messages = [];
let _token = sessionStorage.getItem('maviToken') || '';
let _offlineMode = false; // server yo'q — localStorage rejimi
let _refresh = null;
let _curMsg = null;
let _curOrd = null;

/* ============================================================
   LOGIN
   ============================================================ */
async function doLogin() {
    const user = _v('loginUser');
    const pass = _v('loginPass');
    const errEl = _el('loginError');
    errEl.textContent = '';

    if (!user || !pass) {
        errEl.textContent = 'Login va parolni kiriting.';
        return;
    }

    const btn = _el('loginBtn');
    _btnState(btn, true, 'Kirish...');

    // Avval server bilan ulanib ko'ramiz
    try {
        const res = await fetch(`${API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass }),
            signal: AbortSignal.timeout(4000), // 4 soniya kutish
        });
        const data = await res.json();
        if (data.ok && data.token) {
            _token = data.token;
            _offlineMode = false;
            sessionStorage.setItem('maviToken', _token);
            sessionStorage.setItem('maviOffline', 'false');
            showPanel('🌐 Server bilan ulangan');
            _btnState(btn, false, 'Kirish →');
            return;
        }
        // Server javob berdi lekin parol noto'g'ri
        errEl.textContent = data.error || 'Login yoki parol noto\'g\'ri!';
        _btnState(btn, false, 'Kirish →');
        return;

    } catch {
        // Server javob bermadi — offline rejimga o'tamiz
    }

    // OFFLINE REJIM — localStorage
    if (user === OFFLINE_USER && pass === OFFLINE_PASS) {
        _offlineMode = true;
        _token = 'offline';
        sessionStorage.setItem('maviToken', 'offline');
        sessionStorage.setItem('maviOffline', 'true');
        showPanel('📴 Offline rejim (server yo\'q)');
    } else {
        errEl.textContent = 'Login yoki parol noto\'g\'ri!';
    }
    _btnState(btn, false, 'Kirish →');
}

function doLogout() {
    sessionStorage.removeItem('maviToken');
    sessionStorage.removeItem('maviOffline');
    _token = '';
    _offlineMode = false;
    clearInterval(_refresh);
    _el('adminApp').style.display = 'none';
    _el('loginScreen').style.display = 'flex';
    _el('loginPass').value = '';
}

function togglePass() {
    const i = _el('loginPass');
    i.type = i.type === 'password' ? 'text' : 'password';
}

/* ============================================================
   PANEL
   ============================================================ */
function showPanel(modeLabel) {
    _el('loginScreen').style.display = 'none';
    _el('adminApp').style.display = 'flex';

    // Rejim belgisini topbarda ko'rsatish
    const modeEl = _el('modeLabel');
    if (modeEl && modeLabel) modeEl.textContent = modeLabel;

    loadAll();
    startClock();
    _refresh = setInterval(loadAll, 30000);
}

window.addEventListener('DOMContentLoaded', () => {
    renderProductsTab();

    _el('loginPass') ?.addEventListener('keydown', e => {
        if (e.key === 'Enter') doLogin();
    });

    // Avvalgi sessiyani tiklash
    const savedToken = sessionStorage.getItem('maviToken');
    const savedOffline = sessionStorage.getItem('maviOffline');

    if (!savedToken) return;

    if (savedOffline === 'true') {
        _offlineMode = true;
        _token = 'offline';
        showPanel('📴 Offline rejim');
        return;
    }

    // Server token tekshirish
    fetch(`${API}/stats`, {
            headers: { Authorization: `Bearer ${savedToken}` },
            signal: AbortSignal.timeout(4000),
        })
        .then(r => {
            if (r.ok) {
                _token = savedToken;
                _offlineMode = false;
                showPanel('🌐 Server bilan ulangan');
            } else {
                doLogout();
            }
        })
        .catch(() => {
            // Server yo'q — offline bilan davom etish
            _token = 'offline';
            _offlineMode = true;
            showPanel('📴 Offline rejim');
        });
});

/* ============================================================
   DATA LOAD — server yoki localStorage
   ============================================================ */
async function loadAll() {
    await Promise.all([loadOrders(), loadMessages()]);
    refreshDashboard();
}

async function _apiGet(path) {
    if (_offlineMode) return null;
    try {
        const r = await fetch(API + path, {
            headers: { Authorization: `Bearer ${_token}` },
            signal: AbortSignal.timeout(5000),
        });
        if (r.status === 401) { doLogout(); return null; }
        return r.ok ? r.json() : null;
    } catch { return null; }
}

async function loadOrders() {
    if (_offlineMode) {
        // localStorage dan o'qish
        _orders = JSON.parse(localStorage.getItem('mavi_orders') || '[]');
        return;
    }
    const data = await _apiGet('/orders');
    if (data) _orders = data;
}

async function loadMessages() {
    if (_offlineMode) {
        // localStorage dan o'qish
        _messages = JSON.parse(localStorage.getItem('mavi_messages') || '[]');
        return;
    }
    const data = await _apiGet('/messages');
    if (data) _messages = data;
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function refreshDashboard() {
    const newOrd = _orders.filter(o => o.status === 'new').length;
    const unread = _messages.filter(m => !m.read).length;

    _text('ds-new-orders', newOrd);
    _text('ds-total-orders', _orders.length);
    _text('ds-new-msgs', unread);
    _text('ds-total-msgs', _messages.length);
    _text('badge-orders', newOrd || '');
    _text('badge-msgs', unread || '');

    // Dashboard (oxirgi 5 ta)
    renderOrdersTable('dash-orders-body', [..._orders].reverse().slice(0, 5), true);
    renderMsgsList('dash-msgs-list', [..._messages].reverse().slice(0, 5));
    // Buyurtmalar tab (hammasi)
    renderOrdersTable('all-orders-body', [..._orders].reverse(), false);
    // Xabarlar tab (hammasi)
    renderMsgsList('all-msgs-list', [..._messages].reverse());
    // Statistika
    renderStats();
    // Badge raqamlarini yangilash
    const newOrdBadge = _orders.filter(o => !o.status || o.status === 'new').length;
    const unreadBadge = _messages.filter(m => !m.read).length;
    const bo = _el('badge-orders');
    const bm = _el('badge-msgs');
    if (bo) bo.textContent = newOrdBadge > 0 ? newOrdBadge : '';
    if (bm) bm.textContent = unreadBadge > 0 ? unreadBadge : '';
}

/* ============================================================
   ORDERS TABLE
   ============================================================ */
function renderOrdersTable(bodyId, rows, mini) {
    const tb = _el(bodyId);
    if (!tb) return;
    if (!rows.length) {
        tb.innerHTML = `<tr><td colspan="${mini?7:10}" class="empty-row">Buyurtmalar yo'q</td></tr>`;
        return;
    }
    tb.innerHTML = rows.map(o => {
                const num = o._num || (_orders.indexOf(o) + 1);
                const status = o.status || 'new';
                const sClass = { new: 's-new', done: 's-done', pending: 's-pending' }[status] || 's-new';
                const sLabel = { new: 'Yangi', done: 'Bajarildi', pending: 'Kutilmoqda' }[status] || status;
                const dt = o.created_at ? new Date(o.created_at) : null;
                const time = dt ? dt.toLocaleDateString('uz') + ' ' + dt.toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' }) : '—';

                if (mini) return `<tr>
      <td><strong style="color:var(--rust);">${num}-mijoz</strong></td>
      <td style="font-weight:600">${x(o.name)}</td>
      <td>${x(o.product_name)}</td>
      <td>${x(o.qty||'—')}</td>
      <td><a href="tel:${x(o.phone)}" style="color:var(--brand-mid);font-weight:600;">${x(o.phone)}</a></td>
      <td><span class="s-badge ${sClass}">${sLabel}</span></td>
      <td style="color:var(--sand);font-size:11px;">${time}</td>
    </tr>`;

                return `<tr>
      <td><strong style="color:var(--rust);">${num}-mijoz</strong></td>
      <td style="font-weight:600">${x(o.name)}</td>
      <td><a href="tel:${x(o.phone)}" style="color:var(--brand-mid);font-weight:600;">${x(o.phone)}</a></td>
      <td>${x(o.product_name)}</td>
      <td style="color:var(--rust);font-weight:700;">${x(o.product_price||'—')}</td>
      <td>${x(o.qty||'—')}</td>
      <td style="font-size:12px;color:var(--sand);max-width:140px;">${x(o.note||'—')}</td>
      <td><span class="s-badge ${sClass}">${sLabel}</span></td>
      <td style="font-size:11px;color:var(--sand);white-space:nowrap;">${time}</td>
      <td>
        <div class="tbl-actions">
          <button class="tbl-btn view" onclick="showOrderModal('${o.id || o._localId}')">Ko'rish</button>
          ${status !== 'done' ? `<button class="tbl-btn done" onclick="markDone('${o.id || o._localId}')">✓</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ============================================================
   MESSAGES LIST
   ============================================================ */
function renderMsgsList(containerId, msgs) {
  const el = _el(containerId);
  if (!el) return;
  if (!msgs.length) {
    el.innerHTML = `<div class="empty-row" style="padding:24px;text-align:center;">Xabarlar yo'q</div>`;
    return;
  }
  el.innerHTML = msgs.map(m => {
    const num  = m._num || (_messages.indexOf(m) + 1);
    const dt   = m.created_at ? new Date(m.created_at) : null;
    const time = dt ? dt.toLocaleTimeString('uz',{hour:'2-digit',minute:'2-digit'}) : '';
    return `
    <div class="msg-item ${m.read ? '' : 'unread'}" onclick="showMsgModal('${m.id || m._localId}')">
      <div class="msg-num-circle ${m.read ? '' : 'unread'}">${num}</div>
      <div>
        <div class="msg-sender">${x(m.name)}</div>
        <div class="msg-preview">${x((m.message||'').slice(0,85))}${(m.message||'').length>85?'…':''}</div>
        <div class="msg-contact-row">${x(m.phone)}${m.email?' · '+x(m.email):''}</div>
      </div>
      <div class="msg-right">
        <div class="msg-time">${time}</div>
        ${!m.read ? '<div class="msg-unread-dot"></div>' : ''}
      </div>
    </div>`;
  }).join('');
}

/* ============================================================
   ORDER MODAL
   ============================================================ */
function showOrderModal(id) {
  const o = _orders.find(o => String(o.id) === String(id) || String(o._localId) === String(id));
  if (!o) return;
  _curOrd = o;
  const num = o._num || (_orders.indexOf(o) + 1);
  const dt  = o.created_at ? new Date(o.created_at).toLocaleString('uz') : '—';

  _el('od-num').textContent    = num;
  _el('od-sender').textContent = o.name;
  _el('od-contact').textContent= o.phone;
  _el('od-call').href          = `tel:${o.phone}`;
  _el('od-done-btn').style.display = o.status === 'done' ? 'none' : 'block';

  _el('od-grid').innerHTML = `
    <div class="odg-item"><div class="odg-label">Mahsulot</div><div class="odg-val">${x(o.product_name||'—')}</div></div>
    <div class="odg-item"><div class="odg-label">Narx</div><div class="odg-val rust">${x(o.product_price||'—')}</div></div>
    <div class="odg-item"><div class="odg-label">Miqdor</div><div class="odg-val">${x(o.qty||'—')}</div></div>
    <div class="odg-item"><div class="odg-label">Holat</div><div class="odg-val">
      <span class="s-badge ${o.status==='done'?'s-done':'s-new'}">${o.status==='done'?'Bajarildi':'Yangi'}</span>
    </div></div>
    <div class="odg-item" style="grid-column:1/-1"><div class="odg-label">Izoh</div><div class="odg-val" style="font-size:13px;">${x(o.note||'—')}</div></div>
    <div class="odg-item" style="grid-column:1/-1"><div class="odg-label">Sana</div><div class="odg-val" style="font-size:12px;color:var(--sand);">${dt}</div></div>`;

  openModal('orderDetailModal');
}

async function markOrderDone() {
  if (!_curOrd) return;
  await markDone(_curOrd.id);
  closeModal('orderDetailModal');
}

async function markDone(id) {
  const o = _orders.find(o => String(o.id) === String(id) || String(o._localId) === String(id));
  if (o) o.status = 'done';
  if (_offlineMode) {
    const all = JSON.parse(localStorage.getItem('mavi_orders') || '[]');
    const i = all.findIndex(x => String(x._localId) === String(id) || x.id === id);
    if (i > -1) { all[i].status = 'done'; localStorage.setItem('mavi_orders', JSON.stringify(all)); }
  } else {
    try {
      await fetch(`${API}/orders/${id}/done`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${_token}` }
      });
    } catch {}
  }
  refreshDashboard();
}

/* ============================================================
   MESSAGE MODAL
   ============================================================ */
function showMsgModal(id) {
  const m = _messages.find(m => String(m.id) === String(id) || String(m._localId) === String(id));
  if (!m) return;
  _curMsg = m;
  const num = m._num || (_messages.indexOf(m) + 1);
  const dt  = m.created_at ? new Date(m.created_at).toLocaleString('uz') : '—';

  _el('md-num').textContent     = num;
  _el('md-sender').textContent  = m.name;
  _el('md-contact').textContent = m.phone + (m.email ? ' · ' + m.email : '');
  _el('md-body').textContent    = m.message;
  _el('md-meta').textContent    = `📅 ${dt}`;
  _el('md-call').href           = `tel:${m.phone}`;

  openModal('msgDetailModal');
  markRead(m.id);
}

async function markRead(id) {
  const m = _messages.find(m => String(m.id) === String(id) || String(m._localId) === String(id));
  if (!m || m.read) return;
  m.read = true;
  if (_offlineMode) {
    const all = JSON.parse(localStorage.getItem('mavi_messages') || '[]');
    const i = all.findIndex(x => String(x._localId) === String(id) || x.id === id);
    if (i > -1) { all[i].read = true; localStorage.setItem('mavi_messages', JSON.stringify(all)); }
  } else {
    try {
      await fetch(`${API}/messages/${id}/read`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${_token}` }
      });
    } catch {}
  }
  refreshDashboard();
}

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function openModal(id) {
  const m = _el(id);
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = _el(id);
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['msgDetailModal','orderDetailModal'].forEach(closeModal);
  }
});
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    closeModal(e.target.id);
    document.body.style.overflow = '';
  }
});

/* ============================================================
   TABS
   ============================================================ */
function switchTab(btn, tabId) {
  document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tab-pane').forEach(t => t.classList.remove('active'));
  const pane = _el('tab-' + tabId);
  if (pane) pane.classList.add('active');
  const titles = {
    dashboard:'Dashboard', orders:'📦 Buyurtmalar',
    messages:'💬 Xabarlar', products:'🪨 Mahsulotlar', stats:'📈 Statistika'
  };
  _text('topbarTitle', titles[tabId] || tabId);
  if (window.innerWidth < 900) _el('sidebar')?.classList.remove('open');
  // Tab ochilganda ma'lumotlarni yangilash
  loadAll();
}

function toggleSidebar() {
  _el('sidebar')?.classList.toggle('open');
}

// Sidebar tashqarisiga bosish
document.addEventListener('click', e => {
  const sb = _el('sidebar');
  const mt = _el('menuToggle');
  if (sb && sb.classList.contains('open') && window.innerWidth < 900
      && !sb.contains(e.target) && mt && !mt.contains(e.target)) {
    sb.classList.remove('open');
  }
});

/* ============================================================
   CLOCK
   ============================================================ */
function startClock() {
  const tick = () => _text('topbarTime',
    new Date().toLocaleTimeString('uz',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
  );
  tick(); setInterval(tick, 1000);
}

/* ============================================================
   SEARCH
   ============================================================ */
function filterOrders() {
  const q = (_v('orderSearch') || '').toLowerCase();
  _el('all-orders-body')?.querySelectorAll('tr').forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
function filterMsgs() {
  const q = (_v('msgSearch') || '').toLowerCase();
  _el('all-msgs-list')?.querySelectorAll('.msg-item').forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

/* ============================================================
   PRODUCTS TAB
   ============================================================ */
function renderProductsTab() {
  const tb = _el('products-body');
  if (!tb || typeof PRODUCTS === 'undefined') return;
  tb.innerHTML = PRODUCTS.map((p, i) => `
    <tr>
      <td style="font-weight:700;color:var(--rust);">${i+1}</td>
      <td style="font-weight:600;">${x(p.name)}</td>
      <td><span class="s-badge s-active">${x(catLabel(p.cat))}</span></td>
      <td style="color:var(--rust);font-weight:700;">${x(p.price)} so'm/${x(p.unit)}</td>
      <td style="color:var(--sand);font-size:12px;">${x(p.price2||'—')} so'm</td>
      <td><span class="s-badge s-active">Faol</span></td>
    </tr>`).join('');
}

function catLabel(cat) {
  return {travertin:'Travertin',astar:'Astar',rodban:'Rodban',kley:'Kley',
    pena:'Pena',polistro:'Polistro',shpaklovka:'Shpaklovka',
    vodaemulsiya:'Vodaemulsiya',otachento:'Otachento',kraska:'Kraska'}[cat] || cat;
}

/* ============================================================
   STATS
   ============================================================ */
function renderStats() {
  const catCount = {};
  _orders.forEach(o => {
    const p = typeof PRODUCTS !== 'undefined'
      ? PRODUCTS.find(x => x.name === o.product_name) : null;
    const c = p ? catLabel(p.cat) : 'Boshqa';
    catCount[c] = (catCount[c] || 0) + 1;
  });
  const maxCat = Math.max(1, ...Object.values(catCount));

  const catEl = _el('stats-cat');
  if (catEl) {
    catEl.innerHTML = Object.keys(catCount).length
      ? Object.entries(catCount).sort((a,b)=>b[1]-a[1]).map(([k,v]) => `
          <div class="stat-bar-item">
            <div class="sbi-label"><span>${k}</span><span>${v} ta</span></div>
            <div class="sbi-bar"><div class="sbi-fill" style="width:${Math.round(v/maxCat*100)}%"></div></div>
          </div>`).join('')
      : '<div style="padding:20px;color:var(--sand);text-align:center;">Ma\'lumot yo\'q</div>';
  }

  const total  = _orders.length || 1;
  const newC   = _orders.filter(o => !o.status || o.status==='new').length;
  const doneC  = _orders.filter(o => o.status==='done').length;
  const stEl   = _el('stats-status');
  if (stEl) {
    stEl.innerHTML = _orders.length ? `
      <div class="stat-bar-item">
        <div class="sbi-label"><span>Yangi</span><span>${newC} ta</span></div>
        <div class="sbi-bar"><div class="sbi-fill" style="width:${Math.round(newC/total*100)}%"></div></div>
      </div>
      <div class="stat-bar-item">
        <div class="sbi-label"><span>Bajarildi</span><span>${doneC} ta</span></div>
        <div class="sbi-bar"><div class="sbi-fill brand" style="width:${Math.round(doneC/total*100)}%"></div></div>
      </div>`
      : '<div style="padding:20px;color:var(--sand);text-align:center;">Ma\'lumot yo\'q</div>';
  }
}

/* ============================================================
   UTILS
   ============================================================ */
const _el   = id => document.getElementById(id);
const _v    = id => _el(id)?.value || '';
const _text = (id, v) => { const e = _el(id); if (e) e.textContent = v; };
const _btnState = (btn, dis, txt) => { if (!btn) return; btn.disabled = dis; btn.textContent = txt; };
function x(str) {
  return String(str ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[c]));
}