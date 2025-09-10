/** @param {NS} ns **/
export async function main(ns) {
    
    // Programa para hackaer continuamente um servidor à distancia

    // Para rodar precisa-se escrever dessa maneira: run hackfhome.js "nome do servidor"

    //definindo que o nome do servidor alvo será o primeiro argumento
    var target_server = ns.args[0];
    
    // Máximo de quantidade de dinheiro no servidor
    var max_money_server = ns.getServerMaxMoney(target_server) * 0.75;
    
    // nivel minimo de segurança o sevidor
    var min_security_level = ns.getServerMinSecurityLevel(target_server) + 5; 
    // inicio do loop    
    while(true) {

        // Se o nivel de segurança atual for maoir que o nivel minimo(+5)
            await ns.weaken(target_server);
        if (ns.getServerSecurityLevel(target_server) > min_security_level) { 
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