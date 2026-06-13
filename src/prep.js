/** @param {NS} ns */
export async function main(ns) {

    const target = ns.args[0];

    if (!target) {
        ns.tprint("Uso: run prep.js [target]");
        return;
    }

    ns.tprint(`Preparando ${target}...`);

    while (true) {

        const minSec =
            ns.getServerMinSecurityLevel(target);

        const currentSec =
            ns.getServerSecurityLevel(target);

        const maxMoney =
            ns.getServerMaxMoney(target);

        const currentMoney =
            ns.getServerMoneyAvailable(target);

        const moneyPercent =
            currentMoney / maxMoney;

        if (currentSec > minSec + 0.5) {

            ns.print(
                `[WEAKEN] Security: ${currentSec.toFixed(2)} / ${minSec}`
            );

            await ns.weaken(target);
            continue;
        }

        if (moneyPercent < 0.99) {

            ns.print(
                `[GROW] Money: ${ns.format.number(currentMoney)} / ${ns.format.number(maxMoney)}`
            );

            await ns.grow(target);

            if (
                ns.getServerSecurityLevel(target) >
                minSec + 0.5
            ) {
                await ns.weaken(target);
            }

            continue;
        }

        ns.tprint("");
        ns.tprint(`✓ ${target} está preparado`);
        ns.tprint(
            `Money: ${ns.format.number(currentMoney)} / ${ns.format.number(maxMoney)}`
        );
        ns.tprint(
            `Security: ${currentSec.toFixed(2)} / ${minSec}`
        );

        break;
    }
}
