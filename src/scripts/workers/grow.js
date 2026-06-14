/**
 * Worker atômico de grow.
 * @param {NS} ns
 * args[0] = target
 * args[1] = additionalMsec (delay para alinhar landing em batch)
 */
export async function main(ns) {
    const target = ns.args[0];
    const additionalMsec = Number(ns.args[1] ?? 0);

    await ns.grow(target, { additionalMsec });
}
