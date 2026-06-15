import { queuedCount, NEUROFLUX } from "/lib/augmentations.js";

/**
 * Confirma a instalação dos augmentations enfileirados (soft-reset).
 * Roda boot.js automaticamente após o reset pra relançar toda a stack.
 *
 * Opcional: --nfg  compra o máximo de NeuroFlux Governor antes de instalar
 *           (gasta o dinheiro parado em multiplicadores permanentes).
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const flags = ns.flags([["nfg", false]]);

    if (flags.nfg) {
        buyMaxNeuroFlux(ns);
    }

    const queued = queuedCount(ns);

    if (queued === 0) {
        ns.tprint("Nada na fila pra instalar. Rode o progression-manager primeiro.");
        return;
    }

    ns.tprint(`Instalando ${queued} augmentations e reiniciando via boot.js...`);
    ns.singularity.installAugmentations("boot.js");
}

/**
 * Compra NeuroFlux repetidamente enquanto houver rep e dinheiro.
 * NFG é o único aug repetível — bom dreno pro dinheiro excedente.
 */
function buyMaxNeuroFlux(ns) {
    const factions = ns.getPlayer().factions;
    if (factions.length === 0) return;

    let bought = 0;

    while (true) {
        // Faction com maior rep tende a permitir o próximo nível de NFG.
        const faction = factions
            .slice()
            .sort((a, b) =>
                ns.singularity.getFactionRep(b) - ns.singularity.getFactionRep(a)
            )[0];

        const price = ns.singularity.getAugmentationPrice(NEUROFLUX);
        const repReq = ns.singularity.getAugmentationRepReq(NEUROFLUX);

        if (ns.singularity.getFactionRep(faction) < repReq) break;
        if (ns.getServerMoneyAvailable("home") < price) break;
        if (!ns.singularity.purchaseAugmentation(faction, NEUROFLUX)) break;

        bought++;
    }

    if (bought > 0) ns.tprint(`NeuroFlux comprado x${bought}.`);
}
