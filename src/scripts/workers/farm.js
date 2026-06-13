/** @param {NS} ns */
export async function main(ns) {

    const target = ns.args[0];

    if (!target) {
        ns.tprint("Uso: run farm.js [target]");
        return;
    }

    while (true) {

        const security =
            ns.getServerSecurityLevel(target);

        const minSecurity =
            ns.getServerMinSecurityLevel(target);

        const money =
            ns.getServerMoneyAvailable(target);

        const maxMoney =
            ns.getServerMaxMoney(target);

        const moneyPct =
            money / maxMoney;

        if (security > minSecurity + 2) {

            await ns.weaken(target);
            continue;
        }

        if (moneyPct < 0.95) {

            await ns.grow(target);
            continue;
        }

        await ns.hack(target);
    }
}
