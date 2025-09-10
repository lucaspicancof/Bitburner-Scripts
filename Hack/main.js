/** @param {NS} ns */
export async function main(ns) {
	let servernames = [//      |HackLv|Nports|
		"n00dles", //		         |    1	| 0  |
		"foodnstuff", //	       |    1	| 0  |
		"sigma-cosmetics", //    |    5	| 0  |
		"joesguns", //	         |   10	| 0  |
		"nectar-net", //		     |   20	| 0  |
		"hong-fang-tea", //	     |   30	| 0  |
		"harakiri-sushi", //	   |   40	|	0  |
		"neo-net", //			       |   50	|	1  |
		"CSEC", //			         |   54	|	1  |
		"zer0", //			         |   75	|	1  |
		"max-hardware", //		   |   80	|	1  |
		"iron-gym", //		       |  100	|	1  |
		"phantasy", //           |  100	|	2  |
		"silver-helix", //		   |  150	|	2  |
		"omega-net", //		       |  194	|	2  |
		"avmnite-02h", //		     |  204	|	2  |
		"johnson-ortho", //		   |  256	|	2  |
		"crush-fitness", //		   |  229	|	2  |
		"the-hub", //			       |  284	|	2  |
		"computek", //			     |  371	|	3  |
		"I.I.I.I", //			       |  348	|	3  |
		"netlink", //			       |  399 |	3  |
		"rothman-uni", //		     |  403 |	3  |
		"catalyst", //		       |  405 |	3  |
		"summit-uni", //		     |  439 |	3  |
		"rho-construction", //	 |  489 |	3  |
		"millenium-fitness", //  |  482 |	3  |
		"aevum-police", //		   |  434 |	4  |
		"run4theh111z", //	  	 |  536 |	4  |
		".", //	               	 |  548 |	4  |
		"alpha-ent", //		       |  554 |	4  |
		"syscore", //			       |  613 |	4  |
		"lexo-corp", //		       |  654 |	4  |
		"snap-fitness", //	   	 |  700 |	4  |
		"nova-med", //		       |  850 |	4  |
		"applied-energetics", // |  780 |	4  |
		"zb-def", //			       |  787 |	4  |
		"unitalife", //		       |  792 |	4  |
		"global-pharm", //	     |  845 |	4  |
		"univ-energy", //		     |  889 |	4  |
		"zb-institute", //		   |  738 |	5  |
		"solaris", //			       |  799 |	5  |
		"zeus-med", //		       |  836 |	5  |
		"vitalife", //		       |  854 |	5  |
		"deltaone", //		       |  860 |	5  |
		"titan-labs", //		     |  863 |	5  |
		"microdyne", //		       |  827 |	5  |
		"galactic-cyber", //	   |  833 |	5  |
		"icarus", //		      	 |  921 |	5  |
		"omnia", //			         |  852 |	5  |
		"helios", //			       |  875 |	5  |
		"aerocorp", //		       |  907 |	5  |
		"stormtech", //		       |  892 |	5  |
		'defcomm', //			       | 1017 |	5  |
		"4sigma", //			       |  982 |	5  |
		"infocomm", //		       |  937 |	5  |
		"The-Cave", //		       |  925 |	5  |
		"taiyang-digital", //	   |  940 |	5  |
		"b-and-a", //			       |  902 |	5  |
		"blade", //			         |  916 |	5  |
		"powerhouse-fitness", // | 1044 |	5  |
		"clarkinc", //		       | 1167 |	5  |
		"kuai-gong", //		       | 1078 |	5  |
		"omnitek", //			       | 1001 |	5  |
		"fulcrumtech", //		     | 1166 |	5  |
		"ecorp", //			         | 1348 |	5  |
		"megacorp", //		       | 1144 |	5  |
		"nwo", //			           | 1067 |	5  |
		"fulcrumassets", //		   | 1228 |	5  |
		//"w0r1d_d43m0n" //        | 3000 | 5  |
	];

	let servidores_hackaveis = [];
	let ports = [];
	let nivel_servidores_hackaveis = [1];
	let servidores_nuke = [];
	let servidores_hackfhome = [];
	let numero_de_threads = [0];



	while (true) {

		if (ports.length < 5) {
			if (ns.fileExists("BruteSSH.exe", "home")) {
				if (ports.includes("BruteSSH.exe") == false) {
					ports.push("BruteSSH.exe");
				}
			}
			if (ns.fileExists("FTPCrack.exe", "home")) {
				if (ports.includes("FTPCrack.exe") == false) {
					ports.push("FTPCrack.exe");
				}
			}
			if (ns.fileExists("RelaySMTP.exe", "home")) {
				if (ports.includes("RelaySMTP.exe") == false) {
					ports.push("RelaySMTP.exe");
				}
			}
			if (ns.fileExists("HTTPWorm.exe", "home")) {
				if (ports.includes("HTTPWorm.exe") == false) {
					ports.push("HTTPWorm.exe");
				}
			}
			if (ns.fileExists("SQLInject.exe", "home")) {
				if (ports.includes("SQLInject.exe") == false) {
					ports.push("SQLInject.exe");
				}
			}
		}

		for (var i = 0; i < servernames.length; i++) {
			if (ns.getServerNumPortsRequired(servernames[i]) <= ports.length){
				if (ns.hasRootAccess(servernames[i]) == false){
					if (ns.fileExists("BruteSSH.exe", "home")) {
						ns.brutessh(servernames[i]);
					}
					if (ns.fileExists("FTPCrack.exe", "home")) {
						ns.ftpcrack(servernames[i]);
					}
					if (ns.fileExists("RelaySMTP.exe", "home")) {
						ns.relaysmtp(servernames[i]);
					}
					if (ns.fileExists("HTTPWorm.exe", "home")) {
						ns.httpworm(servernames[i]);
					}
					if (ns.fileExists("SQLInject.exe", "home")) {
						ns.sqlinject(servernames[i]);
					}
				}		
			}
			await ns.sleep(1000);

			if ((servernames[i] == "n00dles") && (ns.isRunning("n0.js", "n00dles") == false)) {
				ns.nuke("n00dles")
				ns.tprint(" ");
				ns.tprint(" ");
				ns.tprint("==================================================");
				ns.tprint(servernames[i]);
				ns.tprint("==================================================");
				ns.tprint("The server has " + ns.getServerMaxRam(servernames[i]) + "GB of RAM");
				ns.tprint("==================================================");
				await ns.scp("n0.js", servernames[i], "home");
				await ns.scp("n02.js", servernames[i], "home");
				ns.tprint("Copiando os scripts n0.js e n02.js para " + servernames[i])
				ns.tprint("==================================================");
				ns.exec("n0.js", servernames[i]);
				ns.exec("n02.js", servernames[i]);
				ns.exec("n03.js", "home");
				ns.exec("n04.js", "home");
				ns.tprint("Executando n0.js e n02.js em " + servernames[i]);
				ns.tprint("Executando n04.js e n03.js em 'home' ");
				ns.tprint("==================================================");
				ns.tprint(" ");
				ns.tprint(" ");
				await ns.sleep(1500);
			}

			else if (ns.getServerRequiredHackingLevel(servernames[i]) <= ns.getHackingLevel("home")) {
				if(servidores_hackaveis.includes(servernames[i])==false){
					if (ns.getServerNumPortsRequired(servernames[i]) <= ports.length) {
						ns.nuke(servernames[i]);
						if (ns.getServerMaxMoney(servernames[i]) != 0) {
							if(servidores_hackfhome.includes(servernames[i]) == false){
								servidores_hackfhome.push(servernames[i])
							}
							if (ns.getServerMaxRam(servernames[i]) != 0) {
								if (ns.isRunning("hack.js", servernames[i]) == false){
									var threads_hack = Math.floor((ns.getServerMaxRam(servernames[i]))/2.45);
									if (ns.fileExists("hack.js", servernames[i])==false) {
										await ns.scp("hack.js", servernames[i], "home");
										ns.exec("hack.js", servernames[i], threads_hack);
									}
									else{
										ns.exec("hack.js", servernames[i], threads_hack);
									}
									servidores_hackaveis.push(servernames[i]);
									if(ns.getServerRequiredHackingLevel(servernames[i])>nivel_servidores_hackaveis[-1]){
										nivel_servidores_hackaveis.push(ns.getServerRequiredHackingLevel(servernames[i]));
									}
								}														
							}
						}
					}
				}				
			}
		}
		await ns.sleep(1000);
		var th = Math.floor(((ns.getServerMaxRam("home")-9.45)/2.4)/servidores_hackfhome.length);
		ns.tprint("Running hackfhome.js with t= "+th);
		if(th>numero_de_threads[numero_de_threads.length-1]){
			numero_de_threads.push(th);
			for (var i = 0; i < servidores_hackfhome.length; i++) {
				if (ns.isRunning("hackfhome.js", "home", servidores_hackfhome[i])){
					ns.kill("hackfhome.js", "home", servidores_hackfhome[i]);
				}
				if (th >= 1){
					ns.run("hackfhome.js", th , servidores_hackfhome[i]);
				}
			}
		} 
			
		if (th >= 1){
			if (th>numero_de_threads[numero_de_threads.length-1]){
				ns.tprint("==================================================");
				ns.tprint("Running hackfhome.js with t= "+th);
				ns.tprint("Started hackfhome.js to "+ servidores_hackfhome.length +" servers successfull!");
				ns.tprint("==================================================");
			}
			else{}
		}
		else{
			ns.tprint("==================================================");
			ns.tprint("Threads on home is less then 1");
			ns.tprint("==================================================");	
		}
		await ns.sleep(600000);
//		if(ns.args[0]=="bn1"){
//			if((ns.getServerMoneyAvailable("home"))>=(ns.ramUpgradeCost)){
//				ns.singularity.upgradeHomeRam
//			}
//		}

	}

}