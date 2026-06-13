export function getStage(nodeCount) {

    if (nodeCount < 8)
        return "EARLY";

    if (nodeCount < 20)
        return "MID";

    return "LATE";
}

export function getMaxPayback(stage) {

    switch (stage) {

        case "EARLY":
            return 24 * 3600;

        case "MID":
            return 6 * 3600;

        default:
            return 1 * 3600;
    }
}

export function getBalanceScore(nodes) {

    const productions =
        nodes.map(n => n.production);

    const min =
        Math.min(...productions);

    const max =
        Math.max(...productions);

    if (max <= 0)
        return 100;

    return (min / max) * 100;
}

export function formatPayback(seconds) {

    if (!isFinite(seconds))
        return "∞";

    if (seconds < 3600)
        return `${(seconds / 60).toFixed(1)}m`;

    if (seconds < 86400)
        return `${(seconds / 3600).toFixed(1)}h`;

    return `${(seconds / 86400).toFixed(1)}d`;
}

export function getNodeProduction(ns, index) {

    return ns.hacknet.getNodeStats(index).production;
}

export function calculateLevelROI(ns, index) {

    const node =
        ns.hacknet.getNodeStats(index);

    const cost =
        ns.hacknet.getLevelUpgradeCost(index, 1);

    if (!isFinite(cost) || cost <= 0)
        return null;

    const gain =
        node.production / node.level;

    const payback =
        cost / gain;

    return {
        type: "LEVEL",
        node: index,
        cost,
        gain,
        payback
    };
}

export function calculateRamROI(ns, index) {

    const node =
        ns.hacknet.getNodeStats(index);

    const cost =
        ns.hacknet.getRamUpgradeCost(index, 1);

    if (!isFinite(cost) || cost <= 0)
        return null;

    const gain =
        node.production;

    const payback =
        cost / gain;

    return {
        type: "RAM",
        node: index,
        cost,
        gain,
        payback
    };
}

export function calculateCoreROI(ns, index) {

    const node =
        ns.hacknet.getNodeStats(index);

    const cost =
        ns.hacknet.getCoreUpgradeCost(index, 1);

    if (!isFinite(cost) || cost <= 0)
        return null;

    const gain =
        node.production * 0.25;

    const payback =
        cost / gain;

    return {
        type: "CORE",
        node: index,
        cost,
        gain,
        payback
    };
}

export function calculateNodeROI(ns) {

    const cost =
        ns.hacknet.getPurchaseNodeCost();

    if (!isFinite(cost))
        return null;

    const gain = 1;

    return {
        type: "NODE",
        node: -1,
        cost,
        gain,
        payback: cost / gain
    };
}

export function getAllUpgrades(ns) {

    const upgrades = [];

    const count =
        ns.hacknet.numNodes();

    for (let i = 0; i < count; i++) {

        const level =
            calculateLevelROI(ns, i);

        const ram =
            calculateRamROI(ns, i);

        const core =
            calculateCoreROI(ns, i);

        if (level) upgrades.push(level);
        if (ram) upgrades.push(ram);
        if (core) upgrades.push(core);
    }

    const node =
        calculateNodeROI(ns);

    if (node)
        upgrades.push(node);

    upgrades.sort(
        (a, b) => a.payback - b.payback
    );

    return upgrades;
}

export function getBestUpgrade(ns) {

    const upgrades =
        getAllUpgrades(ns);

    if (upgrades.length === 0)
        return null;

    return upgrades[0];
}

export function buyUpgrade(ns, upgrade) {

    switch (upgrade.type) {

        case "LEVEL":
            return ns.hacknet.upgradeLevel(
                upgrade.node,
                1
            );

        case "RAM":
            return ns.hacknet.upgradeRam(
                upgrade.node,
                1
            );

        case "CORE":
            return ns.hacknet.upgradeCore(
                upgrade.node,
                1
            );

        case "NODE":
            return ns.hacknet.purchaseNode();
    }

    return false;
}
