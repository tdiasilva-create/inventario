# Providências da rede — D-085

Decisão do responsável em 10/11/2026: opção 3, indicadores separados para coletas pendentes, demandas abertas e alertas de hardware aguardando parecer, com publicação real. Substitui o indicador genérico “Pendentes / Critério pendente” e resolve LOG-13 do tour. Não somar os três conceitos.

## Apresentação e fontes

No Panorama, a faixa “Providências · toda a rede” fica junto aos indicadores, abaixo dos resultados oficialmente publicados. Os três atalhos também aparecem no pulso do cabeçalho. São **globais**, independentemente dos filtros locais do Panorama; o escopo está explícito. Categorias de unidades, equipamentos, ambientes, coletas concluídas e escolas online mantêm seus filtros/regras anteriores.

| Indicador | Critério | Destino |
| --- | --- | --- |
| Coletas pendentes | Uma contagem por unidade ativa elegível para coleta, sem inspeção concluída OU com inspeção aberta (incluindo revisita). | `/coletas-pendentes`: lista paginada, filtrável por situação/nome/INEP. Visitas abertas abrem a consulta parcial; as demais abrem a unidade. |
| Demandas abertas | Registros de `service_requests` em qualquer estado diferente de `Concluída`: Aberta, Em atendimento, Aguardando material ou Visita agendada. | `/demandas`, com o filtro padrão de demandas pendentes. Inclui histórico de solicitações ainda abertas mesmo após inativação/remoção da unidade, conforme D-071. |
| Hardware aguardando parecer | Eventos `hardware_change` com unidade/equipamento existentes e sem linha em `agent_hardware_reviews`, mesma elegibilidade de D-081. | Modal existente, somente após clique, filtrado com `state=pending`. Root/admin decidem; visualizador consulta. |

Coleta pendente não é quantidade de perguntas nem de equipamentos. Unidades que nunca iniciaram aparecem; obras, conveniadas fora do escopo e inativas não aparecem. Múltiplas inspeções históricas não duplicam a unidade. Uma visita pausada sem conclusão fica “Visita anterior preservada”; se já houver conclusão e não houver revisita aberta, não está pendente. Conclusão sem equipamentos continua sendo conclusão válida. Esta consulta não inicia visitas nem altera estados de cartões.

Ler/fechar uma notificação não é parecer. Aceitar retira a alteração da fila e preserva seu histórico. Encaminhar retira da fila de pareceres e cria uma demanda vinculada/idempotente. Concluir essa demanda não reabre o parecer; reabrir a demanda afeta só demandas. Um novo evento de hardware exige novo parecer. Ocorrências do questionário não são convertidas automaticamente em demandas, evitando nova duplicação de fatos. O mapa continua mostrando vermelho sem parecer e âmbar para encaminhamento ainda aberto, conforme D-081.

## Contratos e atualização

- `GET /api/inventory/pending-summary`: `scope: network`, `collections: {total, not_started, in_progress, preserved}`, `demands: {total}`, `hardware: {total}`, `server_time`. Três leituras no mesmo `D1.batch` para um retrato consistente.
- `GET /api/inventory/pending-collections?offset=0&state=&q=`: `items`, `total`, `offset`, `pageSize: 50`, `nextOffset`, `server_time`. `state`: vazio, `not_started`, `in_progress` ou `preserved`. Busca literal por nome/INEP, até 120 caracteres. Ordenação por nome/ID, paginação no servidor.
- `GET /api/inventory/hardware-alerts?state=pending`: somente sem parecer; padrão `active` preserva a consulta anterior de avisos pendentes ou encaminhados.
- Sessão obrigatória, somente root/admin/visualizador no painel. Operador/coletor recusados no servidor. APIs de contagem/lista são somente leitura; parecer continua protegido por CSRF, versão/recibo existentes.
- Uma consulta compartilhada de contagens a cada **15 s**, pausada com a aba oculta, retomada ao retornar. Atualizar força leitura. Após parecer, a tela solicita nova contagem imediatamente. A lista de coletas usa o mesmo ciclo; não cria outro temporizador.
- Erro mostra indisponibilidade/“—”, nunca zero inventado. Lista já carregada pode permanecer visível, explicitamente desatualizada, com botão para tentar novamente. Falha dessas contagens não apaga a presença de agentes no mapa/pulso. Presença segue seu ciclo de 60 s e prazo D-070.

## Limites preservados

Nenhuma migração, escrita de dados oficiais em testes, modificação no coletor, questionário, agente/QR ou Drive. Não altera LOG-08 (fichas vs quantidades físicas), LOG-14 (Relatórios/Planejamento), Ano, destino da matriz, local das escolas offline ou Fases 4/5. Não mostra percentual geral.

[Testes e publicação](../05-qualidade/INDICADORES_PENDENCIAS_2026-11-10.md).


## Atualização D-094 — demandas por unidade no mapa

A resposta demands passa a {total, units: [{unit_id,total}]}; a consulta de demandas agrupa por ID e o total soma os mesmos grupos, mantendo três leituras no batch. Mapa usa a consulta compartilhada de 15 s para anel externo #006D77 em toda unidade localizada com demandas abertas. Não altera elegibilidade/estados nem cria um novo polling. Substitui o antigo âmbar de hardware encaminhado; hardware sem parecer continua vermelho interno. [Aceite](../05-qualidade/DEMANDAS_MAPA_2026-11-11.md).
