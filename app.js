const DATA = window.AKTIEN_DATA || { stocks: [] };
const $ = s => document.querySelector(s);
const fmt = n => n == null || n === '' || !Number.isFinite(Number(n)) ? '–' : Number(n).toLocaleString('de-DE', { maximumFractionDigits: 2 });
const eur = n => n == null || !Number.isFinite(Number(n)) ? '–' : Number(n).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const pct = n => n == null || n === '' || !Number.isFinite(Number(n)) ? '–' : (Number(n) * 100).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' %';
const depotKey = 'aktientool_v34_depot';
const startCash = 10000;
let depotState = JSON.parse(localStorage.getItem(depotKey) || `{"cash":${startCash},"positions":{}}`);
if (!depotState.positions) depotState = { cash: startCash, positions: {} };

function saveDepot() { localStorage.setItem(depotKey, JSON.stringify(depotState)); renderAll(); }
function isDepot(s) { return !!depotState.positions[s.symbol]; }
function signalClass(v) { return Number(v) > 0 ? 'good' : Number(v) < 0 ? 'bad' : ''; }
function sellCount(s) { let n = Number(s.sell || 0); const sig = s.signals || {}; Object.keys(sig).forEach(k => { if (k.includes('-') && Number(sig[k]) > 0) n++; }); return n; }
function buyCount(s) { let n = Number(s.buy || 0); const sig = s.signals || {}; Object.keys(sig).forEach(k => { if (k.includes('+') && Number(sig[k]) > 0) n++; }); return n; }
function trendText(s) { const v = Number(s.trendScore); return Number.isFinite(v) ? (v > 0 ? '+' + fmt(v) : fmt(v)) : '–'; }
function showPage(id) { document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); $('#' + id).classList.add('active'); document.querySelectorAll('nav button').forEach(b => b.classList.toggle('activeBtn', b.dataset.page === id)); window.scrollTo(0, 0); }
document.querySelectorAll('nav button').forEach(b => b.onclick = () => showPage(b.dataset.page));
$('#backBtn').onclick = () => showPage('overview');

function initFilters() {
  let groups = [...new Set(DATA.stocks.map(s => s.group).filter(Boolean))].sort();
  $('#groupFilter').innerHTML = '<option value="">Alle Gruppen</option>' + groups.map(g => `<option>${g}</option>`).join('');
  $('#search').oninput = renderOverview;
  $('#groupFilter').onchange = renderOverview;
}

function renderOverview() {
  const q = $('#search').value.toLowerCase(), g = $('#groupFilter').value;
  const body = $('#stockTable tbody');
  let rows = DATA.stocks.filter(s => (!g || s.group === g) && ((s.symbol + s.name + s.group).toLowerCase().includes(q)));
  body.innerHTML = rows.map(s => `<tr class="${isDepot(s) ? 'inDepot' : ''}" onclick="detail('${s.symbol}')">
    <td>${isDepot(s) ? '📌' : ''}</td><td><b>${s.symbol}</b></td><td>${s.name}</td><td>${s.group}</td><td>${fmt(s.price)}</td>
    <td class="${signalClass(s.percent)}">${pct(s.percent)}</td><td class="good">${buyCount(s) || ''}</td><td class="bad">${sellCount(s) || ''}</td><td class="${signalClass(s.trendScore)}">${trendText(s)}</td>
  </tr>`).join('');
}

function renderStats() {
  let st = DATA.stocks;
  $('#version').textContent = DATA.version || 'V3.4';
  $('#countAll').textContent = st.length;
  $('#countBuy').textContent = st.filter(buyCount).length;
  $('#countSell').textContent = st.filter(sellCount).length;
  $('#countDepot').textContent = Object.keys(depotState.positions).length;
}

function card(s, mode = 'normal') {
  const showBuy = mode !== 'sell';
  return `<div class="card ${isDepot(s) ? 'inDepot' : ''}"><h3>${s.name} <span class="muted">${s.symbol}</span></h3>
    <div class="grid"><div class="metric">Kurs<br><b>${fmt(s.price)}</b></div><div class="metric">Änderung<br><b class="${signalClass(s.percent)}">${pct(s.percent)}</b></div>
    ${showBuy ? `<div class="metric">Kauf<br><b class="good">${buyCount(s)}</b></div>` : ''}<div class="metric">Verkauf<br><b class="bad">${sellCount(s)}</b></div><div class="metric">Trend<br><b class="${signalClass(s.trendScore)}">${trendText(s)}</b></div></div>
    <div class="actions"><button onclick="event.stopPropagation(); detail('${s.symbol}')">Detailanalyse</button><button onclick="event.stopPropagation(); addOrRemoveDepot('${s.symbol}')">${isDepot(s) ? 'Depot entfernen' : 'Ins Depot'}</button></div></div>`;
}

