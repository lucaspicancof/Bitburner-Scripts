import { queuedCount, buyMaxNeuroFlux } from "/lib/augmentations.js";

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
        const n = buyMaxNeuroFlux(ns);
        if (n > 0) ns.tprint(`NeuroFlux comprado x${n}.`);
    }

    const queued = queuedCount(ns);

    if (queued === 0) {
        ns.tprint("Nada na fila pra instalar. Rode o progression-manager primeiro.");
        return;
    }

    ns.tprint(`Instalando ${queued} augmentations e reiniciando via boot.js...`);
    ns.singularity.installAugmentations("boot.js");
}
