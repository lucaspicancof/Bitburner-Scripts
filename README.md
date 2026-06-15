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

## Backdoors

Backdoor também dá pra automatizar com Singularity, mas fiz esse helper antes de descobrir isso — ele monta o caminho pra eu colar no terminal:

```
run analysis/backdoor-helper.js           # status dos servidores de faction
run analysis/backdoor-helper.js CSEC      # cospe a linha de connect + backdoor
```

## `LEGADO/`

Meus scripts antigos, de outras runs. Deixo só como referência — não sincronizo nem mexo. O filesync aponta só pra `src/`.
