# Plano de Melhorias — Automação

Documento de preocupações e soluções em etapas, a partir do comportamento observado
nas runs (saves 4 e 6) e das ideias levantadas. Não é README — é planejamento interno.

> **Status: implementado (15/06/2026).** Todos os 4 pontos foram codados:
> `root-manager` (openers + nuke recorrente), `potentialScore`, batch multi-alvo
> (`batch-manager` scheduler + `batch-runner`), `faction-manager` (+`lib/factions`),
> e estratégia de valor de aug (`lib/aug-value` + rewire do progression). O documento
> fica como registro do raciocínio.

## Contexto que embasa tudo

Verificado no save fresco (17s pós-install — estado real imediatamente após o reset):

- **Skills resetam pra ~1** (hacking voltou a 2). Augs dão multiplicadores; re-sobe rápido.
- **Root é perdido em todos os servidores.** Só 14/72 estavam rooteados logo após o boot.
- **Programas: só `Formulas.exe` persiste de verdade.** O `BruteSSH` que reaparece NÃO é
  persistência — é recompensa da aug **CashRoot Starter Kit** ($1M + BruteSSH no install).
  - Mapa aug → opener no reset: **CashRoot → BruteSSH**, **BitRunners Neurolink → FTPCrack +
    relaySMTP**, **PCMatrix → DeepscanV1 + AutoLink**. `HTTPWorm` e `SQLInject` **nunca** vêm
    de aug → sempre comprar/criar.
  - Hoje ele só tem CashRoot → começa com **1 opener** (BruteSSH) → nukea só ≤1 porta (14/72).
  - Implicação estratégica: pegar **BitRunners Neurolink** faria o reset já começar com 3
    openers. Mas o root-manager **não pode assumir** nenhum — tem que checar os 5 e comprar
    os que faltarem.
  - `Formulas.exe` persiste → a stack baseada em `ns.formulas.*` sobrevive ao reset.
- **TOR persiste** (servidor `darkweb` continua) → dá pra recomprar programas.
- **Home persiste**: 256 TB de RAM, 6 cores. Augs acumulam (34 instaladas).
- **Factions zeradas** (0 joined, 0 convites) → confirma o ponto 2.
- **Hacknet wipado** → confirma a estratégia reset-aware.
- O `boot.js` roda `nuke.js` **uma vez** e sobe a stack.

> Por que a conclusão anterior ("programas persistem") estava errada: o save 6 examinado
> antes estava ~5h dentro da run, com os openers **já recomprados**. O save fresco revela o
> estado real logo após o reset. Isso valida a ideia original do ponto 1b.

## Roadmap (ordem recomendada)

| Prioridade | Item | Por quê |
|---|---|---|
| 1 | **Faction-manager** (ponto 2) | Sem ele, a run da noite inteira não farmou nada. Maior alavanca. |
| 2 | **Root-manager + score por potencial** (ponto 1) | Faz o batch progredir após o reset em vez de travar no foodnstuff. |
| 3 | **Batch multi-alvo** (ponto 4) | Multiplica a renda; usa as 256 TB de verdade. |
| 4 | **Estratégia de valor de aug** (ponto 3) | Refina um sistema que já funciona. Otimização. |

Fundações compartilhadas (1 e 4 dependem): **score de potencial preparado** e o
**root-manager**. Vale construí-las primeiro.

---

## 1. Batch travado no foodnstuff após o reset

### Problema
Ao reiniciar a run, o batch-manager fica infinitamente farmando `foodnstuff`, ignorando
alvos muito melhores (`harakiri-sushi`, `phantasy`, `omega-net`).

### Causa raiz (duas, ambas reais)
**(a) Single-target + ranqueamento por estado ATUAL.**
O `pickTarget` usa `rankTargets`, cujo `effectiveScore` pondera `moneyRatio` e `prepCost`.
Um `omega-net` despreparado tem `moneyRatio` baixo e `prepCost` alto → score baixo → nunca
é escolhido → nunca é preparado → segue com score baixo. Um `foodnstuff` já preparado tem
score alto e é farmado pra sempre. **Galinha-e-ovo**: o que daria mais nunca recebe o prep
que o tornaria o melhor.

