/** @param {NS} ns **/
export async function main(ns) {

    const target = ns.args[0];

    ns.tprint("");
    ns.tprint(`Server: ${target}`);
    ns.tprint("");

    ns.tprint(`Money Max: ${ns.format.number(ns.getServerMaxMoney(target))}`);
    ns.tprint(`Money Current: ${ns.format.number(ns.getServerMoneyAvailable(target))}`);

    ns.tprint(`Min Security: ${ns.getServerMinSecurityLevel(target)}`);
    ns.tprint(`Current Security: ${ns.getServerSecurityLevel(target)}`);

    ns.tprint("");

    ns.tprint(`Hack Chance: ${(ns.hackAnalyzeChance(target)*100).toFixed(2)}%`);
    ns.tprint(`Hack % per thread: ${(ns.hackAnalyze(target)*100).toFixed(4)}%`);

    ns.tprint("");

    ns.tprint(`Hack Time: ${(ns.getHackTime(target)/1000).toFixed(1)}s`);
    ns.tprint(`Grow Time: ${(ns.getGrowTime(target)/1000).toFixed(1)}s`);
    ns.tprint(`Weak Time: ${(ns.getWeakenTime(target)/1000).toFixed(1)}s`);
}
