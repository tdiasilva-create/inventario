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

Implementação no commit **b030985**. Antes da alteração, versões ativas dos dois Workers e única migração pendente 0026 conferidas; bookmark de recuperação D1 guardado privadamente em `.wrangler/d099-recovery-before.json`. Não houve exportação bloqueante, pausa da coleta ou restauração de dados. Esse bookmark não equivale a backup completo do Drive nem a ensaio de recuperação.

Migração **0026_provider_reports.sql** aplicada no D1 real em 11/11/2026 (cinco comandos, sucesso). Painel publicado às **18:16:35 Fortaleza**, versão **e84c72d6-297b-474d-a7b8-c9b5c5913767**, 100% do tráfego, dois assets atualizados. Versão anterior 8d60b5ca-7c98-4104-ad20-882aa59b0727. Coletor preservado em 2dac8571-2671-4eec-8ab0-7492753a0255. Dois crons existentes confirmados. Scanner de 650 arquivos indexados, links documentais e diff aprovados; **54 verificações HTTP reais aprovadas**, incluindo proteção das três rotas e do módulo.

O cron criou sozinho o primeiro **Registro inicial às 18:16:43 Fortaleza**, antes de abrir o relatório no navegador. Consulta somente leitura do D1 confirmou seis unidades/linhas e quatro com provedor identificado, com próximo vencimento **2026-11-16T11:00:00.000Z**. Não houve chamada manual de geração, seed ou escrita de exemplo em produção.

Navegação autenticada como root conferiu Dados atuais (seis unidades, quatro com provedor e duas sem informação), quatro colunas, acesso ao Histórico semanal e abertura do registro inicial com valores preservados. Próxima emissão **16/11/2026 às 08h (Fortaleza)** exibida no painel. Screenshots reais observados; nenhum cadastro alterado nem download de dados reais durante a conferência. Exportações completas e histórico futuro foram exercitados com dados isolados nos testes locais. Evidência HTTP privada em `docs/05-qualidade/evidencias/provedores-historico-2026-11-11/http-real.json`; agregados remotos em `.wrangler/d099-postdeploy.json`.

Plano de retorno: voltar ao código anterior do painel, conservar tabelas/relatórios, não desfazer dados. Sem mudança de Drive, agente, protocolo, contas ou credenciais. Primeira execução semanal futura e aceite operacional final pelo responsável ainda devem ser conferidos; o teste com relógio controlado não é execução de 16/11 em produção.

Endereço: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/computadores — botão **Relatório de provedores**, abas **Dados atuais** e **Histórico semanal**. Mesmo botão em Relatórios.

## Adendo — retirada de frase e conferência navegada, 11/11/2026

Responsável solicitou mostrar os dois relatórios no navegador e retirar a frase sobre rede identificada/provedor contratado/links da unidade. Commit **340e918** altera apenas o texto compartilhado em web/provider-report.js, sem mudanças de dados, consulta ou agenda. Também ajusta a espera do teste existente pelo evento assíncrono de fechamento do dialog: primeira execução encontrou a verificação antecipada; após aguardar a remoção real, roteiro completo aprovado. Nenhuma alteração no comportamento de fechamento da aplicação.

Build desktop e `provider-report-browser.cjs` aprovados novamente: três unidades únicas/quatro colunas, CSV/Excel/PDF, consulta atual e arquivo inicial/semanal, responsividade, permissões e falhas. Links documentais e diff aprovados. Painel publicado na versão **4075d22d-a3b6-4e71-a484-ff7660bcf85d**, com apenas provider-report.js como asset atualizado. Sem migração, mudança de coletor ou escrita cadastral; crons preservados.

Após renovação da sessão pelo próprio responsável, conferência real como root às **18:35 Fortaleza**: Dados atuais mostrou seis unidades, seis linhas sem repetição de nomes, quatro com IP/provedor e duas sem informação. Colunas Nome da unidade, IP público, Provedor / rede identificada e Último contato (Fortaleza). Frase removida confirmada visualmente. Histórico semanal mostrou um Registro inicial de 18:16:43 e próxima emissão em 16/11/2026 às 08h; arquivo aberto manteve os valores antigos, também sem a frase. Screenshots reais observados nas três etapas e navegador deixado no registro arquivado. Nenhuma exportação privada real ou alteração cadastral durante a conferência.
