import fs from 'node:fs/promises';
import vm from 'node:vm';

const DATA_FILE = new URL('../data.js', import.meta.url);
const OUT_FILE = new URL('../prices.json', import.meta.url);
const VERSION = 'V4.0.8-history';

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function yyyymmdd(d) {
  return d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
}
function symbolCandidates(sym) {
  const raw = String(sym || '').trim().toLowerCase();
  if (!raw) return [];
  const out = [raw];
  if (!raw.includes('.')) out.push(raw + '.us');
  // Stooq nutzt fuer deutsche/Xetra-Werte nicht immer die Yahoo-Endung .DE.
  // Deshalb testen wir zusaetzlich das Kuerzel ohne Endung.
  if (raw.endsWith('.de')) out.push(raw.replace(/\.de$/, ''));
  return [...new Set(out)];
}
function stooqUrl(symbol) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 700);
  return `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&d1=${yyyymmdd(start)}&d2=${yyyymmdd(end)}&i=d`;
}
function yahooUrl(symbol) {
  // Yahoo Chart API liefert fuer viele deutsche Werte direkt Symbole wie ADS.DE, BMW.DE usw.
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1d`;
}
function parseCsv(text) {
  const clean = String(text || '').trim();
  if (!clean || /no data/i.test(clean)) throw new Error('Keine Kursdaten');
  const lines = clean.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('Keine Kurszeilen');
  const rows = lines.slice(1)
    .map(line => line.split(','))
    .filter(c => c.length >= 5 && c[0] && c[4] !== 'N/D');
  if (!rows.length) throw new Error('Keine gueltigen Kurszeilen');

  const history = rows.map(c => ({
    date: c[0],
    open: Number(c[1]),
    high: Number(c[2]),
    low: Number(c[3]),
    close: Number(c[4]),
    volume: Number(c[5] || 0)
  })).filter(r => Number.isFinite(r.close));

  if (!history.length) throw new Error('Keine gueltigen historischen Kursdaten');

  const last = history[history.length - 1];
  const prev = history.length > 1 ? history[history.length - 2] : null;

  return {
    date: last.date,
    open: last.open,
    high: last.high,
    low: last.low,
    close: last.close,
    volume: last.volume,
    prevClose: prev ? prev.close : null,
    history,
    historyCount: history.length,
    source: 'Stooq EOD'
  };
}
function parseYahooJson(text, symbol) {
  const data = JSON.parse(text);
  const result = data?.chart?.result?.[0];
  const error = data?.chart?.error;
  if (error) throw new Error(error.description || error.code || 'Yahoo Fehler');
  if (!result) throw new Error('Keine Yahoo-Daten');

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const closes = quote.close || [];
  const opens = quote.open || [];
  const highs = quote.high || [];
  const lows = quote.low || [];
  const volumes = quote.volume || [];

  const history = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = Number(closes[i]);
    if (!Number.isFinite(close)) continue;
    history.push({
      date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      open: Number(opens[i]),
      high: Number(highs[i]),
      low: Number(lows[i]),
      close,
      volume: Number(volumes[i] || 0)
    });
  }

  if (!history.length) throw new Error('Keine gueltigen Yahoo-Kurse');

  const last = history[history.length - 1];
  const prev = history.length > 1 ? history[history.length - 2] : null;

  return {
    date: last.date,
    open: last.open,
    high: last.high,
    low: last.low,
    close: last.close,
    volume: last.volume,
    prevClose: prev ? prev.close : null,
    history,
    historyCount: history.length,
    source: 'Yahoo Finance EOD',
    symbolUsed: symbol
  };
}
async function fetchWithTimeout(url, ms = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Aktientool-GitHub-Action/3.17' } });
  } finally {
    clearTimeout(timer);
  }
}
async function fetchYahooQuote(stock) {
  const symbol = String(stock.symbol || '').trim().toUpperCase();
  if (!symbol) throw new Error('Leeres Symbol');
  const res = await fetchWithTimeout(yahooUrl(symbol));
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status} bei ${symbol}`);
  return parseYahooJson(await res.text(), symbol);
}
async function fetchStooqQuote(stock) {
  const tried = [];
  for (const cand of symbolCandidates(stock.symbol)) {
    tried.push(cand);
    const res = await fetchWithTimeout(stooqUrl(cand));
    if (!res.ok) throw new Error(`Stooq HTTP ${res.status} bei ${cand}`);
    try {
      const q = parseCsv(await res.text());
      q.symbolUsed = cand;
      return q;
    } catch (e) {
      // Naechsten Kandidaten testen
    }
  }
  throw new Error('Keine Stooq-Daten fuer Kandidaten: ' + tried.join(', '));
}
async function fetchQuote(stock) {
  const errors = [];
  try {
    return await fetchYahooQuote(stock);
  } catch (e) {
    errors.push('Yahoo: ' + String(e.message || e));
  }
  try {
    return await fetchStooqQuote(stock);
  } catch (e) {
    errors.push('Stooq: ' + String(e.message || e));
  }
  throw new Error(errors.join(' | '));
}
async function readStocks() {
  const code = await fs.readFile(DATA_FILE, 'utf8');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.window.AKTIEN_DATA?.stocks || [];
}
async function main() {
  const stocks = await readStocks();
  const quotes = {};
  const errors = {};
  let ok = 0;
  for (const stock of stocks) {
    const key = String(stock.symbol || '').toUpperCase();
    try {
      const q = await fetchQuote(stock);
      quotes[key] = { ...q, error: '', updatedAt: new Date().toISOString(), fallbackPrice: stock.price };
      ok++;
      console.log(`OK ${key} ${q.date} ${q.close} (${q.source}, ${q.symbolUsed})`);
    } catch (e) {
      errors[key] = String(e.message || e);
      console.log(`ERR ${key}: ${errors[key]}`);
    }
    await sleep(120);
  }
  const out = {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    source: 'Automatisches EOD-Update via GitHub Action / Yahoo Finance mit Stooq-Fallback',
    symbolsTotal: stocks.length,
    count: Object.keys(quotes).length,
    errorCount: Object.keys(errors).length,
    errors,
    quotes
  };
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n');
  console.log(`Done: ${ok} OK, ${Object.keys(errors).length} Fehler`);
}
main().catch(err => { console.error(err); process.exit(1); });
