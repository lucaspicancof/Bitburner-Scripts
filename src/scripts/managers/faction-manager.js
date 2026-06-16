import { HACKING_FACTIONS, CITY_FACTIONS, TIAN_DI_HUI, FREE_FACTIONS, cityEnemies } from "/lib/factions.js";
import { ownedOrQueued, NEUROFLUX } from "/lib/augmentations.js";
import { findPath } from "/lib/pathfind.js";
import { scanAll } from "/lib/network.js";

/**
 * Faction Manager — re-entra nas factions sozinho pós-reset.
 *
 * Factions de hacking (backdoor) e livres (Netburners, Tian Di Hui) são sempre
 * perseguidas. As CITY FACTIONS são EXCLUSIVAS (inimigas entre si): o manager
 * escolhe a de maior prioridade que ainda tem augs que faltam, viaja, entra nela,
 * e a partir daí NUNCA entra nas inimigas dela na run atual. Quando os augs de uma
 * acabam (todos comprados), ela é pulada — abrindo espaço pra próxima (no reset
 * seguinte, quando as memberships zeram).
 *
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();

    let lastAction = "iniciando";

    while (true) {
        const joined = new Set(ns.getPlayer().factions);
        const owned = ownedOrQueued(ns);
        const blocked = cityEnemies(joined);         // inimigas das já ingressadas
        const network = new Set(scanAll(ns));

        // Alvo de city faction: maior prioridade, não bloqueada, com dinheiro e augs faltando.
        const cityTarget = CITY_FACTIONS
            .filter(f => !joined.has(f.name) && !blocked.has(f.name))
            .filter(f => ns.getServerMoneyAvailable("home") >= f.money)
            .filter(f => hasWantedAugs(ns, f.name, owned))
            .sort((a, b) => a.priority - b.priority)[0] || null;

        // 1) Aceita convites: livres sempre; city só o alvo; nunca bloqueadas.
        for (const inv of ns.singularity.checkFactionInvitations()) {
            if (joined.has(inv) || blocked.has(inv)) continue;
            const ok = FREE_FACTIONS.has(inv) || (cityTarget && inv === cityTarget.name);
            if (ok && ns.singularity.joinFaction(inv)) {
                joined.add(inv);
                lastAction = `entrou em ${inv}`;
                ns.toast(`Entrou na faction: ${inv}`, "success");
            }
        }

        // 2) Backdoor nas factions de hacking faltantes (uma por ciclo — é async).
        let didBackdoor = false;
        for (const f of HACKING_FACTIONS) {
            if (joined.has(f.name)) continue;
            if (!network.has(f.server) || !ns.hasRootAccess(f.server)) continue;
            if (ns.getHackingLevel() < ns.getServerRequiredHackingLevel(f.server)) continue;
            if (ns.getServer(f.server).backdoorInstalled) continue;

            lastAction = `backdoor em ${f.server} (${f.name})`;
            await doBackdoor(ns, f.server);
            didBackdoor = true;
            break;
        }

        // 3) Viagem (uma por ciclo): prioriza Tian Di Hui (Neuroreceptor), depois o cityTarget.
        if (!didBackdoor) {
            const invited = new Set(ns.singularity.checkFactionInvitations());
            const player = ns.getPlayer();

            const wantTDH = !joined.has(TIAN_DI_HUI.name)
                && !invited.has(TIAN_DI_HUI.name)
                && ns.getHackingLevel() >= TIAN_DI_HUI.hack
                && ns.getServerMoneyAvailable("home") >= TIAN_DI_HUI.money
                && hasWantedAugs(ns, TIAN_DI_HUI.name, owned);

            if (wantTDH && !TIAN_DI_HUI.cities.includes(player.city)) {
                ns.singularity.travelToCity(TIAN_DI_HUI.cities[0]);
                lastAction = `viajou p/ ${TIAN_DI_HUI.cities[0]} (Tian Di Hui)`;
            } else if (cityTarget && !invited.has(cityTarget.name) && player.city !== cityTarget.city) {
                ns.singularity.travelToCity(cityTarget.city);
                lastAction = `viajou p/ ${cityTarget.city} (${cityTarget.name})`;
            }
        }

        printStatus(ns, joined, blocked, cityTarget, lastAction);
        await ns.sleep(8000);
    }
}

/** A faction ainda oferece algum aug (fora NeuroFlux) que não temos? */
function hasWantedAugs(ns, faction, owned) {
    try {
        return ns.singularity.getAugmentationsFromFaction(faction)
            .some(a => a !== NEUROFLUX && !owned.has(a));
    } catch {
        return true; // na dúvida, persegue
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

function printStatus(ns, joined, blocked, cityTarget, lastAction) {
    ns.clearLog();
    ns.print("=== FACTION MANAGER ===");
    ns.print("");
    ns.print(`Ingressadas: ${joined.size}`);
    for (const f of joined) ns.print(`  ✓ ${f}`);
    ns.print("");

    if (cityTarget) ns.print(`Alvo de cidade: ${cityTarget.name} (prioridade ${cityTarget.priority})`);
    if (blocked.size) ns.print(`Bloqueadas (inimigas): ${[...blocked].join(", ")}`);
    ns.print("");

    const pendingHack = HACKING_FACTIONS.filter(f => !joined.has(f.name));
    if (pendingHack.length) {
        ns.print("Hacking pendentes:");
        for (const f of pendingHack) ns.print(`  ✗ ${f.name} (backdoor ${f.server}, hack ${f.hack})`);
    }
    ns.print("");
    ns.print(`Ação: ${lastAction}`);
}
