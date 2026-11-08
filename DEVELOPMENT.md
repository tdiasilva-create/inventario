# Desenvolvimento

Guia mantido: [04_DESENVOLVIMENTO_E_TESTES.md](docs/07-operacao/04_DESENVOLVIMENTO_E_TESTES.md). Ler [AGENTS.md](AGENTS.md) e a [precedência](docs/00-governanca/REGRAS_DE_PRECEDENCIA.md).

Node 24, pnpm 11.25.0, lockfile, testes isolados e builds separados. Playwright passa a ser dependência do projeto para os três testes de navegador atuais. Não usar credenciais ou seeds de produção em ensaios.

O [manual operacional](docs/07-operacao/README.md) reúne ambientes, chaves necessárias, contratos, backup e migração. A versão anterior foi [preservada como histórico](docs/99-historico/entrada-anterior-a-organizacao-2026-11-05/DEVELOPMENT.md).

## Cadastro ampliado D-068 (publicado em 06/11/2026)

Nova migração 0016_unidades_cadastro_ampliado.sql, após 0015_questionario_v3.sql. Modelo CSV/XLSX 27 colunas (12 antigas compatíveis). pnpm test inclui units, unit-catalogue, unit-files e unit-names; pnpm test:catalogue:browser verifica matriz/formulário/importação/rede com Worker e SQLite isolados. Opcional SEMED_TEST_IMPORT_FILE aponta ao CSV privado de seis núcleos para repetir o ensaio da fonte. pnpm test:panel:browser confere 17 rotas. Builds: 67 arquivos desktop e 47 coletor. Migração compartilhada e ambos os Workers publicados após autorização posterior; registro em docs/05-qualidade/PUBLICACAO_D068_2026-11-06.md. Não executar seed/reset na produção. Carga de planilhas não realizada.


D-070, 08/11/2026: painel publicado com notificações persistentes de hardware/presença, migração 0017, monitor de minuto e leitura automática em 15s. Fonte operacional: docs/04-dados-apis/MONITORAMENTO_E_NOTIFICACOES.md; aceite/publicação: docs/05-qualidade/MONITORAMENTO_2026-11-08.md. 123 testes aprovados e navegador real/isolado documentados. Não confundir telemetria com conclusão de visita ou teste físico do EXE.
