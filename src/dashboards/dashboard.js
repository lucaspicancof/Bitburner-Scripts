import { createDashboard } from "/lib/dashboard-ui.js";
import { read } from "/lib/telemetry.js";
import { scanAll, analyzeServer } from "/lib/network.js";
import { rankTargets } from "/lib/targets.js";
import { getAllUpgrades, formatPayback } from "/lib/hacknet.js";

/**
 * HUD principal — dashboard com abas. Consome telemetria publicada pelos
 * managers (leve, sem Singularity) e calcula os dados baratos diretamente.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");

    const tabs = [
        { id: "geral", label: "Geral" },
        { id: "hack", label: "Hack" },
        { id: "hacknet", label: "Hacknet" },
        { id: "factions", label: "Factions" },
        { id: "scripts", label: "Scripts" }
    ];

    const dash = createDashboard({ id: "bb-dashboard", title: "BITBURNER HUD", tabs });
    ns.atExit(() => dash.destroy());

    const renderers = {
        geral: () => renderGeral(ns),
        hack: () => renderHack(ns),
        hacknet: () => renderHacknet(ns),
        factions: () => renderFactions(ns),
        scripts: () => renderScripts(ns)
    };

    while (true) {
        if (dash.isClosed()) return;
        dash.reattach();
        const tab = dash.getActive();
        try {
            dash.setBody(renderers[tab]());
        } catch (e) {
            dash.setBody(`<div class="bb-bad">erro ao renderizar: ${e}</div>`);
        }
        await ns.sleep(1000);
    }
}

/* ---------------- helpers de HTML ---------------- */

const f = {
    n: (ns, v) => ns.format.number(v),
    money: (ns, v) => "$" + ns.format.number(v),
    ram: (ns, v) => ns.format.ram(v),
    pct: (v) => `${(v * 100).toFixed(0)}%`
};

function stat(k, v) {
    return `<div class="bb-stat"><span class="k">${k}</span><span class="v">${v}</span></div>`;
}

function section(title) {
    return `<div class="bb-section">${title}</div>`;
}

function bar(ratio) {
    const pct = Math.min(100, Math.max(0, ratio * 100));
    return `<div class="bb-bar"><i style="width:${pct}%"></i></div>`;
}

function staleness(snap) {
    if (!snap) return `<span class="bb-bad">offline</span>`;
    if (snap.age > 15000) return `<span class="bb-warn">${(snap.age / 1000).toFixed(0)}s atrás</span>`;
    return `<span class="bb-good">ao vivo</span>`;
}

/* ---------------- ABA: GERAL ---------------- */

function renderGeral(ns) {
    const money = ns.getServerMoneyAvailable("home");
    const income = ns.getTotalScriptIncome()[0];
    const exp = ns.getTotalScriptExpGain();
    const player = ns.getPlayer();

    // RAM da rede
    let maxRam = 0, usedRam = 0, rooted = 0;
    for (const s of scanAll(ns)) {
        if (!ns.hasRootAccess(s)) continue;
        rooted++;
        maxRam += ns.getServerMaxRam(s);
        usedRam += ns.getServerUsedRam(s);
    }

    // Hacknet
    let hnProd = 0;
    const hn = ns.hacknet.numNodes();
    for (let i = 0; i < hn; i++) hnProd += ns.hacknet.getNodeStats(i).production;

    const prog = read(ns, "progression");
    const factionsN = prog?.data?.factions?.length ?? "—";
    const queued = prog?.data?.queued ?? "—";

    return `
        ${section("RESUMO DA RUN")}
        <div class="bb-grid">
            ${stat("Dinheiro", f.money(ns, money))}
            ${stat("Renda", f.money(ns, income) + "/s")}
            ${stat("Hacking", player.skills.hacking)}
            ${stat("Exp/s", f.n(ns, exp))}
            ${stat("Cidade", player.city)}
            ${stat("Intelligence", player.skills.intelligence)}
        </div>
        ${section("RECURSOS")}
        <div class="bb-stat"><span class="k">RAM da rede (${rooted} servers)</span>
            <span class="v">${f.ram(ns, usedRam)} / ${f.ram(ns, maxRam)}</span></div>
        ${bar(maxRam > 0 ? usedRam / maxRam : 0)}
        <div style="height:10px"></div>
        <div class="bb-grid">
            ${stat("Hacknet", f.money(ns, hnProd) + "/s")}
            ${stat("Renda/dia", f.money(ns, income * 86400))}
            ${stat("Factions", factionsN)}
            ${stat("Augs na fila", queued)}
        </div>
    `;
}

/* ---------------- ABA: HACK ---------------- */

