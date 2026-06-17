# Bitburner Scripts

Minha infraestrutura de automação pro [Bitburner](https://github.com/bitburner-official/bitburner-src).

Voltei a jogar depois de um tempão parado e, em vez de ir colando script solto no editor do jogo como eu fazia, resolvi reconstruir tudo do zero — versionado, com autocomplete e type-check da API, sincronizado pro jogo via [bitburner-filesync](https://github.com/bitburner-official/bitburner-filesync). A meta não é só passar de uma BitNode: é automatizar o **máximo de BNs que eu conseguir**, do começo ao fim, com o mínimo de clique meu. Hoje a run de hacking (BN1) já roda praticamente sozinha — do nada até a hora de resetar e recomeçar mais forte.

## A ideia: um núcleo universal + camadas por BitNode

A sacada que organiza tudo: quase todo o trabalho é **igual em qualquer BitNode** — você sempre hackeia por dinheiro, sempre quer reputação e augmentations, sempre reseta pra ficar mais forte. Isso é o **núcleo**, e ele não muda. O que muda de uma BN pra outra é a *mecânica extra* (BN2 tem gangs, BN3 corporação, BN6/7 bladeburner...).

Então separei assim:

```
src/
├── lib/          bibliotecas compartilhadas e puras (rede, batches, scoring, factions, augs, telemetria...)
├── scripts/
│   ├── workers/  hack / grow / weaken — primitivos burros, só executam
│   └── managers/ O NÚCLEO: os loops que rodam em qualquer BN
├── bitnodes/
│   └── bnN/      camadas específicas (gang, corp, bladeburner) que plugam no núcleo
├── analysis/     relatórios que rodo sob demanda
└── dashboards/   o HUD visual
```

O `reset-loop` (o orquestrador de topo) é **BN-aware**: ele sempre sobe o núcleo e, detectando em qual BitNode estou, lança os managers de `bitnodes/bnN/` que existirem. Pra atacar a BN2 amanhã, é só criar um `bitnodes/bn2/gang-manager.js` e registrar — **sem encostar no núcleo**. É a parte que me deixa mais tranquilo de escalar.

## O núcleo: o ciclo que se sustenta sozinho

Essa é a parte que tenho orgulho. Depois que eu dou `run boot.js` (ou o jogo roda ele sozinho pós-reset), a coisa toda se vira:

- **`root-manager`** — recompra os port openers que somem no reset (só o Formulas persiste) e vai dando nuke conforme meu hacking sobe, pra nunca faltar alvo.
- **`batch-manager`** — um scheduler HWGW **multi-alvo**: ranqueia os servidores pelo $/s que rendem *depois de preparados*, distribui a RAM entre os melhores até cada um saturar, e sobe um `batch-runner` por alvo (que prepara sozinho se preciso). O número de alvos **escala com a RAM** — com PB de home, ele satura meia rede ao mesmo tempo.
- **`hacknet-manager`** — compra de hacknet *reset-aware*: só pega upgrade que se paga antes do próximo reset (com ROI exato via Formulas), porque hacknet some no reset.
- **`faction-manager`** — re-backdoora os servidores das factions de hacking, viaja pras de cidade respeitando as inimigas (entra numa, bloqueia as rivais), e aceita os convites sozinho.
- **`progression-manager`** — escolhe os augs por **densidade de valor** (não só "o mais barato"), farma a reputação, e quando uma faction tem favor ≥ 150 ele **doa dinheiro** pra comprar a rep na hora em vez de trabalhar.
- **`contract-manager`** — resolve os Coding Contracts que aparecem na rede (uns 19 tipos), de bônus.
- **`reset-loop`** — mantém todo mundo vivo (relança quem morre), enche de NeuroFlux, e decide sozinho **quando resetar**: ele simula a curva de reputação, acha o "joelho" (onde farmar mais deixa de valer a pena) e instala ali. Aí o `boot.js` sobe tudo de novo e o ciclo recomeça, mais forte.

```
run boot.js   # liga o ciclo inteiro
```

O resultado é um loop fechado: **hackear → factions → rep → augs → reset → repetir**, se auto-calibrando conforme eu evoluo. A única coisa que deixei de fora de propósito é o backdoor final do `w0r1d_d43m0n` — é o "apertar o botão de vitória", e isso eu quero fazer na mão.

## Estratégia da BN atual (BN1.1)

BN1 é hacking puro, sem Source-Files. O gargalo real não é dinheiro (o batch imprime mais do que dá pra gastar) — é **reputação de faction**, que é o que destrava as augmentations. Então a run gira em torno de:

1. Manter a economia de hacking rodando no automático (núcleo).
2. Entrar em todas as factions de hacking + as de cidade que valem (Sector-12 → CashRoot, Aevum → PCMatrix, Tian Di Hui → Neuroreceptor).
3. Acumular augs e resetar rápido pra ganhar favor — favor alto destrava **doação**, que torna a rep instantânea.
4. Endgame: entrar na **Daedalus** → comprar **The Red Pill** → backdoor no `w0r1d_d43m0n` (esse passo, manual).

## Próximas BitNodes

A estrutura tá pronta pra crescer. Conforme eu for desbloqueando, cada BN ganha sua pasta em `bitnodes/` com os managers específicos, plugando no núcleo que já existe:

- **BN2** — gangs (foco em território e membros, hacking vira coadjuvante)
- **BN3** — corporação
- **BN6/7** — bladeburner
- ...e por aí vai

O núcleo de hacking/factions/augs continua valendo em todas — só a camada de cima muda.

## Ferramentas de apoio

```
run dashboards/dashboard.js     # HUD com abas, sparklines e contagem pro reset
run scan.js top                 # melhores alvos do momento, por potencial
run analysis/rep-forecast.js    # taxa de rep e onde está o joelho da curva
run analysis/backdoor-helper.js # monta os comandos de connect+backdoor
```

O **HUD** é um dashboard em HTML de verdade — arrastável, minimizável, com abas (Geral, Scan, Hack, Hacknet, Factions, Scripts), sparklines de renda/dinheiro/hacking e contagem regressiva pro reset. O truque pra ele ser leve: não calcula nada de Singularity (que custa 16x de RAM); cada manager publica um snapshot do seu estado num arquivo (um barramento de telemetria em `lib/telemetry.js`) e o HUD só lê. Cada aba reflete o estado real — se um manager não tá rodando, a aba mostra "offline".

## `LEGADO/`

Meus scripts antigos, de outras runs. Deixo só como referência histórica — não sincronizo nem mexo. O filesync aponta só pra `src/`.
