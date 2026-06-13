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

## Validar o pipeline

Execute `src/test.js` no jogo para confirmar que o sync está funcionando:

```
run test.js
```

Saída esperada: `sync ok`
