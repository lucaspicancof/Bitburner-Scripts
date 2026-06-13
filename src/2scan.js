/** @param {NS} ns */
export async function main(ns) {

    const mode = String(ns.args[0] ?? "all").toLowerCase();

    const playerHackLevel = ns.getHackingLevel();

    const portOpeners = [
        "BruteSSH.exe",
        "FTPCrack.exe",
        "relaySMTP.exe",
        "HTTPWorm.exe",
        "SQLInject.exe"
    ];

    const availablePortOpeners =
        portOpeners.filter(program =>
            ns.fileExists(program, "home")
        ).length;

    let servers = scanAll(ns);

    servers = servers.filter(server => {

        const moneyMax =
            ns.getServerMaxMoney(server);

        const hackLevel =
            ns.getServerRequiredHackingLevel(server);

        const portsRequired =
            ns.getServerNumPortsRequired(server);

        return (
            moneyMax > 0 &&
            hackLevel <= playerHackLevel + 100 &&
            portsRequired <= availablePortOpeners &&
            ns.hasRootAccess(server)
        );
    });

    servers = servers.map(server => ({
        server,
        ...analyzeServer(ns, server)
    }));

    if (mode === "ready") {
        servers = servers.filter(s => s.status === "READY");
    }

    if (mode === "prep") {
        servers = servers.filter(s => s.status === "PREP");
    }

    servers.sort((a, b) => b.score - a.score);

    if (mode === "top") {
        servers = servers.slice(0, 10);
    }

    ns.tprint("");
    ns.tprint(
        `Player Hacking: ${playerHackLevel} | Port Openers: ${availablePortOpeners}`
    );
    ns.tprint("");

    ns.tprint(
        "SERVER".padEnd(20) +
        " | " +
        "STATUS".padEnd(5) +
        " | " +
        "SCORE".padStart(10) +
        " | " +
        "CUR%".padStart(6) +
        " | " +
        "CH%".padStart(6) +
        " | " +
        "HK%".padStart(6) +
        " | " +
        "SEC".padStart(5) +
        " | " +
        "MAX".padStart(10) +
        " | " +
        "TIME".padStart(8)
    );

    ns.tprint("-".repeat(105));

    for (const data of servers) {

        ns.tprint(
            data.server.padEnd(20) +
            " | " +
            data.status.padEnd(5) +
            " | " +
            ns.format.number(data.score).padStart(10) +
            " | " +
            `${data.moneyPercent.toFixed(0)}%`.padStart(6) +
            " | " +
            `${data.chance.toFixed(1)}%`.padStart(6) +
            " | " +
            `${data.hackPercent.toFixed(2)}%`.padStart(6) +
            " | " +
            data.securityGap.toFixed(1).padStart(5) +
            " | " +
            ns.format.number(data.maxMoney).padStart(10) +
            " | " +
            data.hackTime.padStart(8)
        );
    }
}

function analyzeServer(ns, server) {

    const maxMoney =
        ns.getServerMaxMoney(server);

    const currentMoney =
        ns.getServerMoneyAvailable(server);

    const moneyRatio =
        maxMoney > 0
            ? currentMoney / maxMoney
            : 0;

    const chance =
        ns.hackAnalyzeChance(server);

    const hackPercent =
        ns.hackAnalyze(server);

    const hackTime =
        ns.getHackTime(server);

    const currentSec =
        ns.getServerSecurityLevel(server);

    const minSec =
        ns.getServerMinSecurityLevel(server);

    const securityGap =
        currentSec - minSec;

    const ready =
        moneyRatio >= 0.90 &&
        securityGap <= 2;

    const score =
        (
            maxMoney *
            moneyRatio *
            chance *
            hackPercent
        ) / hackTime;

    return {
        score,
        maxMoney,
        currentMoney,
        moneyPercent: moneyRatio * 100,
        chance: chance * 100,
        hackPercent: hackPercent * 100,
        securityGap,
        status: ready ? "READY" : "PREP",
        hackTime:
            (hackTime / 1000).toFixed(1) + "s"
    };
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
