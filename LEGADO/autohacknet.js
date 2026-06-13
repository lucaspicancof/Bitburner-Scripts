/**
 * Script para comprar e melhorar nós do Hacknet.
 *
 * Modos:
 * - Alvo (padrão): run <script> nodes level RAM cores
 * - Auto: run <script> --auto [--reserve N] [--interval ms]
 *
 * Exemplo alvo: run <script> 10 100 32 10
 * Exemplo auto: run <script> --auto --reserve 5e6
 *
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("sleep");
    ns.disableLog("getServerMoneyAvailable");

    const flags = ns.flags([
        ["help", false],
        ["auto", false],
        ["reserve", 0],
        ["interval", 250],
        ["toast", true],
    ]);

    if (flags.help || (!flags.auto && flags._.length < 4)) {
        ns.tprint("Este script compra e melhora nós do Hacknet.");
        ns.tprint(`Uso alvo: run ${ns.getScriptName()} nodes level RAM cores`);
        ns.tprint(`Uso auto: run ${ns.getScriptName()} --auto [--reserve N] [--interval ms]`);
        ns.tprint(`Ex.: run ${ns.getScriptName()} 10 100 32 10`);
        ns.tprint(`Ex.: run ${ns.getScriptName()} --auto --reserve 5e6`);
        return;
    }

    const validRam = [1, 2, 4, 8, 16, 32, 64];

    const waitForMoney = async (amount) => {
        while (ns.getServerMoneyAvailable("home") - flags.reserve < amount) {
            await ns.sleep(flags.interval);
        }
    };

    const maxNodes = ns.hacknet.maxNumNodes();

    let targetNodes, targetLvl, targetRam, targetCores;
    if (flags.auto) {
        targetNodes = maxNodes;
        targetLvl = 200;
        targetRam = 64;
        targetCores = 16;
    } else {
        const nodes = Number(flags._[0]);
        const lvl = Number(flags._[1]);
        const ram = Number(flags._[2]);
        const cpu = Number(flags._[3]);

        if (!Number.isFinite(nodes) || !Number.isFinite(lvl) || !Number.isFinite(ram) || !Number.isFinite(cpu)) {
            ns.tprint("Parâmetros inválidos.");
            return;
        }
        if (lvl < 1 || lvl > 200) {
            ns.tprint("Nível inválido (1..200).");
            return;
        }
        if (!validRam.includes(ram)) {
            ns.tprint("RAM inválida (1,2,4,8,16,32,64).");
            return;
        }
        if (cpu < 1 || cpu > 16) {
            ns.tprint("Núcleos inválidos (1..16).");
            return;
        }

        const current = ns.hacknet.numNodes();
        targetNodes = Math.min(current + Math.max(0, nodes), maxNodes);
        targetLvl = lvl;
        targetRam = ram;
        targetCores = cpu;
        if (targetNodes > current) ns.tprint("Comprando " + (targetNodes - current) + " novos nós");
    }

    const canImprove = () => {
        if (ns.hacknet.numNodes() < targetNodes) return true;
        for (let i = 0; i < ns.hacknet.numNodes(); i++) {
            const s = ns.hacknet.getNodeStats(i);
            if (s.level < targetLvl) return true;
            if (s.ram < targetRam) return true;
            if (s.cores < targetCores) return true;
        }
        return false;
    };

    while (canImprove()) {
        const actions = [];
        if (ns.hacknet.numNodes() < targetNodes) {
            const cost = ns.hacknet.getPurchaseNodeCost();
            if (isFinite(cost)) actions.push({ kind: "buy-node", cost });
        }
        const count = ns.hacknet.numNodes();
        for (let i = 0; i < count; i++) {
            const s = ns.hacknet.getNodeStats(i);
            if (s.level < targetLvl && s.level < 200) {
                const c = ns.hacknet.getLevelUpgradeCost(i, 1);
                if (isFinite(c)) actions.push({ kind: "lvl", i, cost: c });
            }
            if (s.ram < targetRam && s.ram < 64) {
                const c = ns.hacknet.getRamUpgradeCost(i, 1);
                if (isFinite(c)) actions.push({ kind: "ram", i, cost: c });
            }
            if (s.cores < targetCores && s.cores < 16) {
                const c = ns.hacknet.getCoreUpgradeCost(i, 1);
                if (isFinite(c)) actions.push({ kind: "core", i, cost: c });
            }
        }

        if (actions.length === 0) break;
        actions.sort((a, b) => a.cost - b.cost);
        const act = actions[0];
        await waitForMoney(act.cost);

        if (act.kind === "buy-node") {
            const idx = ns.hacknet.purchaseNode();
            if (flags.toast) ns.toast("Nó do Hacknet comprado: " + idx, "success", 3000);
        } else if (act.kind === "lvl") {
            ns.hacknet.upgradeLevel(act.i, 1);
        } else if (act.kind === "ram") {
            ns.hacknet.upgradeRam(act.i, 1);
        } else if (act.kind === "core") {
            ns.hacknet.upgradeCore(act.i, 1);
        }

        await ns.sleep(flags.interval);
    }

    if (!flags.auto) {
        ns.tprint("Alvos atingidos: nós=" + targetNodes + ", nível=" + targetLvl + ", RAM=" + targetRam + "GB, núcleos=" + targetCores);
    } else {
        ns.tprint("Modo auto: não há upgrades viáveis no momento.");
    }
}
