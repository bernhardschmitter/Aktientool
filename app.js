const DATA = window.AKTIEN_DATA || { stocks: [] };
const $ = s => document.querySelector(s);
const fmt = n => n == null || n === '' || !Number.isFinite(Number(n)) ? '–' : Number(n).toLocaleString('de-DE', { maximumFractionDigits: 2 });
const eur = n => n == null || !Number.isFinite(Number(n)) ? '–' : Number(n).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const pct = n => n == null || n === '' || !Number.isFinite(Number(n)) ? '–' : (Number(n) * 100).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' %';
const depotKey = 'aktientool_v34_depot'; // bewusst beibehalten, damit V3.4-Depotdaten erhalten bleiben
const overviewExtraKey = 'aktientool_v36_overview_extra';
const overviewHiddenKey = 'aktientool_v37_overview_hidden';
const courseUpdateKey = 'aktientool_v38_course_timestamp';
const liveQuotesKey = 'aktientool_v312_live_quotes';
const startCash = 10000;
let depotState = JSON.parse(localStorage.getItem(depotKey) || `{"cash":${startCash},"positions":{}}`);
let currentDetailSymbol = null;
let previousPage='overview';
if (!depotState.positions) depotState = { cash: startCash, positions: {} };

function saveDepot() { localStorage.setItem(depotKey, JSON.stringify(depotState)); renderAll(); }
function getExtraOverviewStocks() {
  try { return JSON.parse(localStorage.getItem(overviewExtraKey) || '[]'); }
  catch (e) { return []; }
}
function saveExtraOverviewStocks(list) { localStorage.setItem(overviewExtraKey, JSON.stringify(list)); }
function getHiddenOverviewSymbols() {
  try { return JSON.parse(localStorage.getItem(overviewHiddenKey) || '[]'); }
  catch (e) { return []; }
}
function saveHiddenOverviewSymbols(list) { localStorage.setItem(overviewHiddenKey, JSON.stringify(list)); }
function allOverviewStocks() {
  const hidden = new Set(getHiddenOverviewSymbols().map(x => String(x).toUpperCase()));
  const extras = getExtraOverviewStocks().filter(x => x && x.symbol);
  const existing = new Set(DATA.stocks.map(s => String(s.symbol).toUpperCase()));
  return DATA.stocks.concat(extras.filter(x => !existing.has(String(x.symbol).toUpperCase()))).filter(s => !hidden.has(String(s.symbol).toUpperCase()));
}
function isDepot(s) { return !!depotState.positions[s.symbol]; }
function signalClass(v) { return Number(v) > 0 ? 'good' : Number(v) < 0 ? 'bad' : ''; }
function sellCount(s) { let n = Number(s.sell || 0); const sig = s.signals || {}; Object.keys(sig).forEach(k => { if (k.includes('-') && Number(sig[k]) > 0) n++; }); return n; }
function buyCount(s) { let n = Number(s.buy || 0); const sig = s.signals || {}; Object.keys(sig).forEach(k => { if (k.includes('+') && Number(sig[k]) > 0) n++; }); return n; }
function trendText(s) { const v = Number(s.trendScore); return Number.isFinite(v) ? (v > 0 ? '+' + fmt(v) : fmt(v)) : '–'; }
function loadLiveQuotes() {
  try { return JSON.parse(localStorage.getItem(liveQuotesKey) || '{}'); }
  catch (e) { return {}; }
}
function saveLiveQuotes(q) { localStorage.setItem(liveQuotesKey, JSON.stringify(q || {})); }
function liveQuoteFor(sym) { return loadLiveQuotes()[String(sym || '').toUpperCase()] || null; }
function effectivePrice(s) {
  const q = liveQuoteFor(s.symbol);
  return q && Number.isFinite(Number(q.close)) ? Number(q.close) : Number(s.price);
}
function effectivePercent(s) {
  const q = liveQuoteFor(s.symbol);
  if (q && Number.isFinite(Number(q.close)) && Number.isFinite(Number(q.prevClose)) && Number(q.prevClose) !== 0) return (Number(q.close) - Number(q.prevClose)) / Number(q.prevClose);
  return s.percent;
}
function quoteDate(s) {
  const q = liveQuoteFor(s.symbol);
  return q && q.date ? q.date : null;
}
function stooqSymbol(sym) {
  const raw = String(sym || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw.endsWith('.de')) return raw;
  if (raw.endsWith('.us')) return raw;
  if (raw.includes('.')) return raw;
  return raw + '.us';
}
function parseStooqCsv(text) {
  const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2 || /no data/i.test(text)) throw new Error('Keine Kursdaten');
  const rows = lines.slice(1).map(line => line.split(',')).filter(c => c.length >= 5 && c[0]);
  if (!rows.length) throw new Error('Keine Kursdaten');
  const last = rows[rows.length - 1], prev = rows.length > 1 ? rows[rows.length - 2] : null;
  return { date: last[0], open: Number(last[1]), high: Number(last[2]), low: Number(last[3]), close: Number(last[4]), volume: Number(last[5] || 0), prevClose: prev ? Number(prev[4]) : null, source: 'Stooq' };
}
function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr + 'T12:00:00');
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}
function priceStatus(s) {
  const q = liveQuoteFor(s.symbol);
  if (!q) return { cls: 'priceFallback', text: 'Fallback/fest' };
  if (q.error) return { cls: 'priceStale', text: 'Fehler/Fallback' };
  const age = daysSince(q.date);
  if (age <= 1) return { cls: 'priceFresh', text: 'aktuell' };
  if (age <= 3) return { cls: 'priceWarn', text: 'leicht alt' };
  return { cls: 'priceStale', text: 'alt' };
}
function priceHtml(s, compact=false) {
  const st = priceStatus(s), date = quoteDate(s);
  const line = date ? `${date} · ${st.text}` : st.text;
  return `<span class="${st.cls}">${fmt(effectivePrice(s))}</span>${compact ? '' : `<div class="muted priceDate">${line}</div>`}`;
}
async function fetchStooqQuote(stock) {
  const symbol = stooqSymbol(stock.symbol);
  if (!symbol) throw new Error('Kein Symbol');
  const url = 'https://stooq.com/q/d/l/?s=' + encodeURIComponent(symbol) + '&i=d';
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const text = await res.text();
  return parseStooqCsv(text);
}

