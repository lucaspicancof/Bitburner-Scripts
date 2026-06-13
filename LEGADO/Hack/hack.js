/**
 * Hack controller with dynamic thread calculation.
 *
 * Replaces small repeated grows with calculated batches:
 * - Grow to a fraction of maxMoney using growthAnalyze
 * - Weaken to offset security from grow/hack
 * - Hack a fraction of current money
 *
 * Usage: run Hack/hack.js [target] [pctMoney=0.75] [secOffset=3] [hackFrac=0.1]
 * - target: target server (default: current host)
 * - pctMoney: fraction of maxMoney to maintain (0..1)
 * - secOffset: threshold above minSec before weakening
 * - hackFrac: fraction of current money to hack when above target
 *
 * Requires: Hack/_g.js, Hack/_h.js, Hack/_w.js (light workers)
 *
 * @param {NS} ns
 */
export async function main(ns) {
  const target = ns.args[0] || ns.getHostname();
  const pctMoney = Number(ns.args[1] ?? 0.75);
  const secOffset = Number(ns.args[2] ?? 3);
  const hackFrac = Number(ns.args[3] ?? 0.1);

  const host = ns.getHostname();

  const W = 'Hack/_w.js';
  const G = 'Hack/_g.js';
  const H = 'Hack/_h.js';

  // Tidy logs
  ns.disableLog('sleep');
  ns.disableLog('getServerSecurityLevel');
  ns.disableLog('getServerMoneyAvailable');
  ns.disableLog('getServerMaxMoney');
  ns.disableLog('getServerMinSecurityLevel');
  ns.disableLog('exec');
  ns.disableLog('getServerMaxRam');
  ns.disableLog('getServerUsedRam');
  ns.disableLog('getScriptRam');
  ns.disableLog('isRunning');

  // Warnings
  const maxMoney0 = ns.getServerMaxMoney(target);
  if (maxMoney0 === 0) ns.tprint(`Aviso: ${target} sem dinheiro (maxMoney=0).`);
  if (!ns.hasRootAccess(target)) ns.tprint(`Aviso: sem root em ${target}.`);

  while (true) {
    const minSec = ns.getServerMinSecurityLevel(target);
    const maxMoney = ns.getServerMaxMoney(target);
    const curSec = ns.getServerSecurityLevel(target);
    const curMoney = Math.max(0, ns.getServerMoneyAvailable(target));

    const secThreshold = minSec + secOffset;
    const moneyTarget = Math.max(1, Math.floor(maxMoney * pctMoney));

    // 1) Weaken down to threshold if needed
    if (curSec > secThreshold) {
      const needW = Math.ceil((curSec - secThreshold) / ns.weakenAnalyze(1));
      ns.print(`Weaken -> sec ${curSec.toFixed(2)} > target ${secThreshold.toFixed(2)} (t=${needW})`);
      if (needW > 0) await runAndWait(ns, W, host, capThreads(ns, host, W, needW), target);
      else await ns.sleep(50);
      continue;
    }

    // 2) Grow up to money target
    if (maxMoney > 0 && curMoney < moneyTarget) {
      const growFactor = moneyTarget / Math.max(1, curMoney);
      let gThreads = Math.ceil(ns.growthAnalyze(target, growFactor));
      gThreads = capThreads(ns, host, G, gThreads);
      if (gThreads < 1) { await ns.sleep(100); continue; }
      const growSec = ns.growthAnalyzeSecurity(gThreads, target);
      let wThreads = Math.ceil(growSec / ns.weakenAnalyze(1));
      wThreads = Math.max(1, capThreads(ns, host, W, wThreads));
      ns.print(`Grow   -> $${Math.floor(curMoney)} -> $${Math.floor(moneyTarget)} (tG=${gThreads}, tW=${wThreads})`);
      await runAndWait(ns, G, host, gThreads, target);
      await runAndWait(ns, W, host, wThreads, target);
      continue;
    }

    // 3) Hack a fraction and neutralize
    const hackAmount = Math.max(1, Math.floor(curMoney * hackFrac));
    let hThreads = Math.floor(ns.hackAnalyzeThreads(target, hackAmount));
    if (!isFinite(hThreads) || hThreads < 1) hThreads = 1;
    hThreads = capThreads(ns, host, H, hThreads);
    const hackSec = ns.hackAnalyzeSecurity(hThreads, target);
    let wThreads = Math.ceil(hackSec / ns.weakenAnalyze(1));
    wThreads = Math.max(1, capThreads(ns, host, W, wThreads));
    ns.print(`Hack   -> ~${(hackFrac*100).toFixed(1)}% (tH=${hThreads}, tW=${wThreads})`);
    await runAndWait(ns, H, host, hThreads, target);
    await runAndWait(ns, W, host, wThreads, target);
  }
}

// Helpers
function capThreads(ns, host, script, desired) {
  const freeRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
  const perThread = ns.getScriptRam(script);
  if (perThread <= 0) return desired; // fallback
  return Math.max(0, Math.min(desired, Math.floor(freeRam / perThread)));
}

async function runAndWait(ns, script, host, threads, target) {
  if (threads < 1) return;
  const pid = ns.exec(script, host, threads, target);
  if (!pid) { await ns.sleep(200); return; }
  while (ns.isRunning(pid)) await ns.sleep(50);
}
