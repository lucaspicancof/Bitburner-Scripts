/** @param {NS} ns **/
export async function main(ns) {
	var servernames = Array(//   |HackLv|Nports|
		"n00dles", //		     |    1	|   0  |
		"foodnstuff", //	     |    1	|   0  |
		"sigma-cosmetics", //    |    5	|   0  |
		"joesguns", //	         |   10	|   0  |
		"nectar-net", //		 |   20	|   0  |
		"hong-fang-tea", //	     |   30	|   0  |
		"harakiri-sushi", //	 |   40	|	0  |
		"neo-net", //			 |   50	|	1  |
		"CSEC", //			     |   54	|	1  |
		"zer0", //			     |   75	|	1  |
		"max-hardware", //		 |   80	|	1  |
		"iron-gym", //		     |  100	|	1  |
		"phantasy", //           |  100	|	2  |
		"silver-helix", //		 |  150	|	2  |
		"omega-net", //		     |  194	|	2  |
		"avmnite-02h", //		 |  204	|	2  |
		"johnson-ortho", //		 |  256	|	2  |
		"crush-fitness", //		 |  229	|	2  |
		"the-hub", //			 |  284	|	2  |
		"computek", //			 |  371	|	3  |
		"I.I.I.I", //			 |  348	|	3  |
		"netlink", //			 |  399 |	3  |
		"rothman-uni", //		 |  403 |	3  |
		"catalyst", //		     |  405 |	3  |
		"summit-uni", //		 |  439 |	3  |
		"rho-construction", //	 |  489 |	3  |
		"millenium-fitness", //  |  482 |	3  |
		"aevum-police", //		 |  434 |	4  |
		"run4theh111z", //		 |  536 |	4  |
		".", //	            	 |  548 |	4  |
		"alpha-ent", //		     |  554 |	4  |
		"syscore", //			 |  613 |	4  |
		"lexo-corp", //		     |  654 |	4  |
		"snap-fitness", //		 |  700 |	4  |
		"nova-med", //		     |  850 |	4  |
		"applied-energetics", // |  780 |	4  |
		"zb-def", //			 |  787 |	4  |
		"unitalife", //		     |  792 |	4  |
		"global-pharm", //	     |  845 |	4  |
		"univ-energy", //		 |  889 |	4  |
		"zb-institute", //		 |  738 |	5  |
		"solaris", //			 |  799 |	5  |
		"zeus-med", //		     |  836 |	5  |
		"vitalife", //		     |  854 |	5  |
		"deltaone", //		     |  860 |	5  |
		"titan-labs", //		 |  863 |	5  |
		"microdyne", //		     |  827 |	5  |
		"galactic-cyber", //	 |  833 |	5  |
		"icarus", //			 |  921 |	5  |
		"omnia", //			     |  852 |	5  |
		"helios", //			 |  875 |	5  |
		"aerocorp", //		     |  907 |	5  |
		"stormtech", //		     |  892 |	5  |
		'defcomm', //			 | 1017 |	5  |
		"4sigma", //			 |  982 |	5  |
		"infocomm", //		     |  937 |	5  |
		"The-Cave", //		     |  925 |	5  |
		"taiyang-digital", //	 |  940 |	5  |
		"b-and-a", //			 |  902 |	5  |
		"blade", //			     |  916 |	5  |
		"powerhouse-fitness", // | 1044 |	5  |
		"clarkinc", //		     | 1167 |	5  |
		"kuai-gong", //		     | 1078 |	5  |
		"omnitek", //			 | 1001 |	5  |
		"fulcrumtech", //		 | 1166 |	5  |
		"ecorp", //			     | 1348 |	5  |
		"megacorp", //		     | 1144 |	5  |
		"nwo", //			     | 1067 |	5  |
		"fulcrumassets", //		 | 1228 |	5  |
		"w0r1d_d43m0n" //        | 3000 |   5  |
	);

	var nivela = 0;
	var niveln = 1;
	var arquivosa = 0;
	var arquivosn = 0;
	var tha = 0;
	while(true){
		if((niveln>nivela)||(arquivosn>arquivosa)){
			nivela = niveln;
			arquivosa=arquivosn;
			//Numero de servidores com dinheiro
			var nsh = 0;
			var nslv = 0;
			for (var i = 0; i < servernames.length; i++) {
				var money1 =(ns.getServerMaxMoney(servernames[i])) ;
				if((ns.hasRootAccess(servernames[i]) == false)&&(ns.getHackingLevel("home")>=ns.getServerRequiredHackingLevel(servernames[i]))){
					ns.tprint(" ");
					ns.tprint(" ");
					ns.tprint("==================================================");
					ns.tprint(servernames[i]);
					ns.tprint("==================================================");
					if (ns.hasRootAccess(servernames[i]) == false){
						ns.tprint("Starting to open portst:");
						var prog = 0;
						if (ns.fileExists("BruteSSH.exe", "home")) {
							ns.tprint("Openend SSH Port");
							ns.brutessh(servernames[i]);
							prog++
						}
						if (ns.fileExists("FTPCrack.exe", "home")) {
							ns.tprint("Openend FTP Port");
							ns.ftpcrack(servernames[i]);
							prog++
						}
						if (ns.fileExists("RelaySMTP.exe", "home")) {
							ns.tprint("Openend SMTP Port");
							ns.relaysmtp(servernames[i]);
							prog++
						}
						if (ns.fileExists("HTTPWorm.exe", "home")) {
							ns.tprint("Openend HTTP Port");
							ns.httpworm(servernames[i]);
							prog++
						}
						if (ns.fileExists("SQLInject.exe", "home")) {
							ns.tprint("Openend SQL Port");
							ns.sqlinject(servernames[i]);
							prog++
						}
						if((ns.getServerNumPortsRequired(servernames[i]))<=prog){
							ns.nuke(servernames[i]);
							ns.tprint("Gainend ROOT Access");
						}
						
					}
				}
				if(prog>arquivosn){
					arquivosn = prog;
				}
				else{}
				if ((servernames[i]=="n00dles")&&(ns.isRunning("n0.js","n00dles")==false)){
					ns.tprint(" ");
					ns.tprint(" ");
					ns.tprint("==================================================");
					ns.tprint(servernames[i]);
					ns.tprint("==================================================");
					ns.tprint("Now connect to " + servernames[i]);
					//ns.singularity.installBackdoor(servernames[i]);
					var ram = ns.getServerMaxRam(servernames[i]);
					ns.tprint("The server has " + ram + "GB of RAM");
					ns.tprint("==================================================");
					var threads;
					switch (ram) {
						case 4: threads = 1
							break;
						case 8: threads = 3
							break;
						case 16: threads = 6
							break;
						case 32: threads = 13
							break;
						case 64: threads = 26
							break;
						case 128: threads = 51
							break;
						case 256: threads = 104
							break;
						case 512: threads = 208;
							break;
						case 1024: threads = 418;
							break;
						case 2048: threads = 836;
							break;
						default: threads = 1
							break;
					}
					ns.tprint("==================================================");
					await ns.scp("n0.js", "home", servernames[i]);
					await ns.scp("n02.js", "home", servernames[i]);
					ns.tprint("Copied n0.js and n02.js Scripts to "+servernames[i])
					ns.tprint("==================================================");
					ns.exec("n0.js",servernames[i]);
					ns.exec("n02.js",servernames[i]);
					ns.exec("n03.js","home");
					ns.exec("n04.js","home");
					ns.tprint("Started n0.js and n02.js on " + servernames[i] + " successfull!");
					ns.tprint("Started n04.js and n03.js on 'home' successfull!");
					ns.tprint("==================================================");
					ns.tprint(" ");
					ns.tprint(" ");
					await ns.sleep(1500);
				}
				else if(money1 == 0) {
				}   
				else if (ns.getHackingLevel("home")>=ns.getServerRequiredHackingLevel(servernames[i])&&(servernames[i]!="n00dles")&&money1 != 0) {
					if(ns.isRunning("hack.js",servernames[i])==false){
						ns.tprint("==================================================");
						ns.tprint(servernames[i]);
						ns.tprint("==================================================");
						ns.tprint("Now connect to " + servernames[i]);
						//ns.installBackdoor(servernames[i]);
						var ram = ns.getServerMaxRam(servernames[i]);
						ns.tprint("The server has " + ram + "GB of RAM");
						ns.tprint("==================================================");
						var threads;
						switch (ram) {
							case 4: threads = 1
								break;
							case 8: threads = 3
								break;
							case 16: threads = 6
								break;
							case 32: threads = 13
								break;
							case 64: threads = 26
								break;
							case 128: threads = 51
								break;
							case 256: threads = 104
								break;
							case 512: threads = 208;
								break;
							case 1024: threads = 418;
								break;
							case 2048: threads = 836;
								break;
							default: threads = 1
								break;
						}
						ns.tprint("Running the script with t= "+threads);
						ns.tprint("==================================================");
						//rm("hack.js", "home", servernames[i]);
						await ns.scp("hack.js", "home", servernames[i]);
						ns.tprint("Copied hack.js Scripts to "+servernames[i]);
						ns.tprint("==================================================");
						if (ns.isRunning("hack.js", servernames[i]) == true){
							ns.kill("hack.js", servernames[i]);
						}
						else{}
						ns.exec("hack.js", servernames[i], threads);
						ns.tprint("Started " + "hack.js" + " on " + servernames[i] + " successfull!");
						ns.tprint("==================================================");
						nsh++;
						nslv++;
						ns.tprint(" ");
						ns.tprint(" ");
						ns.tprint("==================================================");
						ns.tprint("Servers with money: "+nsh);
						ns.tprint("==================================================");
						ns.tprint(" ");
						ns.tprint(" ");
						if(niveln<ns.getServerRequiredHackingLevel(servernames[i])){
							niveln = ns.getServerRequiredHackingLevel(servernames[i]);
						}
					}
					else{
						var ram = ns.getServerMaxRam(servernames[i]);
						var threads;
							switch (ram) {
								case 4: threads = 1
									break;
								case 8: threads = 3
									break;
								case 16: threads = 6
									break;
								case 32: threads = 13
									break;
								case 64: threads = 26
									break;
								case 128: threads = 51
									break;
								case 256: threads = 104
									break;
								case 512: threads = 208;
									break;
								case 1024: threads = 418;
									break;
								case 2048: threads = 836;
									break;
								default: threads = 1
									break;
							}
						await ns.scp("hack.js", "home", servernames[i]);
						if (ns.isRunning("hack.js", servernames[i]) == true){
								ns.kill("hack.js", servernames[i]);
						}
						else{}
						nsh++;
						nslv++;
						ns.exec("hack.js", servernames[i], threads);
						if(niveln<ns.getServerRequiredHackingLevel(servernames[i])){
							niveln = ns.getServerRequiredHackingLevel(servernames[i]);
						}
					}
					await ns.sleep(1500);	
				}
			}
		}
		await ns.sleep(2000);
		


		var th = ((ns.getServerMaxRam("home")*0.9)/2.4)/nslv;
		ns.tprint(th);
		ns.tprint(tha);
		if (tha!=th) {
			tha = th;
			for (var i = 0; i < servernames.length; i++) {
				var money = ns.getServerMaxMoney(servernames[i]);
				if((ns.getHackingLevel("home")>=ns.getServerRequiredHackingLevel(servernames[i]))&&(servernames[i]!="n00dles")&&(money > 0)){
					if (ns.isRunning("hackfhome.js", "home", servernames[i]) == true){
						ns.kill("hackfhome.js", "home", servernames[i]);
					}else{}
					if (th >= 1){
						ns.exec("hackfhome.js", "home", th , servernames[i]);
					}
					if(niveln<ns.getServerRequiredHackingLevel(servernames[i])){
						niveln = ns.getServerRequiredHackingLevel(servernames[i]);
					}
				}	
			}
			if (th >= 1){
				ns.tprint("==================================================");
				ns.tprint("Running hackfhome.js with t= "+th);
				ns.tprint("Started hackfhome.js to "+ nslv +" servers successfull!");
				ns.tprint("==================================================");
			}
			else{
				ns.tprint("==================================================");
				ns.tprint("Threads on home is less then 1");
				ns.tprint("==================================================");	
			}
		}
		await ns.sleep(600000);
	}
}