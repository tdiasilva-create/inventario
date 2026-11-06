# Inventário Tecnológico SEMED · Paço do Lumiar

Código, documentação, migrações e testes do sistema municipal de inventário. Duas interfaces compartilham a mesma persistência: o **coletor** registra visitas, equipamentos e fotografias; o **painel** recebe, consulta e analisa os dados. O agente Windows identifica computadores e envia inventário técnico, vinculado por QR à unidade e à posição do equipamento.

## Endereços em uso

- Painel: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/login
- Coletor: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/login
- Repositório: https://github.com/tdiasilva-create/inventario

As sessões são separadas. Dados, senhas e tokens de produção não fazem parte deste repositório público.

## Começar por aqui

1. [Regras e fontes](00_LEIA_ANTES_DE_TUDO.md), [AGENTS.md](AGENTS.md) e [precedência](docs/00-governanca/REGRAS_DE_PRECEDENCIA.md).
2. [Manual atual de operação e migração](docs/07-operacao/README.md).
3. [Nova estação e testes](docs/07-operacao/04_DESENVOLVIMENTO_E_TESTES.md).
4. [Checklist de transferência em TXT](docs/07-operacao/TRANSFERENCIA_E_MIGRACAO.txt).
5. [Estado comprovado e pendências](docs/07-operacao/09_ESTADO_E_PENDENCIAS.md).

## Tecnologia atual

Frontend em HTML, CSS e JavaScript com módulos nativos. Backend JavaScript em Cloudflare Workers; banco Cloudflare D1/SQLite compartilhado. Fotografias privadas no **Google Drive** via OAuth; o adaptador R2 permanece no código, mas não é o provedor configurado em produção. A API centraliza autenticação, permissões, histórico, QR e acesso às imagens.

Node 24, pnpm 11.25.0 e dependências fixadas em `pnpm-lock.yaml`. Os builds saem de `web/`; publicar somente essa pasta não fornece autenticação e APIs.

```powershell
pnpm install --frozen-lockfile
pnpm test
pnpm build:desktop
pnpm build:collector
pnpm docs:schema
```

Esses comandos são locais. Publicação e banco remoto têm procedimentos próprios no manual. Não executar scripts históricos em produção apenas porque o nome começa com `verify`.

## Organização

| Local | Conteúdo |
|---|---|
| `web/` | Interfaces, esquemas, imagens de interface e bibliotecas locais |
| `server/` | Worker, regras, persistência, fotos e agentes |
| `migrations/` | SQL incremental 0001–0015 |
| `tests/` | Testes e auxiliares isolados |
| `scripts/` | Build, ferramentas e rotinas históricas que exigem revisão |
| `config/` | Exemplos locais sem recursos reais |
| `docs/00-governanca/` | Decisões, conflitos, pendências e rastreabilidade |
| `docs/02-coleta-mobile/` | Base original preservada e especificações da coleta |
| `docs/03-painel-desktop/` | Especificações do painel |
| `docs/04-dados-apis/` | Contratos e integrações; observar decisões posteriores |
| `docs/05-qualidade/`, `docs/06-entregas/` | Relatórios e entregas; capturas privadas não versionadas |
| `docs/07-operacao/` | Arquitetura atual, operação e migração |
| `docs/99-historico/` | Guias antigos preservados |
| `design/`, `arquitetura/` | Referências e diagramas de origem |

## Limites explícitos

O questionário atual segue decisões posteriores à Base de Coleta original. Rascunho no servidor e consulta parcial são distintos da conclusão oficial. Não há offline durável homologado. Testes automatizados não substituem o ciclo físico de instalador Windows/celular. O clone **não contém bancos, fotos operacionais, segredos ou instaladores privados**. Migração só estará homologada após restauração e testes no destino.

Referência desta organização: **05/11/2026**. Não é uma nova publicação dos Workers. Não foi definida licença geral para redistribuição do projeto; licenças das dependências permanecem junto aos arquivos.
