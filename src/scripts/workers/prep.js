/** @param {NS} ns */
export async function main(ns) {

    const target = ns.args[0];

    if (!target) {
        ns.tprint("Uso: run prep.js [target]");
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

        if (
            security <= minSecurity + 1 &&
            moneyPct >= 0.99
        ) {
            return;
        }

        if (security > minSecurity + 1) {

            await ns.weaken(target);

        } else {

            await ns.grow(target);

        }
    }
}
