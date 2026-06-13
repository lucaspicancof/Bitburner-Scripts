/** @param {NS} ns */
export async function main(ns) {

    const target = ns.args[0];

    if (!target) {
        ns.tprint("Uso: run deploy-prep.js [target]");
        return;
    }

    const servers = scanAll(ns);

    let totalThreads = 0;

    const script = "/scripts/workers/prep.js";
    const scriptRam = ns.getScriptRam(script);

    for (const server of servers) {

        if (!ns.hasRootAccess(server))
            continue;

        const maxRam =
            ns.getServerMaxRam(server);

        const usedRam =
            ns.getServerUsedRam(server);

        const freeRam =
            maxRam - usedRam;

        const threads =
            Math.floor(
                freeRam / scriptRam
            );

        if (threads < 1)
            continue;

        if (server !== "home") {

            await ns.scp(
                script,
                server
            );

            ns.killall(server);

        }

        ns.exec(
            script,
            server,
            threads,
            target
        );

        totalThreads += threads;

        ns.tprint(
            `[PREP] ${server} -> ${target} (${threads} threads)`
        );
    }

    ns.tprint("");
    ns.tprint(
        `Target: ${target}`
    );

    ns.tprint(
        `Threads Totais: ${totalThreads}`
    );
}

function scanAll(ns) {

    const discovered = new Set();
    const queue = ["home"];

    while (queue.length > 0) {

        const server =
            queue.shift();

        if (discovered.has(server))
            continue;

        discovered.add(server);

        for (const neighbor of ns.scan(server)) {

            if (!discovered.has(neighbor)) {

                queue.push(
                    neighbor
                );
            }
        }
    }

    return [...discovered];
}
