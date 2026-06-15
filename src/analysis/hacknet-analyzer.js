import { getAllUpgrades, formatPayback } from "/lib/hacknet.js";

/**
 * Relatório de hacknet: produção, saúde da rede (balanceamento) e plano de
 * compra com ROI exato (via lib/hacknet.js, que usa a Formulas API).
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const nodes = ns.hacknet.numNodes();
    if (nodes === 0) {
        ns.tprint("Nenhum Hacknet Node.");
        return;
    }

    const stats = [];
    let total = 0;
    for (let i = 0; i < nodes; i++) {
        const s = ns.hacknet.getNodeStats(i);
        stats.push({ index: i, production: s.production });
        total += s.production;
    }

    const prods = stats.map(n => n.production).sort((a, b) => a - b);
    const worst = prods[0];
    const best = prods[prods.length - 1];
    const median = prods[Math.floor(prods.length / 2)];
    const balance = best > 0 ? (worst / best) * 100 : 100;

    ns.tprint("");
    ns.tprint("=== HACKNET ANALYZER ===");
    ns.tprint("");
    ns.tprint(`Nós:            ${nodes}`);
    ns.tprint(`Produção:       ${ns.format.number(total)}/s`);
    ns.tprint(`Renda/hora:     ${ns.format.number(total * 3600)}`);
    ns.tprint(`Renda/dia:      ${ns.format.number(total * 86400)}`);
    ns.tprint("");

    ns.tprint("=== SAÚDE DA REDE ===");
    ns.tprint("");
    ns.tprint(`Melhor nó:      ${ns.format.number(best)}/s`);
    ns.tprint(`Pior nó:        ${ns.format.number(worst)}/s`);
    ns.tprint(`Mediana:        ${ns.format.number(median)}/s`);
    ns.tprint(`Balanceamento:  ${balance.toFixed(1)}%`);
    ns.tprint("");

    // --- Plano de compra com ROI exato ---
    const upgrades = getAllUpgrades(ns);

    if (upgrades.length === 0) {
        ns.tprint("Tudo maxado — sem upgrades disponíveis.");
        return;
    }

    ns.tprint("=== MELHOR ROI ===");
    ns.tprint("");
    const top = upgrades[0];
    ns.tprint(`${top.type} #${top.node < 0 ? "novo" : top.node}`);
    ns.tprint(`Custo:    ${ns.format.number(top.cost)}`);
    ns.tprint(`+$/s:     ${ns.format.number(top.gain)}`);
    ns.tprint(`Payback:  ${formatPayback(top.payback)}`);
    ns.tprint("");

    ns.tprint("=== TOP 10 (por payback) ===");
    ns.tprint("");
    ns.tprint(" TIPO    NÓ   CUSTO        PAYBACK");
    ns.tprint("-".repeat(40));
    for (const u of upgrades.slice(0, 10)) {
        ns.tprint(
            `${u.type.padEnd(7)} ` +
            `${String(u.node < 0 ? "new" : u.node).padEnd(4)} ` +
            `${ns.format.number(u.cost).padStart(10)} ` +
            `${formatPayback(u.payback).padStart(8)}`
        );
    }
}
