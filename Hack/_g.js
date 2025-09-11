/**
 * Grow worker
 * Usage: run Hack/_g.js target
 * @param {NS} ns
 */
export async function main(ns) {
  const target = String(ns.args[0] ?? ns.getHostname());
  await ns.grow(target);
}

