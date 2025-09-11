/**
 * Hack worker
 * Usage: run Hack/_h.js target
 * @param {NS} ns
 */
export async function main(ns) {
  const target = String(ns.args[0] ?? ns.getHostname());
  await ns.hack(target);
}

