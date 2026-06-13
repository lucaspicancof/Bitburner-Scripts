import { rankTargets } from "/lib/targets.js";
import { scanAll } from "/lib/network.js";

/** @param {NS} ns **/
export async function main(ns) {

    ns.disableLog("ALL");

    while (true) {

        const targets =
            getTargets(ns);

        if (targets.length === 0) {

            await ns.sleep(10000);

            continue;
        }

        const best =
            targets[0];

        const prep =
            ns.scriptRunning(
                "/scripts/workers/prep.js",
                "home"
            );

        if (!prep) {

            ns.run(

                "/scripts/workers/prep.js",

                1,

                best
            );
        }

        const money =
            ns.getServerMoneyAvailable(best);

        const max =
            ns.getServerMaxMoney(best);

        const sec =
            ns.getServerSecurityLevel(best);

        const min =
            ns.getServerMinSecurityLevel(best);

        const ready =

            money > max * 0.95 &&

            sec <= min + 1;

        if (ready) {

            ns.run(

                "/scripts/deploy/deploy-farm.js",

                1,

                best
            );
        }

        ns.clearLog();

        ns.print("");
        ns.print("=== HACK MANAGER ===");
        ns.print("");

        ns.print(
            `Target: ${best}`
        );

        ns.print(
            `Money: ${(
                money /
                max *
                100
            ).toFixed(2)}%`
        );

        ns.print(
            `Security: ${sec.toFixed(2)}`
        );

        ns.print(
            `Ready: ${ready}`
        );

        await ns.sleep(30000);
    }
}

function getTargets(ns) {

    const servers = scanAll(ns);

    return rankTargets(ns, servers).map(t => t.server);
}
