# Central de demandas — 08/11/2026

Pedido e publicação real explicitamente autorizados. Implementação D-071.

## Validação local

- Suíte existente e testes novos: 127 testes aprovados inicialmente; verificações complementares registradas na conclusão abaixo.
- `tests/service-desk.test.mjs`: papéis, CSRF, isolamento collector, vínculo de outra unidade recusado, unidade sem computadores, recibo de reenvio, conflito de versão, conclusão com relato, histórico, comunicação independente do atendimento e contexto preservado após remoção.
- `tests/operations-browser.cjs`: Worker real com SQLite em memória, 57 computadores, laboratório classificado, hover com hostname/unidade/posição, criação de demanda do computador, passagem para Aguardando material, demanda de visita em unidade sem computadores, atualização automática da presença e largura de 390px sem transbordamento.
- Capturas reais da implementação isolada em `evidencias/central-demandas-2026-11-08/`: computadores-laboratorio.png, historico-demanda.png, central-demandas.png, unidade-sem-computadores.png, computadores-responsivo.png. Dados rotulados TESTE ISOLADO, nunca inseridos em D1 oficial.
- Dicionário gerado com 18 migrações: integridade ok e nenhuma violação de chave estrangeira.

## Produção

Publicado em 08/11/2026 às 21:27–21:29 (Fortaleza). Worker do painel: `52ccaadf-0b9d-46be-99ce-4d8ae0b8ef8f`, 100%. Migração `0018_service_desk.sql` aplicada, oito comandos, sem alteração de tabelas antigas. Backup SQL restaurado em SQLite isolado, migração validada sobre a cópia, integridade e chaves estrangeiras conferidas.

Verificação após deploy: conteúdo integral de users, units, inspections, equipments, miscellaneous_equipments, collection_photos e agent_equipment_links idêntico ao backup; 8 contas, 76 unidades, 7 vistorias, 1 equipamento, 3 fotos e 5 vínculos históricos preservados. Configurações, nomes dos segredos e bindings preservados. Collector permanece na versão `859d0016-755f-4104-94ed-94e4780e2f8e`; Drive intacto. Cron diário e minuto a minuto preservados.

Leituras das novas consultas sobre D1 real aprovadas; rotas sem sessão retornam 401 e telas redirecionam ao login. Navegação root em produção mostrou todas as unidades, o computador DESKTOP-GQ2RO6D na EM RAIO DE LUZ, suspensão informada pelo agente, unidade/ambiente/posição no tooltip e formulário de demanda com alvo correto. Central iniciou vazia; nenhum exemplo fictício foi criado. Nenhuma classificação automática de laboratório ou ausência de computadores. Não executado teste na máquina via RustDesk. Capturas de produção no mesmo diretório: producao-computadores.png e producao-central.png.

Evidência privada (fora do Git): private-data/publicacao-d071-2026-11-08/ contém backup, snapshots antes/depois dos Workers e verification.json. Duas verificações complementares passaram: paginação de 1.057 computadores/52 demandas e rollback integral se falhar a gravação do histórico. Total de testes verificados: 123 anteriores + 6 novos; regressão visual das 17 rotas antigas também aprovada.

## Roteiro para o responsável

1. Computadores → selecione uma unidade. Confira hostname/ambiente/posição no ícone e por clique. O resumo distingue comunicando, sem comunicação recente e sem agente.
2. Organizar ambientes → classifique somente os ambientes que realmente são laboratórios. Em unidade comprovadamente sem máquinas, confirme ausência; não marque por falta de coleta.
3. Clique no computador → Registrar demanda. Relate uma necessidade real, origem Telefone e solicitante se disponível. Confirme o equipamento e salve.
4. Central de demandas → confira unidade, localização, situação e histórico. Altere para Em atendimento, Aguardando material ou Visita agendada conforme o trabalho real.
5. Depois do atendimento, escolha Concluída e descreva a solução. A demanda sai do filtro pendentes e permanece em Todas/Concluída.
6. Para toner, selecione a unidade e a impressora no seletor opcional de equipamento. Para visita geral, deixe sem equipamento.
7. O retorno do agente não encerra demandas manuais. O teste de perda/retorno físico continua sendo feito pelo responsável, sem acesso remoto do assistente.
