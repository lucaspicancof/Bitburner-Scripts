import { findPath, pathToCommands } from "/lib/pathfind.js";
import { scanAll } from "/lib/network.js";

/**
 * Servidores que, ao receber backdoor, desbloqueiam factions (BN1).
 * Backdoor exige root + nível de hacking suficiente.
 */
const FACTION_SERVERS = {
    "CSEC": "CyberSec",
    "avmnite-02h": "NiteSec",
    "I.I.I.I": "The Black Hand",
    "run4theh111z": "BitRunners"
};

/**
 * Helper de backdoor.
 *
 * @param {NS} ns
 * Sem args  → lista os servidores de faction, status e comandos prontos.
 * Com arg   → gera os comandos connect+backdoor para o alvo informado.
 *
 * Nota: instalar backdoor não é automatizável sem SF4 (Singularity).
 * Este script só monta a sequência de comandos para você colar no terminal.
 */
export async function main(ns) {
    const target = ns.args[0];

    if (target) {
        printTarget(ns, String(target));
        return;
    }

    ns.tprint("");
    ns.tprint("=== BACKDOOR → FACTIONS (BN1) ===");
    ns.tprint("");

    for (const [server, faction] of Object.entries(FACTION_SERVERS)) {
        if (!serverExists(ns, server)) {
            ns.tprint(`${server.padEnd(16)} | (não encontrado na rede)`);
            continue;
        }

        const root = ns.hasRootAccess(server);
        const reqLevel = ns.getServerRequiredHackingLevel(server);
        const myLevel = ns.getHackingLevel();
        const hasBackdoor = ns.getServer(server).backdoorInstalled;

        let status;
        if (hasBackdoor) status = "✓ JÁ INSTALADO";
        else if (!root) status = "sem root (rode nuke.js)";
        else if (myLevel < reqLevel) status = `precisa hack ${reqLevel} (tem ${myLevel})`;
        else status = "PRONTO";

        ns.tprint(`${server.padEnd(16)} → ${faction.padEnd(16)} | ${status}`);

        if (status === "PRONTO") {
            const path = findPath(ns, server);
            ns.tprint(`   ${pathToCommands(path)}`);
        }
    }

    ns.tprint("");
    ns.tprint("Dica: home; <comandos>  — comece sempre conectado ao home.");
}

function printTarget(ns, target) {
    if (!serverExists(ns, target)) {
        ns.tprint(`Servidor "${target}" não encontrado na rede.`);
        return;
    }

    const path = findPath(ns, target);
    if (!path) {
        ns.tprint(`Sem caminho até "${target}".`);
        return;
    }

    ns.tprint("");
    ns.tprint(`Caminho até ${target}: ${path.join(" → ")}`);
    ns.tprint("");
    ns.tprint("Cole no terminal (a partir do home):");
    ns.tprint(`home; ${pathToCommands(path)}`);
    ns.tprint("");
}

function serverExists(ns, server) {
    return scanAll(ns).includes(server);
}
