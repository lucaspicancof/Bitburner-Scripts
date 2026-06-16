/**
 * Dados de factions pro faction-manager (BN1, foco hacking).
 * Requisitos da doc oficial. Só factions sem combate.
 */

// Factions de hacking: backdoor no servidor → convite. Ordem por dificuldade.
export const HACKING_FACTIONS = [
    { name: "CyberSec", server: "CSEC", hack: 51 },
    { name: "NiteSec", server: "avmnite-02h", hack: 202 },
    { name: "The Black Hand", server: "I.I.I.I", hack: 340 },
    { name: "BitRunners", server: "run4theh111z", hack: 505 }
];

// Tian Di Hui — sem conflito; precisa estar em uma destas cidades. Dá Neuroreceptor.
export const TIAN_DI_HUI = {
    name: "Tian Di Hui",
    cities: ["Chongqing", "New Tokyo", "Ishima"],
    money: 1e6,
    hack: 50
};

/**
 * City factions EXCLUSIVAS: cada uma é inimiga das outras (com dois campos
 * compatíveis: {Sector-12, Aevum} e {Chongqing, New Tokyo, Ishima}; Volhaven sozinha).
 * Entrar em uma barra as inimigas dela na run atual. priority: menor = primeiro.
 */
export const CITY_FACTIONS = [
    { name: "Sector-12", city: "Sector-12", money: 15e6, priority: 1, enemies: ["Chongqing", "New Tokyo", "Ishima", "Volhaven"] },
    { name: "Aevum", city: "Aevum", money: 40e6, priority: 2, enemies: ["Chongqing", "New Tokyo", "Ishima", "Volhaven"] },
    { name: "Volhaven", city: "Volhaven", money: 50e6, priority: 3, enemies: ["Sector-12", "Aevum", "Chongqing", "New Tokyo", "Ishima"] },
    { name: "Chongqing", city: "Chongqing", money: 20e6, priority: 4, enemies: ["Sector-12", "Aevum", "Volhaven"] },
    { name: "New Tokyo", city: "New Tokyo", money: 20e6, priority: 5, enemies: ["Sector-12", "Aevum", "Volhaven"] },
    { name: "Ishima", city: "Ishima", money: 30e6, priority: 6, enemies: ["Sector-12", "Aevum", "Volhaven"] }
];

// Factions livres pra aceitar convite a qualquer momento (sem conflito).
// Daedalus é o endgame (30 augs + $100b + hacking 2500): o jogo convida sozinho
// quando você qualifica — sem backdoor nem viagem, só aceitar. Leva ao The Red Pill.
export const FREE_FACTIONS = new Set([
    ...HACKING_FACTIONS.map(f => f.name),
    "Netburners",
    "Tian Di Hui",
    "Daedalus"
]);

/**
 * Conjunto de factions BLOQUEADAS: inimigas de qualquer faction já ingressada.
 * @param {Set<string>|string[]} joined
 */
export function cityEnemies(joined) {
    const map = Object.fromEntries(CITY_FACTIONS.map(f => [f.name, f.enemies]));
    const blocked = new Set();
    for (const j of joined) {
        for (const e of (map[j] || [])) blocked.add(e);
    }
    return blocked;
}
