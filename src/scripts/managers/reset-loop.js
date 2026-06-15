import { queuedCount, buyMaxNeuroFlux } from "/lib/augmentations.js";

/**
 * Reset Loop — orquestrador de topo. Mantém a stack viva e decide sozinho
 * a hora de instalar os augs, fechando o ciclo farma → compra → instala → repete.
 *
 * Heurística de install (sem matemática frágil de taxa de rep):
 *   os primeiros augs entram na fila rápido; conforme a rep fica cara, o farm
 *   estagna. Quando a fila NÃO cresce há `maxFarmMin` minutos e há pelo menos
 *   `minAugs` enfileirados, o retorno de continuar farmando virou marginal →
 *   instala. O timeout captura o ponto de retornos decrescentes naturalmente.
 *
 * @param {NS} ns
 * Flags:
 *   --min-augs <n>      mínimo na fila pra valer o reset (default 1)
 *   --max-farm-min <m>  minutos sem a fila crescer antes de instalar (default 30)
 *   --nfg               compra NeuroFlux com o excedente antes de instalar
 *   --no-install        só supervisiona a stack, nunca instala (modo monitor)
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();

    const flags = ns.flags([
        ["min-augs", 1],
        ["max-farm-min", 30],
        ["nfg", false],
        ["no-install", false]
    ]);

    const minAugs = flags["min-augs"];
    const maxFarmMs = flags["max-farm-min"] * 60 * 1000;

    const CHILDREN = [
        "scripts/managers/batch-manager.js",
        "scripts/managers/hacknet-manager.js",
        "scripts/managers/progression-manager.js"
    ];

    let lastQueued = queuedCount(ns);
    let lastGrowth = Date.now();

    while (true) {
        // --- 1) Supervisão: relança qualquer filho que tenha morrido ---
        for (const child of CHILDREN) {
            if (ns.fileExists(child, "home") && !ns.scriptRunning(child, "home")) {
                ns.run(child);
                ns.toast(`reset-loop: relançado ${child}`, "info");
            }
        }

        // --- 2) Acompanha o crescimento da fila ---
        const queued = queuedCount(ns);
        if (queued > lastQueued) {
            lastQueued = queued;
            lastGrowth = Date.now();
        }

        const stalledMs = Date.now() - lastGrowth;

        // --- 3) Decisão de install ---
        const shouldInstall =
            !flags["no-install"] &&
            queued >= minAugs &&
            stalledMs >= maxFarmMs;

        printStatus(ns, queued, minAugs, stalledMs, maxFarmMs, flags["no-install"]);

        if (shouldInstall) {
            ns.toast(`reset-loop: instalando ${queued} augs e reiniciando`, "success", null);

            if (flags.nfg) {
                const n = buyMaxNeuroFlux(ns);
                if (n > 0) ns.toast(`NeuroFlux x${n}`, "success");
            }

            // installAugmentations reinicia o jogo e roda boot.js (relança a stack).
            ns.singularity.installAugmentations("boot.js");
            return; // não alcançado — o reset mata este script
        }

        await ns.sleep(15000);
    }
}

function printStatus(ns, queued, minAugs, stalledMs, maxFarmMs, monitorOnly) {
    ns.clearLog();
    ns.print("=== RESET LOOP (overlord) ===");
    ns.print("");
    ns.print(`Augs na fila:   ${queued} (mínimo p/ reset: ${minAugs})`);
    ns.print(`Fila parada há: ${(stalledMs / 60000).toFixed(1)} min`);
    ns.print(`Limite de farm: ${(maxFarmMs / 60000).toFixed(0)} min`);
    ns.print("");

    if (monitorOnly) {
        ns.print("Modo: MONITOR (não instala)");
    } else if (queued < minAugs) {
        ns.print("Status: acumulando augs...");
    } else {
        const left = Math.max(0, (maxFarmMs - stalledMs) / 60000);
        ns.print(`Status: instala em ~${left.toFixed(1)} min se a fila não crescer`);
    }

    ns.print("");
    ns.print(`Money: ${ns.format.number(ns.getServerMoneyAvailable("home"))}`);
    ns.print(`Hack:  ${ns.getHackingLevel()}`);
}
