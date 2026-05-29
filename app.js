const STORAGE_KEY = "aktientool-pwa-v2";
const HISTORY_DAYS = 160;

let state = loadState();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  const prices = {};
  for (const stock of INITIAL_STOCKS) {
    prices[stock.symbol] = demoSeries(seedFromSymbol(stock.symbol), 95, 0.03);
  }

  return {
    selectedSymbol: INITIAL_STOCKS[0]?.symbol || null,
    initialCash: 10000,
    cash: 10000,
    holdings: {},
    trades: [],
    stocks: INITIAL_STOCKS,
    prices,
    lastUpdate: null
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function seedFromSymbol(symbol) {
  let sum = 0;
  for (const ch of symbol) sum += ch.charCodeAt(0);
  return 40 + (sum % 240);
}

function demoSeries(start, count, trend) {
  let arr = [];
  let value = start;
  for (let i = 0; i < count; i++) {
    value += trend + Math.sin(i / 5) * 0.9 + (Math.random() - 0.48) * 1.8;
    arr.push({ date: dateOffset(-(count - i - 1)), close: Number(Math.max(1, value).toFixed(2)) });
  }
  return arr;
}

function dateOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function showPage(name) {
  for (const el of document.querySelectorAll(".page")) el.classList.remove("active");
  document.getElementById(name + "Page").classList.add("active");
  const title = name === "home" ? "Aktientool" : name === "detail" ? "Detailanalyse" : "Depot";
  document.getElementById("pageTitle").textContent = title;
  render();
  window.scrollTo(0, 0);
}

function closes(symbol) {
  return (state.prices[symbol] || []).map(p => Number(p.close)).filter(n => !Number.isNaN(n));
}

function lastPrice(symbol) {
  const p = state.prices[symbol] || [];
  return p.length ? Number(p[p.length - 1].close) : 0;
}

function lastDate(symbol) {
  const p = state.prices[symbol] || [];
  return p.length ? p[p.length - 1].date : "-";
}

function sma(values, period) {
  if (values.length < period) return null;
  const part = values.slice(-period);
  return part.reduce((a, b) => a + b, 0) / period;
}

function ema(values, period) {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let emaValue = sma(values.slice(0, period), period);
  for (let i = period; i < values.length; i++) {
    emaValue = values[i] * k + emaValue * (1 - k);
  }
  return emaValue;
}

function rsi(values, period = 14) {
  if (values.length <= period) return null;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - (100 / (1 + rs));
}

function macd(values) {
  const ema12 = ema(values, 12);
  const ema26 = ema(values, 26);
  if (ema12 === null || ema26 === null) return null;
  return ema12 - ema26;
}

function momentum(values, period = 10) {
  if (values.length <= period) return null;
  return values[values.length - 1] - values[values.length - 1 - period];
}

function indicatorResult(symbol) {
  const values = closes(symbol);
  const last = values[values.length - 1] || 0;
  const sma20 = sma(values, 20);
  const sma50 = sma(values, 50);
  const rsi14 = rsi(values, 14);
  const macdValue = macd(values);
  const mom10 = momentum(values, 10);
  const indicators = [];

  if (sma20 !== null && sma50 !== null) {
    indicators.push({
      name: "Trend SMA20/SMA50",
      value: `SMA20 ${sma20.toFixed(2)} / SMA50 ${sma50.toFixed(2)}`,
      buy: last > sma20 && sma20 > sma50,
      sell: last < sma20 && sma20 < sma50
    });
  }

  if (rsi14 !== null) {
    indicators.push({
      name: "RSI14",
      value: rsi14.toFixed(2),
      buy: rsi14 < 35,
      sell: rsi14 > 70
    });
  }

  if (macdValue !== null) {
    indicators.push({
      name: "MACD",
      value: macdValue.toFixed(2),
      buy: macdValue > 0,
      sell: macdValue < 0
    });
  }

  if (mom10 !== null) {
    indicators.push({
      name: "Momentum 10",
      value: mom10.toFixed(2),
      buy: mom10 > 0,
      sell: mom10 < 0
    });
  }

  const buyHits = indicators.filter(i => i.buy).length;
  const sellHits = indicators.filter(i => i.sell).length;
  let signal = "Halten";
  if (buyHits >= 2 && buyHits > sellHits) signal = "Kaufen";
  if (sellHits >= 2 && sellHits > buyHits) signal = "Verkaufen";
  return { last, indicators, buyHits, sellHits, signal };
}

function signalClass(signal) {
  if (signal === "Kaufen") return "buy";
  if (signal === "Verkaufen") return "sell";
  return "hold";
}

function openDetail(symbol) {
  state.selectedSymbol = symbol;
  saveState();
  showPage("detail");
}

function addStock() {
  const symbol = document.getElementById("symbolInput").value.trim().toUpperCase();
  const name = document.getElementById("nameInput").value.trim();
  const startPrice = Number(document.getElementById("startPriceInput").value || seedFromSymbol(symbol || "X"));
  if (!symbol || !name) return alert("Bitte Ticker und Name eingeben.");
  if (state.stocks.some(s => s.symbol === symbol)) return alert("Ticker existiert bereits.");

  state.stocks.push({ symbol, name });
  state.prices[symbol] = demoSeries(startPrice, 95, 0.02);
  state.selectedSymbol = symbol;
  saveState();
  render();
}

function removeStock(symbol) {
  if (!confirm(`${symbol} wirklich löschen?`)) return;
  state.stocks = state.stocks.filter(s => s.symbol !== symbol);
  delete state.prices[symbol];
  delete state.holdings[symbol];
  if (state.selectedSymbol === symbol) state.selectedSymbol = state.stocks[0]?.symbol || null;
  saveState();
  render();
}

function stooqCandidates(symbol) {
  const s = symbol.toLowerCase();
  const noDot = s.replace(".de", "");
  if (s.endsWith(".de")) return [s, noDot + ".de"];
  if (s.endsWith(".us")) return [s];
  return [s + ".us", s];
}

async function fetchStooq(symbol) {
  const candidates = stooqCandidates(symbol);
  for (const c of candidates) {
    const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(c)}&i=d`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const text = await res.text();
      const parsed = parseStooqCsv(text);
      if (parsed.length >= 30) return parsed.slice(-HISTORY_DAYS);
    } catch (e) {
      continue;
    }
  }
  return null;
}

function parseStooqCsv(text) {
  const rows = text.trim().split(/\r?\n/);
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split(",");
    if (cols.length < 5) continue;
    const date = cols[0];
    const close = Number(cols[4]);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && close > 0) out.push({ date, close });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

async function updateAllPrices() {
  const btn = document.getElementById("updateButton");
  const status = document.getElementById("statusLine");
  btn.disabled = true;
  btn.textContent = "Lade...";
  let ok = 0, fail = 0;

  for (let i = 0; i < state.stocks.length; i++) {
    const stock = state.stocks[i];
    if (status) status.textContent = `Lade Kurse ${i + 1}/${state.stocks.length}: ${stock.symbol}`;
    const data = await fetchStooq(stock.symbol);
    if (data && data.length) {
      state.prices[stock.symbol] = data;
      ok++;
    } else {
      fail++;
    }
    if (i % 8 === 0) {
      saveState();
      renderStockList();
    }
  }

  state.lastUpdate = new Date().toLocaleString("de-DE");
  saveState();
  btn.disabled = false;
  btn.textContent = "Kurse laden";
  if (status) status.textContent = `Kursupdate fertig: ${ok} geladen, ${fail} ohne neue Daten. Letztes Update: ${state.lastUpdate}`;
  render();
}

function addPrice() {
  const symbol = state.selectedSymbol;
  const date = document.getElementById("priceDate").value || dateOffset(0);
  const close = Number(document.getElementById("priceClose").value);
  if (!close || close <= 0) return alert("Bitte gültigen Schlusskurs eingeben.");
  state.prices[symbol] = state.prices[symbol] || [];
  state.prices[symbol].push({ date, close });
  state.prices[symbol].sort((a, b) => a.date.localeCompare(b.date));
  saveState();
  render();
}

function importPricesFromTextarea() {
  const symbol = state.selectedSymbol;
  const text = document.getElementById("csvInput").value.trim();
  if (!symbol || !text) return;
  const rows = text.split(/\n/).map(line => line.trim()).filter(Boolean);
  const parsed = [];
  for (const row of rows) {
    const parts = row.includes(";") ? row.split(";") : row.split(",");
    if (parts.length < 2) continue;
    const date = parts[0].trim();
    const close = Number(parts[1].trim().replace(",", "."));
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && close > 0) parsed.push({ date, close });
  }
  if (!parsed.length) return alert("Keine gültigen Zeilen gefunden. Format: 2026-05-29;123.45");
  state.prices[symbol] = parsed.sort((a, b) => a.date.localeCompare(b.date));
  saveState();
  render();
}

function buySelected() {
  const symbol = state.selectedSymbol;
  const qty = Number(document.getElementById("tradeQty")?.value || 1);
  const price = lastPrice(symbol);
  const cost = qty * price;
  if (!symbol || qty <= 0) return;
  if (state.cash < cost) return alert("Nicht genug virtuelles Guthaben.");
  state.cash -= cost;
  state.holdings[symbol] = (state.holdings[symbol] || 0) + qty;
  state.trades.push({ date: dateOffset(0), type: "Kauf", symbol, qty, price });
  saveState();
  render();
}

function sellSelected() {
  const symbol = state.selectedSymbol;
  const qty = Number(document.getElementById("tradeQty")?.value || 1);
  const price = lastPrice(symbol);
  if (!symbol || qty <= 0) return;
  if ((state.holdings[symbol] || 0) < qty) return alert("Nicht genug Stücke im Musterdepot.");
  state.cash += qty * price;
  state.holdings[symbol] -= qty;
  if (state.holdings[symbol] <= 0) delete state.holdings[symbol];
  state.trades.push({ date: dateOffset(0), type: "Verkauf", symbol, qty, price });
  saveState();
  render();
}

function portfolioValue() {
  let stockValue = 0;
  for (const [symbol, qty] of Object.entries(state.holdings)) stockValue += qty * lastPrice(symbol);
  return { cash: state.cash, stockValue, total: state.cash + stockValue, profit: state.cash + stockValue - state.initialCash };
}

function filteredStocks() {
  const q = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const filter = document.getElementById("filterSelect")?.value || "all";
  const sort = document.getElementById("sortSelect")?.value || "signal";
  let list = state.stocks.filter(s => {
    const res = indicatorResult(s.symbol);
    const owned = (state.holdings[s.symbol] || 0) > 0;
    const matches = s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    if (!matches) return false;
    if (filter === "buy") return res.signal === "Kaufen";
    if (filter === "sell") return res.signal === "Verkaufen";
    if (filter === "hold") return res.signal === "Halten";
    if (filter === "owned") return owned;
    return true;
  });

  list.sort((a, b) => {
    const ra = indicatorResult(a.symbol);
    const rb = indicatorResult(b.symbol);
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "symbol") return a.symbol.localeCompare(b.symbol);
    return (rb.buyHits - rb.sellHits) - (ra.buyHits - ra.sellHits) || a.name.localeCompare(b.name);
  });

  return list;
}

function renderStockList() {
  const el = document.getElementById("stockList");
  if (!el) return;
  const list = filteredStocks();
  if (!list.length) {
    el.innerHTML = "<p>Keine passenden Aktien gefunden.</p>";
    return;
  }

  el.innerHTML = list.map(stock => {
    const res = indicatorResult(stock.symbol);
    const qty = state.holdings[stock.symbol] || 0;
    return `
      <div class="stock-row">
        <div class="stock-main">
          <strong>${stock.symbol}</strong> – ${stock.name}<br>
          <span class="small">Kurs ${res.last.toFixed(2)} · Datum ${lastDate(stock.symbol)} · Kauf ${res.buyHits} / Verkauf ${res.sellHits}${qty ? ` · Depot: ${qty} Stk.` : ""}</span><br>
          <span class="badge ${signalClass(res.signal)}">${res.signal}</span>
        </div>
        <button class="small" onclick="openDetail('${stock.symbol}')">Details</button>
        <button class="small danger" onclick="removeStock('${stock.symbol}')">Löschen</button>
      </div>
    `;
  }).join("");
}

function miniChartSvg(symbol) {
  const values = closes(symbol).slice(-80);
  if (values.length < 2) return "<p>Zu wenige Kursdaten für Chart.</p>";
  const w = 720, h = 180, pad = 12;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = pad + i * ((w - pad * 2) / (values.length - 1));
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <polyline points="${points}" fill="none" stroke="currentColor" stroke-width="3"/>
  </svg>`;
}

function renderDetail() {
  const el = document.getElementById("detailPanel");
  if (!el) return;
  const symbol = state.selectedSymbol;
  const stock = state.stocks.find(s => s.symbol === symbol);
  if (!symbol || !stock) {
    el.innerHTML = "<p>Keine Aktie ausgewählt.</p>";
    return;
  }

  const res = indicatorResult(symbol);
  const rows = res.indicators.map(i => {
    const status = i.buy ? "Kauf-Treffer" : i.sell ? "Verkauf-Treffer" : "Neutral";
    const cls = i.buy ? "buy" : i.sell ? "sell" : "neutral";
    return `<tr><td>${i.name}</td><td>${i.value}</td><td><span class="badge ${cls}">${status}</span></td></tr>`;
  }).join("");

  const priceRows = (state.prices[symbol] || []).slice(-10).reverse().map(p =>
    `<tr><td>${p.date}</td><td>${Number(p.close).toFixed(2)}</td></tr>`
  ).join("");

  el.innerHTML = `
    <h2>${stock.name} (${symbol})</h2>
    <div class="kpi">
      <div><span class="small">Letzter Kurs</span><br><strong>${res.last.toFixed(2)}</strong></div>
      <div><span class="small">Datum</span><br><strong>${lastDate(symbol)}</strong></div>
      <div><span class="small">Signal</span><br><span class="badge ${signalClass(res.signal)}">${res.signal}</span></div>
      <div><span class="small">Treffer</span><br><strong>K ${res.buyHits} / V ${res.sellHits}</strong></div>
    </div>

    ${miniChartSvg(symbol)}

    <h3>Indikatoren</h3>
    <table><thead><tr><th>Indikator</th><th>Wert</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>

    <h3>Handel Musterdepot</h3>
    <div class="grid-3">
      <input id="tradeQty" type="number" value="1" min="1" step="1">
      <button onclick="buySelected()">Kaufen</button>
      <button class="secondary" onclick="sellSelected()">Verkaufen</button>
    </div>

    <h3>Kursdaten ergänzen</h3>
    <div class="grid-3">
      <input id="priceDate" type="date" value="${dateOffset(0)}">
      <input id="priceClose" type="number" step="0.01" placeholder="Schlusskurs">
      <button onclick="addPrice()">Kurs hinzufügen</button>
    </div>

    <h4>CSV-Import</h4>
    <p class="hint">Format pro Zeile: 2026-05-29;123.45</p>
    <textarea id="csvInput" placeholder="2026-05-27;120.50&#10;2026-05-28;121.30&#10;2026-05-29;122.10"></textarea>
    <button onclick="importPricesFromTextarea()">Kurse für diese Aktie ersetzen</button>

    <h4>Letzte 10 Kurse</h4>
    <table><thead><tr><th>Datum</th><th>Schlusskurs</th></tr></thead><tbody>${priceRows}</tbody></table>
  `;
}

function renderPortfolio() {
  const el = document.getElementById("portfolioPanel");
  if (!el) return;
  const val = portfolioValue();

  const positions = Object.entries(state.holdings).map(([symbol, qty]) => {
    const stock = state.stocks.find(s => s.symbol === symbol);
    const price = lastPrice(symbol);
    const res = indicatorResult(symbol);
    const sellWarning = res.signal === "Verkaufen"
      ? `<span class="badge sell">Verkaufssignal</span>`
      : `<span class="badge ${signalClass(res.signal)}">${res.signal}</span>`;
    return `
      <div class="portfolio-row">
        <div><strong>${symbol}</strong> – ${stock?.name || ""}<br><span class="small">${qty} Stück × ${price.toFixed(2)} = ${(qty * price).toFixed(2)}</span></div>
        <div>${sellWarning}</div>
        <button class="small" onclick="openDetail('${symbol}')">Details</button>
      </div>
    `;
  }).join("");

  const trades = state.trades.slice(-12).reverse().map(t =>
    `<tr><td>${t.date}</td><td>${t.type}</td><td>${t.symbol}</td><td>${t.qty}</td><td>${t.price.toFixed(2)}</td></tr>`
  ).join("");

  el.innerHTML = `
    <div class="kpi">
      <div><span class="small">Cash</span><br><strong>${val.cash.toFixed(2)}</strong></div>
      <div><span class="small">Aktienwert</span><br><strong>${val.stockValue.toFixed(2)}</strong></div>
      <div><span class="small">Gesamtwert</span><br><strong>${val.total.toFixed(2)}</strong></div>
      <div><span class="small">Gewinn/Verlust</span><br><strong>${val.profit.toFixed(2)}</strong></div>
    </div>

    <h3>Positionen mit Verkaufssignal</h3>
    ${positions || "<p>Keine Positionen vorhanden.</p>"}

    <h3>Letzte Transaktionen</h3>
    <table>
      <thead><tr><th>Datum</th><th>Typ</th><th>Aktie</th><th>Stück</th><th>Kurs</th></tr></thead>
      <tbody>${trades || "<tr><td colspan='5'>Noch keine Transaktionen</td></tr>"}</tbody>
    </table>
  `;
}

function render() {
  renderStockList();
  renderDetail();
  renderPortfolio();
}

document.getElementById("homeButton").addEventListener("click", () => showPage("home"));
document.getElementById("portfolioButton").addEventListener("click", () => showPage("portfolio"));
document.getElementById("backFromDetail").addEventListener("click", () => showPage("home"));
document.getElementById("backFromPortfolio").addEventListener("click", () => showPage("home"));
document.getElementById("addStockButton").addEventListener("click", addStock);
document.getElementById("updateButton").addEventListener("click", updateAllPrices);
document.getElementById("searchInput").addEventListener("input", renderStockList);
document.getElementById("filterSelect").addEventListener("change", renderStockList);
document.getElementById("sortSelect").addEventListener("change", renderStockList);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

showPage("home");
