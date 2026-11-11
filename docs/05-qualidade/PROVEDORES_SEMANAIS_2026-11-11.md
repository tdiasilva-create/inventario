# D-099 — relatório por unidade e arquivo semanal

## Escopo aprovado e leitura

Pedido direto do responsável: uma linha por unidade, quatro colunas e histórico semanal automático no sistema. Horário confirmado: segunda-feira às 08h, Fortaleza. Implementação/publicação no contexto da autorização contínua da sessão. Registros de exemplo permanecem isolados; nenhuma unidade/ficha oficial é alterada por este recurso.

Consultados: 00_LEIA_ANTES_DE_TUDO.md, AGENTS.md, REGRAS_DE_PRECEDENCIA.md, DECISOES.md, PENDENCIAS.md, CONFLITOS_DOCUMENTAIS.md, MANIFESTO_REFERENCIAS.md e os cinco PNGs desktop abertos na ordem do manifesto; RELATORIOS_E_PLANEJAMENTO.md, MESA_DE_DADOS.md, RELATORIO_PROVEDORES_D098.md, CONEXAO_AGENTES_D097.md, MODELO_CONCEITUAL.md, DIAGRAMAS_E_STATUS.md e fontes DOT; trechos da Base de Coleta sobre históricos, permissões, offline/fotos; operação de publicação/rollback e backup. A Base original permanece intacta e o coletor não foi modificado. D-080 prevalece sobre a antiga paleta das referências originais.

Arquivos: server/provider-report.mjs, provider-report-history.mjs, management-views.mjs e worker.mjs; migrations/0026_provider_reports.sql; web/provider-report.js e painel.css; testes, scripts de pacote e documentação gerada do esquema. Configuração cron preservada, comentários atualizados. [Contrato e regras](../03-painel-desktop/RELATORIO_PROVEDORES_HISTORICO_D099.md).

## Critérios e resultado local

- **223 testes de servidor aprovados** na suíte completa (`pnpm test`), incluindo os sete novos casos de histórico. Seleção por ID da unidade, observação mais recente completa, dados ausentes, empate, unidades homônimas, contatos antigos/offline e vínculo encerrado cobertos.
- Segunda-feira 08h Fortaleza testada antes/no/depois do horário, virada do ano e domingo UTC. Primeiro registro real e próxima emissão futura; nenhuma semana retroativa fabricada.
- Persistência transacional, repetição e concorrência do cron sem duplicação; falha de gravação não avança agenda. Período de indisponibilidade longo gera somente leitura atual, com atraso explícito. Alterar provedor/nome/vínculo não modifica arquivo antigo; UPDATE direto recusado pelo trigger.
- APIs com quatro perfis, proteção do coletor, 401/403/405/404, parâmetros, paginação do histórico, consulta vazia e execução do próprio scheduled do Worker verificadas.
- `provider-report-browser.cjs` aprovado: Worker real e SQLite isolado, três unidades representadas por uma linha cada, quatro colunas, CSV/Excel/PDF completos e seguros, seleção independente do filtro online da tela, histórico inicial e semanal, leitura antiga inalterada após mudança de provedor, erros sem download parcial, visualizador, fechamento durante consulta, viewport 390, zero POST e zero erros JavaScript.
- Screenshots desktop 1440 e viewport 390 inspecionados visualmente; tabela com rolagem própria no celular, sem alargamento da página. Layout D-080 mantido. O teste de viewport não equivale a homologação em aparelho físico.
- Builds painel/coletor e dois dry-runs aprovados por alteração em servidor/esquema compartilhado; publicação necessária somente no painel. Esquema derivado regenerado: 26 migrações, 71 tabelas, 49 índices, uma view, 15 triggers; integridade e referências válidas.

Evidências locais privadas (dados sintéticos): `docs/05-qualidade/evidencias/provedores-historico-2026-11-11/resultado.json`, `01-relatorio-provedores.png`, `02-relatorio-390.png`, `03-acesso-em-relatorios.png`, `04-historico-semanal.png`, `05-registro-inicial.png`, `provedores-teste.pdf`. Fora do Git. Uma primeira execução contra dist antigo foi recusada corretamente; build atualizado e roteiro completo aprovado.

## Publicação

A registrar após aplicação da migração e publicação: versão anterior do painel 8d60b5ca-7c98-4104-ad20-882aa59b0727; coletor preservado em 2dac8571-2671-4eec-8ab0-7492753a0255. Plano de retorno: voltar ao código anterior do painel, conservar tabelas/relatórios, não desfazer dados. Sem mudança de Drive, agente, protocolo, contas ou credenciais.

O primeiro registro automático será conferido no ambiente real. A primeira segunda-feira posterior à publicação prevista é **16/11/2026 às 08h (Fortaleza)**; teste com relógio controlado não deve ser descrito como execução dessa data em produção. Aceite operacional final pelo responsável permanece pendente.