function showPage(id) { if(id!=='detail'&&id!=='newsPage'&&id!=='chartPage') previousPage=id; document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); $('#' + id).classList.add('active'); document.querySelectorAll('nav button').forEach(b => b.classList.toggle('activeBtn', b.dataset.page === id)); window.scrollTo(0, 0); }
document.querySelectorAll('nav button').forEach(b => b.onclick = () => showPage(b.dataset.page));
$('#backBtn').onclick = () => showPage(previousPage || 'overview');
if ($('#newsBackBtn')) $('#newsBackBtn').onclick = () => currentDetailSymbol ? detail(currentDetailSymbol) : showPage('overview');
if ($('#chartBackBtn')) $('#chartBackBtn').onclick = () => currentDetailSymbol ? detail(currentDetailSymbol) : showPage('overview');

function initFilters() {
  $('#search').oninput = renderOverview;
  const addBtn = $('#addOverviewBtn');
  if (addBtn) addBtn.onclick = addOverviewStock;
  const updateBtn = $('#updateCoursesBtn');
  if (updateBtn) updateBtn.onclick = updateCourses;
  const removeBtn = $('#removeSelectedOverviewBtn');
  if (removeBtn) removeBtn.onclick = removeSelectedOverviewStocks;
  const symbolInput = $('#addOverviewSymbol');
  if (symbolInput) symbolInput.onkeydown = e => { if (e.key === 'Enter') addOverviewStock(); };
}

