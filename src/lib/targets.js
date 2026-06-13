import {

    economicScore,
    operationalScore,
    effectiveScore,
    prepPercent,
    isReady

}
from "/lib/scoring.js";

export function rankTargets(
    ns,
    servers
) {

    const targets = [];

    for (const server of servers) {

        const maxMoney =
            ns.getServerMaxMoney(server);

        if (maxMoney <= 0)
            continue;

        const currentMoney =
            ns.getServerMoneyAvailable(server);

        const minSecurity =
            ns.getServerMinSecurityLevel(server);

        const currentSecurity =
            ns.getServerSecurityLevel(server);

        const moneyRatio =
            currentMoney /
            maxMoney;

        const securityGap =
            currentSecurity -
            minSecurity;

        const growth =
            ns.getServerGrowth(server);

        const chance =
            ns.hackAnalyzeChance(server);

        const hackPercent =
            ns.hackAnalyze(server);

        const hackTime =
            ns.getHackTime(server);

        const data = {

            server,

            maxMoney,
            currentMoney,

            moneyRatio,

            minSecurity,
            currentSecurity,
            securityGap,

            growth,

            chance,

            hackPercent,

            hackTime
        };

        targets.push({

            ...data,

            economic:
                economicScore(data),

            operational:
                operationalScore(data),

            effective:
                effectiveScore(data),

            prep:
                prepPercent(data),

            ready:
                isReady(data)
        });
    }

    targets.sort(

        (a, b) =>

            b.effective -
            a.effective
    );

    return targets;
}

export function getBestTarget(
    ns,
    servers
) {

    const targets =
        rankTargets(
            ns,
            servers
        );

    return targets[0];
}

export function getReadyTargets(
    ns,
    servers
) {

    return rankTargets(
        ns,
        servers
    )

    .filter(
        t => t.ready
    );
}

export function getPrepTargets(
    ns,
    servers
) {

    return rankTargets(
        ns,
        servers
    )

    .filter(
        t => !t.ready
    );
}
