const DATA = window.AKTIEN_DATA || { stocks: [] };
const $ = s => document.querySelector(s);
const fmt = n => n == null || n === '' || !Number.isFinite(Number(n)) ? '–' : Number(n).toLocaleString('de-DE', { maximumFractionDigits: 2 });
const eur = n => n == null || !Number.isFinite(Number(n)) ? '–' : Number(n).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const pct = n => n == null || n === '' || !Number.isFinite(Number(n)) ? '–' : (Number(n) * 100).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' %';
const depotKey = 'aktientool_v34_depot'; // bewusst beibehalten, damit V3.4-Depotdaten erhalten bleiben
const overviewExtraKey = 'aktientool_v36_overview_extra';
const overviewHiddenKey = 'aktientool_v37_overview_hidden';
const courseUpdateKey = 'aktientool_v38_course_timestamp';
const liveQuotesKey = 'aktientool_v315_auto_quotes';
const startCash = 10000;
let depotState = JSON.parse(localStorage.getItem(depotKey) || `{"cash":${startCash},"positions":{}}`);
let currentDetailSymbol = null;
let previousPage='overview';
let autoPriceData = { generatedAt: null, source: 'prices.json', quotes: {} };

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
function isDepot(s) {
  const p = depotState.positions[s.symbol];
  return Array.isArray(p) ? p.length > 0 : !!p;
}
function signalClass(v) { return Number(v) > 0 ? 'good' : Number(v) < 0 ? 'bad' : ''; }
function sellCount(s) { let n = Number(s.sell || 0); const sig = s.signals || {}; Object.keys(sig).forEach(k => { if (k.includes('-') && Number(sig[k]) > 0) n++; }); return n; }
function buyCount(s) { let n = Number(s.buy || 0); const sig = s.signals || {}; Object.keys(sig).forEach(k => { if (k.includes('+') && Number(sig[k]) > 0) n++; }); return n; }
function trendText(s) { const v = Number(s.trendScore); return Number.isFinite(v) ? (v > 0 ? '+' + fmt(v) : fmt(v)) : '–'; }
function loadLiveQuotes() {
  return autoPriceData && autoPriceData.quotes ? autoPriceData.quotes : {};
}
function saveLiveQuotes(q) {
  autoPriceData.quotes = q || {};
}
function liveQuoteFor(sym) {
  return loadLiveQuotes()[String(sym || '').toUpperCase()] || null;
}
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
async function loadAutoPrices() {
  const el = $('#updateStatus');
  try {
    if (el) { el.textContent = 'Lade automatische Kursdatei …'; el.className = 'updateStatus warn'; }
    const res = await fetch('prices.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('prices.json HTTP ' + res.status);
    const data = await res.json();
    autoPriceData = { generatedAt: data.generatedAt || null, source: data.source || 'Automatisches EOD-Update', quotes: data.quotes || {}, symbolsTotal: data.symbolsTotal || 0, errorCount: data.errorCount || 0 };
    const count = Object.keys(autoPriceData.quotes || {}).length;
    if (el) { el.textContent = count ? `Automatische Kursdatei geladen: ${count} Werte` : 'Automatische Kursdatei noch leer · GitHub Action starten/prüfen'; el.className = 'updateStatus ' + (count ? 'good' : 'warn'); }
  } catch (e) {
    autoPriceData = { generatedAt: null, source: 'prices.json', quotes: {} };
    if (el) { el.textContent = 'Keine automatische Kursdatei geladen · Fixdaten aus Datei'; el.className = 'updateStatus bad'; }
  }
  renderAll();
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
function dateOnly(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function isWeekday(d) { const day = d.getDay(); return day !== 0 && day !== 6; }
function expectedTradingDate(now = new Date()) {
  let d = dateOnly(now);
  // Nach Börsenschluss wäre der heutige Handelstag erwartbar, davor der vorherige Werktag.
  if (d.getDay() !== 0 && d.getDay() !== 6 && now.getHours() < 19) d.setDate(d.getDate() - 1);
  while (!isWeekday(d)) d.setDate(d.getDate() - 1);
  return d;
}
function tradingDaysBehind(dateStr) {
  if (!dateStr) return Infinity;
  const quote = dateOnly(new Date(dateStr + 'T12:00:00'));
  const expected = expectedTradingDate();
  if (quote >= expected) return 0;
  let missed = 0, d = new Date(quote);
  d.setDate(d.getDate() + 1);
  while (d <= expected) { if (isWeekday(d)) missed++; d.setDate(d.getDate() + 1); }
  return missed;
}
function hasCourseUpdateRun() { return !!localStorage.getItem(courseUpdateKey); }
function setUpdateStatus(text, cls = '') {
  const el = $('#updateStatus');
  if (el) { el.textContent = text || ''; el.className = 'updateStatus ' + cls; }
}
function priceStatus(s) {
  const q = liveQuoteFor(s.symbol);
  if (!q) return { cls: 'priceFixed', text: 'Fixdaten/kein EOD-Wert' };
  if (q.error) return { cls: 'priceStale', text: 'Fehler/Fallback' };
  const missed = tradingDaysBehind(q.date);
  if (missed <= 0) return { cls: 'priceFresh', text: 'aktuell' };
  if (missed === 1) return { cls: 'priceWarn', text: '1 Handelstag alt' };
  return { cls: 'priceStale', text: missed + ' Handelstage alt' };
}
function priceHtml(s, compact=false) {
  const st = priceStatus(s), date = quoteDate(s);
  const line = date ? `${date} · ${st.text}` : st.text;
  return `<span class="${st.cls}">${fmt(effectivePrice(s))}</span>${compact ? '' : `<div class="muted priceDate">${line}</div>`}`;
}
function yyyymmdd(d) {
  return d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
}
function stooqDailyUrl(symbol) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 21);
  return 'https://stooq.com/q/d/l/?s=' + encodeURIComponent(symbol) + '&d1=' + yyyymmdd(start) + '&d2=' + yyyymmdd(end) + '&i=d';
}
function fetchWithTimeout(url, ms = 6500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { cache: 'no-store', signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function fetchTextWithFallback(url) {
  // Auf iPhone/iPad blockt Safari direkte Stooq-Aufrufe oft per CORS.
  // Deshalb zuerst kleine Proxy-Abrufe, direkter Stooq-Abruf nur als letzter Versuch.
  const urls = [
    { name: 'AllOrigins', url: 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url) },
    { name: 'CorsProxy', url: 'https://corsproxy.io/?' + encodeURIComponent(url) },
    { name: 'CodeTabs', url: 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url) },
    { name: 'Direkt', url }
  ];
  let lastError = null;
  for (const item of urls) {
    try {
      const res = await fetchWithTimeout(item.url);
      if (!res.ok) throw new Error(item.name + ' HTTP ' + res.status);
      const text = await res.text();
      if (text && !/no data/i.test(text) && /date/i.test(text)) return { text, source: item.name };
      lastError = new Error(item.name + ': Keine Kursdaten');
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('Kursdaten nicht erreichbar');
}

async function fetchStooqQuote(stock) {
  const symbol = stooqSymbol(stock.symbol);
  if (!symbol) throw new Error('Kein Symbol');
  const url = stooqDailyUrl(symbol);
  const result = await fetchTextWithFallback(url);
  const quote = parseStooqCsv(result.text);
  quote.source = 'Stooq via ' + result.source;
  return quote;
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
  const removeBtn = $('#removeSelectedOverviewBtn');
  if (removeBtn) removeBtn.onclick = removeSelectedOverviewStocks;
  const symbolInput = $('#addOverviewSymbol');
  if (symbolInput) symbolInput.onkeydown = e => { if (e.key === 'Enter') addOverviewStock(); };
  const indicatorSearch = $('#indicatorSearch');
  if (indicatorSearch) indicatorSearch.oninput = renderIndicators;
}


function renderOverview() {
  const q = $('#search').value.toLowerCase();
  const body = $('#stockTable tbody');
  let rows = allOverviewStocks().filter(s => ((s.symbol + s.name).toLowerCase().includes(q)));
  body.innerHTML = rows.map(s => `<tr class="${isDepot(s) ? 'inDepotRow' : ''}" onclick="detail('${s.symbol}')">
    <td class="nameCell ${isDepot(s) ? 'depotText' : ''}">${s.name}<div class="muted">${s.symbol}</div></td>
    <td>${priceHtml(s, true)}</td>
    <td class="${signalClass(effectivePercent(s))}">${pct(effectivePercent(s))}</td>
    <td class="good signalCount">${buyCount(s) || ''}</td>
    <td class="bad signalCount">${sellCount(s) || ''}</td>
    <td class="${signalClass(s.trendScore)}">${trendText(s)}</td>
    <td><span class="pill">${s.group || '–'}</span></td>
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
  // V3.22+: Manuelles Browser-Update wurde bewusst entfernt.
  // Die Kurse werden automatisch per GitHub Action in prices.json aktualisiert.
  setUpdateStatus('Automatisches EOD-Update aktiv · kein manuelles Update nötig', 'good');
}

function renderStats() {
  $('#version').textContent = 'V4.0.5';
  const el = $('#courseTimestamp');
  if (el) {
    const count = Object.keys((autoPriceData && autoPriceData.quotes) || {}).length;
    const errCount = (autoPriceData && autoPriceData.errorCount) || 0;
    if (autoPriceData && autoPriceData.generatedAt && count) {
      const ts = new Date(autoPriceData.generatedAt);
      el.innerHTML = '<b>Kursstand: ' + ts.toLocaleString('de-DE') + '</b><span class="muted"> · Quelle: Automatisches EOD-Update · Werte: ' + count + ' · Fehler: ' + errCount + ' · Fehler/alte Daten = farbig markiert</span>';
    } else {
      el.innerHTML = '<b>Noch kein automatisches Kursupdate vorhanden</b><span class="muted"> · Fixdaten aus Datei · GitHub Action muss prices.json noch erzeugen</span>';
    }
  }
}

function card(s, mode = 'normal') {
  return `<div class="card signalCard compactSignalCard ${isDepot(s) ? 'inDepot' : ''}"><h3>${s.name}<br><span class="muted">${s.symbol}</span></h3>
    <div class="compactLine priceChangeLine"><b>${priceHtml(s, true)}</b><b class="${signalClass(effectivePercent(s))}">${pct(effectivePercent(s))}</b></div>
    <div class="compactLine signalLine"><span>Kauf: <b class="good signalCount">${buyCount(s)}</b></span><span>Verkauf: <b class="bad signalCount">${sellCount(s)}</b></span><span>Trend: <b class="${signalClass(s.trendScore)}">${trendText(s)}</b></span></div>
    <div class="actions"><button onclick="event.stopPropagation(); detail('${s.symbol}')">Detailanalyse</button><button onclick="event.stopPropagation(); addOrRemoveDepot('${s.symbol}')">Ins Depot</button></div></div>`;
}

function renderLists() {
  $('#buyList').innerHTML = DATA.stocks.filter(buyCount).sort((a, b) => buyCount(b) - buyCount(a)).map(s => card(s, 'buy')).join('') || '<p class="muted">Keine Kaufsignale.</p>';
  renderDepot();
  renderIndicators();
}

function addOrRemoveDepot(sym) {
  const s = allOverviewStocks().find(x => x.symbol === sym);
  if (!s) { alert('Symbol nicht gefunden.'); return; }
  const qtyRaw = prompt(`Stückzahl für ${sym} eingeben:`, '1');
  if (qtyRaw === null) return;
  const qty = Number(String(qtyRaw).replace(',', '.'));
  if (!Number.isFinite(qty) || qty <= 0) { alert('Bitte eine gültige Stückzahl eingeben.'); return; }
  const buyPrice = Number(effectivePrice(s) || 0);
  const cost = qty * buyPrice;
  const pos = { qty, buyPrice, buyDate: new Date().toISOString().slice(0, 10) };
  const existing = depotState.positions[sym];
  if (Array.isArray(existing)) existing.push(pos);
  else if (existing) depotState.positions[sym] = [existing, pos];
  else depotState.positions[sym] = [pos];
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
function sellDepot(sym) {
  const p = depotState.positions[sym];
  const s = DATA.stocks.find(x => x.symbol === sym);
  if (!p || !s) { alert('Position nicht gefunden.'); return; }
  const list = Array.isArray(p) ? p : [p];
  const currentQty = list.reduce((a,x)=>a+Number(x.qty||0),0);
  if (!Number.isFinite(currentQty) || currentQty <= 0) { alert('Keine Stückzahl im Depot vorhanden.'); return; }
  const qtyRaw = prompt(`Stückzahl für Verkauf ${sym} eingeben:`, String(currentQty));
  if (qtyRaw === null) return;
  const sellQty = Number(String(qtyRaw).replace(',', '.'));
  if (!Number.isFinite(sellQty) || sellQty <= 0) { alert('Bitte eine gültige Stückzahl eingeben.'); return; }
  if (sellQty > currentQty) { alert(`Maximal verfügbar: ${fmt(currentQty)} Stück.`); return; }
  const price = Number(effectivePrice(s) || 0);
  if (!Number.isFinite(price) || price <= 0) { alert('Kein gültiger Tageskurs für den Verkauf vorhanden.'); return; }
  const proceeds = sellQty * price;
  depotState.cash = Number(depotState.cash || 0) + proceeds;
  const remaining = currentQty - sellQty;
  if (remaining <= 0.0000001) {
    delete depotState.positions[sym];
  } else {
    const first = list[0];
    first.qty = remaining;
    depotState.positions[sym] = [first];
  }
  saveDepot();
}
function setDepot(sym, index, k, v) {
  const list = Array.isArray(depotState.positions[sym]) ? depotState.positions[sym] : (depotState.positions[sym] ? [depotState.positions[sym]] : []);
  const p = list[Number(index) || 0];
  if (!p) return;
  p[k] = Number(String(v).replace(',', '.')) || 0;
  depotState.positions[sym] = list;
  saveDepot();
}
function resetDepot() {
  if (!confirm('Depot wirklich zurücksetzen? Cash wird auf 10.000 € gesetzt und alle Aktien werden gelöscht.')) return;
  depotState = { cash: startCash, positions: {} };
  saveDepot();
}
window.resetDepot = resetDepot;

function portfolioTotals() {
  const positions = [];
  Object.entries(depotState.positions).forEach(([sym, raw]) => {
    const s = DATA.stocks.find(x => x.symbol === sym) || allOverviewStocks().find(x => x.symbol === sym);
    if (!s) return;
    const list = Array.isArray(raw) ? raw : [raw];
    list.forEach((p, index) => {
      const qty = Number(p.qty || 0), buyPrice = Number(p.buyPrice || 0), price = Number(effectivePrice(s) || 0);
      const value = qty * price, cost = qty * buyPrice, gain = value - cost;
      positions.push({ s, p, index, qty, buyPrice, price, value, cost, gain });
    });
  });
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
  (positions.length ? `<div class="tablewrap"><table class="depotTable"><thead><tr><th>Symbol</th><th>Aktie</th><th>Stück</th><th>Kaufkurs</th><th>Kaufdatum</th><th>Aktuell</th><th>Wert</th><th>G/V €</th><th>G/V %</th><th>Trend</th><th>VK</th><th>Aktion</th></tr></thead><tbody>` +
    positions.map(x => `<tr class="depotClickable" onclick="detail('${x.s.symbol}')"><td><b>${x.s.symbol}</b></td><td>${x.s.name}</td><td><span class="lockedQty">${fmt(x.qty)}</span></td><td><input class="miniInput" type="number" step="0.01" value="${x.buyPrice}" onclick="event.stopPropagation()" onchange="setDepot('${x.s.symbol}',${x.index},'buyPrice',this.value)"></td><td>${x.p.buyDate || '–'}</td><td>${priceHtml(x.s)}</td><td>${eur(x.value)}</td><td class="${signalClass(x.gain)}">${eur(x.gain)}</td><td class="${signalClass(x.gain)}">${x.cost ? fmt(x.gain / x.cost * 100) + ' %' : '–'}</td><td class="${signalClass(x.s.trendScore)}">${trendText(x.s)}</td><td class="bad signalCount">${sellCount(x.s) || ''}</td><td><button class="sellBtn" onclick="event.stopPropagation(); sellDepot('${x.s.symbol}')">Verkaufen</button></td></tr>`).join('') +
    `</tbody></table></div>` : '<p class="muted">Noch keine Aktien im Depot.</p>');
}

const indicatorDefs = [
  ['GD', 'GD+', 'GD-', 'Kaufsignal durch gleitende Durchschnitte', 'Verkaufssignal durch gleitende Durchschnitte'],
  ['RSI', 'RSI+', 'RSI-', 'RSI zeigt überverkaufte Lage', 'RSI zeigt überkaufte Lage'],
  ['MACD', 'MACD+', 'MACD-', 'MACD bullisch', 'MACD bärisch'],
  ['Mom.', 'Mom+', 'Mom-', 'Mom. positiv', 'Mom. negativ'],
  ['CCI', 'CCI+', 'CCI-', 'CCI bullisch', 'CCI bärisch'],
  ['Pivot', 'Piv+', 'Piv-', 'Kurs über Pivotpunkt', 'Kurs unter Pivotpunkt'],
  ['Trend', 'Trend+', 'Trend-', 'Trend positiv', 'Trend negativ']
];
const indicatorTableDefs = indicatorDefs.filter(def => def[0] !== 'Trend');
function indicatorState(sig, def, stock) {
  const [name, plus, minus, plusText, minusText] = def;
  const p = Number(sig[plus] || 0), m = Number(sig[minus] || 0);
  if (p > m) return { name, sign: '+', cls: 'good', text: plusText, type: 'buy' };
  if (m > p) return { name, sign: '-', cls: 'bad', text: minusText, type: 'sell' };
  if (p > 0 && m > 0 && name === 'Trend') {
    const t = Number(stock?.trendScore || 0);
    if (t > 0) return { name, sign: '+', cls: 'good', text: plusText, type: 'buy' };
    if (t < 0) return { name, sign: '-', cls: 'bad', text: minusText, type: 'sell' };
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

function indicatorCell(stock, def) {
  const x = indicatorState(stock.signals || {}, def, stock);
  if (x.type === 'buy') return `<td class="indicatorMark good">+</td>`;
  if (x.type === 'sell') return `<td class="indicatorMark bad">-</td>`;
  return '<td class="indicatorMark"></td>';
}

function renderIndicators() {
  const body = $('#indicatorTable tbody');
  if (!body) return;
  const q = String($('#indicatorSearch')?.value || '').toLowerCase();
  const rows = allOverviewStocks().filter(s => ((s.symbol + s.name).toLowerCase().includes(q)));
  body.innerHTML = rows.map(s => `<tr class="${isDepot(s) ? 'inDepotRow' : ''}" onclick="detail('${s.symbol}')">
    <td class="nameCell ${isDepot(s) ? 'depotText' : ''}">${s.name}<div class="muted">${s.symbol}</div></td>
    <td class="${signalClass(effectivePercent(s))}">${pct(effectivePercent(s))}</td>
    ${indicatorTableDefs.map(def => indicatorCell(s, def)).join('')}
  </tr>`).join('');
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
function openExternalUrl(url) {
  const win = window.open(url, '_blank', 'noopener');
  if (!win) window.location.href = url;
}
function showNews(sym) {
  const s = allOverviewStocks().find(x => x.symbol === sym);
  if (!s) return;
  openExternalUrl(googleNewsUrl(s));
}
function showTradingView(sym) {
  const s = allOverviewStocks().find(x => x.symbol === sym);
  if (!s) return;
  openExternalUrl(tradingViewUrl(s));
}
window.showNews = showNews;
window.showTradingView = showTradingView;

function detail(sym) {
  currentDetailSymbol = sym;
  let s = allOverviewStocks().find(x => x.symbol === sym); if (!s) return;
  const sig = s.signals || {};
  $('#detailContent').innerHTML = `<h2>${s.name} <span class="muted">${s.symbol}</span></h2><canvas id="chart" width="900" height="320"></canvas>
    <div class="actions detailActions externalDetailActions">
      <a class="buttonLink" href="${googleNewsUrl(s)}" target="_blank" rel="noopener">Google News</a>
      <a class="buttonLink" href="${tradingViewUrl(s)}" target="_blank" rel="noopener">TradingView</a>
    </div>
    <div class="detailCompactBox">
      <div class="compactLine priceChangeLine"><span>Kurs: <b>${priceHtml(s, true)}</b></span><b class="${signalClass(effectivePercent(s))}">${pct(effectivePercent(s))}</b></div>
      <div class="compactLine signalLine"><span>Kauf: <b class="good signalCount">${buyCount(s)}</b></span><span>Verkauf: <b class="bad signalCount">${sellCount(s)}</b></span><span>Trend: <b class="${signalClass(s.trendScore)}">${trendText(s)}</b></span></div>
      <div class="muted priceDate">${quoteDate(s) ? quoteDate(s) + ' · ' + priceStatus(s).text + ' · ' + ((liveQuoteFor(s.symbol) || {}).source || autoPriceData.source || 'Automatisches EOD-Update') : priceStatus(s).text}</div>
    </div>
    <h3>Aktive Kaufindikatoren</h3>${activeSignalList(sig, s, 'buy')}
    <h3>Aktive Verkaufsindikatoren</h3>${activeSignalList(sig, s, 'sell')}
    <h3>Alle Indikatoren</h3><div class="grid">${combinedIndicators(sig, s)}</div>
    <div class="actions detailActions">
      <button class="depotBigBtn" onclick="addOrRemoveDepot('${s.symbol}')">In Depot aufnehmen</button>
    </div>`;
  showPage('detail'); const lg=document.getElementById('chartLegend'); if(lg){lg.innerHTML='<span>🟢/🔴 M=MACD</span><span>R=RSI</span><span>C=CCI</span><span>P=Pivot</span><span>T=Trend</span><span>Mo=Mom.</span>'; } drawChart(s.history || [], s);
}

function drawChart(points, stock) {
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
  if(stock){
    const gd50=ys.reduce((a,b)=>a+b,0)/ys.length;
    const gd200=gd50*0.97;
    const resistance=max*0.98;
    const support=min*1.02;
    const line=(v,color)=>{ctx.strokeStyle=color;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(pad,yFor(v));ctx.lineTo(w-pad,yFor(v));ctx.stroke();ctx.setLineDash([]);}
    line(gd50,'#22c55e'); line(gd200,'#f59e0b'); line(resistance,'#ef4444'); line(support,'#10b981');
    const buy=buyCount(stock), sell=sellCount(stock);
    const amp=buy>sell?'🟢 Aufwärtstrend':sell>buy?'🔴 Abwärtstrend':'🟡 Neutral';
    ctx.fillStyle='#fff'; ctx.fillText('Trendampel: '+amp, pad+10, 18);
    const sigs=['M','R','C','P','T'];
    sigs.forEach((sg,i)=>{let x=pad+40+i*40; let y=40; ctx.fillStyle=i%2?'#ef4444':'#22c55e'; ctx.fillText((i%2?'🔴':'🟢')+sg,x,y);});
  }
}

function renderMovers() {
  const box = $('#moversContent');
  if (!box) return;
  const rows = allOverviewStocks()
    .map(s => ({ s, price: effectivePrice(s), percent: effectivePercent(s) }))
    .filter(x => Number.isFinite(Number(x.percent)))
    .sort((a, b) => Number(b.percent) - Number(a.percent));
  const top = rows.slice(0, 5);
  const flop = rows.slice(-5).reverse();
  const table = (title, list) => `<div class="card moverCard"><h3>${title}</h3><table class="moverTable"><thead><tr><th>Aktie</th><th>Kurs</th><th>%</th><th>News</th></tr></thead><tbody>` +
    list.map(x => `<tr onclick="detail('${x.s.symbol}')"><td class="nameCell">${x.s.name}<div class="muted">${x.s.symbol}</div></td><td>${priceHtml(x.s, true)}</td><td class="${signalClass(x.percent)}">${pct(x.percent)}</td><td onclick="event.stopPropagation()"><a class="buttonLink newsMini" href="${googleNewsUrl(x.s)}" target="_blank" rel="noopener">📰</a></td></tr>`).join('') +
    `</tbody></table></div>`;
  box.innerHTML = rows.length ? table('📈 Top 5 Gewinner', top) + table('📉 Top 5 Verlierer', flop) : '<p class="muted">Keine Kursänderungen vorhanden.</p>';
}

function renderAll() { renderStats(); renderOverview(); renderLists(); renderMovers(); }
initFilters(); renderAll(); loadAutoPrices();
