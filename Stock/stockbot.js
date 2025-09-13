/**
 * Bot de ações (Stock Market) para Bitburner.
 *
 * Estratégia simples e robusta (apenas posição comprada/long):
 * - Compra quando o forecast ≥ buyThresh e a volatilidade ≤ maxVol.
 * - Vende quando o forecast ≤ sellThresh, ou lucro ≥ takeProfit, ou perda ≤ stopLoss.
 * - Mantém uma reserva mínima de dinheiro e limita o gasto por ativo.
 *
 * Observação: ajuste as constantes abaixo conforme seu apetite de risco.
 * @param {NS} ns
 */
export async function main(ns) {
  // Parâmetros de estratégia
  const buyThresh = 0.65;      // Compra se forecast ≥ 0.65
  const sellThresh = 0.55;     // Vende se forecast ≤ 0.55
  const takeProfit = 0.10;     // Realiza lucro com ≥ 10%
  const stopLoss = -0.07;      // Stop loss com ≤ -7%
  const maxVol = 0.06;         // Volatilidade máxima para comprar
  const reserveCash = 50e6;    // Caixa mínimo a manter
  const perStockFrac = 0.25;   // No máx 25% do excedente por ativo
  const cycleMs = 6000;        // Intervalo do ciclo

  ns.disableLog('sleep');
  ns.disableLog('getServerMoneyAvailable');

  const symbols = ns.stock.getSymbols();
  let cycle = 0;

  while (true) {
    for (const sym of symbols) {
      const [longShares, avgPrice] = ns.stock.getPosition(sym);
      const forecast = ns.stock.getForecast(sym);
      const vol = ns.stock.getVolatility(sym);
      const bid = ns.stock.getBidPrice(sym); // preço de venda
      const ask = ns.stock.getAskPrice(sym); // preço de compra

      if (longShares > 0) {
        const profitPct = avgPrice > 0 ? (bid / avgPrice - 1) : 0;
        if (forecast <= sellThresh || profitPct >= takeProfit || profitPct <= stopLoss) {
          const soldAt = ns.stock.sellStock(sym, longShares);
          ns.print(`SELL ${sym} x${longShares} @ ${fmt2(soldAt ?? bid)} | Pct=${fmtPct(profitPct)} F=${fmtPct(forecast, true)}`);
          await ns.sleep(20);
        }
        continue;
      }

      // Sem posição, avaliar compra
      if (forecast >= buyThresh && vol <= maxVol) {
        const freeCash = Math.max(0, ns.getServerMoneyAvailable('home') - reserveCash);
        if (freeCash <= 0) continue;
        const maxSpend = freeCash * perStockFrac;
        const maxShares = ns.stock.getMaxShares(sym);
        const toBuy = Math.min(Math.floor(maxSpend / ask), maxShares);
        if (toBuy > 0) {
          const paidAt = ns.stock.buyStock(sym, toBuy);
          if (paidAt) ns.print(`BUY  ${sym} x${toBuy} @ ${fmt2(paidAt)} | F=${fmtPct(forecast, true)} V=${fmtPct(vol, true)}`);
          await ns.sleep(20);
        }
      }
    }

    cycle++;
    if (cycle % 10 === 0) printSummary(ns, symbols);
    await ns.sleep(cycleMs);
  }

  function printSummary(ns, symbols) {
    let invested = 0;
    let equity = 0;
    for (const sym of symbols) {
      const [sh, avg] = ns.stock.getPosition(sym);
      if (sh > 0) {
        const bid = ns.stock.getBidPrice(sym);
        invested += sh * avg;
        equity += sh * bid;
      }
    }
    const pnl = equity - invested;
    const pct = invested > 0 ? (pnl / invested) : 0;
    ns.print(`Resumo: Investido=$${fmt(invested)} Equity=$${fmt(equity)} PnL=$${fmt(pnl)} (${fmtPct(pct)})`);
  }

  function fmt(n) {
    if (!isFinite(n)) return String(n);
    const abs = Math.abs(n);
    if (abs >= 1e12) return (n / 1e12).toFixed(2) + 't';
    if (abs >= 1e9)  return (n / 1e9).toFixed(2) + 'b';
    if (abs >= 1e6)  return (n / 1e6).toFixed(2) + 'm';
    if (abs >= 1e3)  return (n / 1e3).toFixed(2) + 'k';
    return n.toFixed(2);
  }

  function fmt2(n) {
    return isFinite(n) ? Number(n).toFixed(2) : String(n);
  }

  function fmtPct(p, asPercent = false) {
    const v = asPercent ? p * 100 : p * 100;
    const s = v >= 0 ? '+' : '';
    return s + v.toFixed(1) + '%';
  }
}

