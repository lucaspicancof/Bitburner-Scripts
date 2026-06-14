# Bitburner Scripts

Meus scripts de automação pro [Bitburner](https://github.com/bitburner-official/bitburner-src).

Voltei a jogar depois de um tempão parado e resolvi reconstruir tudo do zero, mas agora versionado e com uma arquitetura decente — cansei de ir colando código solto no editor do jogo. Escrevo tudo aqui no disco (com autocomplete e type-check da API) e sincronizo pra dentro do jogo com o [bitburner-filesync](https://github.com/bitburner-official/bitburner-filesync).

## Estrutura

```
src/
├── lib/          funções reutilizáveis, puras (rede, scoring, batches, ram, hacknet...)
├── scripts/
│   ├── workers/  hack / grow / weaken — primitivos burros, só executam
│   └── managers/ os loops de automação (batch-manager, hacknet-manager)
├── analysis/     relatórios que rodo sob demanda
└── dashboards/   uns overlays visuais em HTML
```

Tento manter as `lib/` sem nenhum `main`, só lógica reutilizável, e deixar a orquestração toda nos `managers/`. Os `workers/` são de propósito o mais simples possível: só fazem um `hack`/`grow`/`weaken` com um delay opcional, que é o que me deixa alinhar os landings de um batch.

O coração é o `batch-manager`: ele escolhe o alvo, faz o prep quando precisa e dispara ondas de batches HWGW sobrepostos usando toda a RAM em que tenho root.

```
run nuke.js                               # abre portas e dá nuke na rede
run scan.js top                           # melhores alvos do momento
run scripts/managers/batch-manager.js     # liga o hacking
run scripts/managers/hacknet-manager.js   # cuida do hacknet
```

## Backdoors

Não dá pra automatizar backdoor sem o Source-File 4, então fiz um helper que pelo menos monta o caminho:

```
run analysis/backdoor-helper.js           # status dos servidores de faction
run analysis/backdoor-helper.js CSEC      # cospe a linha de connect + backdoor
```

## `LEGADO/`

Meus scripts antigos, de outras runs. Deixo só como referência — não sincronizo nem mexo. O filesync aponta só pra `src/`.
