/**
 * Planejamento de batches HWGW usando a Formulas API.
 *
 * Modelo de um batch (Hack → Weaken → Grow → Weaken):
 *   1. Hack    rouba uma fração do dinheiro
 *   2. Weaken1 anula o aumento de segurança causado pelo hack
 *   3. Grow    recupera o dinheiro até o máximo
 *   4. Weaken2 anula o aumento de segurança causado pelo grow
 *
 * Os quatro devem "pousar" nesta ordem, separados por `spacing` ms.
 */

// Constantes de segurança do jogo (efeito por thread, base de 1 core).
export const WEAKEN_PER_THREAD = 0.05;
export const HACK_SEC_PER_THREAD = 0.002;
export const GROW_SEC_PER_THREAD = 0.004;

// Custo de RAM dos workers (idêntico para os três: hack/grow/weaken = 1.70 GB).
export const WORKER_RAM = 1.75;

/**
 * Quantos threads de weaken anulam um dado aumento de segurança.
 * Usa cores=1 (conservador: leve excesso de weaken é seguro).
 */
function weakenThreadsFor(securityIncrease) {
    return Math.ceil(securityIncrease / WEAKEN_PER_THREAD);
}

/**
 * Monta o plano de um batch para um servidor JÁ PREPARADO
 * (segurança mínima, dinheiro máximo).
 *
 * @param {NS} ns
 * @param {string} target
 * @param {number} hackFraction  Fração do dinheiro a roubar por batch (0..1)
 * @param {number} spacing       Intervalo entre landings, em ms
 * @returns plano com threads e delays, ou null se inviável
 */
export function planBatch(ns, target, hackFraction = 0.5, spacing = 200) {
    const fm = ns.formulas.hacking;
    const player = ns.getPlayer();

    // Servidor no estado preparado (para cálculo de threads).
    const prepped = ns.getServer(target);
    prepped.hackDifficulty = prepped.minDifficulty;
    prepped.moneyAvailable = prepped.moneyMax;

    // --- HACK ---
    const hackPctPerThread = fm.hackPercent(prepped, player);
    if (hackPctPerThread <= 0) return null;

    const hackThreads = Math.max(
        1,
        Math.floor(hackFraction / hackPctPerThread)
    );

    // Fração real roubada (depende do arredondamento de threads).
    const realFraction = hackPctPerThread * hackThreads;

    // --- GROW (recupera o que o hack tirou) ---
    const afterHack = { ...prepped };
    afterHack.moneyAvailable = prepped.moneyMax * (1 - realFraction);

    const growThreads = Math.max(
        1,
        Math.ceil(fm.growThreads(afterHack, player, prepped.moneyMax))
    );

    // --- WEAKENS (anulam a segurança gerada por hack e grow) ---
    const weaken1Threads = weakenThreadsFor(hackThreads * HACK_SEC_PER_THREAD);
    const weaken2Threads = weakenThreadsFor(growThreads * GROW_SEC_PER_THREAD);

    // --- TIMING ---
    const weakenTime = fm.weakenTime(prepped, player);
    const growTime = fm.growTime(prepped, player);
    const hackTime = fm.hackTime(prepped, player);

    // Âncora: w1 pousa em t=weakenTime (delay 0). Os demais se alinham:
    //   hack pousa em weakenTime - spacing
    //   w1   pousa em weakenTime
    //   grow pousa em weakenTime + spacing
    //   w2   pousa em weakenTime + 2*spacing
    const delays = {
        hack: weakenTime - spacing - hackTime,
        weaken1: 0,
        grow: weakenTime + spacing - growTime,
        weaken2: 2 * spacing
    };

    // Sanidade: nenhum delay pode ser negativo.
    if (delays.hack < 0 || delays.grow < 0) return null;

    const totalThreads = hackThreads + weaken1Threads + growThreads + weaken2Threads;

    return {
        target,
        hackThreads,
        weaken1Threads,
        growThreads,
        weaken2Threads,
        totalThreads,
        realFraction,
        delays,
        // Duração total do batch (do disparo ao último landing) + folga.
        duration: weakenTime + 2 * spacing,
        weakenTime,
        ramCost: totalThreads * WORKER_RAM,
        expectedYield: prepped.moneyMax * realFraction
    };
}

/**
 * Plano de PREP: leva um servidor para segurança mínima e dinheiro máximo.
 * Retorna os threads necessários de weaken/grow (sem timing — prep não exige batch).
 *
 * @param {NS} ns
 * @param {string} target
 */
export function planPrep(ns, target) {
    const fm = ns.formulas.hacking;
    const player = ns.getPlayer();
    const server = ns.getServer(target);

    const secGap = server.hackDifficulty - server.minDifficulty;

    // Weaken inicial para zerar a segurança atual.
    const initialWeaken = weakenThreadsFor(secGap);

    // Grow para recuperar dinheiro (no estado de segurança mínima).
    const atMinSec = { ...server };
    atMinSec.hackDifficulty = server.minDifficulty;

    let growThreads = 0;
    if (server.moneyAvailable < server.moneyMax) {
        growThreads = Math.ceil(
            fm.growThreads(atMinSec, player, server.moneyMax)
        );
    }

    // Weaken adicional para anular a segurança gerada pelo grow.
    const weakenAfterGrow = weakenThreadsFor(growThreads * GROW_SEC_PER_THREAD);

    return {
        target,
        initialWeaken,
        growThreads,
        weakenAfterGrow,
        weakenTime: fm.weakenTime(atMinSec, player),
        isPrepped: secGap < 0.5 && server.moneyAvailable >= server.moneyMax * 0.99
    };
}

/**
 * Verifica se um servidor já está preparado (sec mínima, dinheiro máximo).
 * @param {NS} ns
 * @param {string} target
 */
export function isPrepped(ns, target) {
    const server = ns.getServer(target);
    return (
        server.hackDifficulty <= server.minDifficulty + 0.5 &&
        server.moneyAvailable >= server.moneyMax * 0.99
    );
}
