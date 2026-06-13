/** @type {NS} ns **/
export function getAllServers(ns, rootHost = 'home') {
ns.disableLog('scan')
let pendingScan = [rootHost]
const list = new Set(pendingScan)

while (pendingScan.length) {
	const hostname = pendingScan.shift()
	list.add(hostname)

	pendingScan.push(...ns.scan(hostname))
	pendingScan = pendingScan.filter(host => !list.has(host))
}

return [...list]
}