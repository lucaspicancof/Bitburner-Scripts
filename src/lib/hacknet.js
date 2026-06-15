/**
 * ROI de upgrades de hacknet com matemática EXATA via Formulas API.
 *
 * O ganho marginal de cada upgrade é a diferença real de produção:
 *   gain = moneyGainRate(depois) − moneyGainRate(antes)
 * escalada pelo multiplicador efetivo do nó (derivado da produção atual, então
 * inclui mults do jogador E do BitNode sem precisar consultá-los à parte).
 */

export function formatPayback(seconds) {
    if (!isFinite(seconds)) return "∞";
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
    return `${(seconds / 86400).toFixed(1)}d`;
}

/**
 * Multiplicador efetivo de produção de um nó: produção real ÷ taxa base.
 * Robusto a BitNode mults (não assume BN1).
 */
function effectiveMult(ns, stats) {
    const base = ns.formulas.hacknetNodes.moneyGainRate(
        stats.level, stats.ram, stats.cores, 1
    );
    return base > 0 ? stats.production / base : 1;
}

function rate(ns, level, ram, cores, mult) {
    return ns.formulas.hacknetNodes.moneyGainRate(level, ram, cores, mult);
}

/**
 * Todos os upgrades possíveis (level/ram/core de cada nó + novo nó), com
 * ganho e payback exatos, ordenados por payback crescente. Descarta ganhos
 * não-positivos (ex: nó já maxado).
 *
 * @param {NS} ns
 */
export function getAllUpgrades(ns) {
    const upgrades = [];
    const fm = ns.formulas.hacknetNodes;
    const count = ns.hacknet.numNodes();

    for (let i = 0; i < count; i++) {
        const s = ns.hacknet.getNodeStats(i);
        const mult = effectiveMult(ns, s);
        const cur = s.production;

        const lvlCost = ns.hacknet.getLevelUpgradeCost(i, 1);
        if (isFinite(lvlCost) && lvlCost > 0) {
            const gain = rate(ns, s.level + 1, s.ram, s.cores, mult) - cur;
            upgrades.push({ type: "LEVEL", node: i, cost: lvlCost, gain, payback: lvlCost / gain });
        }

        // Upgrade de RAM dobra a RAM do nó.
        const ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
        if (isFinite(ramCost) && ramCost > 0) {
            const gain = rate(ns, s.level, s.ram * 2, s.cores, mult) - cur;
            upgrades.push({ type: "RAM", node: i, cost: ramCost, gain, payback: ramCost / gain });
        }

        const coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
        if (isFinite(coreCost) && coreCost > 0) {
            const gain = rate(ns, s.level, s.ram, s.cores + 1, mult) - cur;
            upgrades.push({ type: "CORE", node: i, cost: coreCost, gain, payback: coreCost / gain });
        }
    }

    // Comprar um novo nó (produção de um nó fresco: level 1, ram 1, cores 1).
    const nodeCost = ns.hacknet.getPurchaseNodeCost();
    if (isFinite(nodeCost)) {
        const mult = ns.getPlayer().mults.hacknet_node_money || 1;
        const gain = fm.moneyGainRate(1, 1, 1, mult);
        upgrades.push({
            type: "NODE", node: -1, cost: nodeCost, gain,
            payback: gain > 0 ? nodeCost / gain : Infinity
        });
    }

    return upgrades
        .filter(u => u.gain > 0 && isFinite(u.payback))
        .sort((a, b) => a.payback - b.payback);
}

/** Melhor upgrade (menor payback) ou null. */
export function getBestUpgrade(ns) {
    const u = getAllUpgrades(ns);
    return u.length ? u[0] : null;
}

/** Executa a compra de um upgrade. Retorna o resultado da API. */
export function buyUpgrade(ns, upgrade) {
    switch (upgrade.type) {
        case "LEVEL": return ns.hacknet.upgradeLevel(upgrade.node, 1);
        case "RAM": return ns.hacknet.upgradeRam(upgrade.node, 1);
        case "CORE": return ns.hacknet.upgradeCore(upgrade.node, 1);
        case "NODE": return ns.hacknet.purchaseNode();
    }
    return false;
}
