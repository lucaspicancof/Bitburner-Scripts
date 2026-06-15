import { getAllUpgrades, formatPayback } from "/lib/hacknet.js";

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();

    while (true) {
        const upgrades = getAllUpgrades(ns);
        const nodes = ns.hacknet.numNodes();

        let totalProduction = 0;
        for (let i = 0; i < nodes; i++) {
            totalProduction += ns.hacknet.getNodeStats(i).production;
        }

        ns.clearLog();
        ns.print("=== HACKNET DASHBOARD ===");
        ns.print("");
        ns.print(`Nós:      ${nodes}`);
        ns.print(`Produção: ${ns.format.number(totalProduction)}/s`);
        ns.print("");

        if (upgrades.length === 0) {
            ns.print("Tudo maxado — nada a comprar.");
            await ns.sleep(2000);
            continue;
        }

        ns.print("Top ROI (menor payback):");
        ns.print("");
        ns.print(" TIPO    NÓ   CUSTO        +$/s       PAYBACK");
        ns.print("-".repeat(48));

        for (const u of upgrades.slice(0, 10)) {
            ns.print(
                `${u.type.padEnd(7)} ` +
                `${String(u.node < 0 ? "new" : u.node).padEnd(4)} ` +
                `${ns.format.number(u.cost).padStart(10)} ` +
                `${ns.format.number(u.gain).padStart(10)} ` +
                `${formatPayback(u.payback).padStart(8)}`
            );
        }

        await ns.sleep(2000);
    }
}
