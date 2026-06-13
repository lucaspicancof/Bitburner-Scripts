/** @param {NS} ns */
export async function main(ns) {
  const filter = ns.args[0] ? String(ns.args[0]) : "";
  const files = ns.ls("home").filter(f => f.endsWith(".js") && f.includes(filter));
  for (const f of files) {
    ns.tprint(`\n=== ${f} ===\n` + ns.read(f));
  }
}