function renderHack(ns) {
    const snap = read(ns, "hack");
    let header = `${section("BATCH MANAGER")}<div class="bb-stat"><span class="k">status</span><span class="v">${staleness(snap)}</span></div>`;

    if (snap?.data) {
        const d = snap.data;
        header += `<div class="bb-grid">
            ${stat("Alvo", d.target)}
            ${stat("Hack/batch", `${(d.hackPct ?? 0).toFixed(1)}%`)}
            ${stat("Yield/batch", f.money(ns, d.yield ?? 0))}
            ${stat("Threads/batch", d.threads ?? "—")}
            ${stat("Batches/onda", `${d.launched ?? 0}/${d.planned ?? 0}`)}
            ${stat("Weaken time", `${((d.weakenTime ?? 0) / 1000).toFixed(0)}s`)}
        </div>`;
    } else {
        header += `<div class="bb-muted">batch-manager não está publicando. Rode-o.</div>`;
    }

    // Top alvos (cálculo barato)
    const servers = scanAll(ns).filter(s =>
        ns.hasRootAccess(s) &&
        ns.getServerMaxMoney(s) > 0 &&
        ns.getServerRequiredHackingLevel(s) <= ns.getHackingLevel()
    );
    const ranked = rankTargets(ns, servers).slice(0, 8);

    let rows = ranked.map(t => `
        <tr>
            <td>${t.server}</td>
            <td>${t.prep.toFixed(0)}%</td>
            <td>${t.ready ? '<span class="bb-good">sim</span>' : '<span class="bb-warn">não</span>'}</td>
            <td>${f.n(ns, t.effective)}</td>
        </tr>`).join("");

    return header + section("TOP ALVOS") + `
        <table class="bb-table">
            <tr><th>server</th><th>prep</th><th>ready</th><th>score</th></tr>
            ${rows}
        </table>`;
}

/* ---------------- ABA: HACKNET ---------------- */

function renderHacknet(ns) {
    const nodes = ns.hacknet.numNodes();
    let prod = 0;
    for (let i = 0; i < nodes; i++) prod += ns.hacknet.getNodeStats(i).production;

    const upgrades = getAllUpgrades(ns).slice(0, 8);
    const rows = upgrades.map(u => `
        <tr>
            <td>${u.type}</td>
            <td>${u.node < 0 ? "novo" : u.node}</td>
            <td>${f.money(ns, u.cost)}</td>
            <td>${formatPayback(u.payback)}</td>
        </tr>`).join("");

    return `
        ${section("HACKNET")}
        <div class="bb-grid">
            ${stat("Nós", nodes)}
            ${stat("Produção", f.money(ns, prod) + "/s")}
            ${stat("Renda/hora", f.money(ns, prod * 3600))}
            ${stat("Renda/dia", f.money(ns, prod * 86400))}
        </div>
        ${section("MELHORES UPGRADES (por payback)")}
        <table class="bb-table">
            <tr><th>tipo</th><th>nó</th><th>custo</th><th>payback</th></tr>
            ${rows || '<tr><td colspan="4" class="bb-muted">tudo maxado</td></tr>'}
        </table>`;
}

/* ---------------- ABA: FACTIONS ---------------- */

function renderFactions(ns) {
    const snap = read(ns, "progression");

    if (!snap?.data) {
        return section("FACTIONS") +
            `<div class="bb-muted">Sem telemetria. Rode o progression-manager pra popular esta aba.</div>`;
    }

    const d = snap.data;
    const rows = (d.factionRows ?? []).map(r => `
        <tr>
            <td>${r.name}</td>
            <td>${f.n(ns, r.rep)}</td>
            <td>${r.favor.toFixed(0)}</td>
        </tr>`).join("");

    let target = `<div class="bb-muted">sem alvo de rep no momento</div>`;
    if (d.target) {
        target = `<div class="bb-grid">
            ${stat("Próximo aug", d.target.aug)}
            ${stat("Faction", d.target.faction)}
            ${stat("Rep", `${f.n(ns, d.target.repHave)} / ${f.n(ns, d.target.repReq)}`)}
            ${stat("ETA", d.target.etaMin != null ? `${d.target.etaMin.toFixed(0)} min` : "—")}
        </div>`;
    }

    return `
        ${section("PROGRESSÃO")} <span class="bb-stat" style="float:right">${staleness(snap)}</span>
        ${stat("Augs comprados (sessão)", d.bought ?? 0)}
        ${stat("Augs na fila", d.queued ?? 0)}
        ${section("ALVO ATUAL")}
        ${target}
        ${section("REPUTAÇÃO")}
        <table class="bb-table">
            <tr><th>faction</th><th>rep</th><th>favor</th></tr>
            ${rows || '<tr><td colspan="3" class="bb-muted">—</td></tr>'}
        </table>`;
}

/* ---------------- ABA: SCRIPTS ---------------- */

function renderScripts(ns) {
    const agg = new Map(); // filename -> { threads, instances, ram }

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

    const list = [...agg.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.ram - a.ram)
        .slice(0, 14);

    const totalThreads = list.reduce((s, x) => s + x.threads, 0);
    const rows = list.map(s => `
        <tr>
            <td>${s.name}</td>
            <td>${s.instances}</td>
            <td>${s.threads}</td>
            <td>${f.ram(ns, s.ram)}</td>
        </tr>`).join("");

    return `
        ${section(`SCRIPTS ATIVOS (${agg.size} tipos, ${totalThreads} threads)`)}
        <table class="bb-table">
            <tr><th>script</th><th>inst</th><th>threads</th><th>ram</th></tr>
            ${rows || '<tr><td colspan="4" class="bb-muted">nenhum</td></tr>'}
        </table>`;
}
