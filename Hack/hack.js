/** @param {NS} ns **/
export async function main(ns) {

    // Programa para hack automatico no proprio servidor

    // Nome do servidor alvo
    var target_server = ns.getHostname(); 

    // Máximo de quantidade de dinheiro no servidor
    var max_money_server = ns.getServerMaxMoney(target_server) * 0.75; 

    // nivel minimo de segurança o sevidor
    var min_security_level = ns.getServerMinSecurityLevel(target_server) + 5; 
    // inicio do loop
    while(true) {
        // Se o nivel de segurança atual for maoir que o nivel minimo(+5)
        if (ns.getServerSecurityLevel(target_server) > min_security_level) { 
            await ns.weaken(target_server);
            await ns.sleep(3000);
        } 

        // Se o dinheiro disponivel do servidor for menor do que 75% do dinheiro máximo
        else if (ns.getServerMoneyAvailable(target_server) < max_money_server) { 
            await ns.grow(target_server);
            await ns.sleep(3000);
        }
        
        // Se tudo estiver ok: 
        else {
            await ns.hack(target_server);
            await ns.sleep(3000);
        }
    }    
}