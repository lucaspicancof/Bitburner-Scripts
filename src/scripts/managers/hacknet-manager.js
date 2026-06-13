import {
    getStage,
    getMaxPayback,
    formatPayback,
    getBestUpgrade,
    buyUpgrade
}
from "/lib/hacknet.js";

/** @param {NS} ns **/
export async function main(ns) {

    ns.disableLog("ALL");

    try {
        ns.ui.openTail();
    } catch {}

    const RESERVE_MONEY =
        5_000_000_000;

    let purchases = 0;
    let spent = 0;
    let lastPurchase = "None";

    while (true) {

        const money =
            ns.getServerMoneyAvailable("home");

        const nodes =
            ns.hacknet.numNodes();

        const stage =
            getStage(nodes);

        const maxPayback =
            getMaxPayback(stage);

        const best =
            getBestUpgrade(ns);

        ns.clearLog();

        ns.print("");
        ns.print("=== HACKNET MANAGER ===");
        ns.print("");

        ns.print(
            `Stage: ${stage}`
        );

        ns.print(
            `Nodes: ${nodes}`
        );

        ns.print(
            `Money: ${ns.format.number(money)}`
        );

        ns.print(
            `Reserve: ${ns.format.number(RESERVE_MONEY)}`
        );

        ns.print("");

        if (!best) {

            ns.print(
                "No upgrades available."
            );

            await ns.sleep(10000);
            continue;
        }

        ns.print("=== BEST UPGRADE ===");
        ns.print("");

        ns.print(
            `Type: ${best.type}`
        );

        ns.print(
            `Node: ${best.node}`
        );

        ns.print(
            `Cost: ${ns.format.number(best.cost)}`
        );

        ns.print(
            `Gain/s: ${best.gain.toFixed(3)}`
        );

        ns.print(
            `Payback: ${formatPayback(best.payback)}`
        );

        ns.print("");

        const enoughMoney =
            money - best.cost > RESERVE_MONEY;

        const goodPayback =
            best.payback <= maxPayback;

        ns.print("=== CONDITIONS ===");
        ns.print("");

        ns.print(
            `Money OK: ${enoughMoney}`
        );

        ns.print(
            `Payback OK: ${goodPayback}`
        );

        ns.print("");

        if (
            enoughMoney &&
            goodPayback
        ) {

            const success =
                buyUpgrade(ns, best);

            if (success !== false) {

                purchases++;

                spent += best.cost;

                lastPurchase =
                    `${best.type} Node ${best.node}`;

                ns.print("");
                ns.print("PURCHASED");

                ns.print(
                    `${lastPurchase}`
                );

                ns.print(
                    `${ns.format.number(best.cost)}`
                );
            }
        }
        else {

            ns.print("SKIPPED");

            if (!enoughMoney)
                ns.print(
                    "Reason: Reserve protection"
                );

            if (!goodPayback)
                ns.print(
                    `Reason: Payback > ${formatPayback(maxPayback)}`
                );
        }

        ns.print("");
        ns.print("=== STATS ===");
        ns.print("");

        ns.print(
            `Purchases: ${purchases}`
        );

        ns.print(
            `Spent: ${ns.format.number(spent)}`
        );

        ns.print(
            `Last: ${lastPurchase}`
        );

        await ns.sleep(10000);
    }
}
