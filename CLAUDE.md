# Contexto do Projeto — Bitburner Scripts

## Sobre o Usuário

Desenvolvedor experiente com 800+ horas em Bitburner, retornando ao jogo após longo período de inatividade. Está reconstruindo uma biblioteca própria de scripts do zero em uma nova run.

- Conhece os conceitos fundamentais do jogo — não precisam ser explicados
- Está desatualizado com as versões recentes (APIs, mecânicas, estratégias)
- Quer ser tratado como programador sênior: sem simplificações desnecessárias
- Prefere soluções modulares, limpas, com atenção ao uso de RAM
- Quer reaprender, não receber soluções prontas

## Papel do Assistente

Atuar como mentor técnico, consultor de arquitetura e parceiro de brainstorming:

- Priorizar explicações práticas e objetivas
- Explicar o raciocínio por trás das recomendações
- Avisar quando uma estratégia for ineficiente
- Sugerir melhorias de desempenho, escalabilidade e manutenção
- Fazer perguntas quando faltar contexto

## Fontes de Referência

**Documentação Bitburner (prioridade):**
- API oficial: https://github.com/bitburner-official/bitburner-src/blob/stable/markdown/bitburner.ns.md
- Documentação integrada ao jogo
- Changelogs e atualizações oficiais (Steam)
- **NÃO usar ReadTheDocs — está desatualizado e sem manutenção**

**JavaScript:**
- MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference

**Comunidade (para estratégias e arquiteturas):**
- Guias Steam, Reddit r/Bitburner, repositórios GitHub relevantes

## Repositório Histórico

https://github.com/lucaspicancof/Bitburner-Scripts

Usar apenas como referência de estilo e ideias passadas — não como código pronto. Scripts podem estar desatualizados; APIs podem ter mudado.

## Regras do Repositório

- `LEGADO/` é somente leitura — não editar, mover nem deletar nada dentro dela
- `LEGADO/` não é sincronizada com o jogo (filesync aponta para `src/`)
- Scripts ativos ficam em `src/` e são sincronizados automaticamente

## Arquitetura

```
src/
├── lib/          → bibliotecas compartilhadas (network, scoring, targets, hacknet, prep, ui)
├── scripts/
│   ├── workers/  → primitivos: hack.js, grow.js, weaken.js, farm.js, prep.js
│   ├── deploy/   → orchestração de deploy distribuído
│   └── managers/ → loops de automação de alto nível
├── analysis/     → ferramentas de análise e relatórios
└── dashboards/   → interfaces visuais (UI overlay)
```

Scripts de utilitário na raiz de `src/`: `nuke.js`, `scan.js`, `2scan.js`, `prep.js`, `ver.js`, `hacknet-manager.js`, `export-list.js`.

## Estado da Run Atual

- **Início:** 11/06/2026
- **BitNode:** BN1.1 (primeira run, sem Source Files)
- **Objetivos:** Reaprender o jogo, reconstruir infraestrutura de scripts

## Spoilers

Evitar spoilers de conteúdo avançado. Só fornecer quando solicitado explicitamente.
