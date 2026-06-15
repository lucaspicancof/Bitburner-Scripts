import { createDashboard, sparkline } from "/lib/dashboard-ui.js";
import { read } from "/lib/telemetry.js";
import { scanAll, analyzeServer } from "/lib/network.js";
import { prepPercent, potentialScore } from "/lib/scoring.js";
import { getAllUpgrades, formatPayback } from "/lib/hacknet.js";

/**
 * HUD principal — dashboard com abas. Consome telemetria dos managers (leve, sem
 * Singularity) e calcula os dados baratos direto. Mantém séries temporais em memória
 * pra desenhar sparklines de renda/dinheiro/hacking.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");

    const tabs = [
        { id: "geral", label: "Geral" },
        { id: "scan", label: "Scan" },
        { id: "hack", label: "Hack" },
        { id: "hacknet", label: "Hacknet" },
        { id: "factions", label: "Factions" },
        { id: "scripts", label: "Scripts" }
    ];

    const dash = createDashboard({ id: "bb-dashboard", title: "BITBURNER HUD", tabs });
    ns.atExit(() => dash.destroy());

    // Séries temporais (buffer rolante).
    const MAX = 120;
    const hist = { income: [], money: [], hack: [] };
    const push = (arr, v) => { arr.push(v); if (arr.length > MAX) arr.shift(); };

    const renderers = {
        geral: () => renderGeral(ns, hist),
        scan: () => renderScan(ns),
        hack: () => renderHack(ns),
        hacknet: () => renderHacknet(ns),
        factions: () => renderFactions(ns),
        scripts: () => renderScripts(ns)
    };

    while (true) {
        if (dash.isClosed()) return;
        dash.reattach();

        // Amostra a série sempre (mesmo minimizado/outra aba).
        push(hist.income, ns.getTotalScriptIncome()[0]);
        push(hist.money, ns.getServerMoneyAvailable("home"));
        push(hist.hack, ns.getHackingLevel());

        if (!dash.isCollapsed()) {
            try {
                dash.setBody(renderers[dash.getActive()]());
            } catch (e) {
                dash.setBody(`<div class="bb-bad">erro ao renderizar: ${e}</div>`);
            }
        }
        await ns.sleep(1000);
    }
}

/* ---------------- helpers ---------------- */

const f = {
    n: (ns, v) => ns.format.number(v),
    money: (ns, v) => "$" + ns.format.number(v),
    ram: (ns, v) => ns.format.ram(v)
};

const stat = (k, v) => `<div class="bb-stat"><span class="k">${k}</span><span class="v">${v}</span></div>`;
const section = t => `<div class="bb-section">${t}</div>`;
const bar = r => `<div class="bb-bar"><i style="width:${Math.min(100, Math.max(0, r * 100))}%"></i></div>`;

function card(label, big, spark) {
    return `<div class="bb-card">
        <div class="lbl">${label}</div>
        <div class="big">${big}</div>
        ${spark || ""}
    </div>`;
}

function staleness(snap) {
    if (!snap) return `<span class="bb-bad">offline</span>`;
    if (snap.age > 20000) return `<span class="bb-warn">${(snap.age / 1000).toFixed(0)}s atrás</span>`;
    return `<span class="bb-good">ao vivo</span>`;
}

/* ---------------- ABA: GERAL ---------------- */

