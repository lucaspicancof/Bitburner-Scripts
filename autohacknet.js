/**
 * Script para comprar e melhorar nós do Hacknet.
 *
 * Uso:
 *   run <este_script> nodes level RAM cores
 * Exemplo:
 *   run <este_script> 10 100 32 10
 *
 * Parâmetros:
 * - nodes: quantidade de novos nós para comprar (0 para não comprar)
 * - level: nível alvo para cada nó (1 a 200)
 * - RAM: quantidade-alvo de RAM (1,2,4,8,16,32,64)
 * - cores: núcleos-alvo por nó (1 a 16)
 *
 * @param {NS} ns
 */
export async function main(ns) {
    // Lê flags/argumentos; aceita "--help"
    const args = ns.flags([["help", false]]);

    // Ajuda e validação básica de quantidade de argumentos
    if (args.help || args._.length < 4) {
        ns.tprint("Este script compra e melhora nós do Hacknet.");
        ns.tprint("O primeiro argumento é o número de nós extras a comprar. Informe 0 se não quiser comprar novos nós.");
        ns.tprint(`Uso: run ${ns.getScriptName()} nodes level RAM cores`);
        ns.tprint("Exemplo:");
        ns.tprint(`> run ${ns.getScriptName()} 10 100 32 10`);
        return;
    }

    // Parâmetros posicionais
    const nodes = args._[0];
    const lvl = args._[1];
    const ram = args._[2];
    const cpu = args._[3];

    // Número atual de nós e total alvo após compras
    const cnodes = ns.hacknet.numNodes();
    var tnodes = cnodes + nodes;

    // Validação: nível (1..200)
    if (lvl > 200 || lvl < 1){
        ns.tprint("Nível de nó inválido! Deve estar entre 1 e 200!");
        ns.tprint("Tente novamente com um número válido!");
        return;
    }

    // Validação: RAM deve ser uma potência de 2 (entre as abaixo)
    const validram = [1, 2, 4, 8, 16, 32, 64];
    if (!(validram.includes(ram))){
        ns.tprint("Quantidade de RAM inválida! Deve ser estritamente 1, 2, 4, 8, 16, 32 ou 64!");
        ns.tprint("Tente novamente com um número válido!");
        return;
    }

    // Validação: núcleos (1..16)
    if (cpu > 16 || cpu < 1){
        ns.tprint("Quantidade de núcleos inválida! Deve estar entre 1 e 16!");
        ns.tprint("Tente novamente com um número válido!");
        return;
    }

    // Não ultrapassar o máximo de nós permitido pelo jogo
    if (tnodes > ns.hacknet.maxNumNodes()) {
        ns.tprint("Número máximo de nós atingido!");
        tnodes = ns.hacknet.maxNumNodes();        
    }

    ns.tprint("Comprando " + nodes + " novos nós");

    // Compra nós até alcançar o total desejado; espera ter dinheiro suficiente
    while (ns.hacknet.numNodes() < tnodes) {
        let cost = ns.hacknet.getPurchaseNodeCost();
        while (ns.getServerMoneyAvailable("home") < cost) {
            ns.print("Necessário $" + cost + " . Disponível $" + ns.getServerMoneyAvailable("home"));
            await ns.sleep(3000);
        }
        let res = ns.hacknet.purchaseNode();
        ns.toast("Nó do Hacknet comprado com índice " + res);
    }

    // Upgrade de nível até o alvo especificado
    for (let i = 0; i < tnodes; i++) {
        if (ns.hacknet.getNodeStats(i).level == 200){
            continue; // já está no máximo de nível
        }
        while (ns.hacknet.getNodeStats(i).level < lvl) {
            let cost = ns.hacknet.getLevelUpgradeCost(i, 1);
            while (ns.getServerMoneyAvailable("home") < cost) {
                ns.print("Necessário $" + cost + " . Disponível $" + ns.getServerMoneyAvailable("home"));
                await ns.sleep(3000);
            }
            let res = ns.hacknet.upgradeLevel(i, 1);
        }
    }
    ns.tprint("Todos os nós atualizados para o nível " + lvl);

    // Upgrade de RAM até o alvo especificado
    for (let i = 0; i < tnodes; i++) {
        if (ns.hacknet.getNodeStats(i).ram == 64){
            continue; // já está no máximo de RAM
        }
        while (ns.hacknet.getNodeStats(i).ram < ram) {
            let cost = ns.hacknet.getRamUpgradeCost(i, 1);
            while (ns.getServerMoneyAvailable("home") < cost) {
                ns.print("Necessário $" + cost + " . Disponível $" + ns.getServerMoneyAvailable("home"));
                await ns.sleep(3000);
            }
            let res = ns.hacknet.upgradeRam(i, 1);
        }
    }
    ns.tprint("Todos os nós atualizados para " + ram + "GB de RAM");

    // Upgrade de núcleos até o alvo especificado
    for (let i = 0; i < tnodes; i++) {
        if (ns.hacknet.getNodeStats(i).cores == 16){
            continue; // já está no máximo de núcleos
        }
        while (ns.hacknet.getNodeStats(i).cores < cpu) {
            let cost = ns.hacknet.getCoreUpgradeCost(i, 1);
            while (ns.getServerMoneyAvailable("home") < cost) {
                ns.print("Necessário $" + cost + " . Disponível $" + ns.getServerMoneyAvailable("home"));
                await ns.sleep(3000);
            }
            let res = ns.hacknet.upgradeCore(i, 1);
        }
    }

    // Finalização
    ns.tprint("Todos os nós atualizados para " + cpu + " núcleos");
    ns.tprint("Atualização do Hacknet concluída!");
}
