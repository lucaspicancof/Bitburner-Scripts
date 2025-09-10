var servernames = Array(
   "hack",
   "hack2",
   "n00dles",
   "foodnstuff", //1
   "sigma-cosmetics", //5
   "joesguns", //10
   "nectar-net", //20
   "hong-fang-tea", //30
   "harakiri-sushi", //40
   "neo-net", //50
   "zer0", //75
   "max-hardware", //80
   "iron-gym", //100
   "phantasy", //100
   "silver-helix", //150
   "omega-net", //200
   "crush-fitness", //250
   "johnson-ortho", //	275
   "the-hub", //	300
   "comptek", //	350
   "netlink", //	400
   "rothman-uni", //	400
   "catalyst", //	425
   "summit-uni", //	450
   "rho-construction", //	500
   "millenium-fitness", //	500
   "aevum-police", //	425
   "alpha-ent", //	550
   "syscore", //	600
   "lexo-corp", //	700
   "snap-fitness", //	750
   "global-pharm", //	775
   "applied-energetics", //	775
   "unitalife", //	790
   "univ-energy", //	790
   "nova-med", //	800
   "zb-def", //	800
   "zb-institute", //	750
   "vitalife", //	775
   "titan-labs", //	795
   "solaris", //	800
   "microdyne", //	800
   "helios", //	800
   "deltaone", //	810
   "icarus", //	810
   "zeus-med", //	810
   "omnia", //	825
   "defcomm", //	825
   "galactic-cyber", //	825
   "infocomm", //	830
   "taiyang-digital", //	850
   "stormtech", //	850
   "aerocorp", //	850
   "clarkinc", //	900
   "omnitek", //	900
   "nwo", //	900
   "4sigma", //	900
   "blade", //	900
   "b-and-a", //	900
   "ecorp", //	900
   "fulcrumtech", //	900
   "megacorp", //	900
   "kuai-gong", //	925
   "fulcrumassets", //	999
   "powerhouse-fitness" //	1000
);


