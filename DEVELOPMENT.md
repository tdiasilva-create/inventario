# Desenvolvimento

Guia mantido: [04_DESENVOLVIMENTO_E_TESTES.md](docs/07-operacao/04_DESENVOLVIMENTO_E_TESTES.md). Ler [AGENTS.md](AGENTS.md) e a [precedência](docs/00-governanca/REGRAS_DE_PRECEDENCIA.md).

Node 24, pnpm 11.25.0, lockfile, testes isolados e builds separados. Playwright é dependência do projeto para os nove roteiros de navegador mantidos na CI. Não usar credenciais ou seeds de produção em ensaios.

Preparação para auditoria de 08/11/2026: [guia e matriz de regras](docs/08-auditoria/README.md), [roteiro TXT](docs/08-auditoria/ROTEIRO_AUDITORIA.txt) e [resultados da verificação](docs/08-auditoria/VERIFICACAO_2026-11-08.md). Não equivale a parecer de auditor independente. O histórico das entregas abaixo preserva quantidades e versões da época.

O [manual operacional](docs/07-operacao/README.md) reúne ambientes, chaves necessárias, contratos, backup e migração. A versão anterior foi [preservada como histórico](docs/99-historico/entrada-anterior-a-organizacao-2026-11-05/DEVELOPMENT.md).

## Cadastro ampliado D-068 (publicado em 06/11/2026)

Nova migração 0016_unidades_cadastro_ampliado.sql, após 0015_questionario_v3.sql. Modelo CSV/XLSX 27 colunas (12 antigas compatíveis). pnpm test inclui units, unit-catalogue, unit-files e unit-names; pnpm test:catalogue:browser verifica matriz/formulário/importação/rede com Worker e SQLite isolados. Opcional SEMED_TEST_IMPORT_FILE aponta ao CSV privado de seis núcleos para repetir o ensaio da fonte. pnpm test:panel:browser confere 17 rotas. Builds: 67 arquivos desktop e 47 coletor. Migração compartilhada e ambos os Workers publicados após autorização posterior; registro em docs/05-qualidade/PUBLICACAO_D068_2026-11-06.md. Não executar seed/reset na produção. Carga de planilhas não realizada.


D-070, 08/11/2026: painel publicado com notificações persistentes de hardware/presença, migração 0017, monitor de minuto e leitura automática em 15s. Fonte operacional: docs/04-dados-apis/MONITORAMENTO_E_NOTIFICACOES.md; aceite/publicação: docs/05-qualidade/MONITORAMENTO_2026-11-08.md. 123 testes aprovados e navegador real/isolado documentados. Não confundir telemetria com conclusão de visita ou teste físico do EXE.


D-071: pnpm test:operations:browser testa central/frota contra Worker e SQLite isolados; pnpm test inclui service-desk.test.mjs. Rotas /computadores e /demandas usam operations.html; migracao 0018 antes do deploy desktop. Nao semear dados de teste em D1 oficial.

Regressão de navegação D-071: executar `pnpm build:desktop` e `pnpm test:panel-navigation:browser`. `desktopPageRoutes` contém somente páginas renderizadas por desktop.js; `pageRoutes` contém todos os links do menu. Páginas de outro documento não devem ser interceptadas pelo roteador interno. Testar sempre entrada pelo menu, além do URL direto.

D-073/Fase 3: `pnpm test:blocks:browser` verifica mapa/DOM preservados, fachada antiga, 57 fotos paginadas, cache/Atualizar e exportação completa de 58 fichas em CSV/XLSX. `pnpm test` inclui permissões/separação parcial e consultas somente leitura. Executar após `pnpm build:desktop`; fixtures somente em memória, imagens sintéticas, sem credenciais reais. [Aceite e escopo](docs/05-qualidade/CORRECOES_PRODUCAO_FASE_3_2026-11-09.md).

D-090, 10/11/2026: migração aditiva 0025 e campos escolares opcionais. Modelo 55 colunas compatível com 12/27. Executar pnpm test:school-registration:browser e regressões catálogo/identidade/navegação; pnpm test cobre migração, validação, versões, permissões e importação. Ambos os Workers usam o mesmo esquema. [Contrato](docs/04-dados-apis/CADASTRO_ESCOLAS_D090.md), [publicação](docs/05-qualidade/CADASTRO_ESCOLAS_2026-11-10.md). Nenhuma importação oficial foi feita.
