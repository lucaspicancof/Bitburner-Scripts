import {
    rankTargets
}
from "/lib/targets.js";

import {
    scanAll
}
from "/lib/network.js";

/** @param {NS} ns **/
export async function main(ns) {

    const servers =
        scanAll(ns);

    const targets =
        rankTargets(
            ns,
            servers
        );

    ns.tprint("");
    ns.tprint("=== TOP TARGETS ===");
    ns.tprint("");

    ns.tprint(
        " # SERVER               PREP READY MONEY GROW SEC  SCORE"
    );

    ns.tprint(
        "--------------------------------------------------------------"
    );

    for (
        let i = 0;
        i < Math.min(
            20,
            targets.length
        );
        i++
    ) {

        const t =
            targets[i];

        const moneyPercent =

            (
                t.moneyRatio * 100
            )
            .toFixed(0)
            .padStart(3);

        const prep =

            t.prep
            .toFixed(0)
            .padStart(3);

        const growth =

            String(
                t.growth
            )
            .padStart(4);

        const sec =

            t.securityGap
            .toFixed(1)
            .padStart(4);

        ns.tprint(

            `${String(i + 1).padStart(2)} ` +

            `${t.server.padEnd(20)} ` +

            `${prep}% ` +

            `${String(t.ready).padEnd(5)} ` +

            `${moneyPercent}% ` +

            `${growth} ` +

            `${sec} ` +

            `${ns.format.number(
                t.effective
            )}`
        );
    }

    ns.tprint("");
}
