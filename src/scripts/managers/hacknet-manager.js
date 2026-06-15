import { getAllUpgrades, buyUpgrade, formatPayback } from "/lib/hacknet.js";

/**
 * Hacknet Manager — reset-aware.
 *
 * Como o hacknet é zerado a cada install de aug e rende uma fração ínfima da
 * renda do batch, só faz sentido comprar upgrades que se pagam ANTES do próximo
 * reset. Este manager compra agressivamente tudo com payback abaixo do limite
 * (liquidez inicial de cada reset) e simplesmente para quando nada mais qualifica.
 *
 * @param {NS} ns
 * Flags:
 *   --max-payback-min <m>  só compra upgrades que pagam em < m minutos. Default 10
 *   --reserve <$>          dinheiro a preservar. Default 0
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();

    const flags = ns.flags([
        ["max-payback-min", 10],
        ["reserve", 0]
    ]);

    const maxPaybackSec = flags["max-payback-min"] * 60;
    const reserve = flags.reserve;

    let bought = 0;
    let spent = 0;
    let last = "—";

    while (true) {
        const money = ns.getServerMoneyAvailable("home");
        const upgrades = getAllUpgrades(ns);
        const best = upgrades[0] || null;

        let acted = false;

        if (best) {
            const qualifies = best.payback <= maxPaybackSec;
            const affordable = money - best.cost >= reserve;

            if (qualifies && affordable) {
                if (buyUpgrade(ns, best) !== false) {
                    bought++;
                    spent += best.cost;
                    last = `${best.type} #${best.node < 0 ? "novo" : best.node}`;
                    acted = true;
                }
            }
        }

        printStatus(ns, { best, maxPaybackSec, bought, spent, last, acted });

        // Comprou algo → tenta de novo logo (pode haver mais barato em fila);
        // senão, nada qualifica agora → espera mais.
        await ns.sleep(acted ? 200 : 5000);
    }
}

function printStatus(ns, s) {
    ns.clearLog();
    ns.print("=== HACKNET MANAGER (reset-aware) ===");
    ns.print("");
    ns.print(`Nós:      ${ns.hacknet.numNodes()}`);
    ns.print(`Produção: ${ns.format.number(totalProduction(ns))}/s`);
    ns.print(`Limite:   payback < ${formatPayback(s.maxPaybackSec)}`);
    ns.print("");

    if (s.best) {
        const ok = s.best.payback <= s.maxPaybackSec;
        ns.print("Melhor upgrade:");
        ns.print(`  ${s.best.type} #${s.best.node < 0 ? "novo" : s.best.node}`);
        ns.print(`  Custo:   ${ns.format.number(s.best.cost)}`);
        ns.print(`  +$/s:    ${ns.format.number(s.best.gain)}`);
        ns.print(`  Payback: ${formatPayback(s.best.payback)} ${ok ? "✓" : "✗ (acima do limite)"}`);
    } else {
        ns.print("Tudo maxado — nada a comprar.");
    }

    ns.print("");
    ns.print(`Comprados: ${s.bought}  |  Gasto: ${ns.format.number(s.spent)}`);
    ns.print(`Último:    ${s.last}`);
    ns.print("");
    ns.print(s.acted ? "Status: comprando..." : "Status: aguardando upgrade que valha a pena");
}

function totalProduction(ns) {
    let total = 0;
    const n = ns.hacknet.numNodes();
    for (let i = 0; i < n; i++) total += ns.hacknet.getNodeStats(i).production;
    return total;
}
