# Inventário Tecnológico SEMED · Paço do Lumiar

Código, documentação, migrações e testes do sistema municipal de inventário. O **coletor** registra visitas, equipamentos e fotografias; o **painel** consulta e analisa os dados. O **APK único** oferece Atendimento técnico e Coleta na mesma conta, com capacidades separadas. A localização técnica continua durante a fila após o primeiro aceite conforme D114. São dois Workers e uma persistência compartilhada. O agente Windows envia inventário técnico, vinculado por QR à unidade e ao equipamento; versões compatíveis executam medições de internet solicitadas pelo root.

## Endereços em uso

- Painel: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/login
- Coletor: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/login
- Repositório: https://github.com/tdiasilva-create/inventario

As sessões são separadas. Dados, senhas e tokens de produção não fazem parte deste repositório público.

## Começar por aqui

**Nesta branch `codex/auditoria-completa-2026-11-15`:** código consolidado até D122, [pedido de auditoria ao Claude](docs/08-auditoria/2026-11-15/00_PEDIDO_AO_CLAUDE.txt), [matriz de cobertura](docs/08-auditoria/2026-11-15/01_ESCOPO_E_CRITERIOS.md) e [estado atual](docs/07-operacao/13_ESTADO_ATUAL_D122.md). A [análise de migração física](docs/09-migracao-servidor-fisico/README.md) permanece proposta, sem corte realizado. `main` não deve ser presumida idêntica à versão desta auditoria.

1. [Regras e fontes](00_LEIA_ANTES_DE_TUDO.md), [AGENTS.md](AGENTS.md) e [precedência](docs/00-governanca/REGRAS_DE_PRECEDENCIA.md).
2. [Manual atual de operação e migração](docs/07-operacao/README.md).
3. [Nova estação e testes](docs/07-operacao/04_DESENVOLVIMENTO_E_TESTES.md).
4. [Checklist de transferência em TXT](docs/07-operacao/TRANSFERENCIA_E_MIGRACAO.txt).
5. [Estado comprovado e pendências](docs/07-operacao/09_ESTADO_E_PENDENCIAS.md).
6. [Auditoria de funcionamento e lógica](docs/08-auditoria/README.md): mapa de regras, roteiro TXT, testes e versões publicadas.
7. [Estado D-110 e dependências de migração](docs/07-operacao/11_ESTADO_ATUAL_D110.md), [mapa funcional do código](docs/07-operacao/12_MAPA_CODIGO_E_FLUXOS.md) e [índice gerado de código/API](docs/07-operacao/gerado/CODIGO_E_ROTAS.md).
8. [Branch de análise de migração para servidor físico](https://github.com/tdiasilva-create/inventario/tree/codex/analise-migracao-servidor-fisico/docs/09-migracao-servidor-fisico): proposta detalhada, decisões, testes de aceite, corte e recuperação; nenhuma migração de produção executada.

## Tecnologia atual

Frontend em HTML, CSS e JavaScript; painel empacotado com esbuild e arquivos versionados. Backend JavaScript em Cloudflare Workers; banco Cloudflare D1/SQLite compartilhado. Fotografias privadas no **Google Drive** via OAuth; miniaturas derivadas limitadas no D1 (D-072). O adaptador R2 permanece no código, mas não é o provedor configurado em produção. A API centraliza autenticação, permissões, histórico, QR e acesso às imagens. Android nativo Java/WebView; OSRM calcula trajetos pelas ruas. KV guarda somente o cache do medidor Analytics D1.

Node 24, pnpm 11.25.0 e dependências fixadas em `pnpm-lock.yaml`. Os builds saem de `web/`; publicar somente essa pasta não fornece autenticação e APIs.

```powershell
pnpm install --frozen-lockfile
pnpm test
pnpm build:desktop
pnpm build:collector
pnpm docs:schema
pnpm docs:code
pnpm docs:txt
pnpm check:docs
```

Esses comandos são locais. Publicação e banco remoto têm procedimentos próprios no manual. Não executar scripts históricos em produção apenas porque o nome começa com `verify`.

## Organização

| Local | Conteúdo |
|---|---|
| `web/` | Interfaces, esquemas, imagens de interface e bibliotecas locais |
| `server/` | Worker, regras, persistência, fotos e agentes |
| `migrations/` | 31 migrações SQL incrementais, 0001–0031 |
| `android/technician/` | Código do APK exclusivo de atendimento; assinatura privada fora do Git |
| `tests/` | Testes e auxiliares isolados |
| `scripts/` | Build, ferramentas e rotinas históricas que exigem revisão |
| `config/` | Exemplos locais sem recursos reais |
| `docs/00-governanca/` | Decisões, conflitos, pendências e rastreabilidade |
| `docs/02-coleta-mobile/` | Base original preservada e especificações da coleta |
| `docs/03-painel-desktop/` | Especificações do painel |
| `docs/04-dados-apis/` | Contratos e integrações; observar decisões posteriores |
| `docs/05-qualidade/`, `docs/06-entregas/` | Relatórios e entregas; capturas privadas não versionadas |
| `docs/07-operacao/` | Arquitetura atual, operação e migração |
| `docs/08-auditoria/` | Entrada para revisão independente de funcionamento e lógica |
| `docs/99-historico/` | Guias antigos preservados |
| `design/`, `arquitetura/` | Referências e diagramas de origem |

## Limites explícitos

O questionário atual segue decisões posteriores à Base de Coleta original. Rascunho no servidor e consulta parcial são distintos da conclusão oficial. Não há offline durável homologado. Testes automatizados não substituem o ciclo físico de instalador Windows/celular. O clone **não contém bancos, fotos operacionais, segredos ou instaladores privados**. Migração só estará homologada após restauração e testes no destino.

Atualização documental: **12/11/2026, D-110**, incluindo roteiros/GPS, avatares, relatórios semanais, medidor D1 e redução de leituras. O catálogo reproduzível contém 88 tabelas de aplicação, 58 índices explícitos, duas views e 68 triggers. O pacote distingue código local, publicação real e homologação física. Atualizar o GitHub não publica os Workers nem instala um servidor físico. Não foi definida licença geral para redistribuição do projeto; licenças das dependências permanecem junto aos arquivos.
