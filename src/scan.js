import { scanAll, analyzeServer } from "/lib/network.js";
import { economicScore, prepPercent, isReady } from "/lib/scoring.js";

/**
 * Scanner de rede: lista servidores hackeáveis ranqueados por score econômico.
 *
 * @param {NS} ns
 * Args: modo opcional — "all" (default) | "ready" | "prep" | "top"
 */
export async function main(ns) {
    const mode = String(ns.args[0] ?? "all").toLowerCase();

    const myLevel = ns.getHackingLevel();
    const openers = [
        "BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe",
        "HTTPWorm.exe", "SQLInject.exe"
    ].filter(p => ns.fileExists(p, "home")).length;

    let rows = scanAll(ns)
        .filter(s =>
            ns.getServerMaxMoney(s) > 0 &&
            ns.hasRootAccess(s)
        )
        .map(s => {
            const data = analyzeServer(ns, s);
            return {
                server: s,
                score: economicScore(data),
                prep: prepPercent(data),
                ready: isReady(data),
                moneyPct: data.moneyRatio * 100,
                chance: data.chance * 100,
                securityGap: data.securityGap,
                maxMoney: data.maxMoney,
                hackTime: data.hackTime / 1000
            };
        });

    if (mode === "ready") rows = rows.filter(r => r.ready);
    if (mode === "prep") rows = rows.filter(r => !r.ready);

    rows.sort((a, b) => b.score - a.score);
    if (mode === "top") rows = rows.slice(0, 10);

    ns.tprint("");
    ns.tprint(`Hacking: ${myLevel} | Port openers: ${openers} | Modo: ${mode}`);
    ns.tprint("");
    ns.tprint(
        "SERVER".padEnd(20) + " | " +
        "STATUS".padEnd(6) + " | " +
        "SCORE".padStart(10) + " | " +
        "PREP".padStart(5) + " | " +
        "MONEY%".padStart(7) + " | " +
        "CH%".padStart(6) + " | " +
        "SEC".padStart(5) + " | " +
        "MAX".padStart(10) + " | " +
        "TIME".padStart(8)
    );
    ns.tprint("-".repeat(100));

    for (const r of rows) {
        ns.tprint(
            r.server.padEnd(20) + " | " +
            (r.ready ? "READY" : "PREP").padEnd(6) + " | " +
            ns.format.number(r.score).padStart(10) + " | " +
            `${r.prep.toFixed(0)}%`.padStart(5) + " | " +
            `${r.moneyPct.toFixed(0)}%`.padStart(7) + " | " +
            `${r.chance.toFixed(1)}%`.padStart(6) + " | " +
            r.securityGap.toFixed(1).padStart(5) + " | " +
            ns.format.number(r.maxMoney).padStart(10) + " | " +
            `${r.hackTime.toFixed(1)}s`.padStart(8)
        );
    }
}
