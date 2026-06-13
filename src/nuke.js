/** @param {NS} ns */
export async function main(ns) {

    const servers = scanAll(ns);

    let nuked = 0;
    let skipped = 0;

    for (const server of servers) {

        if (server === "home")
            continue;

        if (ns.hasRootAccess(server))
            continue;

        const portsRequired =
            ns.getServerNumPortsRequired(server);

        let openedPorts = 0;

        if (ns.fileExists("BruteSSH.exe", "home")) {
            ns.brutessh(server);
            openedPorts++;
        }

        if (ns.fileExists("FTPCrack.exe", "home")) {
            ns.ftpcrack(server);
            openedPorts++;
        }

        if (ns.fileExists("relaySMTP.exe", "home")) {
            ns.relaysmtp(server);
            openedPorts++;
        }

        if (ns.fileExists("HTTPWorm.exe", "home")) {
            ns.httpworm(server);
            openedPorts++;
        }

        if (ns.fileExists("SQLInject.exe", "home")) {
            ns.sqlinject(server);
            openedPorts++;
        }

        if (openedPorts < portsRequired) {

            ns.tprint(
                `[SKIP] ${server} - precisa ${portsRequired} portas`
            );

            skipped++;
            continue;
        }

        try {

            ns.nuke(server);

            if (ns.hasRootAccess(server)) {

                ns.tprint(
                    `[NUKED] ${server}`
                );

                nuked++;
            }
        }
        catch (error) {

            ns.tprint(
                `[ERROR] ${server} - ${error}`
            );
        }
    }

    ns.tprint("");
    ns.tprint("========== RESUMO ==========");
    ns.tprint(`Servidores NUKADOS: ${nuked}`);
    ns.tprint(`Ignorados: ${skipped}`);
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