function renderLists() {
  $('#buyList').innerHTML = DATA.stocks.filter(buyCount).sort((a, b) => buyCount(b) - buyCount(a)).map(s => card(s, 'buy')).join('') || '<p class="muted">Keine Kaufsignale.</p>';
  $('#sellList').innerHTML = DATA.stocks.filter(sellCount).sort((a, b) => sellCount(b) - sellCount(a)).map(s => card(s, 'sell')).join('') || '<p class="muted">Keine Verkaufssignale.</p>';
  renderDepot();
}

function addOrRemoveDepot(sym) {
  if (depotState.positions[sym]) { removeDepot(sym); return; }
  const s = DATA.stocks.find(x => x.symbol === sym);
  const qtyRaw = prompt(`Stückzahl für ${sym} eingeben:`, '1');
  if (qtyRaw === null) return;
  const qty = Number(String(qtyRaw).replace(',', '.'));
  if (!Number.isFinite(qty) || qty <= 0) { alert('Bitte eine gültige Stückzahl eingeben.'); return; }
  const buyPrice = Number(s.price || 0);
  const cost = qty * buyPrice;
  depotState.positions[sym] = { qty, buyPrice };
  depotState.cash = Number(depotState.cash || 0) - cost;
  saveDepot();
}
function removeDepot(sym) {
  const p = depotState.positions[sym];
  const s = DATA.stocks.find(x => x.symbol === sym);
  if (p && s) depotState.cash = Number(depotState.cash || 0) + Number(p.qty || 0) * Number(s.price || 0);
  delete depotState.positions[sym];
  saveDepot();
}
function setDepot(sym, k, v) {
  if (!depotState.positions[sym]) depotState.positions[sym] = { qty: 0, buyPrice: 0 };
  depotState.positions[sym][k] = Number(String(v).replace(',', '.')) || 0;
  saveDepot();
}
function resetDepot() {
  if (!confirm('Depot wirklich zurücksetzen? Cash wird auf 10.000 € gesetzt und alle Aktien werden gelöscht.')) return;
  depotState = { cash: startCash, positions: {} };
  saveDepot();
}
window.resetDepot = resetDepot;

function portfolioTotals() {
  const positions = Object.entries(depotState.positions).map(([sym, p]) => {
    const s = DATA.stocks.find(x => x.symbol === sym);
    if (!s) return null;
    const qty = Number(p.qty || 0), buyPrice = Number(p.buyPrice || 0), price = Number(s.price || 0);
    const value = qty * price, cost = qty * buyPrice, gain = value - cost;
    return { s, p, qty, buyPrice, price, value, cost, gain };
  }).filter(Boolean);
  const stockValue = positions.reduce((a, x) => a + x.value, 0);
  const total = Number(depotState.cash || 0) + stockValue;
  const gainTotal = total - startCash;
  return { positions, stockValue, total, gainTotal };
}

function renderDepot() {
  const { positions, stockValue, total, gainTotal } = portfolioTotals();
  $('#depotList').innerHTML = `<div class="depotSummary">
    <div class="metric">Cash<br><b>${eur(depotState.cash)}</b></div><div class="metric">Aktienwert<br><b>${eur(stockValue)}</b></div><div class="metric">Gesamtwert<br><b>${eur(total)}</b></div><div class="metric">Gewinn/Verlust<br><b class="${signalClass(gainTotal)}">${eur(gainTotal)}</b></div>
  </div><div class="actions"><button onclick="resetDepot()">Depot zurücksetzen</button></div>` +
  (positions.length ? `<div class="tablewrap"><table class="depotTable"><thead><tr><th>Symbol</th><th>Aktie</th><th>Stück</th><th>Kaufkurs</th><th>Aktuell</th><th>Wert</th><th>G/V €</th><th>G/V %</th><th>Verkauf</th><th>Trend</th><th></th></tr></thead><tbody>` +
    positions.map(x => `<tr><td><b>${x.s.symbol}</b></td><td>${x.s.name}</td><td><input class="miniInput" type="number" step="1" value="${x.qty}" onchange="setDepot('${x.s.symbol}','qty',this.value)"></td><td><input class="miniInput" type="number" step="0.01" value="${x.buyPrice}" onchange="setDepot('${x.s.symbol}','buyPrice',this.value)"></td><td>${fmt(x.price)}</td><td>${eur(x.value)}</td><td class="${signalClass(x.gain)}">${eur(x.gain)}</td><td class="${signalClass(x.gain)}">${x.cost ? fmt(x.gain / x.cost * 100) + ' %' : '–'}</td><td class="bad">${sellCount(x.s) || ''}</td><td class="${signalClass(x.s.trendScore)}">${trendText(x.s)}</td><td><button onclick="removeDepot('${x.s.symbol}')">Entfernen</button></td></tr>`).join('') +
    `</tbody></table></div>` : '<p class="muted">Noch keine Aktien im Depot.</p>');
}