for (i = 0; i < servernames.length; i++) {
   tprint("==================================");
   tprint(servernames[i]);
   tprint("==================================");
   //tprint("Connected to home");
   //connect("home");
   tprint("Starting to open portst:");

   if (fileExists("BruteSSH.exe", "home")) {
      tprint("Openend SSH Port");
      brutessh(servernames[i]);
   }
   if (fileExists("FTPCrack.exe", "home")) {
      tprint("Openend FTP Port");
      ftpcrack(servernames[i]);
   }
   if (fileExists("RelaySMTP.exe", "home")) {
      tprint("Openend SMTP Port");
      relaysmtp(servernames[i]);
   }
   if (fileExists("HTTPWorm.exe", "home")) {
      tprint("Openend HTTP Port");
      httpworm(servernames[i]);
   }
   if (fileExists("SQLInject.exe", "home")) {
      tprint("Openend SQL Port");
      sqlinject(servernames[i]);
   }
   tprint("Gainend ROOT Access");
   nuke(servernames[i]);
   tprint("==================================");
   tprint("Now connect to " + servernames[i]);
   var ram = getServerMaxRam(servernames[i]);
   tprint("The server has " + ram + "GB of RAM");
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
      case 1024: threads = 417;
         break;
      default: threads = 1
         break;
   }
   if (servernames[i]=="n00dles"){
      tprint("==================================");
      scp("n0.js", "home", servernames[i]);
      scp("n02.js", "home", servernames[i]);
      exec("n0.js",servernames[i]);
      exec("n02.js",servernames[i]);
      exec("n03.js","home");
      exec("n04.js","home");
      tprint(" ");
      tprint(" ");
      sleep(2000);
   }
   else if (servernames[i]=="hack"||servernames[i]=="hack2") {
      tprint("And run your script with -t 1");
      tprint("==================================");
      //rm("hack.js", "home", servernames[i]);
      for (x = 1; x <= 417; x++){
         if(x==1){
            scp("hhack.js", "home", servernames[i]);
         }
         else{
            var aaa = "hhack"+x+".js";
            scp(aaa, "home", servernames[i]);
         }
      }
      tprint("Copied 417 Scripts to "+servernames[i]);
      tprint("==================================");
      for (z = 1; z <= 417; z++){
         if(z==1){
            exec("hhack.js", servernames[i]);
         }
         else{
            var aaa = "hhack"+z+".js";
            exec(aaa, servernames[i]);
         }
      }
      tprint("Started " + "417 Scripts" + " on " + servernames[i] + " successfull!");
      tprint("==================================");
      tprint(" ");
      tprint(" ");
      sleep(5000);
   }   
   else if (ram==16) {
      tprint("And run your script with -t ");
      tprint("==================================");
      //rm("hack.js", "home", servernames[i]);
      files = ["hack6.js","hack5.js","hack4.js","hack3.js","hack2.js","hack.js"];
      scp(files, "home", servernames[i]);
      tprint("Copied 6 Scripts to "+servernames[i]);
      tprint("==================================");
      for (z = 1; z <= 6; z++){
         if(z==1){
            exec("hack.js", servernames[i]);
         }
         else{
            var aaa = "hack"+z+".js"
            exec(aaa, servernames[i]);
         }
      }
      tprint("Started " + "6 Scripts" + " on " + servernames[i] + " successfull!");
      tprint("==================================");
      tprint(" ");
      tprint(" ");
      sleep(5000);
   }
   else if (ram==32) {
      tprint("And run your script with -t ");
      tprint("==================================");
      //rm("hack.js", "home", servernames[i]);
      files = ["hack13.js","hack12.js","hack11.js","hack10.js","hack9.js","hack8.js","hack7.js","hack6.js","hack5.js","hack4.js","hack3.js","hack2.js","hack.js"];
      scp(files, "home", servernames[i]);
      tprint("Copied 13 Scripts to "+servernames[i]);
      tprint("==================================");
      for (z = 1; z <= 13; z++){
         if(z==1){
            exec("hack.js", servernames[i]);
         }
         else{
            var aaa = "hack"+z+".js"
            exec(aaa, servernames[i]);
         }
      }
      tprint("Started " + "13 Scripts" + " on " + servernames[i] + " successfull!");
      tprint("==================================");
      tprint(" ");
      tprint(" ");
      sleep(5000);
   }
   else if (ram==64) {
      tprint("And run your script with -t ");
      tprint("==================================");
      //rm("hack.js", "home", servernames[i]);
      files = ["hack26.js","hack25.js","hack24.js","hack23.js","hack22.js","hack21.js","hack20.js","hack19.js","hack18.js","hack17.js","hack16.js","hack15.js","hack14.js","hack13.js","hack12.js","hack11.js","hack10.js","hack9.js","hack8.js","hack7.js","hack6.js","hack5.js","hack4.js","hack3.js","hack2.js","hack.js"];
      scp(files, "home", servernames[i]);
      tprint("Copied 26 Scripts to "+servernames[i]);
      tprint("==================================");
      for (z = 1; z <= 26; z++){
         if(z==1){
            exec("hack.js", servernames[i]);
         }
         else{
            var aaa = "hack"+z+".js"
            exec(aaa, servernames[i]);
         }
      }
      tprint("Started " + "26 Scripts" + " on " + servernames[i] + " successfull!");
      tprint("==================================");
      tprint(" ");
      tprint(" ");
      sleep(5000);
   }
   else if (ram==128) {
      tprint("And run your script with -t ");
      tprint("==================================");
      //rm("hack.js", "home", servernames[i]);
      files = ["hack51.js","hack50.js","hack49.js","hack48.js","hack47.js","hack46.js","hack45.js","hack44.js","hack43.js","hack42.js","hack41.js","hack40.js","hack39.js","hack38.js","hack37.js","hack36.js","hack35.js","hack34.js","hack33.js","hack32.js","hack31.js","hack30.js","hack29.js","hack28.js","hack27.js","hack26.js","hack25.js","hack24.js","hack23.js","hack22.js","hack21.js","hack20.js","hack19.js","hack18.js","hack17.js","hack16.js","hack15.js","hack14.js","hack13.js","hack12.js","hack11.js","hack10.js","hack9.js","hack8.js","hack7.js","hack6.js","hack5.js","hack4.js","hack3.js","hack2.js","hack.js"];
      scp(files, "home", servernames[i]);
      tprint("Copied 51 Scripts to "+servernames[i]);
      tprint("==================================");
      for (z = 1; z <= 51; z++){
         if(z==1){
            exec("hack.js", servernames[i]);
         }
         else{
            var aaa = "hack"+z+".js"
            exec(aaa, servernames[i]);
         }
      }
      tprint("Started " + "51 Scripts" + " on " + servernames[i] + " successfull!");
      tprint("==================================");
      tprint(" ");
      tprint(" ");
      sleep(5000);
   }
   else if (ram==256) {
      tprint("And run your script with -t ");
      tprint("==================================");
      //rm("hack.js", "home", servernames[i]);
      files = ["hack104.js","hack103.js","hack102.js","hack101.js","hack100.js","hack99.js","hack98.js","hack97.js","hack96.js","hack95.js","hack94.js","hack93.js","hack92.js","hack91.js","hack90.js","hack89.js","hack88.js","hack87.js","hack86.js","hack85.js","hack84.js","hack83.js","hack82.js","hack81.js","hack80.js","hack79.js","hack78.js","hack77.js","hack76.js","hack75.js","hack74.js","hack73.js","hack72.js","hack71.js","hack70.js","hack69.js","hack68.js","hack67.js","hack66.js","hack65.js","hack64.js","hack63.js","hack62.js","hack61.js","hack60.js","hack59.js","hack58.js","hack57.js","hack56.js","hack55.js","hack54.js","hack53.js","hack52.js","hack51.js","hack50.js","hack49.js","hack48.js","hack47.js","hack46.js","hack45.js","hack44.js","hack43.js","hack42.js","hack41.js","hack40.js","hack39.js","hack38.js","hack37.js","hack36.js","hack35.js","hack34.js","hack33.js","hack32.js","hack31.js","hack30.js","hack29.js","hack28.js","hack27.js","hack26.js","hack25.js","hack24.js","hack23.js","hack22.js","hack21.js","hack20.js","hack19.js","hack18.js","hack17.js","hack16.js","hack15.js","hack14.js","hack13.js","hack12.js","hack11.js","hack10.js","hack9.js","hack8.js","hack7.js","hack6.js","hack5.js","hack4.js","hack3.js","hack2.js","hack.js"];
      scp(files, "home", servernames[i]);
      tprint("Copied 104 Scripts to "+servernames[i]);
      tprint("==================================");
      for (z = 1; z <= 104; z++){
         if(z==1){
            exec("hack.js", servernames[i]);
         }
         else{
            var aaa = "hack"+z+".js"
            exec(aaa, servernames[i]);
         }
      }
      tprint("Started " + "104 Scripts" + " on " + servernames[i] + " successfull!");
      tprint("==================================");
      tprint(" ");
      tprint(" ");
      sleep(5000);
   }
   else if (ram==512) {
      tprint("And run your script with -t ");
      tprint("==================================");
      //rm("hack.js", "home", servernames[i]);
      files = ["hack208.js","hack207.js","hack206.js","hack205.js","hack204.js","hack203.js","hack202.js","hack201.js","hack200.js","hack199.js","hack198.js","hack197.js","hack196.js","hack195.js","hack194.js","hack193.js","hack192.js","hack191.js","hack190.js","hack189.js","hack188.js","hack187.js","hack186.js","hack185.js","hack184.js","hack183.js","hack182.js","hack181.js","hack180.js","hack179.js","hack178.js","hack177.js","hack176.js","hack175.js","hack174.js","hack173.js","hack172.js","hack171.js","hack170.js","hack169.js","hack168.js","hack167.js","hack166.js","hack165.js","hack164.js","hack163.js","hack162.js","hack161.js","hack160.js","hack159.js","hack158.js","hack157.js","hack156.js","hack155.js","hack154.js","hack153.js","hack152.js","hack151.js","hack150.js","hack149.js","hack148.js","hack147.js","hack146.js","hack145.js","hack144.js","hack143.js","hack142.js","hack141.js","hack140.js","hack139.js","hack138.js","hack137.js","hack136.js","hack135.js","hack134.js","hack133.js","hack132.js","hack131.js","hack130.js","hack129.js","hack128.js","hack127.js","hack126.js","hack125.js","hack124.js","hack123.js","hack122.js","hack121.js","hack120.js","hack119.js","hack118.js","hack117.js","hack116.js","hack115.js","hack114.js","hack113.js","hack112.js","hack111.js","hack110.js","hack109.js","hack108.js","hack107.js","hack106.js","hack105.js","hack104.js","hack103.js","hack102.js","hack101.js","hack100.js","hack99.js","hack98.js","hack97.js","hack96.js","hack95.js","hack94.js","hack93.js","hack92.js","hack91.js","hack90.js","hack89.js","hack88.js","hack87.js","hack86.js","hack85.js","hack84.js","hack83.js","hack82.js","hack81.js","hack80.js","hack79.js","hack78.js","hack77.js","hack76.js","hack75.js","hack74.js","hack73.js","hack72.js","hack71.js","hack70.js","hack69.js","hack68.js","hack67.js","hack66.js","hack65.js","hack64.js","hack63.js","hack62.js","hack61.js","hack60.js","hack59.js","hack58.js","hack57.js","hack56.js","hack55.js","hack54.js","hack53.js","hack52.js","hack51.js","hack50.js","hack49.js","hack48.js","hack47.js","hack46.js","hack45.js","hack44.js","hack43.js","hack42.js","hack41.js","hack40.js","hack39.js","hack38.js","hack37.js","hack36.js","hack35.js","hack34.js","hack33.js","hack32.js","hack31.js","hack30.js","hack29.js","hack28.js","hack27.js","hack26.js","hack25.js","hack24.js","hack23.js","hack22.js","hack21.js","hack20.js","hack19.js","hack18.js","hack17.js","hack16.js","hack15.js","hack14.js","hack13.js","hack12.js","hack11.js","hack10.js","hack9.js","hack8.js","hack7.js","hack6.js","hack5.js","hack4.js","hack3.js","hack2.js","hack.js"];
      scp(files, "home", servernames[i]);
      tprint("Copied 208 Scripts to "+servernames[i]);
      tprint("==================================");
      for (z = 1; z <= 208; z++){
         if(z==1){
            exec("hack.js", servernames[i]);
         }
         else{
            var aaa = "hack"+z+".js"
            exec(aaa, servernames[i]);
         }
      }
      tprint("Started " + "208 Scripts" + " on " + servernames[i] + " successfull!");
      tprint("==================================");
      tprint(" ");
      tprint(" ");
      sleep(5000);
   }
   else if (ram==0){
      tprint("And run your script with -t ");
      tprint("==================================");
      //rm("hack.js", "home", servernames[i]);
      scp("hack.js", "home", servernames[i]);
      tprint("Copied hack.js Scripts to "+servernames[i])
      tprint("==================================");
      exec("hack.js", servernames[i]);
      tprint("Started " + "hack.js" + " on " + servernames[i] + " successfull!");
      tprint("==================================");
      tprint(" ");
      tprint(" ");
      sleep(5000);
   }
}