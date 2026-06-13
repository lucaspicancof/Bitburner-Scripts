/** @param {NS} ns **/
export async function main(ns) {

    const nodes = ns.hacknet.numNodes();

    if (nodes === 0) {
        ns.tprint("Nenhum Hacknet Node.");
        return;
    }

    const money = ns.getServerMoneyAvailable("home");

    let totalProduction = 0;
    const nodeStats = [];

    for (let i = 0; i < nodes; i++) {

        const node = ns.hacknet.getNodeStats(i);

        totalProduction += node.production;

        nodeStats.push({
            index: i,
            level: node.level,
            ram: node.ram,
            cores: node.cores,
            production: node.production
        });
    }

    const productions = nodeStats
        .map(n => n.production)
        .sort((a, b) => a - b);

    const bestProduction = productions[productions.length - 1];
    const worstProduction = productions[0];

    const averageProduction =
        totalProduction / nodes;

    const medianProduction =
        productions[Math.floor(productions.length / 2)];

    const balanceScore =
        (worstProduction / bestProduction) * 100;

    const gap =
        bestProduction / Math.max(1, worstProduction);

    const upgrades = [];

    for (let i = 0; i < nodes; i++) {

        const stats =
            ns.hacknet.getNodeStats(i);

        const current =
            stats.production;

        // LEVEL
        {
            const cost =
                ns.hacknet.getLevelUpgradeCost(i, 1);

            if (isFinite(cost)) {

                const gain =
                    estimateLevelGain(stats);

                upgrades.push({
                    type: "LEVEL",
                    node: i,
                    cost,
                    gain,
                    payback: cost / Math.max(gain, 0.000001)
                });
            }
        }

        // RAM
        {
            const cost =
                ns.hacknet.getRamUpgradeCost(i, 1);

            if (isFinite(cost)) {

                const gain =
                    estimateRamGain(stats);

                upgrades.push({
                    type: "RAM",
                    node: i,
                    cost,
                    gain,
                    payback: cost / Math.max(gain, 0.000001)
                });
            }
        }

        // CORE
        {
            const cost =
                ns.hacknet.getCoreUpgradeCost(i, 1);

            if (isFinite(cost)) {

                const gain =
                    estimateCoreGain(stats);

                upgrades.push({
                    type: "CORE",
                    node: i,
                    cost,
                    gain,
                    payback: cost / Math.max(gain, 0.000001)
                });
            }
        }
    }

    // NEW NODE
    {
        const cost =
            ns.hacknet.getPurchaseNodeCost();

        upgrades.push({
            type: "NODE",
            node: "-",
            cost,
            gain: 1,
            payback: cost
        });
    }

    upgrades.sort(
        (a, b) => a.payback - b.payback
    );

    const bestUpgrade = upgrades[0];

    const affordable =
        upgrades.filter(x => x.cost <= money);

    const weakNodes =
        [...nodeStats]
            .sort((a, b) => a.production - b.production)
            .slice(0, 5);

    const topNodes =
        [...nodeStats]
            .sort((a, b) => b.production - a.production)
            .slice(0, 5);

    ns.tprint("");
    ns.tprint("=== HACKNET ANALYZER V5 ===");
    ns.tprint("");

    ns.tprint(`Nodes:            ${nodes}`);
    ns.tprint(`Money:            ${ns.format.number(money)}`);
    ns.tprint(`Production:       ${ns.format.number(totalProduction)}/s`);
    ns.tprint("");
    ns.tprint(`Income / Hour:    ${ns.format.number(totalProduction * 3600)}`);
    ns.tprint(`Income / Day:     ${ns.format.number(totalProduction * 86400)}`);
    ns.tprint("");
    ns.tprint("=== NETWORK HEALTH ===");
    ns.tprint("");
    ns.tprint(`Best Node:        ${ns.format.number(bestProduction)}/s`);
    ns.tprint(`Worst Node:       ${ns.format.number(worstProduction)}/s`);
    ns.tprint(`Average:          ${ns.format.number(averageProduction)}/s`);
    ns.tprint(`Median:           ${ns.format.number(medianProduction)}/s`);
    ns.tprint(`Gap:              ${gap.toFixed(1)}x`);
    ns.tprint(`Balance Score:    ${balanceScore.toFixed(2)}%`);
    ns.tprint("");

    if (balanceScore < 10) {
        ns.tprint("Status:           EXTREMELY UNBALANCED");
    } else if (balanceScore < 25) {
        ns.tprint("Status:           UNBALANCED");
    } else if (balanceScore < 50) {
        ns.tprint("Status:           ACCEPTABLE");
    } else {
        ns.tprint("Status:           HEALTHY");
    }

    ns.tprint("");
    ns.tprint("=== TOP PRODUCERS ===");
    ns.tprint("");

    for (const node of topNodes) {
        const percent = (node.production / totalProduction) * 100;
        ns.tprint(
            `#${node.index.toString().padEnd(3)} ` +
            `${ns.format.number(node.production).padStart(10)}/s ` +
            `${percent.toFixed(2)}%`
        );
    }

    ns.tprint("");
    ns.tprint("=== WEAK NODES ===");
    ns.tprint("");

    for (const node of weakNodes) {
        const percent = (node.production / totalProduction) * 100;
        ns.tprint(
            `#${node.index.toString().padEnd(3)} ` +
            `${ns.format.number(node.production).padStart(10)}/s ` +
            `${percent.toFixed(2)}%`
        );
    }

    ns.tprint("");
    ns.tprint("=== BEST ROI ===");
    ns.tprint("");
    ns.tprint(`Type:            ${bestUpgrade.type}`);
    ns.tprint(`Node:            ${bestUpgrade.node}`);
    ns.tprint(`Cost:            ${ns.format.number(bestUpgrade.cost)}`);
    ns.tprint(`Gain/s:          ${bestUpgrade.gain.toFixed(3)}`);
    ns.tprint(`Payback:         ${formatTime(bestUpgrade.payback)}`);
    ns.tprint("");
    ns.tprint("=== BUY PLAN ===");
    ns.tprint("");

    affordable
        .slice(0, 10)
        .forEach((u, i) => {
            ns.tprint(
                `${i + 1}. ` +
                `${u.type.padEnd(5)} ` +
                `Node ${u.node.toString().padEnd(3)} ` +
                `${formatTime(u.payback)}`
            );
        });

    ns.tprint("");
    ns.tprint("=== STRATEGY ===");
    ns.tprint("");

    if (balanceScore < 10) {
        ns.tprint("Upgrade weak nodes first.");
        ns.tprint("Avoid buying new nodes.");
        ns.tprint("Focus: RAM -> LEVEL.");
    } else if (balanceScore < 30) {
        ns.tprint("Balance network gradually.");
    } else {
        ns.tprint("Network is healthy.");
        ns.tprint("Optimize for ROI.");
    }

    ns.tprint("");
}

function estimateLevelGain(stats) {
    return Math.max(stats.production * 0.04, 0.001);
}

function estimateRamGain(stats) {
    return Math.max(stats.production * 0.50, 0.001);
}

function estimateCoreGain(stats) {
    return Math.max(stats.production * 0.25, 0.001);
}

function formatTime(seconds) {
    if (seconds < 3600) return (seconds / 60).toFixed(1) + "m";
    if (seconds < 86400) return (seconds / 3600).toFixed(1) + "h";
    return (seconds / 86400).toFixed(1) + "d";
}
