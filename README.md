# Bitburner Scripts

Esse repositório é a minha infraestrutura de automação para o [Bitburner](https://github.com/bitburner-official/bitburner-src). Voltei a jogar depois de um bom tempo parado e decidi reconstruir minha biblioteca de scripts do zero — dessa vez com uma arquitetura limpa, modular e versionada de verdade, em vez de ir colando código solto no editor do jogo.

A ideia central é tratar o jogo como uma plataforma de programação: escrevo tudo aqui no disco, com autocomplete e type-check da API, e sincronizo automaticamente para dentro do jogo.

## Como eu sincronizo com o jogo

Uso o [`bitburner-filesync`](https://github.com/bitburner-official/bitburner-filesync). Na raiz do repo:

```
npx bitburner-filesync
```

Ele fica observando a pasta `src/` e empurra qualquer alteração para o jogo. Para conectar, é só ir em **Options → Remote API**, apontar para a porta **12525** e clicar em **Connect**. Quando conecto, todos os arquivos de `src/` são enviados de uma vez.

Só a pasta `src/` é sincronizada — ela espelha o `home` do jogo:

| No disco                 | No jogo (home)      |
|--------------------------|---------------------|
| `src/lib/`               | `lib/`              |
| `src/scripts/workers/`   | `scripts/workers/`  |
| `src/scripts/managers/`  | `scripts/managers/` |
| `src/analysis/`          | `analysis/`         |
| `src/dashboards/`        | `dashboards/`       |

> **Nota:** deixei `allowDeletingFiles: true` no `filesync.json`, então apagar um arquivo aqui também o remove do jogo na próxima sincronização. Se eu apagar algo, reinicio o filesync para ele propagar.

## Como organizei

```
src/
├── lib/                  bibliotecas compartilhadas (puras, sem main)
│   ├── network.js        varredura da rede + análise de servidor
│   ├── scoring.js        meu modelo de score econômico / prep / ready
│   ├── targets.js        ranqueamento e seleção de alvos
│   ├── hgw.js            planejamento de batches HWGW (via Formulas API)
│   ├── ram.js            pool de RAM distribuída + dispatch de workers
│   ├── pathfind.js       BFS de rotas na rede (usado pro backdoor)
│   ├── hacknet.js        cálculo de ROI dos upgrades de hacknet
│   └── prep.js           threads de prep (consumido pelas análises)
├── scripts/
│   ├── workers/          primitivos atômicos: hack / grow / weaken
│   │                     (aceitam delay em ms pra alinhar os landings)
│   └── managers/         os loops de automação contínua
│       ├── batch-manager.js     coração do hacking: HWGW em ondas
│       └── hacknet-manager.js   compra upgrades de hacknet por ROI
├── analysis/             relatórios que rodo sob demanda
│   ├── targets-report.js, server-info.js
│   ├── hacknet-analyzer.js, prep-analyzer.js
│   └── backdoor-helper.js       monta os comandos de backdoor pras factions
├── dashboards/           overlays visuais (UI em HTML)
└── *.js                  utilitários soltos de terminal: nuke, scan, prep, ver
```

A regra que sigo é manter as `lib/` puras (sem `main`, só funções reutilizáveis) e deixar toda a lógica de orquestração nos `managers/`. Os `workers/` são propositalmente burros: só executam um `hack`/`grow`/`weaken` com um delay opcional, pra eu conseguir alinhar os landings de um batch.

## Fluxo que eu uso

```
run nuke.js                               # abre portas e dá nuke na rede toda
run scan.js top                           # vê os melhores alvos do momento
run scripts/managers/batch-manager.js     # liga o hacking HWGW automático
run scripts/managers/hacknet-manager.js   # automatiza os upgrades de hacknet
```

O `batch-manager` escolhe o alvo sozinho, faz o prep quando precisa e dispara ondas de batches HWGW sobrepostos usando toda a RAM em que tenho root. Quando quero forçar parâmetros:

```
run scripts/managers/batch-manager.js --target phantasy --fraction 0.5 --spacing 200
```

## Backdoors

Instalar backdoor não dá pra automatizar sem o Source-File 4 (Singularity), então fiz um helper que pelo menos monta o caminho pra mim:

```
run analysis/backdoor-helper.js           # status dos servidores de faction
run analysis/backdoor-helper.js CSEC      # gera a linha de connect + backdoor
```

Aí é só copiar a linha gerada e colar no terminal do jogo.

## Sobre a pasta `LEGADO/`

São meus scripts antigos, de runs passadas. Mantenho só como referência histórica — pra consultar ideias antigas e comparar com a abordagem nova. Não sincronizo nem mexo nessa pasta; o `filesync` aponta só pra `src/`.
