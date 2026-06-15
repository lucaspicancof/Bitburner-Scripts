/**
 * Startup pós-reset. Chamado automaticamente pelo install.js após instalar augs
 * (a Singularity reinicia o jogo e roda este script). Relança a stack inteira.
 *
 * Como o aug install zera o root de todos os servidores e mata os scripts,
 * a ordem importa: primeiro nuke (recupera root), depois os managers.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    ns.tprint("boot: recuperando root da rede...");
    ns.run("nuke.js");

    // Dá tempo do nuke abrir portas antes de farmar.
    await ns.sleep(3000);

    const managers = [
        "scripts/managers/batch-manager.js",
        "scripts/managers/hacknet-manager.js",
        "scripts/managers/progression-manager.js"
    ];

    for (const m of managers) {
        if (ns.fileExists(m, "home")) {
            ns.run(m);
            ns.tprint(`boot: ${m} iniciado`);
        } else {
            ns.tprint(`boot: AVISO — ${m} não encontrado`);
        }
    }

    ns.tprint("boot: stack relançada.");
}
