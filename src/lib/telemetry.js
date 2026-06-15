/**
 * Barramento de telemetria. Desacopla quem PRODUZ o dado (managers) de quem o
 * CONSOME (dashboard), via arquivos JSON. Mantém o dashboard leve e sem precisar
 * pagar o custo de RAM (ex: 16x da Singularity) — ele só lê snapshots prontos.
 */

const DIR = "/telemetry/";

/**
 * Publica um snapshot. Adiciona timestamp automático.
 * @param {NS} ns
 * @param {string} key   ex: "hack", "progression"
 * @param {object} data
 */
export function publish(ns, key, data) {
    const payload = JSON.stringify({ t: Date.now(), data });
    ns.write(`${DIR}${key}.txt`, payload, "w");
}

/**
 * Lê um snapshot. Retorna { age, data } ou null se não existir/inválido.
 * `age` é a idade do dado em ms (pra detectar manager parado).
 * @param {NS} ns
 * @param {string} key
 */
export function read(ns, key) {
    const file = `${DIR}${key}.txt`;
    if (!ns.fileExists(file, "home")) return null;

    try {
        const raw = ns.read(file);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return { age: Date.now() - parsed.t, data: parsed.data };
    } catch {
        return null;
    }
}
