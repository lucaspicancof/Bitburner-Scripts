import { SOLVERS } from "/lib/contracts.js";
import { scanAll } from "/lib/network.js";

/**
 * Contract Manager — varre a rede atrás de Coding Contracts (.cct) e resolve os
 * tipos que conhecemos. Tipos sem solver são pulados (deixados pra você na mão).
 *
 * Segurança: um contrato que FALHA é marcado e nunca mais é tentado — evita
 * queimar todas as tentativas (e destruir o contrato) re-tentando a cada varredura.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();

    let solved = 0, failed = 0;
    const failedKeys = new Set();   // host/arquivo que já falhou — não re-tentar
    const unknownTypes = new Set(); // tipos sem solver, pra você saber

    while (true) {
        for (const host of scanAll(ns)) {
            for (const file of ns.ls(host, ".cct")) {
                const key = `${host}/${file}`;
                if (failedKeys.has(key)) continue;

                const type = ns.codingcontract.getContractType(file, host);
                const solver = SOLVERS[type];
                if (!solver) { unknownTypes.add(type); continue; }

                let answer;
                try {
                    answer = solver(ns.codingcontract.getData(file, host));
                } catch (e) {
                    failedKeys.add(key);
                    continue;
                }

                const reward = ns.codingcontract.attempt(answer, file, host);
                if (reward) {
                    solved++;
                    ns.toast(`Contract: ${type} ✓ (${reward})`, "success");
                } else {
                    failed++;
                    failedKeys.add(key);
                    ns.toast(`Contract FALHOU: ${type} @ ${host}`, "error", null);
                }
            }
        }

        printStatus(ns, solved, failed, unknownTypes);
        await ns.sleep(30000);
    }
}

function printStatus(ns, solved, failed, unknownTypes) {
    ns.clearLog();
    ns.print("=== CONTRACT MANAGER ===");
    ns.print("");
    ns.print(`Resolvidos: ${solved}`);
    ns.print(`Falhas:     ${failed}`);
    ns.print("");
    if (unknownTypes.size) {
        ns.print("Tipos sem solver (resolver na mão):");
        for (const t of unknownTypes) ns.print(`  • ${t}`);
    }
}
