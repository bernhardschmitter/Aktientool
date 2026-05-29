const STORAGE_KEY = "aktientool-pwa-grundlogik-v1";

let state = loadState();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  return {
    selectedSymbol: "AAPL",
    initialCash: 10000,
    cash: 10000,
    holdings: {},
    trades: [],
    stocks: [
      { symbol: "AAPL", name: "Apple" },
      { symbol: "MSFT", name: "Microsoft" },
      { symbol: "SAP.DE", name: "SAP" }
    ],
    prices: {
      "AAPL": demoSeries(170, 90, 0.25),
      "MSFT": demoSeries(390, 90, 0.18),
      "SAP.DE": demoSeries(175, 90, 0.12)
    }
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetDemo() {
  if (!confirm("Alle lokalen Daten löschen und Demo neu laden?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  render();
}

function demoSeries(start, count, trend) {
  let arr = [];
  let value = start;
  for (let i = 0; i < count; i++) {
    value += trend + Math.sin(i / 5) * 0.9 + (Math.random() - 0.48) * 1.8;
    arr.push({
      date: dateOffset(-(count - i - 1)),
      close: Number(value.toFixed(2))
    });
  }
  return arr;
}

function dateOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function closes(symbol) {
  return (state.prices[symbol] || []).map(p => Number(p.close)).filter(n => !Number.isNaN(n));
}

function lastPrice(symbol) {
  const p = state.prices[symbol] || [];
  return p.length ? Number(p[p.length - 1].close) : 0;
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

  return { last, sma20, sma50, rsi14, macdValue, mom10, indicators, buyHits, sellHits, signal };
}

function signalClass(signal) {
  if (signal === "Kaufen") return "buy";
  if (signal === "Verkaufen") return "sell";
  return "hold";
}

function addStock() {
  const symbol = document.getElementById("symbolInput").value.trim().toUpperCase();
  const name = document.getElementById("nameInput").value.trim();
  const startPrice = Number(document.getElementById("startPriceInput").value || 100);

  if (!symbol || !name) {
    alert("Bitte Ticker und Name eingeben.");
    return;
  }

  if (state.stocks.some(s => s.symbol === symbol)) {
    alert("Ticker existiert bereits.");
    return;
  }

  state.stocks.push({ symbol, name });
  state.prices[symbol] = demoSeries(startPrice, 90, 0.05);
  state.selectedSymbol = symbol;
  saveState();
  render();
}

function selectStock(symbol) {
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

function addPrice() {
  const symbol = state.selectedSymbol;
  if (!symbol) return;
  const date = document.getElementById("priceDate").value || dateOffset(0);
  const close = Number(document.getElementById("priceClose").value);

  if (!close || close <= 0) {
    alert("Bitte gültigen Schlusskurs eingeben.");
    return;
  }

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

    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && close > 0) {
      parsed.push({ date, close });
    }
  }

  if (!parsed.length) {
    alert("Keine gültigen Zeilen gefunden. Format: 2026-05-29;123.45");
    return;
  }

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
  if (state.cash < cost) {
    alert("Nicht genug virtuelles Guthaben.");
    return;
  }

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
  if ((state.holdings[symbol] || 0) < qty) {
    alert("Nicht genug Stücke im Musterdepot.");
    return;
  }

  state.cash += qty * price;
  state.holdings[symbol] -= qty;
  if (state.holdings[symbol] <= 0) delete state.holdings[symbol];
  state.trades.push({ date: dateOffset(0), type: "Verkauf", symbol, qty, price });
  saveState();
  render();
}

function portfolioValue() {
  let stockValue = 0;
  for (const [symbol, qty] of Object.entries(state.holdings)) {
    stockValue += qty * lastPrice(symbol);
  }
  return {
    cash: state.cash,
    stockValue,
    total: state.cash + stockValue,
    profit: state.cash + stockValue - state.initialCash
  };
}

function renderStockList() {
  const el = document.getElementById("stockList");
  if (!state.stocks.length) {
    el.innerHTML = "<p>Keine Aktien vorhanden.</p>";
    return;
  }

  el.innerHTML = state.stocks.map(stock => {
    const res = indicatorResult(stock.symbol);
    const active = stock.symbol === state.selectedSymbol ? "active" : "";
    return `
      <div class="stock-row ${active}">
        <div>
          <strong>${stock.symbol}</strong> – ${stock.name}<br>
          <span class="small">Kurs ${res.last.toFixed(2)} | Treffer Kauf ${res.buyHits}, Verkauf ${res.sellHits}</span><br>
          <span class="badge ${signalClass(res.signal)}">${res.signal}</span>
        </div>
        <div>
          <button class="small" onclick="selectStock('${stock.symbol}')">Öffnen</button>
          <button class="small danger" onclick="removeStock('${stock.symbol}')">Löschen</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderAnalysis() {
  const el = document.getElementById("analysisPanel");
  const symbol = state.selectedSymbol;
  if (!symbol) {
    el.innerHTML = "Bitte eine Aktie auswählen.";
    return;
  }

  const stock = state.stocks.find(s => s.symbol === symbol);
  const res = indicatorResult(symbol);

  const rows = res.indicators.map(i => {
    const status = i.buy ? "Kauf-Treffer" : i.sell ? "Verkauf-Treffer" : "Neutral";
    const cls = i.buy ? "buy" : i.sell ? "sell" : "neutral";
    return `<tr><td>${i.name}</td><td>${i.value}</td><td><span class="badge ${cls}">${status}</span></td></tr>`;
  }).join("");

  el.innerHTML = `
    <h3>${stock?.name || symbol} (${symbol})</h3>
    <div class="kpi">
      <div><span class="small">Letzter Kurs</span><br><strong>${res.last.toFixed(2)}</strong></div>
      <div><span class="small">Kauf-Treffer</span><br><strong>${res.buyHits}</strong></div>
      <div><span class="small">Signal</span><br><span class="badge ${signalClass(res.signal)}">${res.signal}</span></div>
    </div>

    <table>
      <thead><tr><th>Indikator</th><th>Wert</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <h4>Handel Musterdepot</h4>
    <div class="grid-3">
      <input id="tradeQty" type="number" value="1" min="1" step="1">
      <button onclick="buySelected()">Kaufen</button>
      <button class="secondary" onclick="sellSelected()">Verkaufen</button>
    </div>

    <p class="hint">Signalregel: Mindestens 2 Indikatoren müssen gleichzeitig in dieselbe Richtung zeigen.</p>
  `;
}

function renderPriceEditor() {
  const el = document.getElementById("priceEditor");
  const symbol = state.selectedSymbol;
  if (!symbol) {
    el.innerHTML = "Bitte eine Aktie auswählen.";
    return;
  }

  const priceRows = (state.prices[symbol] || []).slice(-10).reverse().map(p => 
    `<tr><td>${p.date}</td><td>${Number(p.close).toFixed(2)}</td></tr>`
  ).join("");

  el.innerHTML = `
    <h3>Kursdaten für ${symbol}</h3>
    <div class="grid-3">
      <input id="priceDate" type="date" value="${dateOffset(0)}">
      <input id="priceClose" type="number" step="0.01" placeholder="Schlusskurs">
      <button onclick="addPrice()">Kurs hinzufügen</button>
    </div>

    <h4>CSV-Import</h4>
    <p class="hint">Format pro Zeile: 2026-05-29;123.45</p>
    <textarea id="csvInput" placeholder="2026-05-27;120.50&#10;2026-05-28;121.30&#10;2026-05-29;122.10"></textarea>
    <button onclick="importPricesFromTextarea()">Kurse für ausgewählte Aktie ersetzen</button>

    <h4>Letzte 10 Kurse</h4>
    <table>
      <thead><tr><th>Datum</th><th>Schlusskurs</th></tr></thead>
      <tbody>${priceRows}</tbody>
    </table>
  `;
}

function renderPortfolio() {
  const el = document.getElementById("portfolioPanel");
  const val = portfolioValue();

  const positions = Object.entries(state.holdings).map(([symbol, qty]) => {
    const price = lastPrice(symbol);
    return `
      <div class="portfolio-row">
        <div><strong>${symbol}</strong><br><span class="small">${qty} Stück × ${price.toFixed(2)}</span></div>
        <div><strong>${(qty * price).toFixed(2)}</strong></div>
      </div>
    `;
  }).join("");

  const trades = state.trades.slice(-8).reverse().map(t =>
    `<tr><td>${t.date}</td><td>${t.type}</td><td>${t.symbol}</td><td>${t.qty}</td><td>${t.price.toFixed(2)}</td></tr>`
  ).join("");

  el.innerHTML = `
    <div class="kpi">
      <div><span class="small">Cash</span><br><strong>${val.cash.toFixed(2)}</strong></div>
      <div><span class="small">Aktienwert</span><br><strong>${val.stockValue.toFixed(2)}</strong></div>
      <div><span class="small">Gewinn/Verlust</span><br><strong>${val.profit.toFixed(2)}</strong></div>
    </div>

    <h3>Positionen</h3>
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
  renderAnalysis();
  renderPriceEditor();
  renderPortfolio();
}

document.getElementById("addStockButton").addEventListener("click", addStock);
document.getElementById("resetButton").addEventListener("click", resetDemo);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

render();
