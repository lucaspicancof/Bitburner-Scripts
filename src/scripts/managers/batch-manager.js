import { planBatch, WORKER_RAM, isPrepped } from "/lib/hgw.js";
import { getRamPool } from "/lib/ram.js";
import { scanAll } from "/lib/network.js";
import { potentialScore } from "/lib/scoring.js";
import { publish } from "/lib/telemetry.js";

const RUNNER = "scripts/managers/batch-runner.js";

/**
 * Batch Manager — SCHEDULER multi-alvo.
 *
 * Ranqueia os alvos por $/s POTENCIAL (preparado), aloca o pool de RAM de forma
 * gulosa — enche cada alvo até o ponto de saturação (concorrência útil × RAM/batch)
 * antes de passar pro próximo — e mantém um `batch-runner` por alvo com seu orçamento.
 * Runners despreparados preparam o alvo sozinhos, então alvos de alto potencial são
 * preparados em paralelo enquanto os prontos são farmados.
 *
 * @param {NS} ns
 * Flags:
 *   --max-targets <n>  teto de alvos simultâneos. Default 8
 *   --spacing <ms>     intervalo entre landings. Default 200
 *   --fraction <0..1>  fração roubada por batch. Default 0.5
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();

    const flags = ns.flags([
        ["max-share", 0.25],   // teto de fração do pool por alvo (garante espalhar)
        ["max-targets", 0],    // 0 = sem limite; nº de alvos emerge da RAM disponível
        ["spacing", 200],
        ["fraction", 0.5]
    ]);

    const spacing = flags.spacing;
    const fraction = flags.fraction;
    const maxShare = flags["max-share"];
    const hardCap = flags["max-targets"];

    // Limpa runners órfãos de uma execução anterior (evita duplicar alvos).
    for (const p of ns.ps("home")) {
        if (p.filename === RUNNER) ns.kill(p.pid);
    }

    // target -> { pid, budgetGB }
    const running = new Map();

    ns.atExit(() => {
        for (const { pid } of running.values()) ns.kill(pid);
    });

    while (true) {
        const alloc = allocate(ns, spacing, maxShare, hardCap);
        reconcile(ns, running, alloc, spacing, fraction);

        publish(ns, "hack", {
            count: alloc.length,
            targets: alloc.map(a => ({
                name: a.target,
                potential: a.potential,
                budgetGB: Math.round(a.budgetGB),
                prepped: isPrepped(ns, a.target)
            })),
            totalBudgetGB: Math.round(alloc.reduce((s, a) => s + a.budgetGB, 0)),
            estIncomePerSec: alloc.reduce((s, a) => s + a.potential, 0)
        });

        printStatus(ns, ns, alloc);
        await ns.sleep(15000);
    }
}

/**
 * Decide a lista de alvos e o orçamento (GB) de cada um.
 *
 * Modular pela RAM: cada alvo recebe o orçamento que CONSEGUE usar (saturação =
 * batches que cabem na janela de tempo × RAM/batch), limitado a `maxShare` do pool
 * (pra nenhum hogar tudo). Desce o ranking de potencial até a RAM acabar — então o
 * NÚMERO de alvos cresce sozinho conforme sobra RAM. `hardCap` (0 = sem limite) é
 * só uma trava de segurança.
 */
function allocate(ns, spacing, maxShare, hardCap) {
    // Candidatos: root, com dinheiro, dentro do nível de hacking.
    const candidates = scanAll(ns)
        .filter(s =>
            ns.hasRootAccess(s) &&
            ns.getServerMaxMoney(s) > 0 &&
            ns.getServerRequiredHackingLevel(s) <= ns.getHackingLevel()
        )
        .map(s => ({ target: s, potential: potentialScore(ns, s) }))
        .filter(c => c.potential > 0)
        .sort((a, b) => b.potential - a.potential);

    const initialPool = getRamPool(ns).reduce((sum, h) => sum + h.free, 0);
    let poolGB = initialPool;
    const alloc = [];

    const capGB = initialPool * maxShare;

    for (const c of candidates) {
        if (hardCap > 0 && alloc.length >= hardCap) break;
        if (poolGB <= 0) break;

        const plan = planBatch(ns, c.target, 0.5, spacing);
        if (!plan) continue;

        const oneBatchGB = plan.totalThreads * WORKER_RAM;
        // Saturação: nº de batches que cabem na janela de tempo do alvo.
        const satBatches = Math.max(1, Math.floor(plan.weakenTime / (4 * spacing)));
        const usefulGB = satBatches * oneBatchGB;

        const budgetGB = Math.min(usefulGB, capGB, poolGB);
        if (budgetGB < oneBatchGB) continue; // nem 1 batch cabe

        alloc.push({ target: c.target, potential: c.potential, budgetGB });
        poolGB -= budgetGB;
    }

    return alloc;
}

/**
 * Garante que existe um runner por alvo alocado, com o orçamento certo.
 * Mata runners de alvos que saíram; (re)inicia os que faltam ou cujo orçamento mudou muito.
 */
function reconcile(ns, running, alloc, spacing, fraction) {
    const desired = new Map(alloc.map(a => [a.target, a.budgetGB]));

    // Mata o que não é mais desejado ou que morreu.
    for (const [target, info] of [...running.entries()]) {
        if (!desired.has(target) || !ns.isRunning(info.pid)) {
            if (ns.isRunning(info.pid)) ns.kill(info.pid);
            running.delete(target);
        }
    }

    // Inicia / reajusta.
    for (const [target, budgetGB] of desired.entries()) {
        const cur = running.get(target);

        const changedMuch = cur &&
            Math.abs(budgetGB - cur.budgetGB) / cur.budgetGB > 0.3;

        if (cur && changedMuch) {
            ns.kill(cur.pid);
            running.delete(target);
        }

        if (!running.has(target)) {
            const pid = ns.exec(RUNNER, "home", 1, target, Math.floor(budgetGB), spacing, fraction);
            if (pid !== 0) running.set(target, { pid, budgetGB });
        }
    }
}

function printStatus(ns, _ns, alloc) {
    ns.clearLog();
    ns.print("=== BATCH SCHEDULER (multi-alvo) ===");
    ns.print("");
    ns.print(`Alvos ativos: ${alloc.length}`);
    ns.print(`Renda potencial: ${ns.format.number(alloc.reduce((s, a) => s + a.potential, 0))}/s`);
    ns.print("");
    ns.print(" ALVO                 POTENCIAL/s   ORÇAMENTO   PREP");
    ns.print("-".repeat(56));
    for (const a of alloc) {
        ns.print(
            `${a.target.padEnd(20)} ` +
            `${ns.format.number(a.potential).padStart(11)} ` +
            `${ns.format.ram(a.budgetGB).padStart(10)} ` +
            `${isPrepped(ns, a.target) ? " ✓" : " ..."}`
        );
    }
}
