import { buildPlan, ownedOrQueued } from "/lib/augmentations.js";

/**
 * Matemática de previsão de farm de reputação — compartilhada entre o
 * relatório (analysis/rep-forecast.js) e o orquestrador (reset-loop.js).
 */

/**
 * Taxa de rep/min por faction (hacking work, foco total — limite superior).
 * @param {NS} ns
 * @returns {Record<string, number>}
 */
export function factionRates(ns) {
    const player = ns.getPlayer();
    const rates = {};
    for (const f of player.factions) {
        const favor = ns.singularity.getFactionFavor(f);
        const gains = ns.formulas.work.factionGains(player, "hacking", favor);
        rates[f] = gains.reputation * 5 * 60; // 5 ciclos/s × 60s
    }
    return rates;
}

/**
 * Simula a ordem de compra do progression-manager (sempre o menor gap de rep),
 * avançando a rep de cada faction conforme "farma". Retorna a linha do tempo.
 *
 * @param {NS} ns
 * @returns {{timeline: {aug,faction,at:number}[], rates: Record<string,number>}}
 */
export function simulateTimeline(ns) {
    const owned = ownedOrQueued(ns);
    const plan = buildPlan(ns).filter(e => e.prereqs.every(p => owned.has(p)));
    const rates = factionRates(ns);

    const simRep = {};
    for (const f of ns.getPlayer().factions) {
        simRep[f] = ns.singularity.getFactionRep(f);
    }

    const pending = plan.map(e => ({ ...e }));
    const timeline = [];
    let elapsed = 0;

    while (pending.length > 0) {
        let best = null;
        for (const e of pending) {
            const gap = e.repReq - simRep[e.faction];
            if (!best || gap < best.gap) best = { e, gap };
        }

        const r = rates[best.e.faction];
        if (!r || r <= 0) break;

        elapsed += Math.max(0, best.gap) / r;
        simRep[best.e.faction] = Math.max(simRep[best.e.faction], best.e.repReq);
        timeline.push({ aug: best.e.aug, faction: best.e.faction, at: elapsed });
        pending.splice(pending.indexOf(best.e), 1);

        if (elapsed > 600) break; // corta em 10h
    }

    return { timeline, rates };
}

/**
 * Detecta o "joelho" da curva: o ponto onde o custo marginal por aug dispara.
 * Resetar passando do joelho é ROI ruim. Retorna também o timeout sugerido.
 *
 * @param {{at:number}[]} timeline
 * @returns {{kneeIndex:number, augsAtKnee:number, suggestedMin:number|null, gaps:number[]}}
 */
export function findKnee(timeline) {
    if (timeline.length === 0) {
        return { kneeIndex: 0, augsAtKnee: 0, suggestedMin: null, gaps: [] };
    }

    const gaps = timeline.map((t, i) =>
        i === 0 ? t.at : t.at - timeline[i - 1].at
    );

    // Mediana dos gaps iniciais (augs baratos) como referência.
    const early = gaps.slice(0, Math.max(1, Math.ceil(gaps.length / 2)));
    const sorted = [...early].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] || 1;

    // Joelho = primeiro gap acima de 2x a mediana inicial.
    let kneeIdx = gaps.findIndex((g, i) => i > 0 && g > median * 2);
    if (kneeIdx === -1) kneeIdx = gaps.length;

    const lastGoodGap = gaps[Math.max(0, kneeIdx - 1)];
    const suggestedMin = Math.ceil(lastGoodGap * 1.3);

    return { kneeIndex: kneeIdx, augsAtKnee: kneeIdx, suggestedMin, gaps };
}
