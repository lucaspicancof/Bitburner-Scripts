import { getBestUpgrade } from "/lib/hacknet.js";

/** @param {NS} ns */
export async function main(ns) {

    ns.disableLog("ALL");

    while (true) {

        const upgrades =
            getBestUpgrade(ns);

        const nodes =
            ns.hacknet.numNodes();

        const best =
            upgrades[0];

        let totalProduction = 0;

        for (let i = 0; i < nodes; i++) {

            totalProduction +=
                ns.hacknet.getNodeStats(i).production;
        }

        ns.clearLog();

        ns.print("Hacknet Dashboard");
        ns.print("");

        ns.print(
            `Nodes: ${nodes}`
        );

        ns.print(
            `Production: $${totalProduction.toFixed(2)}/s`
        );

        ns.print("");

        ns.print(
            "Best Upgrade:"
        );

        ns.print(
            `${best.type}`
        );

        ns.print(
            `Node: ${best.node}`
        );

        ns.print(
            `Cost: ${ns.format.number(best.cost)}`
        );

        ns.print("");

        ns.print("Top 10 ROI");

        for (const item of upgrades.slice(0, 10)) {

            ns.print(
                `${item.type.padEnd(10)} ` +
                `${String(item.node).padEnd(3)} ` +
                `${ns.format.number(item.cost)}`
            );
        }

        await ns.sleep(2000);
    }
}
