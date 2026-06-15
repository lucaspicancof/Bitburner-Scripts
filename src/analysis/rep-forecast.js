import { buildPlan, ownedOrQueued } from "/lib/augmentations.js";

/**
 * Previsão de farm de reputação.
 *
 * Calcula a taxa real de rep/min do personagem (via Formulas API) para cada
 * faction e simula o MESMO comportamento do progression-manager (farma sempre
 * o aug de menor gap), respondendo na prática: "quantos augs eu pego em X min?".
 *
 * Use pra calibrar o --max-farm-min do reset-loop.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const player = ns.getPlayer();
    const factions = player.factions;

    if (factions.length === 0) {
        ns.tprint("Sem factions. Entre em alguma primeiro.");
        return;
    }

    // Taxa de rep/min por faction (foco total = limite superior).
    // focus=false (como o manager usa) tende a render ~20% menos sem o
    // aug Neuroreceptor Management Implant, então tratar isto como otimista.
    const rate = {};      // faction -> rep/min
    const repNow = {};    // faction -> rep atual
    const favorNow = {};  // faction -> favor

    ns.tprint("");
    ns.tprint("=== TAXA DE REPUTAÇÃO (hacking work, foco total) ===");
    ns.tprint("");

    for (const f of factions) {
        const favor = ns.singularity.getFactionFavor(f);
        const gains = ns.formulas.work.factionGains(player, "hacking", favor);
        const perMin = gains.reputation * 5 * 60; // 5 ciclos/s × 60s

        rate[f] = perMin;
        repNow[f] = ns.singularity.getFactionRep(f);
        favorNow[f] = favor;

        ns.tprint(
            `${f.padEnd(16)} | favor ${favor.toFixed(0).padStart(4)} | ` +
            `${ns.format.number(perMin).padStart(10)}/min | ` +
            `rep atual ${ns.format.number(repNow[f])}`
        );
    }

    // --- Simulação: farma sempre o menor gap, igual ao progression-manager ---
    const owned = ownedOrQueued(ns);
    const plan = buildPlan(ns).filter(e => e.prereqs.every(p => owned.has(p)));

    // Estado mutável da simulação.
    const simRep = { ...repNow };
    const pending = plan.map(e => ({ ...e }));
    const timeline = [];
    let elapsed = 0; // minutos

    while (pending.length > 0) {
        // Escolhe o aug de menor gap de rep AGORA (mesma heurística do manager).
        let best = null;
        for (const e of pending) {
            const gap = e.repReq - simRep[e.faction];
            if (!best || gap < best.gap) best = { e, gap };
        }

        const r = rate[best.e.faction];
        if (!r || r <= 0) break; // faction sem taxa (sem work de hacking)

        const minutesNeeded = Math.max(0, best.gap) / r;
        elapsed += minutesNeeded;

        // Avança a rep daquela faction até o requisito (compra acontece).
        simRep[best.e.faction] = Math.max(simRep[best.e.faction], best.e.repReq);
        timeline.push({ aug: best.e.aug, faction: best.e.faction, at: elapsed });

        // Remove da fila.
        const idx = pending.indexOf(best.e);
        pending.splice(idx, 1);

        if (elapsed > 600) break; // corta em 10h pra não simular infinito
    }

    // --- Relatório ---
    ns.tprint("");
    ns.tprint("=== ORDEM DE COMPRA SIMULADA ===");
    ns.tprint("");
    ns.tprint(" #  | min  | aug (faction)");
    ns.tprint("-".repeat(60));

    timeline.forEach((t, i) => {
        ns.tprint(
            `${String(i + 1).padStart(2)}  | ` +
            `${t.at.toFixed(0).padStart(4)} | ` +
            `${t.aug} (${t.faction})`
        );
    });

    // --- Resumo por horizonte ---
    ns.tprint("");
    ns.tprint("=== AUGS ALCANÇÁVEIS POR HORIZONTE ===");
    ns.tprint("");
    for (const h of [30, 60, 90, 120, 180]) {
        const count = timeline.filter(t => t.at <= h).length;
        ns.tprint(`  ${String(h).padStart(3)} min  →  ${count} augs`);
    }

    // --- Detecção do "joelho": onde o custo marginal por aug dispara ---
    // Resetar passando do joelho é ROI ruim — melhor banar favor e voltar.
    ns.tprint("");
    ns.tprint("=== CUSTO MARGINAL (min p/ o próximo aug) ===");
    ns.tprint("");

    const gaps = timeline.map((t, i) =>
        i === 0 ? t.at : t.at - timeline[i - 1].at
    );

    // Mediana dos gaps "baratos" iniciais (primeira metade) como referência.
    const early = gaps.slice(0, Math.max(1, Math.ceil(gaps.length / 2)));
    const sorted = [...early].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] || 1;

    // Joelho = primeiro gap que passa de 2x a mediana inicial.
    let kneeIdx = gaps.findIndex((g, i) => i > 0 && g > median * 2);
    if (kneeIdx === -1) kneeIdx = gaps.length; // sem joelho claro

    timeline.forEach((t, i) => {
        const mark = i === kneeIdx ? "  ← joelho (resetar aqui)" : "";
        ns.tprint(
            `  #${String(i + 1).padStart(2)}  +${gaps[i].toFixed(0).padStart(4)} min${mark}`
        );
    });

    ns.tprint("");
    if (kneeIdx > 0 && kneeIdx <= gaps.length) {
        const lastGoodGap = gaps[kneeIdx - 1];
        const augsAtKnee = kneeIdx;
        const suggestion = Math.ceil(lastGoodGap * 1.3);
        ns.tprint(
            `Sugestão: --max-farm-min ${suggestion}  ` +
            `(~${augsAtKnee} augs/reset, para antes do grind caro).`
        );
    }
    ns.tprint("");
    ns.tprint("Nota: taxas são com foco total. Com focus=false (manager) e sem o");
    ns.tprint("Neuroreceptor Management Implant, conte ~20% mais tempo.");
}
