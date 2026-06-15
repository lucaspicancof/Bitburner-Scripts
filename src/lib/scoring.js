export const READY_MONEY = 0.95;

export const READY_SECURITY = 1;

export function prepCost(data) {

    const moneyPenalty =

        (1 - data.moneyRatio) * 8;

    const securityPenalty =

        data.securityGap * 3;

    return (

        1 +

        moneyPenalty +

        securityPenalty
    );
}

export function growthMultiplier(data) {

    return Math.min(

        3,

        1 + (
            data.growth / 100
        )
    );
}

export function economicScore(data) {

    return (

        data.maxMoney *

        data.chance *

        data.hackPercent *

        growthMultiplier(data)

    ) / data.hackTime;
}

export function operationalScore(data) {

    return (

        economicScore(data) *

        data.moneyRatio
    );
}

export function effectiveScore(data) {

    return (

        operationalScore(data)

    ) / prepCost(data);
}

export function prepPercent(data) {

    const moneyPart =
        data.moneyRatio;

    const securityPart =
        Math.max(
            0,
            1 -
            (data.securityGap / 20)
        );

    return (

        (
            moneyPart +
            securityPart
        ) / 2

    ) * 100;
}

export function isReady(data) {

    return (

        data.moneyRatio >=
        READY_MONEY &&

        data.securityGap <=
        READY_SECURITY
    );
}

/**
 * Score de POTENCIAL: $/s estimado quando o servidor está PREPARADO (sec mínima,
 * dinheiro máximo), independente do estado atual. Usa a Formulas API.
 *
 * Diferente do effectiveScore (que pondera o estado atual e por isso subestima
 * servidores grandes ainda despreparados), este mede o quanto o alvo VALE depois
 * de preparado — é o que deve guiar a escolha de o que preparar/atacar.
 *
 * @param {NS} ns
 * @param {string} server
 * @returns {number} dinheiro por segundo potencial
 */
export function potentialScore(ns, server) {
    const maxMoney = ns.getServerMaxMoney(server);
    if (maxMoney <= 0) return 0;

    const fm = ns.formulas.hacking;
    const player = ns.getPlayer();

    // Servidor no estado preparado.
    const s = ns.getServer(server);
    s.hackDifficulty = s.minDifficulty;
    s.moneyAvailable = s.moneyMax;

    const hackPct = fm.hackPercent(s, player);   // fração roubada por thread
    const chance = fm.hackChance(s, player);
    const weakenSec = fm.weakenTime(s, player) / 1000;
    if (weakenSec <= 0) return 0;

    // Proxy de $/s: dinheiro roubável × chance, normalizado pelo tempo do ciclo.
    return (maxMoney * hackPct * chance) / weakenSec;
}
