/**
 * Valor de augmentations e escolha de alvo de farm por densidade de valor.
 *
 * O gate da run é tempo-de-rep (dinheiro é infinito), então não otimizamos por
 * "menor rep" e sim por VALOR por rep a farmar — com bônus pra augs estratégicas
 * cujo valor vai além dos multiplicadores.
 */

// Pesos default (foco hacking). Cada mult vale (mult - 1) * peso.
export const DEFAULT_WEIGHTS = {
    hacking: 3.0,
    hacking_money: 3.0,
    hacking_speed: 2.5,
    hacking_grow: 1.5,
    hacking_chance: 1.5,
    hacking_exp: 1.5,
    faction_rep: 2.5,   // compõe: acelera todo farm futuro
    company_rep: 0.3,
    hacknet_node_money: 0.3
};

// Bônus fixo pra augs com efeito além de multiplicadores.
export const STRATEGIC_BONUS = {
    "Neuroreceptor Management Implant": 5.0, // remove penalidade de focus=false
    "BitRunners Neurolink": 3.0,             // FTPCrack + relaySMTP no reset
    "PCMatrix": 1.5,                         // DeepscanV1 + AutoLink
    "CashRoot Starter Kit": 1.5,             // BruteSSH + $1M
    "The Red Pill": 100.0                    // endgame (w0r1d_d43m0n)
};

/**
 * Valor de um aug: soma ponderada dos multiplicadores + bônus estratégico.
 * @param {NS} ns
 * @param {string} aug
 * @param {Record<string, number>} [weights]
 */
export function value(ns, aug, weights = DEFAULT_WEIGHTS) {
    const m = ns.singularity.getAugmentationStats(aug);
    let v = 0;
    for (const [k, w] of Object.entries(weights)) {
        const mult = m[k];
        if (typeof mult === "number") v += (mult - 1) * w;
    }
    return v + (STRATEGIC_BONUS[aug] || 0);
}

/**
 * Escolhe o melhor aug pra farmar rep agora: maior VALOR por rep restante, entre os
 * que ainda faltam rep e têm prereqs satisfeitos. Guarda de ETA evita perseguir um
 * aug cuja rep levaria mais que `maxEtaMin` minutos; se todos estourarem a ETA,
 * cai no de menor ETA (não trava).
 *
 * @param {NS} ns
 * @param {{aug,faction,repReq,repHave,prereqs:string[]}[]} plan
 * @param {Set<string>} owned
 * @param {Record<string, number>} rates  faction -> rep/min
 * @param {{maxEtaMin?: number, weights?: object}} [opts]
 */
export function chooseFarmTarget(ns, plan, owned, rates, opts = {}) {
    const maxEtaMin = opts.maxEtaMin ?? 120;
    const weights = opts.weights ?? DEFAULT_WEIGHTS;

    const candidates = plan
        .filter(e => e.repHave < e.repReq)
        .filter(e => e.prereqs.every(p => owned.has(p)))
        .map(e => {
            const remaining = Math.max(1, e.repReq - e.repHave);
            const rate = rates[e.faction] || 0;
            const etaMin = rate > 0 ? remaining / rate : Infinity;
            const v = value(ns, e.aug, weights);
            return { ...e, etaMin, valueScore: v, density: v / remaining };
        });

    if (candidates.length === 0) return null;

    const withinEta = candidates.filter(c => c.etaMin <= maxEtaMin);
    const pool = withinEta.length > 0 ? withinEta : candidates;

    // Dentro da ETA: maior densidade de valor. Fora: menor ETA (destrava).
    if (withinEta.length > 0) {
        pool.sort((a, b) => b.density - a.density);
    } else {
        pool.sort((a, b) => a.etaMin - b.etaMin);
    }
    return pool[0];
}
