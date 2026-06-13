/** @param {NS} ns **/
export async function main(ns) {

    const target =
        ns.args[0];

    const hosts =
        scanAll(ns);

    const scripts = [

        "/scripts/workers/hack.js",
        "/scripts/workers/grow.js",
        "/scripts/workers/weaken.js"
    ];

    for (const host of hosts) {

        if (!ns.hasRootAccess(host))
            continue;

        if (host === "home")
            continue;

        await ns.scp(
            scripts,
            host
        );

        const ram =
            ns.getServerMaxRam(host);

        const used =
            ns.getServerUsedRam(host);

        const free =
            ram - used;

        const cost =
            ns.getScriptRam(
                "/scripts/workers/hack.js"
            );

        const threads =
            Math.floor(
                free / cost
            );

        if (threads <= 0)
            continue;

        ns.exec(

            "/scripts/workers/hack.js",

            host,

            threads,

            target
        );
    }
}

function scanAll(ns) {

    const visited =
        new Set(["home"]);

    const queue =
        ["home"];

    while (queue.length > 0) {

        const current =
            queue.shift();

        for (const next of ns.scan(current)) {

            if (visited.has(next))
                continue;

            visited.add(next);

            queue.push(next);
        }
    }

    return [...visited];
}