function renderOverview() {
  const q = $('#search').value.toLowerCase();
  const body = $('#stockTable tbody');
  let rows = allOverviewStocks().filter(s => ((s.symbol + s.name).toLowerCase().includes(q)));
  body.innerHTML = rows.map(s => `<tr class="${isDepot(s) ? 'inDepotRow' : ''}" onclick="detail('${s.symbol}')">
    <td class="nameCell ${isDepot(s) ? 'depotText' : ''}">${s.name}<div class="muted">${s.symbol}</div></td><td>${priceHtml(s)}</td>
    <td class="${signalClass(effectivePercent(s))}">${pct(effectivePercent(s))}</td><td class="good signalCount">${buyCount(s) || ''}</td><td class="bad signalCount">${sellCount(s) || ''}</td><td class="${signalClass(s.trendScore)}">${trendText(s)}</td>
    <td onclick="event.stopPropagation()"><input class="removeOverviewCheck" type="checkbox" value="${s.symbol}" aria-label="${s.symbol} entfernen"></td>
  </tr>`).join('');
}

function removeSelectedOverviewStocks() {
  const selected = Array.from(document.querySelectorAll('.removeOverviewCheck:checked')).map(x => String(x.value).toUpperCase());
  if (!selected.length) { alert('Bitte mindestens eine Aktie auswählen.'); return; }
  if (!confirm(selected.length + ' Aktie(n) aus der Übersicht entfernen?')) return;
  const sel = new Set(selected);
  const extras = getExtraOverviewStocks().filter(s => !sel.has(String(s.symbol).toUpperCase()));
  saveExtraOverviewStocks(extras);
  const dataSymbols = new Set(DATA.stocks.map(s => String(s.symbol).toUpperCase()));
  const hidden = new Set(getHiddenOverviewSymbols().map(x => String(x).toUpperCase()));
  selected.forEach(sym => { if (dataSymbols.has(sym)) hidden.add(sym); });
  saveHiddenOverviewSymbols(Array.from(hidden));
  renderOverview();
}
window.removeSelectedOverviewStocks = removeSelectedOverviewStocks;


function addOverviewStock() {
  const input = $('#addOverviewSymbol');
  if (!input) return;
  const sym = String(input.value || '').trim().toUpperCase();
  if (!sym) { alert('Bitte ein Symbol eingeben.'); return; }
  if (allOverviewStocks().some(s => String(s.symbol).toUpperCase() === sym)) {
    alert(sym + ' ist bereits in der Übersicht vorhanden.');
    input.value = '';
    return;
  }
  const nameRaw = prompt('Name der Aktie eingeben:', sym);
  if (nameRaw === null) return;
  const extra = {
    symbol: sym,
    name: String(nameRaw || sym).trim() || sym,
    price: null,
    change: null,
    percent: null,
    buy: 0,
    sell: 0,
    trendScore: 0,
    volumeFlag: '',
    history: [],
    signals: {},
    trend: {},
    isManual: true
  };
  const extras = getExtraOverviewStocks();
  extras.push(extra);
  saveExtraOverviewStocks(extras);
  input.value = '';
  renderOverview();
}
window.addOverviewStock = addOverviewStock;