function renderGeral(ns, hist) {
    const money = ns.getServerMoneyAvailable("home");
    const income = ns.getTotalScriptIncome()[0];
    const player = ns.getPlayer();

    let maxRam = 0, usedRam = 0, rooted = 0;
    for (const s of scanAll(ns)) {
        if (!ns.hasRootAccess(s)) continue;
        rooted++; maxRam += ns.getServerMaxRam(s); usedRam += ns.getServerUsedRam(s);
    }

    let hnProd = 0;
    const hn = ns.hacknet.numNodes();
    for (let i = 0; i < hn; i++) hnProd += ns.hacknet.getNodeStats(i).production;

    const reset = read(ns, "reset");
    const prog = read(ns, "progression");
    const uptime = uptimeStr(ns);

    // Cartões com sparkline.
    let html = `<div class="bb-grid">
        ${card("Renda / s", f.money(ns, income), sparkline(hist.income, { color: "#3fb950", fill: "rgba(63,185,80,.12)" }))}
        ${card("Dinheiro", f.money(ns, money), sparkline(hist.money))}
    </div>`;

    html += `<div class="bb-card">
        <div class="lbl">Hacking — nível ${player.skills.hacking}</div>
        ${sparkline(hist.hack, { color: "#d29922", fill: "rgba(210,153,34,.12)" })}
    </div>`;

    html += section("RECURSOS");
    html += `<div class="bb-stat"><span class="k">RAM da rede (${rooted} servers)</span>
        <span class="v">${f.ram(ns, usedRam)} / ${f.ram(ns, maxRam)}</span></div>${bar(maxRam ? usedRam / maxRam : 0)}`;
    html += `<div style="height:10px"></div><div class="bb-grid">
        ${stat("Renda / dia", f.money(ns, income * 86400))}
        ${stat("Hacknet", f.money(ns, hnProd) + "/s")}
        ${stat("Uptime (aug)", uptime)}
        ${stat("Factions", player.factions.length)}
    </div>`;

    html += section("CICLO DE RESET");
    if (reset?.data) {
        const d = reset.data;
        const when = d.monitorOnly ? "modo monitor (manual)"
            : d.installInMin != null ? `~${d.installInMin.toFixed(1)} min`
                : "acumulando...";
        html += `<div class="bb-grid">
            ${stat("Augs na fila", `${d.queued} / ${d.minAugs}`)}
            ${stat("Instala em", when)}
            ${stat("Timeout (joelho)", `${d.effectiveMin} min`)}
            ${stat("Fila parada há", `${d.stalledMin.toFixed(1)} min`)}
        </div>`;
    } else {
        html += `<div class="bb-muted">reset-loop offline ${staleness(reset)}</div>`;
    }

    return html;
}

function uptimeStr(ns) {
    try {
        const ms = Date.now() - ns.getResetInfo().lastAugReset;
        const m = Math.floor(ms / 60000), h = Math.floor(m / 60);
        return h > 0 ? `${h}h${m % 60}m` : `${m}m`;
    } catch {
        return "—";
    }
}

/* ---------------- ABA: SCAN ---------------- */

function renderScan(ns) {
    const myLevel = ns.getHackingLevel();

    const rows = scanAll(ns)
        .filter(s => s !== "home" && ns.getServerMaxMoney(s) > 0)
        .map(s => {
            const data = analyzeServer(ns, s);
            const root = ns.hasRootAccess(s);
            return {
                server: s,
                root,
                backdoor: !!ns.getServer(s).backdoorInstalled,
                req: data.hackingLevel,
                moneyPct: data.moneyRatio * 100,
                prep: prepPercent(data),
                potential: root ? potentialScore(ns, s) : 0
            };
        })
        .sort((a, b) => b.potential - a.potential)
        .slice(0, 24);

    const body = rows.map(r => {
        const lvlClass = r.req <= myLevel ? "" : "bb-bad";
        return `<tr>
            <td>${r.server}</td>
            <td>${r.potential > 0 ? f.money(ns, r.potential) + "/s" : '<span class="bb-muted">—</span>'}</td>
            <td>${r.moneyPct.toFixed(0)}%</td>
            <td>${r.prep.toFixed(0)}%</td>
            <td class="${lvlClass}">${r.req}</td>
            <td>${r.root ? '<span class="bb-good">✓</span>' : '<span class="bb-bad">✗</span>'}</td>
            <td>${r.backdoor ? '<span class="bb-good">✓</span>' : '<span class="bb-muted">·</span>'}</td>
        </tr>`;
    }).join("");

    return section(`REDE — top ${rows.length} por potencial`) + `
        <table class="bb-table">
            <tr><th>server</th><th>potencial</th><th>$%</th><th>prep</th><th>lvl</th><th>root</th><th>bd</th></tr>
            ${body}
        </table>`;
}

/* ---------------- ABA: HACK ---------------- */

function renderHack(ns) {
    const snap = read(ns, "hack");
    let html = `${section("BATCH SCHEDULER")}<div class="bb-stat"><span class="k">status</span><span class="v">${staleness(snap)}</span></div>`;

    if (snap?.data) {
        const d = snap.data;
        html += `<div class="bb-grid">
            ${stat("Alvos ativos", d.count ?? 0)}
            ${stat("Renda potencial", f.money(ns, d.estIncomePerSec ?? 0) + "/s")}
            ${stat("Orçamento total", f.ram(ns, d.totalBudgetGB ?? 0))}
        </div>`;
        const rows = (d.targets ?? []).map(t => `
            <tr>
                <td>${t.name}</td>
                <td>${f.money(ns, t.potential)}/s</td>
                <td>${f.ram(ns, t.budgetGB)}</td>
                <td>${t.prepped ? '<span class="bb-good">✓</span>' : '<span class="bb-warn">prep</span>'}</td>
            </tr>`).join("");
        html += section("ALVOS EM ATAQUE") + `
            <table class="bb-table">
                <tr><th>server</th><th>potencial</th><th>orçamento</th><th>prep</th></tr>
                ${rows || '<tr><td colspan="4" class="bb-muted">—</td></tr>'}
            </table>`;
    } else {
        html += `<div class="bb-muted">batch-manager não está publicando.</div>`;
    }
    return html;
}

