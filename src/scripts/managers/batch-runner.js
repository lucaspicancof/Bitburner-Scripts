import { planBatch, planPrep, isPrepped, WORKER_RAM } from "/lib/hgw.js";
import { totalThreadsAvailable, dispatch } from "/lib/ram.js";

const HACK = "/scripts/workers/hack.js";
const GROW = "/scripts/workers/grow.js";
const WEAKEN = "/scripts/workers/weaken.js";

/**
 * Batch Runner — executa HWGW em UM alvo, limitado a um orçamento de RAM.
 * Spawnado e parametrizado pelo batch-manager (scheduler). Cada runner cuida do
 * seu alvo: prepara se preciso, depois dispara ondas de batches dentro do orçamento.
 *
 * Vários runners coexistem; o `dispatch` usa RAM realmente livre, então não há
 * sobre-alocação — o orçamento só limita o quanto cada alvo ocupa.
 *
 * @param {NS} ns
 * args: [target, budgetGB, spacing=200, fraction=0.5]
 */
export async function main(ns) {
    ns.disableLog("ALL");

    const target = ns.args[0];
    const budgetGB = Number(ns.args[1]);
    const spacing = Number(ns.args[2] ?? 200);
    const fraction = Number(ns.args[3] ?? 0.5);

    if (!target || !budgetGB) {
        ns.tprint("Uso: batch-runner.js <target> <budgetGB> [spacing] [fraction]");
        return;
    }

    const budgetThreads = Math.floor(budgetGB / WORKER_RAM);
    let batchId = 0;

    while (true) {
        // --- PREP (dentro do orçamento) ---
        if (!isPrepped(ns, target)) {
            const waited = runPrep(ns, target, spacing, budgetThreads);
            await ns.sleep(waited);
            continue;
        }

        // --- BATCHING ---
        const plan = planBatch(ns, target, fraction, spacing);
        if (!plan) { await ns.sleep(5000); continue; }

        const poolThreads = totalThreadsAvailable(ns, WORKER_RAM);
        const byBudget = Math.floor(budgetThreads / plan.totalThreads);
        const byRam = Math.floor(poolThreads / plan.totalThreads);
        const byTime = Math.max(1, Math.floor(plan.weakenTime / (4 * spacing)));
        const numBatches = Math.max(0, Math.min(byBudget, byRam, byTime));

        if (numBatches === 0) { await ns.sleep(plan.duration); continue; }

        for (let i = 0; i < numBatches; i++) {
            const offset = i * 4 * spacing;
            if (!launchBatch(ns, plan, offset, batchId++)) break;
        }

        await ns.sleep(plan.duration + numBatches * 4 * spacing + 500);
    }
}

function launchBatch(ns, plan, offset, id) {
    const d = plan.delays;
    const t = plan.target;
    const h = dispatch(ns, HACK, WORKER_RAM, plan.hackThreads, [t, d.hack + offset, id]);
    const w1 = dispatch(ns, WEAKEN, WORKER_RAM, plan.weaken1Threads, [t, d.weaken1 + offset, id]);
    const g = dispatch(ns, GROW, WORKER_RAM, plan.growThreads, [t, d.grow + offset, id]);
    const w2 = dispatch(ns, WEAKEN, WORKER_RAM, plan.weaken2Threads, [t, d.weaken2 + offset, id]);
    return (
        h === plan.hackThreads && w1 === plan.weaken1Threads &&
        g === plan.growThreads && w2 === plan.weaken2Threads
    );
}

/**
 * Prep limitado ao orçamento: gasta no máximo budgetThreads entre weaken→grow→weaken.
 * @returns {number} ms a aguardar
 */
function runPrep(ns, target, spacing, budgetThreads) {
    const prep = planPrep(ns, target);
    let budget = budgetThreads;

    const w1 = Math.min(prep.initialWeaken, budget);
    if (w1 > 0) { dispatch(ns, WEAKEN, WORKER_RAM, w1, [target, 0, -1]); budget -= w1; }

    if (prep.growThreads > 0 && budget > 0) {
        const g = Math.min(prep.growThreads, budget);
        dispatch(ns, GROW, WORKER_RAM, g, [target, spacing, -1]); budget -= g;

        const w2 = Math.min(prep.weakenAfterGrow, budget);
        if (w2 > 0) dispatch(ns, WEAKEN, WORKER_RAM, w2, [target, 2 * spacing, -1]);
    }

    return prep.weakenTime + 3 * spacing + 500;
}
