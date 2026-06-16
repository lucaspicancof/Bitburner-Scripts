import {
    buildPlan,
    buyableNow,
    ownedOrQueued,
    queuedCount
} from "/lib/augmentations.js";
import { factionRates } from "/lib/forecast.js";
import { chooseFarmTarget, value } from "/lib/aug-value.js";
import { publish } from "/lib/telemetry.js";

/**
 * Progression Manager — automatiza rep farming + compra de augmentations.
 *
 * Modo híbrido (escolhido): compra tudo automaticamente, mas NÃO instala.
 * Quando não há mais nada a comprar/farmar, avisa e fica aguardando você
 * rodar `install.js` pra confirmar o reset.
 *
 * Loop:
 *   1. Compra todo aug com rep suficiente (mais caro primeiro).
 *   2. Se sobrou aug rep-locked → trabalha pra faction com menor gap de rep.
 *   3. Se não sobrou nada → toast "pronto pra instalar" e idle.
 *
 * Requer rodar no HOME com RAM alta (Singularity custa 16x sem SF4).
 *
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();

    const flags = ns.flags([["reserve", 1e9]]); // dinheiro preservado p/ openers/travel/preços

    let totalBought = 0;
    let notified = false;
    let lastAction = "iniciando";

    while (true) {
        const owned = ownedOrQueued(ns);
        let plan = buildPlan(ns);

        // --- 0) DOAR rep nas factions com favor suficiente (instantâneo, $ é abundante) ---
        const donated = donateForRep(ns, plan, flags.reserve);
        if (donated) {
            plan = buildPlan(ns); // rep mudou → replaneja
            lastAction = `doou rep (${donated} faction[s])`;
        }

        // --- 1) COMPRAR o que dá (maior valor primeiro) ---
        const buyable = buyableNow(ns, plan, owned)
            .sort((a, b) => value(ns, b.aug) - value(ns, a.aug));
        for (const e of buyable) {
            if (ns.singularity.purchaseAugmentation(e.faction, e.aug)) {
                totalBought++;
                owned.add(e.aug);
                lastAction = `comprou ${e.aug}`;
                ns.toast(`Comprado: ${e.aug} (${e.faction})`, "success");
            }
        }

        // Replaneja após as compras.
        const remaining = buildPlan(ns);

        // --- 3) NADA RESTANTE → avisa e idle ---
        if (remaining.length === 0) {
            if (!notified) {
                ns.toast(
                    `Tudo comprado (${queuedCount(ns)} na fila). Rode: run install.js`,
                    "warning",
                    null
                );
                ns.tprint("PROGRESSION: nada mais a comprar. Confirme com 'run install.js'.");
                notified = true;
                stopWork(ns);
            }
            printStatus(ns, totalBought, "AGUARDANDO INSTALL", null);
            publishProgress(ns, totalBought, null);
            await ns.sleep(30000);
            continue;
        }
        notified = false;

        // --- 2) FARMAR rep pro alvo de maior valor por rep (com guarda de ETA) ---
        const rates = factionRates(ns);
        const target = chooseFarmTarget(ns, remaining, owned, rates);

        if (target) {
            ensureWorking(ns, target.faction);
            lastAction = `farmando ${target.faction} → ${target.aug}`;
            printStatus(ns, totalBought, lastAction, target);
        } else {
            // Sobram augs, mas todos travados por prereq ainda não comprável.
            lastAction = "aguardando prereqs/dinheiro";
            printStatus(ns, totalBought, lastAction, null);
        }

        publishProgress(ns, totalBought, target);
        await ns.sleep(10000);
    }
}

/**
 * Doa dinheiro pra ganhar reputação nas factions com favor >= getFavorToDonate().
 * Pra cada uma, doa o suficiente pra cobrir o maior repReq entre os augs faltantes
 * (cobre todos os menores de uma vez), respeitando a reserva. Como o dinheiro é
 * abundante, isso torna a rep dessas factions instantânea.
 *
 * @returns {number} quantas factions receberam doação
 */
function donateForRep(ns, plan, reserve) {
    const favorMin = ns.getFavorToDonate();
    const player = ns.getPlayer();
    const perDollar = ns.formulas.reputation.repFromDonation(1, player);
    if (perDollar <= 0) return 0;

    const byFaction = new Map();
    for (const e of plan) {
        if (!byFaction.has(e.faction)) byFaction.set(e.faction, []);
        byFaction.get(e.faction).push(e);
    }

    let count = 0;
    for (const [faction, augs] of byFaction) {
        if (ns.singularity.getFactionFavor(faction) < favorMin) continue;

        const have = ns.singularity.getFactionRep(faction);
        const needRep = Math.max(...augs.map(a => a.repReq));
        if (have >= needRep) continue;

        const cost = Math.ceil((needRep - have) / perDollar * 1.02); // 2% de folga
        const afford = ns.getServerMoneyAvailable("home") - reserve;
        if (afford <= 0) continue;

        const amount = Math.min(cost, afford); // doa o que der dentro da reserva
        if (ns.singularity.donateToFaction(faction, amount)) count++;
    }
    return count;
}

/**
 * Garante que estamos trabalhando para a faction alvo (focus=false pra não
 * roubar a tela). Não reinicia o trabalho se já estiver na faction certa.
 */
function ensureWorking(ns, faction) {
    const work = ns.singularity.getCurrentWork();
    if (work && work.type === "FACTION" && work.factionName === faction) {
        return;
    }

    const types = ns.singularity.getFactionWorkTypes(faction);
    if (types.length === 0) return;

    // Prioriza hacking (melhor rep/seg pro perfil de hacking).
    const workType = types.includes("hacking") ? "hacking" : types[0];
    ns.singularity.workForFaction(faction, workType, false);
}

function stopWork(ns) {
    const work = ns.singularity.getCurrentWork();
    if (work && work.type === "FACTION") {
        ns.singularity.stopAction();
    }
}

/** Publica o snapshot de progressão pro dashboard (aba Factions). */
function publishProgress(ns, bought, target) {
    const factions = ns.getPlayer().factions;
    const rates = factionRates(ns);

    const factionRows = factions.map(name => ({
        name,
        rep: ns.singularity.getFactionRep(name),
        favor: ns.singularity.getFactionFavor(name)
    }));

    let targetObj = null;
    if (target) {
        const r = rates[target.faction];
        targetObj = {
            aug: target.aug,
            faction: target.faction,
            repHave: target.repHave,
            repReq: target.repReq,
            etaMin: r > 0 ? (target.repReq - target.repHave) / r : null
        };
    }

    publish(ns, "progression", {
        factions,
        factionRows,
        queued: queuedCount(ns),
        bought,
        target: targetObj
    });
}

function printStatus(ns, bought, action, target) {
    ns.clearLog();
    ns.print("=== PROGRESSION MANAGER ===");
    ns.print("");
    ns.print(`Comprados (sessão): ${bought}`);
    ns.print(`Na fila:            ${queuedCount(ns)}`);
    ns.print(`Ação:               ${action}`);
    ns.print("");

    if (target) {
        const gap = target.repReq - target.repHave;
        ns.print("Alvo de rep:");
        ns.print(`  ${target.aug}`);
        ns.print(`  Faction: ${target.faction}`);
        ns.print(`  Rep: ${ns.format.number(target.repHave)} / ${ns.format.number(target.repReq)}`);
        ns.print(`  Falta: ${ns.format.number(gap)}`);
    }

    ns.print("");
    ns.print(`Money: ${ns.format.number(ns.getServerMoneyAvailable("home"))}`);
}
