/** @param {NS} ns */
export async function main(ns) {
	while (!(ns.fileExists("BruteSSH.exe", "home"))) {
		ns.createProgram("BruteSSH.exe");
		await ns.sleep(10000);
	}

	while (!(ns.fileExists("FTPCrack.exe", "home"))) {
		ns.createProgram("FTPCrack.exe");
		await ns.sleep(10000);
	}

	while (!(ns.fileExists("RelaySMTP.exe", "home"))) {
		ns.createProgram("RelaySMTP.exe");
		await ns.sleep(10000);
	}

	while (!(ns.fileExists("HTTPWorm.exe", "home"))) {
		ns.createProgram("HTTPWorm.exe");
		await ns.sleep(10000);
	}

	while (!(ns.fileExists("SQLInject.exe", "home"))) {
		ns.createProgram("SQLInject.exe");
		await ns.sleep(10000);
	}
}