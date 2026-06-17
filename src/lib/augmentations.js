/**
 * Lógica de decisão de augmentations (usa Singularity API).
 *
 * Em BN1 sem SF4, as funções de Singularity custam 16x RAM — então qualquer
 * script que importe isto precisa rodar no home com RAM suficiente.
 */

export const NEUROFLUX = "NeuroFlux Governor";

/** Augs já instalados OU na fila de compra (purchased=true inclui ambos). */
export function ownedOrQueued(ns) {
    return new Set(ns.singularity.getOwnedAugmentations(true));
}

/**
 * Monta o plano de augs ainda não adquiridos, varrendo todas as factions
 * em que o jogador entrou. NeuroFlux é tratado à parte (é infinito).
 *
 * Um aug pode aparecer em várias factions — fica com a entrada da faction
 * onde temos MAIS reputação (mais provável de conseguir comprar).
 *
 * @param {NS} ns
 * @returns {{aug,faction,price,repReq,repHave,prereqs:string[]}[]}
 */
export function buildPlan(ns) {
    const factions = ns.getPlayer().factions;
    const owned = ownedOrQueued(ns);
    const best = new Map();

    for (const faction of factions) {
        const repHave = ns.singularity.getFactionRep(faction);

        for (const aug of ns.singularity.getAugmentationsFromFaction(faction)) {
            if (aug === NEUROFLUX) continue;
            if (owned.has(aug)) continue;

            const entry = {
                aug,
                faction,
                price: ns.singularity.getAugmentationPrice(aug),
                repReq: ns.singularity.getAugmentationRepReq(aug),
                repHave,
                prereqs: ns.singularity.getAugmentationPrereq(aug)
            };

            const prev = best.get(aug);
            if (!prev || entry.repHave > prev.repHave) {
                best.set(aug, entry);
            }
        }
    }

    return [...best.values()];
}

/**
 * Augs compráveis agora: rep suficiente + prereqs já adquiridos + dinheiro ok.
 * Ordenados do mais caro pro mais barato (cada compra multiplica o preço
 * dos restantes por 1.9x, então compra-se o caro primeiro).
 *
 * @param {NS} ns
 * @param {ReturnType<typeof buildPlan>} plan
 * @param {Set<string>} owned
 */
export function buyableNow(ns, plan, owned) {
    const money = ns.getServerMoneyAvailable("home");

    return plan
        .filter(e => e.repHave >= e.repReq)
        .filter(e => e.prereqs.every(p => owned.has(p)))
        .filter(e => e.price <= money)
        .sort((a, b) => b.price - a.price);
}

/** Quantos augs estão na fila aguardando install. */
export function queuedCount(ns) {
    const all = ns.singularity.getOwnedAugmentations(true).length;
    const installed = ns.singularity.getOwnedAugmentations(false).length;
    return all - installed;
}

/**
 * Compra NeuroFlux repetidamente. NFG é o único aug repetível e sobe TODOS os
 * multiplicadores — ótimo dreno pro dinheiro excedente antes do reset. Quando a
 * rep não basta mas a faction tem favor >= getFavorToDonate(), DOA pra cobrir a
 * rep (dinheiro é abundante), maximizando os níveis comprados.
 *
 * @param {NS} ns
 * @param {number} reserve  dinheiro a preservar (default 0: na hora do install dá pra zerar)
 * @returns {number} quantos níveis comprou
 */
export function buyMaxNeuroFlux(ns, reserve = 0) {
    const factions = ns.getPlayer().factions;
    if (factions.length === 0) return 0;

    const favorMin = ns.getFavorToDonate();
    let bought = 0;

    while (true) {
        const price = ns.singularity.getAugmentationPrice(NEUROFLUX);
        const repReq = ns.singularity.getAugmentationRepReq(NEUROFLUX);
        if (ns.getServerMoneyAvailable("home") - price < reserve) break;

        // Factions ordenadas por rep (a de maior rep é a candidata natural).
        const sorted = factions.slice().sort((a, b) =>
            ns.singularity.getFactionRep(b) - ns.singularity.getFactionRep(a));

        // 1) Alguma já tem rep suficiente?
        let chosen = sorted.find(f => ns.singularity.getFactionRep(f) >= repReq);

        // 2) Senão, doar numa com favor suficiente.
        if (!chosen) {
            const donatable = sorted.find(f => ns.singularity.getFactionFavor(f) >= favorMin);
            if (!donatable) break;

            const perDollar = ns.formulas.reputation.repFromDonation(1, ns.getPlayer());
            if (perDollar <= 0) break;

            const gap = repReq - ns.singularity.getFactionRep(donatable);
            const cost = Math.ceil(gap / perDollar * 1.02);
            if (ns.getServerMoneyAvailable("home") - cost - price < reserve) break;
            if (!ns.singularity.donateToFaction(donatable, cost)) break;
            chosen = donatable;
        }

        if (!ns.singularity.purchaseAugmentation(chosen, NEUROFLUX)) break;
        bought++;
    }

    return bought;
}
