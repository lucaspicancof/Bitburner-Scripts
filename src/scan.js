import { scanAll, analyzeServer } from "/lib/network.js";
import { prepPercent, isReady, potentialScore } from "/lib/scoring.js";
import { HACKING_FACTIONS } from "/lib/factions.js";

/**
 * Scanner de rede. Lista servidores hackeáveis ranqueados pelo $/s POTENCIAL
 * (mesmo critério do batch scheduler), com prep, segurança, root, backdoor e
 * marcação dos servidores de faction.
 *
 * @param {NS} ns
 * Args: modo opcional — "all" (default) | "ready" | "prep" | "top" | "faction"
 */
export async function main(ns) {
    const mode = String(ns.args[0] ?? "all").toLowerCase();
    const myLevel = ns.getHackingLevel();
    const factionServers = new Set(HACKING_FACTIONS.map(f => f.server));

    const openers = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"]
        .filter(p => ns.fileExists(p, "home")).length;

    let rows = scanAll(ns)
        .filter(s => s !== "home" && ns.getServerMaxMoney(s) > 0)
        .map(s => {
            const data = analyzeServer(ns, s);
            const root = ns.hasRootAccess(s);
            return {
                server: s,
                root,
                backdoor: !!ns.getServer(s).backdoorInstalled,
                isFaction: factionServers.has(s),
                req: data.hackingLevel,
                moneyPct: data.moneyRatio * 100,
                securityGap: data.securityGap,
                prep: prepPercent(data),
                ready: isReady(data),
                maxMoney: data.maxMoney,
                weakenTime: data.weakenTime / 1000,
                potential: root ? potentialScore(ns, s) : 0
            };
        });

    if (mode === "ready") rows = rows.filter(r => r.ready);
    if (mode === "prep") rows = rows.filter(r => r.root && !r.ready);
    if (mode === "faction") rows = rows.filter(r => r.isFaction);

    rows.sort((a, b) => b.potential - a.potential);
    if (mode === "top") rows = rows.slice(0, 12);

    ns.tprint("");
    ns.tprint(`Hacking: ${myLevel} | Openers: ${openers}/5 | Modo: ${mode}`);
    ns.tprint("");
    ns.tprint(
        "SERVER".padEnd(20) + " | " + "POT/s".padStart(10) + " | " + "PREP".padStart(5) + " | " +
        "MONEY%".padStart(7) + " | " + "SEC".padStart(5) + " | " + "REQ".padStart(5) + " | " +
        "ROOT".padStart(4) + " | " + "BD".padStart(3) + " | " + "MAX".padStart(10)
    );
    ns.tprint("-".repeat(96));

    for (const r of rows) {
        const tag = r.isFaction ? " «faction»" : "";
        ns.tprint(
            r.server.padEnd(20) + " | " +
            (r.potential > 0 ? ns.format.number(r.potential) : "-").padStart(10) + " | " +
            `${r.prep.toFixed(0)}%`.padStart(5) + " | " +
            `${r.moneyPct.toFixed(0)}%`.padStart(7) + " | " +
            r.securityGap.toFixed(1).padStart(5) + " | " +
            String(r.req).padStart(5) + " | " +
            (r.root ? "✓" : "✗").padStart(4) + " | " +
            (r.backdoor ? "✓" : "·").padStart(3) + " | " +
            ns.format.number(r.maxMoney).padStart(10) + tag
        );
    }
}
