/** @param {NS} ns */
export async function main(ns) {

    const target = ns.args[0] || "phantasy";

    ns.disableLog("sleep");

    while (true) {

        const money =
            ns.getServerMoneyAvailable(target);

        const maxMoney =
            ns.getServerMaxMoney(target);

        const pct =
            ((money / maxMoney) * 100).toFixed(2);

        ns.print(
            `${target}: ${pct}%`
        );

        await ns.sleep(1000);
    }
}
