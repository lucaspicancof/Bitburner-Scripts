/**
 * Startup pós-reset. Chamado automaticamente após instalar augs (a Singularity
 * reinicia o jogo e roda este script). Recupera root e sobe o orquestrador.
 *
 * Só lança nuke + reset-loop: o reset-loop é quem supervisiona e relança os
 * demais managers (batch, hacknet, progression), então não duplico aqui.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    ns.tprint("boot: recuperando root da rede...");
    ns.run("nuke.js");

    // Dá tempo do nuke abrir portas antes de farmar.
    await ns.sleep(3000);

    const overlord = "scripts/managers/reset-loop.js";

    if (ns.fileExists(overlord, "home")) {
        ns.run(overlord);
        ns.tprint("boot: reset-loop iniciado (supervisiona o resto).");
    } else {
        ns.tprint(`boot: AVISO — ${overlord} não encontrado.`);
    }

    // Sobe o HUD (não é supervisionado — o usuário pode fechá-lo à vontade).
    if (ns.fileExists("dashboards/dashboard.js", "home")) {
        ns.run("dashboards/dashboard.js");
    }
}