async function updateCourses() {
  const btn = $('#updateCoursesBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Lade Kurse …'; }
  const now = new Date();
  const quotes = loadLiveQuotes();
  const stocks = allOverviewStocks();
  let ok = 0, fail = 0;
  for (const stock of stocks) {
    try {
      const q = await fetchStooqQuote(stock);
      if (!Number.isFinite(Number(q.close))) throw new Error('Ungültiger Kurs');
      quotes[String(stock.symbol).toUpperCase()] = { ...q, updatedAt: now.toISOString(), fallbackPrice: stock.price };
      ok++;
    } catch (e) {
      const prev = quotes[String(stock.symbol).toUpperCase()];
      quotes[String(stock.symbol).toUpperCase()] = { ...(prev || {}), error: String(e.message || e), updatedAt: now.toISOString(), fallbackPrice: stock.price };
      fail++;
    }
  }
  saveLiveQuotes(quotes);
  localStorage.setItem(courseUpdateKey, now.toISOString());
  if (btn) { btn.disabled = false; btn.textContent = 'Update'; }
  renderAll();
  alert(`Kursupdate abgeschlossen: ${ok} erfolgreich, ${fail} Fehler. Fehlerhafte Werte bleiben als Fallback markiert.`);
}
function renderStats() {
  $('#version').textContent = DATA.version || 'V3.12';
  const el = $('#courseTimestamp');
  if (el) {
    const stored = localStorage.getItem(courseUpdateKey);
    const ts = stored ? new Date(stored) : new Date();
    if (!stored) localStorage.setItem(courseUpdateKey, ts.toISOString());
    el.innerHTML = '<b>Letztes Kursupdate: ' + ts.toLocaleString('de-DE') + '</b><span class="muted"> · Quelle: Stooq EOD, Fehler = Fallback</span>';
  }
}

function card(s, mode = 'normal') {
  const showBuy = mode !== 'sell';
  return `<div class="card ${isDepot(s) ? 'inDepot' : ''}"><h3>${s.name} <span class="muted">${s.symbol}</span></h3>
    <div class="grid"><div class="metric">Kurs<br><b>${priceHtml(s)}</b></div><div class="metric">Änderung<br><b class="${signalClass(effectivePercent(s))}">${pct(effectivePercent(s))}</b></div>
    ${showBuy ? `<div class="metric">Kauf<br><b class="good signalCount">${buyCount(s)}</b></div>` : ''}<div class="metric">Verkauf<br><b class="bad signalCount">${sellCount(s)}</b></div><div class="metric">Trend<br><b class="${signalClass(s.trendScore)}">${trendText(s)}</b></div></div>
    <div class="actions"><button onclick="event.stopPropagation(); detail('${s.symbol}')">Detailanalyse</button><button onclick="event.stopPropagation(); addOrRemoveDepot('${s.symbol}')">${isDepot(s) ? 'Depot entfernen' : 'Ins Depot'}</button></div></div>`;
}

function renderLists() {
  $('#buyList').innerHTML = DATA.stocks.filter(buyCount).sort((a, b) => buyCount(b) - buyCount(a)).map(s => card(s, 'buy')).join('') || '<p class="muted">Keine Kaufsignale.</p>';
  $('#sellList').innerHTML = DATA.stocks.filter(sellCount).sort((a, b) => sellCount(b) - sellCount(a)).map(s => card(s, 'sell')).join('') || '<p class="muted">Keine Verkaufssignale.</p>';
  renderDepot();
}