**(b) Openers perdidos + nuke one-shot.** Você estava certo: pós-reset sobra **1 opener**
(BruteSSH). Sem recomprar FTPCrack/relaySMTP/HTTPWorm/SQLInject, só dá pra nukear servidores
de ≤1 porta (14/72). Além disso o `boot.js` roda `nuke.js` **uma vez** com hacking baixo →
conforme o hacking sobe e/ou você recompra openers, novos servidores ficam nukeáveis, mas
**ninguém roda nuke de novo** → eles nunca recebem root → o batch nunca os vê. Resultado: o
batch fica preso nos poucos servidores iniciais, e o `foodnstuff` (preparado e barato) vira
o "melhor".

> Crédito: sua ideia 1b estava certa — re-desbloquear os port openers **é** um objetivo
> inicial do loop. Eu havia concluído errado que persistiam. O root-manager precisa recomprá-los.

### Solução
1. **Root-manager recorrente** — loop leve que, a cada ~10s:
   - **Checa os 5 openers via `fileExists`** (não assume nenhum — o que você tem depende de
     quais augs possui). Compra os faltantes via darkweb (TOR persiste), na ordem de custo
     conforme o dinheiro permite: BruteSSH ($500k) → FTPCrack ($1.5M) → relaySMTP ($5M) →
     HTTPWorm ($30M) → SQLInject ($250M). Cada opener destrava uma faixa de servidores.
   - Dá nuke em todo servidor agora alcançável (openers suficientes) sem root.
   - É barato e fecha o gargalo nos primeiros minutos do reset (o batch gera os ~$286M dos
     openers rapidinho).
2. **Score por POTENCIAL preparado** — separar "o que hackear agora" de "o que preparar a
   seguir". Ranquear candidatos pelo `$/s potencial quando preparado`
   (`maxMoney * hackPct * chance / weakenTime`), ignorando o estado atual. Assim `omega-net`
   sobe no ranking e ganha prioridade de prep.
3. **Preparar o melhor-potencial em paralelo** ao hackear o melhor-pronto (ponte pro ponto 4).

### Etapas
- **1.1** Criar `scripts/managers/root-manager.js` (compra openers faltantes + nuke recorrente). Adicionar ao `reset-loop` (supervisionado) e ao `boot.js`.
- **1.2** Adicionar `potentialScore(ns, server)` em `lib/scoring.js` (estado preparado).
- **1.3** Fazer o batch usar `potentialScore` pra escolher o que preparar, separado do que hackear.

---

## 2. Loop não entra em factions automaticamente (falha grave)

### Problema
O loop rodou a noite toda, resetou, e **não entrou em nenhuma faction** → não farmou rep
nem augs enquanto você dormia. O `progression-manager` só trabalha/compra pra factions **já
ingressadas**; ele não faz `joinFaction` nem re-backdoora servidores.

### Causa raiz
Backdoors são perdidos no reset (e dão os convites das factions de hacking). Ninguém na
stack re-backdoora nem aceita convites pós-reset. A automação assume factions já dentro.

### Solução
**Faction-manager** rodando em paralelo ao progression. Requisitos reais (doc oficial):

**Factions de hacking — sem conflito, melhores augs. Ordem por backdoor:**
- CyberSec → backdoor `CSEC` (hack ~51)
- NiteSec → backdoor `avmnite-02h` (hack ~202)
- The Black Hand → backdoor `I.I.I.I` (hack ~340)
- BitRunners → backdoor `run4theh111z` (hack ~505) — dá **BitRunners Neurolink** (FTPCrack+relaySMTP)

