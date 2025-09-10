# Bitburner-Scripts

Coleção de scripts para o jogo Bitburner (NS2) focada em:

- Automação de hack de servidores.
- Compra e upgrade de nós do Hacknet.
- Bot simples para o mercado de ações (Stock Market).
- Utilitários para varredura de servidores e impressão de requisitos.
- Soluções automatizadas para alguns Coding Contracts.
- Scripts para facilitar instalação de backdoors.

Todas as mensagens dos scripts principais estão em PT‑BR e vários arquivos possuem comentários explicativos para facilitar manutenção e ajustes.

## Requisitos

- Bitburner (NS2 – JavaScript/TypeScript typings integrados do jogo).
- Alguns scripts que usam `ns.singularity.*` exigem Source‑File 4 (Singularity) no jogo.
- Espaço em RAM suficiente para executar cada script (varia por arquivo).

## Estrutura do Repositório

- `autohacknet.js`: compra novos nós do Hacknet e faz upgrade de nível, RAM e núcleos até alvos definidos.
- `Stock/stockbot.js`: bot de ações básico com thresholds de forecast, volatilidade e caixa mínimo.
- `Hack/`
  - `hack.js`: hack contínuo no servidor atual (onde o script está rodando).
  - `hackfhome.js`: hack contínuo em um alvo remoto a partir do `home` (ou de onde executar).
  - Demais variantes de automação/hack para diferentes estratégias (`main.js`, `main208.js`, etc.).
- `Solver/autosolver.js`: varre servidores, identifica `.cct` e tenta resolver alguns tipos de contratos (stock trader, paths, IPs, etc.).
- `getservers.js`: utilitário para listar/varrer todos os servidores (usado pelo autosolver e pode ser útil em outros scripts).
- `Backdoor/`
  - `ib.js`: instala backdoor no servidor atual via Singularity.
  - `mainib.js`: faz deploy de `ib.js` em servidores com root e RAM suficiente; tenta executar de lá.
  - `a.js`: automação de terminal para conectar e instalar backdoor em sequência.
- `printlLevel.js`: imprime nível de hack requerido e RAM máxima para um conjunto de servidores comuns.

## Como Usar

- Hacknet
  - Compre e faça upgrade automático de nós:
    - `run autohacknet.js <nodes> <level> <RAM> <cores>`
    - Exemplo: `run autohacknet.js 10 100 32 10`
    - Observações: `level` ∈ [1..200], `RAM` ∈ {1,2,4,8,16,32,64}, `cores` ∈ [1..16]. O script espera ter dinheiro disponível, aguardando quando necessário.

- Mercado de Ações
  - Bot simples de compra/venda:
    - `run Stock/stockbot.js`
    - Ajuste no arquivo os limiares: `forecastThresh` (padrão 0.65), `minimumCash` (padrão 50m). Compra apenas com volatilidade ≤ 5%.

- Hack de Servidores
  - Hack local (no servidor conectado):
    - Conecte no alvo e rode: `run Hack/hack.js`
  - Hack remoto a partir do `home` (ou outro):
    - `run Hack/hackfhome.js <servidor>`

- Coding Contracts
  - Varredura e solução automática de alguns tipos:
    - `run Solver/autosolver.js`
    - Mostra no terminal cada contrato encontrado e se foi resolvido.

- Backdoor
  - Instalar backdoor no servidor atual (requer Singularity):
    - `run Backdoor/ib.js`
  - Distribuir `ib.js` e executar em máquinas com root/RAM:
    - `run Backdoor/mainib.js`
    - Observação: o script referencia `main2.js` ao final; ajuste/remova essa linha se não existir no seu ambiente.
  - Automação via terminal para conectar e backdoor em sequência:
    - `run Backdoor/a.js`
    - Observação: envia comandos pelo terminal do jogo; aguarde a conclusão.

- Utilitários
  - Listar níveis de hack e RAM de servidores comuns:
    - `run printlLevel.js`

## Dicas e Observações

- Caixa mínimo no bot de ações: o script preserva `minimumCash` antes de comprar novas ações.
- Unidades inteiras de ação: a API trata ações como inteiros; caso veja valores fracionários, a compra será truncada/ajustada internamente.
- Scripts de backdoor com Singularity exigem SF‑4 e privilégios adequados.
- Sempre monitore a RAM disponível antes de disparar vários scripts em paralelo.
