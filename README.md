# Bitburner Scripts

Scripts para automação da run atual de Bitburner, sincronizados via `bitburner-filesync`.

## Como iniciar o sync

Na raiz do repositório:

```
npx bitburner-filesync
```

O processo fica em watch e envia para o jogo qualquer arquivo alterado dentro de `src/`.

## Como conectar pelo jogo

1. No jogo: **Options → Remote API**
2. Definir a porta: **12525**
3. Clicar em **Connect**

Ao conectar, todos os arquivos de `src/` são enviados automaticamente (`pushAllOnConnection: true`).

## Mapeamento src/ → home do jogo

| Diretório local          | Diretório no jogo (home)  |
|--------------------------|---------------------------|
| `src/lib/`               | `lib/`                    |
| `src/scripts/`           | `scripts/`                |
| `src/scripts/managers/`  | `scripts/managers/`       |
| `src/scripts/workers/`   | `scripts/workers/`        |
| `src/analysis/`          | `analysis/`               |
| `src/dashboards/`        | `dashboards/`             |

## Regra sobre LEGADO/

A pasta `LEGADO/` contém os scripts da run anterior e é **somente leitura / referência**.

- Não é sincronizada com o jogo (`scriptsFolder` aponta para `src/`, não para a raiz).
- Não deve ser editada, movida ou deletada.
- Use-a apenas para consultar implementações anteriores ao portar lógica para `src/`.

## Arquitetura

```
src/
├── lib/                  bibliotecas compartilhadas (puras, sem main)
│   ├── network.js        scanAll + analyzeServer
│   ├── scoring.js        modelo de score econômico / prep / ready
│   ├── targets.js        rankTargets — seleção de alvos
│   ├── hgw.js            planejamento de batch HWGW (usa Formulas API)
│   ├── ram.js            pool de RAM distribuída + dispatch de workers
│   ├── pathfind.js       BFS de rotas (backdoor)
│   ├── hacknet.js        ROI de upgrades de hacknet
│   └── prep.js           cálculo de threads de prep (consumido por análises)
├── scripts/
│   ├── workers/          primitivos atômicos: hack / grow / weaken
│   │                     (aceitam delay em ms para alinhar landings de batch)
│   └── managers/         loops de automação contínua
│       ├── batch-manager.js    ← CORE: hacking HWGW com ondas sobrepostas
│       └── hacknet-manager.js  compra de upgrades de hacknet por ROI
├── analysis/             ferramentas de relatório (rodar sob demanda)
│   ├── targets-report.js, server-info.js
│   ├── hacknet-analyzer.js, prep-analyzer.js
│   └── backdoor-helper.js      gera comandos connect+backdoor p/ factions
├── dashboards/           overlays visuais (UI HTML)
└── *.js                  utilitários de terminal: nuke, scan, prep, ver
```

## Uso — fluxo principal

```
run nuke.js                          # abre portas + nuke em toda a rede
run scan.js top                      # mostra os melhores alvos
run scripts/managers/batch-manager.js   # inicia o hacking HWGW automático
run scripts/managers/hacknet-manager.js # automatiza upgrades de hacknet
```

O `batch-manager` escolhe o alvo automaticamente, faz prep quando necessário e
dispara ondas de batches HWGW sobrepostos usando toda a RAM com root. Flags:

```
run scripts/managers/batch-manager.js --target phantasy --fraction 0.5 --spacing 200
```

## Backdoors (manual — exige SF4 para automatizar)

```
run analysis/backdoor-helper.js              # status dos servidores de faction
run analysis/backdoor-helper.js CSEC         # gera os comandos connect+backdoor
```

Copie a linha gerada e cole no terminal do jogo.

## Regra sobre `allowDeletingFiles`

Está em `true` no `filesync.json`: deletar um arquivo de `src/` no disco também
o remove do jogo na próxima sincronização. Reinicie o filesync após deleções.