**Factions úteis sem combate:**
- Netburners: hack 80 + hacknet (levels 100/RAM 8/cores 4). Trivial, ele tem hacknet.
- Tian Di Hui: $1M + hack 50 + viajar p/ Chongqing/New Tokyo/Ishima. Dá **Neuroreceptor
  Management Implant** (remove penalidade de focus=false → acelera todo o farm de rep).
- Sector-12: estar em Sector-12 + $15M. Dá **CashRoot** (BruteSSH no reset).
- Aevum: estar em Aevum + $40M. Dá **PCMatrix**. (S-12 e Aevum **não** são inimigas → pode as duas.)

**Regras de automação:**
- Re-backdoora (`installBackdoor`) em ordem de dificuldade quando tiver root+hacking; aceita
  convites (`checkFactionInvitations` → `joinFaction`). Viaja (`travelToCity`) p/ as factions
  de cidade quando o dinheiro permitir.
- **Pular** as de combate (Slum Snakes, Tetrads, Silhouette, Speakers, Dark Army, Syndicate):
  exigem str/def/dex/agi que a run de hacking não treina.
- **Conflitos de cidade**: cada city faction exclui as outras cidades; S-12+Aevum são
  compatíveis. Usar allowlist consciente — não joinar cegamente.
- Roda em paralelo: enquanto tenta entrar/backdoorar umas, o progression farma nas já dentro.

> **Endgame BN1** (registrar como meta de longo prazo): Daedalus (30 augs + $100b + hack 2500)
> → comprar **The Red Pill** → backdoor `w0r1d_d43m0n` → destrói o BitNode. É pra onde o loop
> deve eventualmente convergir.

### Etapas
- **2.1** `lib/factions.js` — tabela de factions-alvo: tipo (hacking/cidade/netburners), servidor de backdoor, requisitos, augs pendentes, "finalizada?", e conflitos de cidade.
- **2.2** `scripts/managers/faction-manager.js` — loop: backdoor em ordem de dificuldade + viajar + aceitar convites + joinar (respeitando conflitos e a allowlist; pulando combate).
- **2.3** Integrar ao `reset-loop` (CHILDREN, supervisionado) e ao `boot.js`.
- **2.4** Depende do **root-manager** (1.1) pra ter root/openers nos servidores de backdoor.

---

## 3. Estratégia de compra de aug (sempre a de menor rep)

### Problema
O `progression-manager` sempre busca o aug de **menor reputação necessária**
(`nextRepTarget`). Isso minimiza o tempo até o *próximo* aug, mas ignora o **valor** do aug
e a escalada de preço (cada compra ×1.9 nos restantes).

### Análise
- Pra você, **dinheiro é praticamente infinito** ($38T) → a escalada de preço quase não
  importa em termos de poder comprar. O **gate real é tempo-de-rep**.
- Logo a otimização certa não é "menor rep", é **valor por tempo-de-rep**: priorizar augs
  com maior impacto (multiplicadores) por unidade de rep a farmar.
- Sua ideia (focar no mais caro se a ETA for aceitável) está no caminho — a generalização é
  uma **densidade de valor**: `valor(aug) / repReq`, com uma guarda de ETA (não perseguir um
  aug de 10h de rep) usando o `lib/forecast`.

### Solução
- Calcular `valor(aug)` via `ns.singularity.getAugmentationStats(aug)` (retorna os
  multiplicadores), com **pesos configuráveis** focados na estratégia (ex: `hacking`,
  `hacking_money`, `hacking_speed`, `faction_rep`, `hacknet_node_money`).
- Selecionar o alvo de farm por **densidade de valor** (`valor / repReq`), com guarda de ETA
  (descartar alvos cuja rep levaria mais que X — reaproveita o joelho do forecast).
- **Cheap wins**: sempre comprar de imediato os augs cuja rep você já alcançou (valor grátis),
  independente da densidade.