function combinedIndicators(sig) {
  const pairs = [['GD', 'GD+', 'GD-'], ['RSI', 'RSI+', 'RSI-'], ['MACD', 'MACD+', 'MACD-'], ['Momentum', 'Mom+', 'Mom-'], ['CCI', 'CCI+', 'CCI-'], ['Pivot', 'Piv+', 'Piv-'], ['Trend', 'Trend+', 'Trend-']];
  return pairs.map(([name, plus, minus]) => {
    const p = Number(sig[plus] || 0), m = Number(sig[minus] || 0);
    const val = p > 0 ? '+' : (m > 0 ? '−' : '');
    const cls = p > 0 ? 'good' : (m > 0 ? 'bad' : '');
    return `<div class="metric">${name}<br><b class="${cls}">${val || '–'}</b></div>`;
  }).join('');
}

function detail(sym) {
  let s = DATA.stocks.find(x => x.symbol === sym); if (!s) return;
  const sig = s.signals || {};
  $('#detailContent').innerHTML = `<h2>${s.name} <span class="muted">${s.symbol}</span></h2><canvas id="chart" width="900" height="320"></canvas>
    <div class="grid"><div class="metric">Kurs<br><b>${fmt(s.price)}</b></div><div class="metric">Kauf gesamt<br><b class="good">${buyCount(s)}</b></div><div class="metric">Verkauf gesamt<br><b class="bad">${sellCount(s)}</b></div><div class="metric">Trend<br><b class="${signalClass(s.trendScore)}">${trendText(s)}</b></div></div>
    <h3>Indikatoren</h3><div class="grid">${combinedIndicators(sig)}</div>
    <div class="actions"><button onclick="addOrRemoveDepot('${s.symbol}')">${isDepot(s) ? 'Depot entfernen' : 'Ins Depot'}</button></div>`;
  showPage('detail'); drawChart(s.history || []);
}

function drawChart(points) {
  const c = $('#chart'), ctx = c.getContext('2d'), w = c.width, h = c.height, pad = 46;
  ctx.clearRect(0, 0, w, h);
  if (!points.length) { ctx.fillText('Keine Kursdaten', pad, 40); return; }
  const ys = points.map(p => p.y).filter(Number.isFinite), min = Math.min(...ys), max = Math.max(...ys), span = max - min || 1;
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
  ctx.fillStyle = '#94a3b8'; ctx.font = '12px system-ui';
  for (let i = 0; i <= 5; i++) { let y = h - pad - i * (h - 2 * pad) / 5, val = min + i * span / 5; ctx.fillText(fmt(val), 6, y + 4); ctx.strokeStyle = '#1f2937'; ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke(); }
  let xFor = i => pad + i * (w - 2 * pad) / (points.length - 1), yFor = v => h - pad - (v - min) * (h - 2 * pad) / span;
  ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.beginPath(); points.forEach((p, i) => { let x = xFor(i), y = yFor(p.y); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
  ctx.fillStyle = '#cbd5e1'; [0, Math.floor(points.length / 2), points.length - 1].forEach(i => { let label = points[i].x === 0 ? 'heute' : points[i].x + ' T'; ctx.fillText(label, xFor(i) - 15, h - 18); });
  ctx.fillText('Zeitachse: Handelstage bis heute', w / 2 - 80, h - 4);
}
function renderAll() { renderStats(); renderOverview(); renderLists(); }
initFilters(); renderAll();
