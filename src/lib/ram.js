import { scanAll } from "/lib/network.js";

/**
 * Pool de RAM distribuída: descobre todos os hosts com root e RAM livre,
 * e aloca threads de workers entre eles.
 */

/** RAM reservada no home para managers/dashboards/terminal. */
const HOME_RESERVE_GB = 16;

/**
 * Lista hosts utilizáveis (root + RAM > 0), com RAM livre calculada.
 * @param {NS} ns
 * @returns {{host: string, free: number, cores: number}[]}
 */
export function getRamPool(ns) {
    const pool = [];

    for (const host of scanAll(ns)) {
        if (!ns.hasRootAccess(host)) continue;

        const max = ns.getServerMaxRam(host);
        if (max <= 0) continue;

        let free = max - ns.getServerUsedRam(host);
        if (host === "home") free -= HOME_RESERVE_GB;
        if (free <= 0) continue;

        pool.push({
            host,
            free,
            cores: ns.getServer(host).cpuCores
        });
    }

    // Mais RAM livre primeiro — concentra batches em poucos hosts.
    pool.sort((a, b) => b.free - a.free);
    return pool;
}

/**
 * Total de threads de um worker que cabem no pool inteiro.
 * @param {NS} ns
 * @param {number} workerRam  custo em GB de um worker
 */
export function totalThreadsAvailable(ns, workerRam) {
    return getRamPool(ns).reduce(
        (sum, h) => sum + Math.floor(h.free / workerRam),
        0
    );
}

/**
 * Distribui `threads` de um script entre os hosts do pool e os executa.
 * Garante que o script exista no host (scp) antes de rodar.
 *
 * @param {NS} ns
 * @param {string} script    caminho do worker
 * @param {number} workerRam custo em GB por thread
 * @param {number} threads   total desejado
 * @param {any[]} args       argumentos passados ao worker
 * @returns {number} threads efetivamente lançados
 */
export function dispatch(ns, script, workerRam, threads, args) {
    let remaining = threads;
    const pool = getRamPool(ns);

    for (const { host, free } of pool) {
        if (remaining <= 0) break;

        const capacity = Math.floor(free / workerRam);
        if (capacity <= 0) continue;

        const n = Math.min(capacity, remaining);

        if (host !== "home") {
            ns.scp(script, host);
        }

        // pid 0 = falha ao executar.
        const pid = ns.exec(script, host, n, ...args);
        if (pid !== 0) remaining -= n;
    }

    return threads - remaining;
}
