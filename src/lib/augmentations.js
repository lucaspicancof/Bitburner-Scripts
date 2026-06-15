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

/**
 * Próximo alvo de farm de rep: o aug com o MENOR gap de reputação,
 * entre os que ainda não temos rep mas cujos prereqs já estão garantidos.
 *
 * @param {NS} ns
 * @param {ReturnType<typeof buildPlan>} plan
 * @param {Set<string>} owned
 */
export function nextRepTarget(ns, plan, owned) {
    return plan
        .filter(e => e.repHave < e.repReq)
        .filter(e => e.prereqs.every(p => owned.has(p)))
        .sort((a, b) => (a.repReq - a.repHave) - (b.repReq - b.repHave))[0] || null;
}

/** Quantos augs estão na fila aguardando install. */
export function queuedCount(ns) {
    const all = ns.singularity.getOwnedAugmentations(true).length;
    const installed = ns.singularity.getOwnedAugmentations(false).length;
    return all - installed;
}