function addOrRemoveDepot(sym) {
  if (depotState.positions[sym]) { removeDepot(sym); return; }
  const s = allOverviewStocks().find(x => x.symbol === sym);
  if (!s) { alert('Symbol nicht gefunden.'); return; }
  const qtyRaw = prompt(`Stückzahl für ${sym} eingeben:`, '1');
  if (qtyRaw === null) return;
  const qty = Number(String(qtyRaw).replace(',', '.'));
  if (!Number.isFinite(qty) || qty <= 0) { alert('Bitte eine gültige Stückzahl eingeben.'); return; }
  const buyPrice = Number(effectivePrice(s) || 0);
  const cost = qty * buyPrice;
  depotState.positions[sym] = { qty, buyPrice };
  depotState.cash = Number(depotState.cash || 0) - cost;
  saveDepot();
}
function removeDepot(sym) {
  const p = depotState.positions[sym];
  const s = DATA.stocks.find(x => x.symbol === sym);
  if (p && s) depotState.cash = Number(depotState.cash || 0) + Number(p.qty || 0) * Number(effectivePrice(s) || 0);
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
    const qty = Number(p.qty || 0), buyPrice = Number(p.buyPrice || 0), price = Number(effectivePrice(s) || 0);
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
    positions.map(x => `<tr><td><b>${x.s.symbol}</b></td><td>${x.s.name}</td><td><input class="miniInput" type="number" step="1" value="${x.qty}" onchange="setDepot('${x.s.symbol}','qty',this.value)"></td><td><input class="miniInput" type="number" step="0.01" value="${x.buyPrice}" onchange="setDepot('${x.s.symbol}','buyPrice',this.value)"></td><td>${priceHtml(x.s)}</td><td>${eur(x.value)}</td><td class="${signalClass(x.gain)}">${eur(x.gain)}</td><td class="${signalClass(x.gain)}">${x.cost ? fmt(x.gain / x.cost * 100) + ' %' : '–'}</td><td class="bad signalCount">${sellCount(x.s) || ''}</td><td class="${signalClass(x.s.trendScore)}">${trendText(x.s)}</td><td><button onclick="removeDepot('${x.s.symbol}')">Entfernen</button></td></tr>`).join('') +
    `</tbody></table></div>` : '<p class="muted">Noch keine Aktien im Depot.</p>');
}

const indicatorDefs = [
  ['GD', 'GD+', 'GD-', 'Kaufsignal durch gleitende Durchschnitte', 'Verkaufssignal durch gleitende Durchschnitte'],
  ['RSI', 'RSI+', 'RSI-', 'RSI zeigt überverkaufte Lage', 'RSI zeigt überkaufte Lage'],
  ['MACD', 'MACD+', 'MACD-', 'MACD bullisch', 'MACD bärisch'],
  ['Momentum', 'Mom+', 'Mom-', 'Momentum positiv', 'Momentum negativ'],
  ['CCI', 'CCI+', 'CCI-', 'CCI bullisch', 'CCI bärisch'],
  ['Pivot', 'Piv+', 'Piv-', 'Kurs über Pivotpunkt', 'Kurs unter Pivotpunkt'],
  ['Trend', 'Trend+', 'Trend-', 'Trend positiv', 'Trend negativ']
];
function indicatorState(sig, def, stock) {
  const [name, plus, minus, plusText, minusText] = def;
  const p = Number(sig[plus] || 0), m = Number(sig[minus] || 0);
  if (p > m) return { name, sign: '+', cls: 'good', text: plusText, type: 'buy' };
  if (m > p) return { name, sign: '−', cls: 'bad', text: minusText, type: 'sell' };
  if (p > 0 && m > 0 && name === 'Trend') {
    const t = Number(stock?.trendScore || 0);
    if (t > 0) return { name, sign: '+', cls: 'good', text: plusText, type: 'buy' };
    if (t < 0) return { name, sign: '−', cls: 'bad', text: minusText, type: 'sell' };
  }
  return { name, sign: '–', cls: '', text: 'neutral', type: 'neutral' };
}
function combinedIndicators(sig, stock) {
  return indicatorDefs.map(def => {
    const x = indicatorState(sig, def, stock);
    return `<div class="metric"><b>${x.name}</b><br><b class="${x.cls}">${x.sign}</b><br><span class="muted">${x.text}</span></div>`;
  }).join('');
}
function activeSignalList(sig, stock, type) {
  const items = indicatorDefs.map(def => indicatorState(sig, def, stock)).filter(x => x.type === type);
  if (!items.length) return '<p class="muted">Keine aktiven Einzelsignale.</p>';
  return `<div class="signalList">${items.map(x => `<div><b class="${x.cls}">${x.name} ${x.sign}</b><span>${x.text}</span></div>`).join('')}</div>`;
}


