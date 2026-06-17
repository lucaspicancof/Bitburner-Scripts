import { queuedCount, buyMaxNeuroFlux } from "/lib/augmentations.js";
import { simulateTimeline, findKnee } from "/lib/forecast.js";
import { publish } from "/lib/telemetry.js";

/**
 * Reset Loop — orquestrador de topo. Mantém a stack viva e decide sozinho
 * a hora de instalar os augs, fechando o ciclo farma → compra → instala → repete.
 *
 * Em modo --auto (padrão), recalcula o "joelho" da curva de rep a cada ~60s
 * (mesma lib do rep-forecast) e usa a sugestão como timeout — então conforme o
 * favor sobe e as taxas mudam, o ponto de reset se ajusta sozinho.
 *
 * Heurística de install: instala quando a fila NÃO cresce há `effectiveTimeout`
 * minutos e há ≥ `min-augs` enfileirados (retornos decrescentes = hora de resetar).
 *
 * @param {NS} ns
 * Flags:
 *   --auto              recalcula o timeout pelo joelho (padrão: ligado)
 *   --max-farm-min <m>  timeout fixo (sem --auto) ou piso (com --auto). Default 30
 *   --min-augs <n>      mínimo na fila pra valer o reset. Default 1
 *   --nfg               compra NeuroFlux com o excedente antes de instalar
 *   --no-install        só supervisiona a stack, nunca instala
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();

    const flags = ns.flags([
        ["auto", true],
        ["max-farm-min", 30],
        ["min-augs", 1],
        ["nfg", true],
        ["no-install", false]
    ]);

    const minAugs = flags["min-augs"];
    const fallbackMin = flags["max-farm-min"];

    // Limites de sanidade pro timeout dinâmico.
    const FLOOR_MIN = 10;
    const CEIL_MIN = 120;
    const RECOMPUTE_MS = 60000;

    const CHILDREN = [
        "scripts/managers/root-manager.js",
        "scripts/managers/batch-manager.js",
        "scripts/managers/hacknet-manager.js",
        "scripts/managers/faction-manager.js",
        "scripts/managers/progression-manager.js",
        "scripts/managers/contract-manager.js"
    ];

    // Sobe o HUD uma vez (não supervisionado — o usuário pode fechá-lo à vontade).
    const HUD = "dashboards/dashboard.js";
    if (ns.fileExists(HUD, "home") && !ns.scriptRunning(HUD, "home")) {
        ns.run(HUD);
    }

    let lastQueued = queuedCount(ns);
    let lastGrowth = Date.now();

    let effectiveMin = fallbackMin;
    let kneeAugs = null;
    let lastForecast = 0;

    while (true) {
        // --- 1) Supervisão: relança filhos mortos ---
        for (const child of CHILDREN) {
            if (ns.fileExists(child, "home") && !ns.scriptRunning(child, "home")) {
                ns.run(child);
                ns.toast(`reset-loop: relançado ${child}`, "info");
            }
        }

        // --- 2) Auto-calibração do timeout (a cada ~60s) ---
        if (flags.auto && Date.now() - lastForecast >= RECOMPUTE_MS) {
            lastForecast = Date.now();
            try {
                const { timeline } = simulateTimeline(ns);
                const { suggestedMin, augsAtKnee } = findKnee(timeline);
                if (suggestedMin != null) {
                    effectiveMin = Math.min(CEIL_MIN, Math.max(FLOOR_MIN, fallbackMin, suggestedMin));
                    kneeAugs = augsAtKnee;
                } else {
                    // Nada mais a farmar → instala logo (timeout no piso).
                    effectiveMin = FLOOR_MIN;
                    kneeAugs = 0;
                }
            } catch (e) {
                effectiveMin = fallbackMin; // fallback seguro
            }
        } else if (!flags.auto) {
            effectiveMin = fallbackMin;
        }

        // --- 3) Acompanha o crescimento da fila ---
        const queued = queuedCount(ns);
        if (queued > lastQueued) {
            lastQueued = queued;
            lastGrowth = Date.now();
        }
        const stalledMs = Date.now() - lastGrowth;
        const effectiveMs = effectiveMin * 60000;

        // --- 4) Decisão de install ---
        const shouldInstall =
            !flags["no-install"] &&
            queued >= minAugs &&
            stalledMs >= effectiveMs;

        printStatus(ns, { queued, minAugs, stalledMs, effectiveMin, kneeAugs, flags });

        publish(ns, "reset", {
            queued,
            minAugs,
            effectiveMin,
            stalledMin: stalledMs / 60000,
            kneeAugs,
            monitorOnly: flags["no-install"],
            installInMin: (!flags["no-install"] && queued >= minAugs)
                ? Math.max(0, (effectiveMs - stalledMs) / 60000)
                : null
        });

        if (shouldInstall) {
            ns.toast(`reset-loop: instalando ${queued} augs e reiniciando`, "success", null);
            if (flags.nfg) {
                const n = buyMaxNeuroFlux(ns);
                if (n > 0) ns.toast(`NeuroFlux x${n}`, "success");
            }
            ns.singularity.installAugmentations("boot.js");
            return; // o reset mata este script
        }

        await ns.sleep(15000);
    }
}

function printStatus(ns, s) {
    ns.clearLog();
    ns.print("=== RESET LOOP (overlord) ===");
    ns.print("");
    ns.print(`Augs na fila:   ${s.queued} (mínimo p/ reset: ${s.minAugs})`);
    ns.print(`Fila parada há: ${(s.stalledMs / 60000).toFixed(1)} min`);

    if (s.flags.auto) {
        const knee = s.kneeAugs != null ? ` (joelho ~${s.kneeAugs} augs)` : "";
        ns.print(`Timeout (auto): ${s.effectiveMin} min${knee}`);
    } else {
        ns.print(`Timeout (fixo): ${s.effectiveMin} min`);
    }
    ns.print("");

    if (s.flags["no-install"]) {
        ns.print("Modo: MONITOR (não instala)");
    } else if (s.queued < s.minAugs) {
        ns.print("Status: acumulando augs...");
    } else {
        const left = Math.max(0, (s.effectiveMin * 60000 - s.stalledMs) / 60000);
        ns.print(`Status: instala em ~${left.toFixed(1)} min se a fila não crescer`);
    }

    ns.print("");
    ns.print(`Money: ${ns.format.number(ns.getServerMoneyAvailable("home"))}`);
    ns.print(`Hack:  ${ns.getHackingLevel()}`);
}
