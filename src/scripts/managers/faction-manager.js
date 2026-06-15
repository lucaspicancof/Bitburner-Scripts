import { HACKING_FACTIONS, CITY_FACTIONS, ALLOWLIST } from "/lib/factions.js";
import { findPath } from "/lib/pathfind.js";
import { scanAll } from "/lib/network.js";

/**
 * Faction Manager — fecha o elo que faltava na autonomia: pós-reset, re-entra nas
 * factions sozinho. Aceita convites allowlisted, re-backdoora os servidores das
 * factions de hacking (em ordem de dificuldade) e viaja pra habilitar as de cidade.
 *
 * Roda em paralelo ao progression-manager (que farma rep nas já ingressadas).
 *
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();

    let lastAction = "iniciando";

    while (true) {
        const joined = new Set(ns.getPlayer().factions);
        const network = new Set(scanAll(ns));

        // 1) Aceita convites de factions na allowlist.
        for (const fac of ns.singularity.checkFactionInvitations()) {
            if (ALLOWLIST.has(fac) && !joined.has(fac)) {
                if (ns.singularity.joinFaction(fac)) {
                    joined.add(fac);
                    lastAction = `entrou em ${fac}`;
                    ns.toast(`Entrou na faction: ${fac}`, "success");
                }
            }
        }

        // 2) Backdoor nas factions de hacking faltantes (uma por ciclo — é async).
        let didBackdoor = false;
        for (const f of HACKING_FACTIONS) {
            if (joined.has(f.name)) continue;
            if (!network.has(f.server)) continue;
            if (!ns.hasRootAccess(f.server)) continue;
            if (ns.getHackingLevel() < ns.getServerRequiredHackingLevel(f.server)) continue;
            if (ns.getServer(f.server).backdoorInstalled) continue;

            lastAction = `backdoor em ${f.server} (${f.name})`;
            await doBackdoor(ns, f.server);
            didBackdoor = true;
            break;
        }

        // 3) Factions de cidade: viaja pra habilitar o convite (uma por ciclo).
        if (!didBackdoor) {
            const invited = new Set(ns.singularity.checkFactionInvitations());
            for (const f of CITY_FACTIONS) {
                if (joined.has(f.name) || invited.has(f.name)) continue;
                if (ns.getServerMoneyAvailable("home") < f.money) continue;
                if (ns.getHackingLevel() < f.hack) continue;

                if (ns.getPlayer().city !== f.city) {
                    ns.singularity.travelToCity(f.city);
                    lastAction = `viajou p/ ${f.city} (${f.name})`;
                }
                break; // uma cidade por ciclo; o convite chega no próximo loop
            }
        }

        printStatus(ns, joined, lastAction);
        await ns.sleep(8000);
    }
}

/** Conecta hop a hop até o servidor, instala backdoor e volta pro home. */
async function doBackdoor(ns, server) {
    const path = findPath(ns, server);
    if (!path) return;

    for (const hop of path.slice(1)) ns.singularity.connect(hop);
    await ns.singularity.installBackdoor();
    ns.singularity.connect("home");
    ns.toast(`Backdoor instalado: ${server}`, "success");
}

function printStatus(ns, joined, lastAction) {
    ns.clearLog();
    ns.print("=== FACTION MANAGER ===");
    ns.print("");
    ns.print(`Ingressadas: ${joined.size}`);
    for (const f of joined) ns.print(`  ✓ ${f}`);
    ns.print("");

    const pending = [...HACKING_FACTIONS, ...CITY_FACTIONS]
        .filter(f => !joined.has(f.name));
    if (pending.length) {
        ns.print("Pendentes:");
        for (const f of pending) {
            const srv = f.server ? ` (backdoor ${f.server}, hack ${f.hack})` : ` (cidade ${f.city})`;
            ns.print(`  ✗ ${f.name}${srv}`);
        }
    } else {
        ns.print("Todas as factions-alvo ingressadas.");
    }
    ns.print("");
    ns.print(`Ação: ${lastAction}`);
}
