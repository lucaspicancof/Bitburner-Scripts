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
