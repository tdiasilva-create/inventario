# D131 — filtro independente de agentes para testes de internet

24/11/2026. Implementação local, ainda não publicada. [Verificações](../05-qualidade/FILTRO_AGENTE_D131_2026-11-24.md).

## Decisão e experiência

O responsável quer visualizar no mapa somente as unidades que ainda não possuem agente atualizado, para montar rotas a partir dos marcadores visíveis. Corrigiu expressamente a proposta: **o filtro pertence ao mapa do Panorama, fora do módulo Criar rota**. Confirmou que uma unidade com um computador compatível e outros antigos **deve desaparecer** do filtro; não exigir atualização integral da frota para considerá-la atendida nesse critério.

- Botão **Sem agente 0.1.9**, nos controles do próprio mapa, funciona antes de abrir o planejador, no tamanho normal e ampliado. Pressionar novamente retira o filtro.
- Mostrar unidades ativas do catálogo atual, respeitando os filtros de regional/tipo já aplicados, quando nenhum computador com vínculo atual declarou capacidade de testes de internet. Inclui unidades sem agente e com agentes antigos.
- Basta **um computador vinculado compatível**, mesmo offline, para retirar a unidade do mapa filtrado. Vínculos encerrados, dispositivos revogados e fichas excluídas não contam; cadastros parciais válidos contam.
- A elegibilidade é `network_test_protocol === 1`, recebida no heartbeat assinado, igual ao servidor de testes D118. O número da versão sozinho não garante suporte; versões compatíveis posteriores também contam. Instalação/atualização física ainda sem comunicação e vínculo não pode ser reconhecida remotamente.
- Contagem do botão representa unidades elegíveis com coordenadas. Unidades elegíveis sem coordenadas aparecem como quantidade explicativa, sem posição inventada. Todas as categorias do catálogo seguem seus filtros atuais; o controle não reclassifica tipos pelo nome.
- Busca principal, enquanto o filtro estiver ativo, só sugere unidades compatíveis com esse filtro. Seleção mantém o mapa. Retirar filtro recupera a busca completa existente.
- Abrir Criar rota mantém o mapa filtrado; os cliques selecionam normalmente, mantendo ordem, descrições, técnico e atendimento iniciado D130. Cancelar a rota não cancela o filtro. Rascunhos já iniciados não são apagados por atualização da frota ou mudança de filtro; unidades que deixarem de estar no mapa mantêm a indicação de indisponibilidade já existente no cartão.
- O filtro altera marcadores de unidades, não a camada de localização/rotas dos técnicos, indicadores gerais ou cadastros. Categoria, alertas e anéis existentes continuam nos marcadores visíveis. Nenhuma animação nova que concorra com alertas de demandas/hardware.
- Durante falha de leitura, não afirmar que todas as unidades estão sem agente: filtro inicialmente indisponível; se ativo, conservar a última seleção conhecida com aviso e permitir retirá-lo. Recuperação usa a atualização existente.

## Implementação e consumo

`GET /api/operations/units` acrescenta `internet_test_capable`, inteiro por unidade calculado no loop existente sobre `agent_presence.data_json`, somente quando dispositivo/vínculo estão ativos. Reutiliza a leitura fresca de presença de D110, sem adicionar SQL, joins, índices ou gatilhos. Não colocar capacidade em cache estático: atualização do agente deve refletir no próximo pulso mesmo sem alteração de catálogo.

`web/map-agent-filter.js` usa o evento `semed:fleet-presence`, sem fetch ou timer próprio. Filtrar, buscar, ampliar e ordenar unidades são ações locais. Leitura aquecida continua com três chamadas D1; consulta de técnicos e envio de demandas continuam sendo ações explícitas D130, fora do filtro.

Arquivos: `server/service-desk.mjs`; `web/map-agent-filter.js`, `desktop-map.js`, `desktop.js`, `panel-unit-search.js`, `painel.css`; build, CI e testes. Autorização desktop existente preservada (root/admin/visualizador consultam); criar rota continua exclusivo root. Sem novo endpoint, migração, credenciais, APK, instalador, coletor, alteração de plano ou comportamento de GPS/alertas.

## Publicação

Preparado para publicar somente o Worker do painel após autorização específica. Produção continua D130 `c516cd99-c3d0-4480-b5ef-aaaf1383e5ed`. Sem migração; rollback de código remove o filtro sem alterar demandas ou dados. A autorização anterior de D130 publicou o criador de rotas, não esta nova alteração de filtro.
