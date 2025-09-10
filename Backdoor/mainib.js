/** @param {NS} ns */
export async function main(ns) {
	let servernames = [//        |HackLv|Nports|
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
	];

	for (var i = 0; i < servernames.length; i++) {
		if ((ns.hasRootAccess(servernames[i])) && (ns.getServerMaxRam(servernames[i]) > 33)) {
			await ns.scp("ib.js", servernames[i], "home")
			ns.exec("ib.js", servernames[i])
		}
		await ns.sleep(1000)
	}
	await ns.sleep(60000)
	ns.exec("main2.js", "home")

}