function externalSymbol(sym) {
  return String(sym || '').replace('.DE', '').replace('.F', '').replace('.AS', '').replace('.PA', '').replace('.MI', '').replace('.SW', '');
}
function googleNewsUrl(stock) {
  const q = encodeURIComponent((stock.name || stock.symbol) + ' ' + stock.symbol + ' Aktie Börse News');
  return 'https://news.google.com/search?q=' + q + '&hl=de&gl=DE&ceid=DE:de';
}
function tradingViewSymbol(stock) {
  const raw = String(stock?.symbol || '').trim().toUpperCase();
  const clean = externalSymbol(raw);
  const group = String(stock?.group || '').toUpperCase();
  if (raw.endsWith('.DE') || group === 'DAX40') return 'XETR:' + clean;
  if (group === 'NASDAQ') return 'NASDAQ:' + clean;
  return clean;
}
function tradingViewUrl(stock) {
  return 'https://www.tradingview.com/chart/?symbol=' + encodeURIComponent(tradingViewSymbol(stock));
}
function showNews(sym) {
  const s = allOverviewStocks().find(x => x.symbol === sym);
  if (!s) return;
  currentDetailSymbol = sym;
  const url = googleNewsUrl(s);
  $('#newsContent').innerHTML = `<h2>Google News <span class="muted">${s.symbol}</span></h2>
    <div class="card">
      <h3>${s.name}</h3>
      <p>Öffnet die aktuellen Google-News zur Aktie in einem neuen Tab. Danach kannst du hier wieder zur Detailanalyse zurückspringen.</p>
      <div class="actions"><a class="buttonLink" href="${url}" target="_blank" rel="noopener">Google News öffnen</a></div>
    </div>`;
  showPage('newsPage');
}
function showTradingView(sym) {
  const s = allOverviewStocks().find(x => x.symbol === sym);
  if (!s) return;
  currentDetailSymbol = sym;
  const tvSymbol = tradingViewSymbol(s);
  const url = tradingViewUrl(s);
  $('#chartContent').innerHTML = `<h2>TradingView <span class="muted">${s.symbol}</span></h2>
    <div class="card">
      <h3>${s.name}</h3>
      <p>Öffnet den Chart der ausgewählten Aktie direkt in TradingView. Verwendetes Symbol: <b>${tvSymbol}</b>.</p>
      <div class="actions"><a class="buttonLink" href="${url}" target="_blank" rel="noopener">TradingView öffnen</a></div>
    </div>`;
  showPage('chartPage');
}
window.showNews = showNews;
window.showTradingView = showTradingView;

function detail(sym) {
  currentDetailSymbol = sym;
  let s = allOverviewStocks().find(x => x.symbol === sym); if (!s) return;
  const sig = s.signals || {};
  $('#detailContent').innerHTML = `<h2>${s.name} <span class="muted">${s.symbol}</span></h2><canvas id="chart" width="900" height="320"></canvas>
    <div class="actions detailActions externalDetailActions">
      <button onclick="showNews('${s.symbol}')">Google News</button>
      <button onclick="showTradingView('${s.symbol}')">TradingView</button>
    </div>
    <div class="grid"><div class="metric">Kurs<br><b>${priceHtml(s)}</b></div><div class="metric">Kauf gesamt<br><b class="good signalCount">${buyCount(s)}</b></div><div class="metric">Verkauf gesamt<br><b class="bad signalCount">${sellCount(s)}</b></div><div class="metric">Trend<br><b class="${signalClass(s.trendScore)}">${trendText(s)}</b></div></div>
    <h3>Aktive Kaufindikatoren</h3>${activeSignalList(sig, s, 'buy')}
    <h3>Aktive Verkaufsindikatoren</h3>${activeSignalList(sig, s, 'sell')}
    <h3>Alle Indikatoren</h3><div class="grid">${combinedIndicators(sig, s)}</div>
    <div class="actions detailActions">
      <button class="depotBigBtn" onclick="addOrRemoveDepot('${s.symbol}')">${isDepot(s) ? 'Depot entfernen' : 'Ins Depot übernehmen'}</button>
    </div>`;
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
