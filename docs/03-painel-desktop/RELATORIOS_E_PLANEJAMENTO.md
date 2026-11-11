# Relatórios e Planejamento — D-086, 10/11/2026

O responsável escolheu a opção 2: primeiro relatório útil de computadores e fila de trabalho por unidade. Interface compacta D-065/D-080, somente desktop. Não inclui agenda nova, atribuição de técnicos ou regras automáticas de prioridade.

## Relatório de computadores

Em `/relatorios`, uma linha corresponde a uma ficha ativa de computador, inclusive dados parciais já salvos no servidor. A ficha identifica unidade, ambiente atual, posição, nome, hostname, ID permanente, vínculo do agente, comunicação e último contato. PARCIAL distingue o registro corrente ainda não publicado; não altera os indicadores oficiais da matriz. Inatividade da unidade é explícita e pode ser filtrada. Equipamentos removidos não entram; tipos fora do escopo atual seguem `inventoryScopeSql`.

- Filtros: texto, unidade, ambiente dessa unidade, comunicação, vínculo/cadastro, publicação e situação da unidade. Filtros e página ficam na URL, sem credenciais/respostas.
- Contagem por **ficha**, conforme o comportamento existente: lotes são identificados, com quantidade declarada separada na exportação. Não se decide LOG-08 nem se transforma um lote em computadores individualizados.
- Comunicação reutiliza D-070 e o mesmo relógio por consulta: comunicando, sem comunicação recente, sem vínculo e outros estados. Prazo atual de 17 minutos. Não equivale a funcionamento físico, uso por pessoa ou diagnóstico de internet.
- A tela pagina em 60; CSV, Excel e impressão consultam **todos os resultados filtrados**, por uma única consulta de dados no servidor. Não exportar apenas a página visível. Resposta incompleta ou erro interrompe a operação, sem arquivo parcial fingindo sucesso.
- Exportação contém instante da consulta, IDs e quantidade de lote; não inclui senhas, contas Windows nem seções técnicas completas. Textos são escapados para HTML e fórmulas de planilhas.
- Impressão abre prévia integral, com filtros, horário e limites da leitura; o navegador permite imprimir/salvar PDF. Não é um relatório histórico imutável: a exportação consulta o estado atual no instante do clique. Atualização da tela é manual para estabilizar sua leitura.

`GET /api/inventory/computer-report`: `q`, `unitId`, `environmentId`, `presence=online|lost|unlinked|other`, `agent` conforme `equipment-link-state.mjs`, `publication=published|partial`, `active=all|1|0`, `offset`, `all=0|1`. Retorna linhas, totais, unidades/ambientes, paginação, `complete`, `server_time` e `threshold_seconds`. Ausência de filtro de estado é admitida. `all=1` é a exportação integral.

## Fila de trabalho

Em `/planejamento`, agrupar por ID da unidade as três providências de D-085: coleta pendente, demanda aberta e hardware aguardando parecer. Não somar esses conceitos em um único total. Unidades sem computadores também aparecem quando possuem alguma providência. Demandas de unidades inativas/removidas permanecem na fila, com identificação histórica disponível.

- Busca por nome/INEP e filtro do tipo de providência; ordenação alfabética, sem prioridade inferida; 50 unidades por página.
- Coleta em andamento abre consulta PARCIAL existente; coleta não iniciada abre unidade. Demandas abrem Central filtrada; hardware abre o modal existente apenas após clique, com pareceres conforme permissões.
- Atualização na aba visível a cada 15 segundos pela consulta compartilhada de pendências, adiada durante edição de filtro/modal; botão Atualizar. Falhas aparecem explicitamente e dados anteriores ficam rotulados desatualizados.
- Bloco global de Coletas em andamento permanece abaixo da fila. O filtro da fila não reduz esse bloco global.

`GET /api/inventory/work-plan`: `q`, `unitId`, `kind=collection|demands|hardware`, `offset`. Retorna linhas, totais separados, paginação e `server_time`. Reutiliza SQL de pendências e revisão de hardware, evitando critérios divergentes.

## Acesso, escala e manutenção

As duas APIs aceitam somente GET e root/admin/visualizador no painel; operador/coletor não acessam. Não escrevem registros nem exigem migração. Pareceres e demandas continuam nos endpoints existentes. Coletor, QR/EXE, Drive, fotos e conclusão da vistoria preservados.

O filtro de comunicação usa a função compartilhada no Worker após leitura compacta dos computadores; a exportação integral pode exigir mais memória/tempo em redes maiores. Falhas/timeout são visíveis; não há truncamento silencioso. Não foi homologada uma quantidade máxima de computadores. Consultas históricas, relatórios adicionais, agenda e atribuição de equipe permanecem para decisão posterior.

[Aceite e publicação](../05-qualidade/RELATORIOS_PLANEJAMENTO_2026-11-10.md).


## D-098 — relatório adicional de provedores

Botão Relatório de provedores em Relatórios e Computadores. Consulta toda a rede com vínculo atual de agente e dados recebidos, independente dos filtros da tela; inclui offline. Prévia e exportações completas da mesma leitura datada, sem agendamento ou histórico semanal fictício. [Contrato](RELATORIO_PROVEDORES_D098.md). Relatório operacional D-086 e Planejamento preservados.

Atualização D-099: esse relatório adicional agora mostra **uma linha por unidade e quatro colunas**, possui Dados atuais e Histórico semanal imutável, com emissão automática segunda-feira 08h Fortaleza e registro inicial real. [Contrato vigente](RELATORIO_PROVEDORES_HISTORICO_D099.md). Não muda o relatório operacional por computador nem a fila de planejamento D-086.
