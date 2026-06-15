# Bitburner Scripts

Meus scripts de automação pro [Bitburner](https://github.com/bitburner-official/bitburner-src).

Voltei a jogar depois de um tempão parado e resolvi reconstruir tudo do zero, mas agora versionado e com uma arquitetura decente — cansei de ir colando código solto no editor do jogo. Escrevo tudo aqui no disco (com autocomplete e type-check da API) e sincronizo pra dentro do jogo com o [bitburner-filesync](https://github.com/bitburner-official/bitburner-filesync).

## Estrutura

```
src/
├── lib/          funções reutilizáveis, puras (rede, scoring, batches, ram, hacknet...)
├── scripts/
│   ├── workers/  hack / grow / weaken — primitivos burros, só executam
│   └── managers/ os loops de automação (root, batch, hacknet, faction, progression, reset-loop)
├── analysis/     relatórios que rodo sob demanda
└── dashboards/   uns overlays visuais em HTML
```

Tento manter as `lib/` sem nenhum `main`, só lógica reutilizável, e deixar a orquestração toda nos `managers/`. Os `workers/` são de propósito o mais simples possível: só fazem um `hack`/`grow`/`weaken` com um delay opcional, que é o que me deixa alinhar os landings de um batch.

O coração é o `batch-manager`: ele virou um scheduler multi-alvo — ranqueia os servidores pelo $/s que rendem **depois de preparados**, distribui a RAM entre os melhores até cada um saturar, e sobe um `batch-runner` por alvo (que prepara sozinho se precisar). Antes dele, o `root-manager` recompra os port openers perdidos no reset e vai dando nuke conforme o hacking sobe, pra nunca faltar alvo.

```
run nuke.js                               # abre portas e dá nuke na rede
run scan.js top                           # melhores alvos do momento
run scripts/managers/batch-manager.js     # liga o hacking
run scripts/managers/hacknet-manager.js   # hacknet reset-aware (só payback curto)
```

## Progressão (factions + augs)

Descobri que a Singularity API funciona mesmo sem o Source-File 4 — só custa 16x de RAM. Como dinheiro não é problema, dá pra comprar RAM de home e automatizar a parte chata: farmar reputação e comprar augmentation.

O `progression-manager` varre as factions em que entrei, compra todo aug que já tenho rep pra pegar (do mais caro pro mais barato, que é a ordem certa), e quando falta rep ele vai trabalhar pra faction com o menor gap. Não instala sozinho — quando esgota o que dá pra comprar, ele me avisa e espera eu rodar o `install.js`.

```
run scripts/managers/progression-manager.js   # farma rep e compra augs
run install.js                                 # confirma o reset e reinicia tudo
run install.js --nfg                           # idem, gastando o excedente em NeuroFlux
```

O `install.js` chama `installAugmentations` passando o `boot.js`, que roda depois do reset e relança a stack inteira. Como tudo isso usa Singularity, o progression-manager precisa de bastante RAM no home — uns 400-550 GB. Confiro o custo com `mem` antes.

### Ligo e esqueço

O `faction-manager` fecha o elo da autonomia: pós-reset ele re-backdoora os servidores das factions de hacking (em ordem de dificuldade), viaja pras factions de cidade e aceita os convites sozinho — enquanto o progression farma rep e compra augs por densidade de valor.

Por cima de tudo tem o `reset-loop`, que é o orquestrador de topo: ele mantém os outros managers vivos (relança qualquer um que morra) e decide sozinho a hora de instalar. A regra que usei é simples — os primeiros augs entram na fila rápido, depois o farm de rep estagna; quando a fila não cresce há um tempo, o retorno virou marginal e ele dá o reset. Aí o `boot.js` sobe ele de novo e o ciclo recomeça.

O melhor é que ele se auto-calibra: em modo `--auto` (padrão) ele roda a mesma simulação do `rep-forecast` a cada ~60s, acha o "joelho" da curva de reputação e ajusta o próprio timeout. Conforme o favor das factions sobe e o farm acelera, o ponto de reset se move junto — eu não preciso ficar mexendo no número.

```
run scripts/managers/reset-loop.js                  # autônomo e auto-calibrado
run scripts/managers/reset-loop.js --no-install     # só supervisiona, não reseta
run scripts/managers/reset-loop.js --auto=false --max-farm-min 20   # timeout fixo
```

Pra ver a conta por trás disso a qualquer momento:

```
run analysis/rep-forecast.js    # taxa de rep, ordem de compra e onde está o joelho
```

## HUD

Cansei de ficar abrindo `tail` de script em script pra saber o que tá rolando, então fiz um dashboard de verdade — uma janela em HTML/CSS, arrastável e minimizável, com abas: Geral, Scan, Hack, Hacknet, Factions e Scripts. A aba Geral tem sparklines de renda/dinheiro/hacking (séries que ele guarda em memória) e uma contagem regressiva pro próximo reset; a Scan mostra a rede inteira ranqueada por potencial, com root e backdoor.

```
run dashboards/dashboard.js
```

O truque pra não pesar: ele não calcula nada de Singularity (que custaria 16x de RAM). Cada manager publica um snapshot do próprio estado num arquivo (um barramento de telemetria em `lib/telemetry.js`), e o HUD só lê esses snapshots. Assim ele fica leve e cada aba reflete o estado real do manager — se o batch-manager não tá rodando, a aba Hack mostra "offline". O que é barato (dinheiro, RAM da rede, hacknet, scripts) ele calcula sozinho na hora.

## Backdoors

Backdoor também dá pra automatizar com Singularity, mas fiz esse helper antes de descobrir isso — ele monta o caminho pra eu colar no terminal:

```
run analysis/backdoor-helper.js           # status dos servidores de faction
run analysis/backdoor-helper.js CSEC      # cospe a linha de connect + backdoor
```

## `LEGADO/`

Meus scripts antigos, de outras runs. Deixo só como referência — não sincronizo nem mexo. O filesync aponta só pra `src/`.
