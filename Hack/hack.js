/**
 * Hack contínuo em um servidor alvo com thresholds configuráveis.
 *
 * Uso: run Hack/hack.js [alvo] [pctDinheiro=0.75] [offsetSeg=3]
 * - alvo: nome do servidor alvo (padrão: host atual)
 * - pctDinheiro: fração do dinheiro máximo a manter (0–1)
 * - offsetSeg: offset acima da segurança mínima antes de enfraquecer
 *
 * @param {NS} ns
 */
export async function main(ns) {
  // Parâmetros e thresholds
  const target = ns.args[0] || ns.getHostname();
  const pctMoney = Number(ns.args[1] ?? 0.75);
  const secOffset = Number(ns.args[2] ?? 3);

  const maxMoney = ns.getServerMaxMoney(target);
  const minSec = ns.getServerMinSecurityLevel(target);
  const moneyThreshold = maxMoney * pctMoney;
  const secThreshold = minSec + secOffset;

  // Logs menos verbosos
  ns.disableLog('sleep');
  ns.disableLog('getServerSecurityLevel');
  ns.disableLog('getServerMoneyAvailable');

  // Avisos úteis
  if (maxMoney === 0) {
    ns.tprint(`Aviso: ${target} não possui dinheiro (hack sem efeito).`);
  }
  if (!ns.hasRootAccess(target)) {
    ns.tprint(`Aviso: sem root em ${target}. Ganhos podem ser nulos/baixos.`);
  }

  // Loop principal: weaken -> grow -> hack
  while (true) {
    const sec = ns.getServerSecurityLevel(target);
    const money = ns.getServerMoneyAvailable(target);

    if (sec > secThreshold) {
      ns.print(`Weaken -> seg ${sec.toFixed(2)} > alvo ${secThreshold.toFixed(2)}`);
      await ns.weaken(target);
    } else if (money < moneyThreshold) {
      ns.print(`Grow   -> $${Math.floor(money)} < alvo $${Math.floor(moneyThreshold)}`);
      await ns.grow(target);
    } else {
      ns.print(`Hack   -> ok (seg ${sec.toFixed(2)}, $${Math.floor(money)})`);
      await ns.hack(target);
    }
  }
}