- **Bônus para augs estratégicas** (valor além de multiplicadores — peso extra no score):
  - **Neuroreceptor Management Implant** (Tian Di Hui): remove a penalidade de `focus=false`
    → acelera TODO farm de rep futuro. Provável melhor ROI composto da run.
  - **Program-granters** (BitRunners Neurolink, PCMatrix, CashRoot): cada reset passa a
    começar com mais openers → menos trabalho do root-manager, ramp pós-reset mais rápido.
  - **The Red Pill** (Daedalus): caminho do endgame; pegar assim que Daedalus abrir.
- NeuroFlux como filler final (já coberto pelo `install --nfg`).

### Etapas
- **3.1** `lib/aug-value.js` — `value(ns, aug)` via `getAugmentationStats` + pesos default (foco hacking) e overridable.
- **3.2** Trocar `nextRepTarget` por seleção por densidade de valor com guarda de ETA (usa `lib/forecast`).
- **3.3** Manter compra imediata dos augs já alcançáveis (cheap wins).
- **3.4** Expor os pesos como flags pra ajustar a estratégia sem editar código.

---

## 4. Batch atacando múltiplos alvos

### Problema
O batch ataca **um alvo por vez**. Você rodou 5 instâncias na mão (phantasy, harakiri-sushi,
alpha-ent, catalyst, rho-construction) pra usar a RAM. Quer que ele escolha e ataque vários
alvos sozinho, conforme RAM e nível de hack.

### Análise
- Rodar N instâncias independentes é frágil: elas **brigam pelo mesmo pool de RAM** sem
  coordenação (uma engole a RAM que a outra ia usar).
- Cada alvo tem uma **concorrência útil máxima** (`weakenTime / (4*spacing)` batches em voo)
  e um **RAM por batch**. Acima disso, jogar mais RAM no mesmo alvo não rende mais — ele
  **satura**. O ganho está em distribuir a RAM entre vários alvos de alto potencial.

### Solução
**Scheduler único** que dona o pool de RAM e distribui batches entre os melhores alvos:
1. Ranqueia alvos por **$/s potencial preparado** (fundação compartilhada com o ponto 1).
2. Para cada alvo, calcula o ponto de saturação (concorrência × RAM/batch).
3. Aloca a RAM **gulosa**: enche o melhor alvo até saturar, depois o próximo, etc. — maximiza
   o $/s total.
4. **Prepara em paralelo** os próximos alvos de maior potencial ainda não prontos.
5. Refatorar o batch-manager: de loop single-target → um scheduler que orquestra runners por
   alvo (a lógica de onda atual, parametrizada por alvo e por orçamento de RAM).

### Plano de RAM (home / pservs)
- Com 256 TB, RAM sobra — o foco é **usar bem**, não adquirir. Mesmo assim, um plano de
  compra por ROI marginal vale: comprar RAM (home up / pserv) quando o `$/s` extra que ela
  destrava por $ gasto for bom. Útil em runs futuras com home menor.

### Etapas
- **4.1** `potentialScore` (mesmo de 1.2).
- **4.2** Refatorar `batch-manager` em scheduler único: pool de RAM → aloca batches entre top-N alvos até saturar cada um.
- **4.3** Prep paralelo dos próximos alvos de maior potencial.
- **4.4** (Opcional) `lib/ram-plan.js` + lógica de compra de RAM/pserv por ROI marginal de $/s.

---

## Notas de API (confirmadas no NetScriptDefinitions.d.ts v3.0.1)

- `ns.singularity.getAugmentationStats(name): Multipliers` — valor de aug (ponto 3).
- `ns.singularity.purchaseProgram(name)` / `getDarkwebPrograms()` — comprar openers (ponto 1).
- `ns.singularity.installBackdoor()`, `joinFaction`, `checkFactionInvitations` — faction-manager (ponto 2).
- `ns.getServerNumPortsRequired`, `ns.getServerRequiredHackingLevel` — root-manager / ordenação.
- Todas de Singularity custam 16x RAM sem SF4 — irrelevante com 256 TB de home.
