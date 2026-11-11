# D-094 — demandas abertas sinalizadas no mapa

Pedido direto do responsável em 11/11/2026: animação circular média em verde-petróleo #006D77 ao redor do marcador da unidade com demandas pendentes, para o técnico identificar onde há necessidade de atendimento. Publicação no painel real dentro da autorização contínua da sessão. Sem criação de solicitações reais para demonstração.

## Fontes e escopo

Consultados: 00_LEIA_ANTES_DE_TUDO.md, AGENTS.md, REGRAS_DE_PRECEDENCIA.md, DECISOES.md, PENDENCIAS.md, CONFLITOS_DOCUMENTAIS.md; CENTRAL_DE_DEMANDAS.md, INDICADORES_DE_PENDENCIAS.md, NOTIFICACOES_E_LOG.md, MONITORAMENTO_E_NOTIFICACOES.md, HARDWARE_DECISAO_2026-11-10.md, MANIFESTO_REFERENCIAS.md, implementações e regressões de demandas, hardware e mapa. Os cinco PNGs desktop já examinados nesta conversa continuam referências históricas de composição; D-065/D-080 e cores D-087 prevalecem.

Arquivos: server/pending-indicators.mjs; web/desktop-demand-count.js, desktop-map.js, unit-map-palette.js, painel.css; testes, CI e documentação. Sem mudança no questionário, banco, coleta, QR, instalador, Drive, cron ou permissões. Nenhum requisito de coleta TXT acrescentado/removido.

## Comportamento e aceite

- Toda demanda não concluída conta: Aberta, Em atendimento, Aguardando material, Visita agendada. Inclui solicitações manuais, unidades sem computadores e demandas de hardware. Preserva o ID/contexto da demanda, sem inferir pelo nome da unidade.
- Uma unidade tem um anel externo, não um por demanda. Cor #006D77, área de 48 px e ciclo suave de 3 segundos, centrado na coordenada real; centro mantém a cor da categoria. Contagem/nome disponíveis no hover e na identificação acessível.
- Concluir uma de várias solicitações mantém o anel; concluir a última o remove; reabrir o restaura. Receber comunicação do agente nunca conclui demanda manual.
- No Panorama e Mapa da Rede, inclusive ampliação e zoom. Respeita os filtros e não cria coordenadas para unidades sem localização. Demandas de unidades removidas/inativas continuam na Central e nos contadores; somente marcadores existentes e localizados podem receber anel.
- Clique/Enter no anel abre /demandas?unidade=ID com o filtro de pendentes. Sobreposição oferece seleção explícita de unidade, preservando D-092. No centro de uma unidade com hardware sem parecer, continua abrindo o modal de hardware; o círculo vermelho interno convive com o anel externo verde-petróleo. O centro de hardware já encaminhado mantém a consulta histórica existente. Nada abre automaticamente.
- D-094 substitui o antigo halo âmbar de hardware encaminhado pelo mesmo anel verde-petróleo usado para todas as demandas. Nenhuma duplicação de círculos de atendimento. Aceitar hardware não remove outras demandas abertas da unidade.
- Movimento reduzido: círculo fixo visível. Em falha de consulta, preserva a última leitura, pausa o pulso e informa indisponibilidade no tooltip/legenda; não inventa zero.

## Consulta compartilhada

GET /api/inventory/pending-summary acrescenta demands.units: [{unit_id,total}]. O total é a soma dos grupos da mesma leitura; continua usando três consultas no mesmo batch. Sem novo temporizador ou chamada: atualiza com a leitura existente de 15 segundos em aba visível. Mantém root/admin/visualizador; operador e ambiente do coletor continuam recusados pelo Worker. Nenhuma escrita ou migração.

## Verificações

- 26 testes de servidor: pending-indicators, service-desk, agent-monitoring e hardware-review. Novo teste cobre agrupamento, todos os estados, conclusão, reabertura, histórico inativo/removido e unidades sem coordenadas.
- tests/map-demands-browser.cjs: Worker real/SQLite em memória; cores, quantidade por unidade, ancoragem, zoom/ampliação, erro/retomada, clique/teclado, Central filtrada, leitura como visualizador e 390 px. Zero requisições de escrita e zero erros JavaScript. Teste incorporado à CI.
- Regressões: hardware-review-browser, panorama-map-browser, pending-indicators-browser, school-presence-browser e panel-usability-browser.
- Capturas em docs/05-qualidade/evidencias/demandas-mapa-2026-11-11/, rotuladas TESTE LOCAL: anéis com hardware, ampliação, leitura desatualizada, Central filtrada, mapa 390 e resultado.json. Dados sintéticos somente em SQLite isolado.

Ao testar redimensionamento, foi identificado que o primeiro desenho de caminhos SVG podia ocorrer depois da atribuição de data-unit-id. A pintura dos estados agora reaplica ID e tipo ao elemento renderizado, preservando acessibilidade, seleção e identificação. As coordenadas não mudam.

## Publicação

Resultado da publicação e conferência real registrado após deploy. Versão anterior do painel para rollback: f43d0101-aca7-465e-a666-ad4981405f62. Coletor anterior: 91ba6200-d080-4026-8e92-7042bd67f86e. Nenhum dado ou incidente de produção usado como teste de escrita. Fases e decisões pendentes continuam preservadas.
