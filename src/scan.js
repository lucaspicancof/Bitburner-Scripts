/** @param {NS} ns */
export async function main(ns) {

    const playerHackLevel = ns.getHackingLevel();

    const portOpeners = [
        "BruteSSH.exe",
        "FTPCrack.exe",
        "relaySMTP.exe",
        "HTTPWorm.exe",
        "SQLInject.exe"
    ];

    const availablePortOpeners =
        portOpeners.filter(program => ns.fileExists(program, "home")).length;

    let servers = scanAll(ns);

    servers = servers.filter(server => {

        const moneyMax = ns.getServerMaxMoney(server);
        const hackLevel = ns.getServerRequiredHackingLevel(server);
        const portsRequired = ns.getServerNumPortsRequired(server);

        return (
            moneyMax > 0 &&
            hackLevel <= playerHackLevel + 100 &&
            portsRequired <= availablePortOpeners &&
            ns.hasRootAccess(server)
        );
    });

    servers.sort((a, b) =>
        calculateScore(ns, b) - calculateScore(ns, a)
    );

    ns.tprint("");
    ns.tprint(
        `Player Hacking: ${playerHackLevel} | Port Openers: ${availablePortOpeners}`
    );
    ns.tprint("");

    ns.tprint(
        "SERVER".padEnd(20) +
        " | " +
        "SCORE".padStart(10) +
        " | " +
        "MAX".padStart(10) +
        " | " +
        "CUR".padStart(10) +
        " | " +
        "GRW".padStart(5) +
        " | " +
        "CH%".padStart(6) +
        " | " +
        "TIME".padStart(8) +
        " | " +
        "HLVL".padStart(5)
    );

    ns.tprint("-".repeat(95));

    for (const server of servers) {

        const score = ns.format.number(
            calculateScore(ns, server)
        );

        const maxMoney = ns.format.number(
            ns.getServerMaxMoney(server)
        );

        const currentMoney = ns.format.number(
            ns.getServerMoneyAvailable(server)
        );

        const growth =
            ns.getServerGrowth(server);

        const chance =
            (ns.hackAnalyzeChance(server) * 100).toFixed(1);

        const hackTime =
            (ns.getHackTime(server) / 1000).toFixed(1) + "s";

        const hackLevel =
            ns.getServerRequiredHackingLevel(server);

        ns.tprint(
            server.padEnd(20) +
            " | " +
            score.padStart(10) +
            " | " +
            maxMoney.padStart(10) +
            " | " +
            currentMoney.padStart(10) +
            " | " +
            String(growth).padStart(5) +
            " | " +
            chance.padStart(6) +
            " | " +
            hackTime.padStart(8) +
            " | " +
            String(hackLevel).padStart(5)
        );
    }
}

function calculateScore(ns, server) {

    const money =
        ns.getServerMaxMoney(server);

    const growth =
        ns.getServerGrowth(server);

    const chance =
        ns.hackAnalyzeChance(server);

    const hackTime =
        ns.getHackTime(server);

    return (
        money *
        growth *
        chance
    ) / hackTime;
}

function scanAll(ns) {

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
