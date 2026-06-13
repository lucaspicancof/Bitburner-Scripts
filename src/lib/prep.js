export function calculatePrep(ns, server) {

    const maxMoney =
        ns.getServerMaxMoney(server);

    const currentMoney =
        Math.max(
            ns.getServerMoneyAvailable(server),
            1
        );

    const currentSecurity =
        ns.getServerSecurityLevel(server);

    const minSecurity =
        ns.getServerMinSecurityLevel(server);

    const securityGap =
        currentSecurity - minSecurity;

    const weakenThreads =
        Math.ceil(
            securityGap /
            ns.weakenAnalyze(1)
        );

    let growThreads = 0;

    if (currentMoney < maxMoney) {

        const growthNeeded =
            maxMoney / currentMoney;

        growThreads =
            Math.ceil(
                ns.growthAnalyze(
                    server,
                    growthNeeded
                )
            );
    }

    const growSecurity =
        ns.growthAnalyzeSecurity(
            growThreads
        );

    const weakenAfterGrow =
        Math.ceil(
            growSecurity /
            ns.weakenAnalyze(1)
        );

    return {

        server,

        maxMoney,
        currentMoney,

        currentSecurity,
        minSecurity,

        securityGap,

        weakenThreads,

        growThreads,

        weakenAfterGrow,

        totalWeakenThreads:
            weakenThreads +
            weakenAfterGrow,

        totalThreads:
            weakenThreads +
            growThreads +
            weakenAfterGrow,

        hackTime:
            ns.getHackTime(server),

        growTime:
            ns.getGrowTime(server),

        weakenTime:
            ns.getWeakenTime(server)
    };
}
