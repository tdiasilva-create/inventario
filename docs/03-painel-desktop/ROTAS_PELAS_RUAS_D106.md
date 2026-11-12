# D-106 — roteiro do técnico pelas ruas

Pedido de 12/11/2026: substituir o tracejado reto do painel por percurso viário, começando na posição do técnico e respeitando a sequência definida pelo root. Implementação, testes e publicação real solicitados expressamente. Esta decisão supera apenas o desenho em linha reta da D-105.

## Comportamento

- Panorama e Mapa da Rede desenham a geometria viária em verde-petróleo, fina, tracejada e animada; movimento reduzido respeitado. Cores das unidades e anéis de demandas/hardware permanecem.
- Origem: última localização recente do atendimento ativo. Destinos: todas as demandas abertas atribuídas ao técnico, na ordem global definida pelo root. Não promove a demanda aceita para o início quando ela está fora dessa ordem, não otimiza nem troca a sequência.
- Encerrar/revogar/pausar o atendimento retira a posição e a rota. Concluir ou reatribuir destinos os retira da sequência na atualização seguinte. Reordenar ou editar coordenadas invalida o trajeto anterior.
- Localização consultada a cada 15 segundos em aba visível. Critério de posição recente continua 180 segundos. Recalcular rota quando mudar sequência/destinos, deslocamento atingir 75 m ou cálculo completar dois minutos. Enquanto isso o marcador acompanha a posição recebida, independentemente do cálculo.
- Sem coordenadas de uma parada: explicar e indicar os números das demandas; não pular a parada nem traçar uma linha reta. Sem posição atual: não calcular. Serviço indisponível: mensagem explícita e nova tentativa; nenhum caminho fictício.
- São vias para automóvel, conforme a cartografia do provedor. Não representa trânsito ao vivo, trajeto efetivamente percorrido nem instruções de direção no painel. APK continua abrindo navegação externa; não exige reinstalação.

## Provedor e privacidade

OSRM operado pela FOSSGIS: `https://routing.openstreetmap.de/routed-car/route/v1/driving/`. Usar o serviço `route`, que preserva a ordem; nunca `trip`. Enviam-se somente coordenadas, sem nomes, IDs internos, sessão, conteúdo das demandas ou credenciais. O provedor informa que registra consultas nos seus logs. Consulta de autorização específica do responsável registrada na conversa antes da ativação.

- [Política de utilização e privacidade do servidor](https://routing.openstreetmap.de/about.html)
- [Contrato Route do OSRM](https://project-osrm.org/docs/v5.24.0/api/#route-service)

Serviço comunitário gratuito, sujeito a disponibilidade e política de uso; não é contratação com SLA. Limite global durável: intervalo mínimo 1,2 s e uma consulta em voo, com lease de 15 s. Cache compartilhado reduz consultas de vários roots/abas. Timeout de 9 s, resposta limitada a 2,5 MB e geometria a 1,5 MB; máximo explícito de 99 destinos. Aproximação até 500 m da via, sem inventar acessos de prédios; resposta fora desse limite é recusada. Falha temporária recebe intervalo de 30 s. Atribuição OSRM/OSM e link Corrigir mapa aparecem no rodapé.

## API e persistência

`GET /api/dispatch/road-route?technician=UUID`: exclusivamente root autenticado, somente no Worker do painel. O servidor obtém origem, permissões, destinos e ordem do banco; o cliente não fornece coordenadas arbitrárias ou endereço de proxy. Estados: ready, waiting, unavailable, changed. Resultado contém chave da sequência, origem/horário, validade, GeoJSON, distância e duração. Interface não exibe resposta atrasada de uma sequência anterior.

Migração aditiva `0028_dispatch_road_routes.sql`: último cálculo por atendimento e controle global de acesso ao provedor. Não é histórico de deslocamentos. Cache substituído, eliminado ao encerrar atendimento/posição e invalidado por alterações da fila. Cron existente limpa vencidos. Cada leitura revalida sessão, usuário ativo, habilitação, atribuição, demanda e posição. Dados de cache nunca liberam acesso por si só.

Código: `server/dispatch-road-routing.mjs`, integração em `server/technical-dispatch.mjs`, renderização em `web/dispatch-map.js`. Nenhuma alteração no protocolo do agente Windows, coletor, Drive ou APK. Fonte/fixtures sintéticas em testes não entram no D1 oficial.

## Retorno

Rollback de código para a versão D-105 conserva tabelas aditivas, sem restauração destrutiva do banco. A versão antiga volta ao conector reto identificado como sequência; não continua consultando o novo provedor. Não executar DROP nem restaurar dump sobre novos atendimentos. Cache é derivado e não altera demandas, ordem, usuários ou histórico.

Testes e publicação: [registro de qualidade](../05-qualidade/ROTAS_RUAS_2026-11-12.md).
