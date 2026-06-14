import { planBatch, planPrep, isPrepped, WORKER_RAM } from "/lib/hgw.js";
import { getRamPool, totalThreadsAvailable, dispatch } from "/lib/ram.js";
import { scanAll } from "/lib/network.js";
import { rankTargets } from "/lib/targets.js";

const HACK = "/scripts/workers/hack.js";
const GROW = "/scripts/workers/grow.js";
const WEAKEN = "/scripts/workers/weaken.js";

/**
 * Batch Manager (HWGW) com ondas sobrepostas.
 *
 * Fluxo:
 *   1. Escolhe o melhor alvo preparável.
 *   2. Se não estiver preparado → executa prep e espera.
 *   3. Quando preparado → dispara uma onda de batches sobrepostos,
 *      espaçados em 4*spacing ms, até esgotar RAM ou a janela de tempo.
 *   4. Aguarda a onda terminar e repete.
 *
 * @param {NS} ns
 * Args opcionais:
 *   --target <host>    fixa um alvo (senão escolhe automaticamente)
 *   --fraction <0..1>  fração de dinheiro roubada por batch (default 0.5)
 *   --spacing <ms>     intervalo entre landings (default 200)
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();

    const flags = ns.flags([
        ["target", ""],
        ["fraction", 0.5],
        ["spacing", 200]
    ]);

    const spacing = flags.spacing;
    const fraction = flags.fraction;
    let batchId = 0;

    while (true) {
        const target = flags.target || pickTarget(ns);

        if (!target) {
            ns.print("Nenhum alvo válido. Aguardando...");
            await ns.sleep(10000);
            continue;
        }

        // --- PREP ---
        if (!isPrepped(ns, target)) {
            const waited = await runPrep(ns, target, spacing);
            // Após prep, reavalia do zero.
            await ns.sleep(waited);
            continue;
        }

        // --- BATCHING ---
        const plan = planBatch(ns, target, fraction, spacing);

        if (!plan) {
            ns.print(`Plano inviável para ${target}. Aguardando...`);
            await ns.sleep(5000);
            continue;
        }

        // Quantos batches cabem na RAM?
        const poolThreads = totalThreadsAvailable(ns, WORKER_RAM);
        const byRam = Math.floor(poolThreads / plan.totalThreads);

        // Quantos batches cabem na janela de tempo (sem colidir landings)?
        const byTime = Math.max(1, Math.floor(plan.weakenTime / (4 * spacing)));

        const numBatches = Math.max(0, Math.min(byRam, byTime));

        if (numBatches === 0) {
            ns.print(`RAM insuficiente para 1 batch de ${target}. Aguardando...`);
            await ns.sleep(plan.duration);
            continue;
        }

        // Dispara a onda.
        let launched = 0;
        for (let i = 0; i < numBatches; i++) {
            const offset = i * 4 * spacing;
            if (launchBatch(ns, plan, offset, batchId++)) launched++;
            else break; // RAM acabou no meio da onda
        }

        const waveDuration = plan.duration + numBatches * 4 * spacing + 500;

        printStatus(ns, target, plan, launched, numBatches, poolThreads);

        await ns.sleep(waveDuration);
    }
}

/**
 * Dispara os 4 componentes de um batch com os delays do plano + offset da onda.
 * @returns {boolean} true se todos os 4 foram lançados
 */
function launchBatch(ns, plan, offset, id) {
    const d = plan.delays;
    const t = plan.target;

    const h = dispatch(ns, HACK, WORKER_RAM, plan.hackThreads, [t, d.hack + offset, id]);
    const w1 = dispatch(ns, WEAKEN, WORKER_RAM, plan.weaken1Threads, [t, d.weaken1 + offset, id]);
    const g = dispatch(ns, GROW, WORKER_RAM, plan.growThreads, [t, d.grow + offset, id]);
    const w2 = dispatch(ns, WEAKEN, WORKER_RAM, plan.weaken2Threads, [t, d.weaken2 + offset, id]);

    return (
        h === plan.hackThreads &&
        w1 === plan.weaken1Threads &&
        g === plan.growThreads &&
        w2 === plan.weaken2Threads
    );
}

/**
 * Prepara o alvo (weaken → grow → weaken) usando toda a RAM disponível.
 * @returns {number} ms a aguardar até a prep terminar
 */
async function runPrep(ns, target, spacing) {
    const prep = planPrep(ns, target);

    // 1) Weaken inicial para baixar a segurança.
    if (prep.initialWeaken > 0) {
        dispatch(ns, WEAKEN, WORKER_RAM, prep.initialWeaken, [target, 0, -1]);
    }

    // 2) Grow + 3) Weaken do grow, alinhados para pousar após o weaken inicial.
    if (prep.growThreads > 0) {
        dispatch(ns, GROW, WORKER_RAM, prep.growThreads, [target, spacing, -1]);
        dispatch(ns, WEAKEN, WORKER_RAM, prep.weakenAfterGrow, [target, 2 * spacing, -1]);
    }

    ns.print(
        `[PREP] ${target} | W:${prep.initialWeaken} G:${prep.growThreads} W2:${prep.weakenAfterGrow}`
    );

    return prep.weakenTime + 3 * spacing + 500;
}

/**
 * Escolhe o melhor alvo: maior score entre servidores com dinheiro e root,
 * dentro do nível de hacking do jogador.
 */
function pickTarget(ns) {
    const servers = scanAll(ns).filter(s => {
        return (
            ns.hasRootAccess(s) &&
            ns.getServerMaxMoney(s) > 0 &&
            ns.getServerRequiredHackingLevel(s) <= ns.getHackingLevel()
        );
    });

    const ranked = rankTargets(ns, servers);
    return ranked.length > 0 ? ranked[0].server : "";
}

function printStatus(ns, target, plan, launched, planned, poolThreads) {
    ns.clearLog();
    ns.print("=== BATCH MANAGER (HWGW) ===");
    ns.print("");
    ns.print(`Alvo:        ${target}`);
    ns.print(`Hack/batch:  ${(plan.realFraction * 100).toFixed(1)}%`);
    ns.print(`Yield/batch: ${ns.format.number(plan.expectedYield)}`);
    ns.print("");
    ns.print(`Threads/batch: ${plan.totalThreads}  (H:${plan.hackThreads} W1:${plan.weaken1Threads} G:${plan.growThreads} W2:${plan.weaken2Threads})`);
    ns.print(`Pool RAM:      ${poolThreads} threads`);
    ns.print(`Batches:       ${launched}/${planned}`);
    ns.print("");
    ns.print(`Weaken time:   ${(plan.weakenTime / 1000).toFixed(1)}s`);
    ns.print(`Yield/onda:    ${ns.format.number(plan.expectedYield * launched)}`);
}
