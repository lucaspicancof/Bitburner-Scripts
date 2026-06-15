import { scanAll } from "/lib/network.js";

/**
 * Root Manager — garante openers e root continuamente.
 *
 * Pós-reset sobram poucos programas (só Formulas + os que augs concedem). Sem os
 * port openers, o batch fica preso em poucos servidores. Este manager:
 *   1. Compra TOR se faltar.
 *   2. Checa os 5 openers (não assume nenhum) e compra os faltantes conforme o dinheiro,
 *      na ordem de custo.
 *   3. Dá nuke em todo servidor alcançável (portas suficientes) que ainda não tem root.
 *
 * @param {NS} ns
 * Flags:
 *   --reserve <$>  dinheiro a preservar ao comprar programas. Default 0
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();

    const flags = ns.flags([["reserve", 0]]);

    // openers em ordem de custo crescente
    const OPENERS = [
        { file: "BruteSSH.exe", fn: ns.brutessh },
        { file: "FTPCrack.exe", fn: ns.ftpcrack },
        { file: "relaySMTP.exe", fn: ns.relaysmtp },
        { file: "HTTPWorm.exe", fn: ns.httpworm },
        { file: "SQLInject.exe", fn: ns.sqlinject }
    ];

    while (true) {
        ensureTor(ns);
        const bought = buyMissingOpeners(ns, OPENERS, flags.reserve);
        const { nuked, rooted, total } = nukeReachable(ns, OPENERS);

        printStatus(ns, OPENERS, rooted, total, bought, nuked);
        await ns.sleep(10000);
    }
}

function ensureTor(ns) {
    // getDarkwebPrograms só funciona com TOR; purchaseTor é idempotente.
    try { ns.singularity.purchaseTor(); } catch { /* sem dinheiro ainda */ }
}

/** Compra openers faltantes via darkweb, mais barato primeiro. Retorna nº comprado. */
function buyMissingOpeners(ns, openers, reserve) {
    let count = 0;
    for (const o of openers) {
        if (ns.fileExists(o.file, "home")) continue;
        const money = ns.getServerMoneyAvailable("home");
        const cost = safeProgramCost(ns, o.file);
        if (cost == null) continue;            // não disponível ainda (sem TOR)
        if (money - cost < reserve) continue;  // respeita reserva
        if (ns.singularity.purchaseProgram(o.file)) {
            count++;
            ns.toast(`root: comprou ${o.file}`, "success");
        }
    }
    return count;
}

function safeProgramCost(ns, file) {
    try {
        const list = ns.singularity.getDarkwebPrograms();
        if (!list.includes(file)) return null;
        return ns.singularity.getDarkwebProgramCost(file);
    } catch {
        return null;
    }
}

/** Abre portas e nukea todo servidor alcançável sem root. */
function nukeReachable(ns, openers) {
    let nuked = 0, rooted = 0, total = 0;

    for (const server of scanAll(ns)) {
        if (server === "home") continue;
        total++;

        if (ns.hasRootAccess(server)) { rooted++; continue; }

        // Abre todas as portas que conseguimos.
        let open = 0;
        for (const o of openers) {
            if (ns.fileExists(o.file, "home")) {
                try { o.fn(server); open++; } catch { /* ignore */ }
            }
        }

        if (open >= ns.getServerNumPortsRequired(server)) {
            try {
                ns.nuke(server);
                if (ns.hasRootAccess(server)) { nuked++; rooted++; }
            } catch { /* nível/portas insuficientes */ }
        }
    }

    return { nuked, rooted, total };
}

function printStatus(ns, openers, rooted, total, bought, nuked) {
    ns.clearLog();
    ns.print("=== ROOT MANAGER ===");
    ns.print("");
    const have = openers.filter(o => ns.fileExists(o.file, "home")).map(o => o.file);
    ns.print(`Openers: ${have.length}/5`);
    for (const o of openers) {
        ns.print(`  ${ns.fileExists(o.file, "home") ? "✓" : "✗"} ${o.file}`);
    }
    ns.print("");
    ns.print(`Root: ${rooted}/${total} servidores`);
    if (bought > 0) ns.print(`Comprados agora: ${bought} openers`);
    if (nuked > 0) ns.print(`Nukados agora: ${nuked}`);
}
