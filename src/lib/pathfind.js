/**
 * Busca em largura (BFS) a partir do home.
 * Retorna o caminho de servidores de "home" até `target`, inclusive.
 *
 * @param {NS} ns
 * @param {string} target
 * @returns {string[] | null}  ex: ["home", "n00dles", "CSEC"] ou null se não achar
 */
export function findPath(ns, target) {
    const queue = [["home"]];
    const visited = new Set(["home"]);

    while (queue.length > 0) {
        const path = queue.shift();
        const node = path[path.length - 1];

        if (node === target) return path;

        for (const next of ns.scan(node)) {
            if (visited.has(next)) continue;
            visited.add(next);
            queue.push([...path, next]);
        }
    }

    return null;
}

/**
 * Converte um caminho em uma sequência de comandos de terminal.
 * Pula o "home" inicial (você já está nele).
 *
 * @param {string[]} path
 * @param {boolean} backdoor  acrescenta "backdoor" ao final
 * @returns {string}  ex: "connect n00dles; connect CSEC; backdoor"
 */
export function pathToCommands(path, backdoor = true) {
    const hops = path.slice(1).map(h => `connect ${h}`);
    if (backdoor) hops.push("backdoor");
    return hops.join("; ");
}