/* ---------------- ABA: HACKNET ---------------- */

function renderHacknet(ns) {
    const nodes = ns.hacknet.numNodes();
    let prod = 0;
    for (let i = 0; i < nodes; i++) prod += ns.hacknet.getNodeStats(i).production;

    const upgrades = getAllUpgrades(ns).slice(0, 8);
    const rows = upgrades.map(u => `
        <tr><td>${u.type}</td><td>${u.node < 0 ? "novo" : u.node}</td>
        <td>${f.money(ns, u.cost)}</td><td>${formatPayback(u.payback)}</td></tr>`).join("");

    return `${section("HACKNET")}<div class="bb-grid">
            ${stat("Nós", nodes)}
            ${stat("Produção", f.money(ns, prod) + "/s")}
            ${stat("Renda/dia", f.money(ns, prod * 86400))}
        </div>${section("MELHORES UPGRADES")}
        <table class="bb-table">
            <tr><th>tipo</th><th>nó</th><th>custo</th><th>payback</th></tr>
            ${rows || '<tr><td colspan="4" class="bb-muted">tudo maxado</td></tr>'}
        </table>`;
}

/* ---------------- ABA: FACTIONS ---------------- */

function renderFactions(ns) {
    const snap = read(ns, "progression");
    if (!snap?.data) {
        return section("FACTIONS") + `<div class="bb-muted">Sem telemetria. Rode o progression-manager.</div>`;
    }
    const d = snap.data;
    const rows = (d.factionRows ?? []).map(r =>
        `<tr><td>${r.name}</td><td>${f.n(ns, r.rep)}</td><td>${r.favor.toFixed(0)}</td></tr>`).join("");

    let target = `<div class="bb-muted">sem alvo de rep agora</div>`;
    if (d.target) {
        target = `<div class="bb-grid">
            ${stat("Próximo aug", d.target.aug)}
            ${stat("Faction", d.target.faction)}
            ${stat("Rep", `${f.n(ns, d.target.repHave)} / ${f.n(ns, d.target.repReq)}`)}
            ${stat("ETA", d.target.etaMin != null ? `${d.target.etaMin.toFixed(0)} min` : "—")}
        </div>`;
    }

    return `${section("PROGRESSÃO")} <span style="float:right">${staleness(snap)}</span>
        ${stat("Comprados (sessão)", d.bought ?? 0)}${stat("Na fila", d.queued ?? 0)}
        ${section("ALVO ATUAL")}${target}
        ${section("REPUTAÇÃO")}
        <table class="bb-table"><tr><th>faction</th><th>rep</th><th>favor</th></tr>
        ${rows || '<tr><td colspan="3" class="bb-muted">—</td></tr>'}</table>`;
}

/* ---------------- ABA: SCRIPTS ---------------- */

function renderScripts(ns) {
    const agg = new Map();
    for (const host of scanAll(ns)) {
        if (!ns.hasRootAccess(host)) continue;
        for (const p of ns.ps(host)) {
            const cur = agg.get(p.filename) ?? { threads: 0, instances: 0, ram: 0 };
            cur.threads += p.threads;
            cur.instances += 1;
            cur.ram += ns.getScriptRam(p.filename, host) * p.threads;
            agg.set(p.filename, cur);
        }
    }
    const list = [...agg.entries()].map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.ram - a.ram).slice(0, 16);
    const totalThreads = list.reduce((s, x) => s + x.threads, 0);
    const rows = list.map(s => `
        <tr><td>${s.name}</td><td>${s.instances}</td><td>${s.threads}</td><td>${f.ram(ns, s.ram)}</td></tr>`).join("");

    return section(`SCRIPTS (${agg.size} tipos, ${totalThreads} threads)`) + `
        <table class="bb-table"><tr><th>script</th><th>inst</th><th>threads</th><th>ram</th></tr>
        ${rows || '<tr><td colspan="4" class="bb-muted">nenhum</td></tr>'}</table>`;
}
