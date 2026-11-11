# D-098 — testes e publicação do relatório de provedores

## Escopo e referências

Pedido direto do responsável em 11/11/2026, após aprovar a ficha D-097. Botão no painel para relatório semanal gerado ao clicar, com toda a rede e última informação recebida, incluindo computadores offline. Quinta coluna Último contato confirmada expressamente pelo responsável: “Sim, usar Último contato”. Publicação no contexto da autorização contínua de alterações no ambiente real.

Leitura: 00_LEIA_ANTES_DE_TUDO.md, AGENTS.md, REGRAS_DE_PRECEDENCIA.md, DECISOES.md, PENDENCIAS.md, CONFLITOS_DOCUMENTAIS.md, RELATORIOS_E_PLANEJAMENTO.md, CONEXAO_AGENTES_D097.md e seus aceites; fontes reais de consulta, exportação, presença, vínculo e permissões. Referências desktop e identidade D-080 já abertas/consultadas na fase anterior, preservadas. Nenhuma modificação de questionário, pergunta, estado de conclusão, foto ou offline da Base TXT; arquivo original intacto.

Arquivos de implementação: server/provider-report.mjs, management-views.mjs; web/provider-report.js, operations.js, desktop-management.js, painel.css; build, package/CI e testes. Nenhuma migração, segredo ou reinstalação. Coletor não precisa de nova publicação. [Contrato](../03-painel-desktop/RELATORIO_PROVEDORES_D098.md).

## Aceite local

- 21 testes aprovados: provider-report.test.mjs, management-views.test.mjs, agent-connection.test.mjs e equipment-deletion.test.mjs. Incluem consulta de 135 computadores, registros offline antigos (fora de sete dias), inventário sem heartbeat, legado sem IP/provedor, exclusão de manual/sem dados/vínculo encerrado/impressora, unidades inativas/homônimas, mesmo IP em várias máquinas, perfis, sessão, somente GET, proteção no coletor, indisponibilidade e ausência de campos privados indevidos. Migração de presença e fluxo de remoção anteriores preservados.
- provider-report-browser.cjs: Worker real e SQLite isolado, 74 computadores, prévia/Excel/CSV/PDF completos, independência do filtro online da tela, data/hora, leitura estável entre prévia/download, texto HTML/fórmula escapado, visualizador, vazio, falha e resposta incompleta sem download, fechamento durante consulta, zero POST e erros JavaScript. Navegador desktop 1440 e viewport 390; imagens reais inspecionadas. Teste incorporado à CI.
- management-views-browser.cjs: regressão aprovada, filtros/páginas/65 linhas completas em exportação e impressão, Planejamento, atualização de pendências, erros e visualizador.
- operations-browser.cjs: regressão aprovada, computadores/laboratórios, tooltip, demanda, histórico, unidade sem computadores, atualização e responsividade.

Evidências locais privadas: docs/05-qualidade/evidencias/provedores-2026-11-11/resultado.json, 01-relatorio-provedores.png, 02-relatorio-390.png, 03-acesso-em-relatorios.png e provedores-teste.pdf. Dados sintéticos, nenhuma carga de teste em produção. Evidências permanecem fora do Git.

## Publicação

Painel publicado em 11/11/2026, 17:54:53 (Fortaleza), versão **8d60b5ca-7c98-4104-ad20-882aa59b0727**, 100% do tráfego. Implementação no commit **1d47d69**. Somente painel; sem migração nem escrita cadastral. Versão anterior: e59b7120-4036-4ba0-b850-a400c39df18e. Coletor preservado em 2dac8571-2671-4eec-8ab0-7492753a0255. Em caso de rollback, basta reverter o painel; não apagar dados de conexão.

Build desktop: 88 entradas; dry-run do Worker aprovado; scanner de 645 arquivos indexados, links documentais e git diff --check aprovados. Após publicação, 52 verificações HTTP aprovadas (50 do roteiro de release e duas do módulo/API protegida).

Conferência navegada em produção com sessão root: botão Relatório de provedores aberto a partir de Computadores, mesmo com a tela filtrada por estado=comunicando. A prévia emitida às 17:55:43 mostrou **65 computadores, seis unidades, 14 com provedor identificado e 51 sem provedor identificado**, incluindo máquinas sem comunicação recente e suspensas. Cinco colunas e ações Excel/CSV/PDF habilitadas observadas; screenshot real inspecionado. Valores ausentes ficaram explicitamente Não recebido/Não identificado. São totais daquele instante, não números fixos. Nenhuma alteração cadastral nem download dos dados reais durante a conferência; arquivos e impressão foram exercitados com dados isolados nos testes locais.

Endereço: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/computadores — botão Relatório de provedores (também disponível em Relatórios). Aceite operacional final pelo responsável permanece pendente.
