/**
 * Dados de factions pro faction-manager (BN1, foco hacking).
 * Requisitos da doc oficial. Só factions sem combate e sem conflito ruim.
 */

// Factions de hacking: backdoor no servidor → convite. Ordem por dificuldade.
export const HACKING_FACTIONS = [
    { name: "CyberSec", server: "CSEC", hack: 51 },
    { name: "NiteSec", server: "avmnite-02h", hack: 202 },
    { name: "The Black Hand", server: "I.I.I.I", hack: 340 },
    { name: "BitRunners", server: "run4theh111z", hack: 505 }
];

// Factions que precisam viajar + dinheiro (+ hacking). Convite aparece estando na
// cidade com os requisitos. Sector-12 e Aevum são compatíveis entre si.
export const CITY_FACTIONS = [
    { name: "Tian Di Hui", city: "Chongqing", money: 1e6, hack: 50 }, // dá Neuroreceptor
    { name: "Sector-12", city: "Sector-12", money: 15e6, hack: 0 },   // dá CashRoot
    { name: "Aevum", city: "Aevum", money: 40e6, hack: 0 }            // dá PCMatrix
];

// Netburners: convida sozinho quando o hacknet atende; só aceitar.
// Allowlist: tudo que o manager pode joinar automaticamente.
export const ALLOWLIST = new Set([
    ...HACKING_FACTIONS.map(f => f.name),
    ...CITY_FACTIONS.map(f => f.name),
    "Netburners"
]);
