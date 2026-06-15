import { simulateTimeline, findKnee } from "/lib/forecast.js";

/**
 * Previsão de farm de reputação.
 *
 * Mostra a taxa real de rep/min por faction, simula a ordem de compra do
 * progression-manager e responde "quantos augs em X min?". Marca o joelho da
 * curva (onde resetar passa a valer mais que continuar farmando).
 *
 * O reset-loop usa a MESMA lib (lib/forecast.js) pra se auto-calibrar.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const player = ns.getPlayer();
    if (player.factions.length === 0) {
        ns.tprint("Sem factions. Entre em alguma primeiro.");
        return;
    }

    const { timeline, rates } = simulateTimeline(ns);

    // --- Taxas por faction ---
    ns.tprint("");
    ns.tprint("=== TAXA DE REPUTAÇÃO (hacking work, foco total) ===");
    ns.tprint("");
    for (const f of player.factions) {
        const favor = ns.singularity.getFactionFavor(f);
        const rep = ns.singularity.getFactionRep(f);
        ns.tprint(
            `${f.padEnd(16)} | favor ${favor.toFixed(0).padStart(4)} | ` +
            `${ns.format.number(rates[f] || 0).padStart(10)}/min | ` +
            `rep atual ${ns.format.number(rep)}`
        );
    }

    if (timeline.length === 0) {
        ns.tprint("");
        ns.tprint("Nada a comprar — sem augs pendentes alcançáveis.");
        return;
    }

    // --- Ordem de compra simulada ---
    ns.tprint("");
    ns.tprint("=== ORDEM DE COMPRA SIMULADA ===");
    ns.tprint("");
    ns.tprint(" #  | min  | aug (faction)");
    ns.tprint("-".repeat(60));
    timeline.forEach((t, i) => {
        ns.tprint(
            `${String(i + 1).padStart(2)}  | ${t.at.toFixed(0).padStart(4)} | ` +
            `${t.aug} (${t.faction})`
        );
    });

    // --- Augs por horizonte ---
    ns.tprint("");
    ns.tprint("=== AUGS ALCANÇÁVEIS POR HORIZONTE ===");
    ns.tprint("");
    for (const h of [30, 60, 90, 120, 180]) {
        ns.tprint(`  ${String(h).padStart(3)} min  →  ${timeline.filter(t => t.at <= h).length} augs`);
    }

    // --- Custo marginal + joelho ---
    const { kneeIndex, augsAtKnee, suggestedMin, gaps } = findKnee(timeline);

    ns.tprint("");
    ns.tprint("=== CUSTO MARGINAL (min p/ o próximo aug) ===");
    ns.tprint("");
    timeline.forEach((t, i) => {
        const mark = i === kneeIndex ? "  ← joelho (resetar aqui)" : "";
        ns.tprint(`  #${String(i + 1).padStart(2)}  +${gaps[i].toFixed(0).padStart(4)} min${mark}`);
    });

    ns.tprint("");
    if (suggestedMin != null) {
        ns.tprint(
            `Sugestão: --max-farm-min ${suggestedMin}  ` +
            `(~${augsAtKnee} augs/reset, para antes do grind caro).`
        );
    }
    ns.tprint("");
    ns.tprint("Nota: taxas com foco total. Com focus=false (manager) e sem o");
    ns.tprint("Neuroreceptor Management Implant, conte ~20% mais tempo.");
    ns.tprint("O reset-loop com --auto recalcula isso sozinho a cada ~60s.");
}
