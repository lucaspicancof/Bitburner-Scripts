/**
 * Retorna todos os servidores da rede
 * @param {NS} ns
 */
export function scanAll(ns) {

    const discovered = new Set();
    const queue = ["home"];

    while (queue.length > 0) {

        const server = queue.shift();

        if (discovered.has(server))
            continue;

        discovered.add(server);

        for (const neighbor of ns.scan(server)) {

            if (!discovered.has(neighbor)) {
                queue.push(neighbor);
            }
        }
    }

    return [...discovered];
}

/**
 * Analisa um servidor
 * @param {NS} ns
 * @param {string} server
 */
export function analyzeServer(ns, server) {

    const maxMoney =
        ns.getServerMaxMoney(server);

    const currentMoney =
        ns.getServerMoneyAvailable(server);

    const currentSecurity =
        ns.getServerSecurityLevel(server);

    const minSecurity =
        ns.getServerMinSecurityLevel(server);

    const moneyRatio =
        maxMoney > 0
            ? currentMoney / maxMoney
            : 0;

    const securityGap =
        currentSecurity - minSecurity;

    const chance =
        ns.hackAnalyzeChance(server);

    const hackPercent =
        ns.hackAnalyze(server);

    const hackTime =
        ns.getHackTime(server);

    const growTime =
        ns.getGrowTime(server);

    const weakenTime =
        ns.getWeakenTime(server);

    return {
        server,

        maxMoney,
        currentMoney,

        moneyRatio,

        currentSecurity,
        minSecurity,
        securityGap,

        chance,
        hackPercent,

        hackTime,
        growTime,
        weakenTime,

        growth:
            ns.getServerGrowth(server),

        hackingLevel:
            ns.getServerRequiredHackingLevel(server),

        rooted:
            ns.hasRootAccess(server)
    };
}
