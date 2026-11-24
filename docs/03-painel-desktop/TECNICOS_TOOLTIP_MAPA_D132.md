# D132 — técnicos designados no aviso da unidade

Pedido de 24/11/2026: identificar, ao passar o mouse sobre a unidade no mapa, qual técnico foi designado. Publicação autorizada especificamente e concluída em 24/11/2026 às 15:58:25 Fortaleza; painel `bfa2cbce-3faa-4e1f-8e2d-44981b73c173` em 100%. Preserva a visibilidade root das atribuições no mapa D105/D106.

## Comportamento

- No Panorama normal/ampliado e no Mapa da Rede, o root vê os técnicos vinculados às demandas abertas da unidade, além do nome/tipo, alunos, vagas e avisos existentes.
- Nome de usuário como fallback quando não houver nome de exibição. Pessoas agrupadas por ID da unidade e do usuário, sem repetir quem tem várias demandas na mesma unidade; ordem alfabética em português. Homônimos não são fundidos.
- `Técnico designado` / `Técnicos designados`: atribuições atuais de usuários ativos e habilitados; não depende de GPS, internet do celular ou aceite.
- `Aceite confirmado`: técnicos com atividade operacional D126 naquela demanda. Não afirma chegada à escola; pode estar a caminho. A expiração da sessão/GPS não desfaz esse aceite.
- Demanda aberta sem técnico: `Técnico ainda não designado`. Unidade sem demanda nem atribuição não recebe linha adicional.
- Não usar o campo livre `responsible`, proximidade geográfica ou primeira parada da rota como prova de designação/aceite. Demandas concluídas/excluídas e atribuições encerradas ficam fora.
- A atualização existente de 15 segundos atualiza também um aviso que já esteja aberto. Falha inicial mostra indisponibilidade; falha posterior identifica explicitamente a última leitura. Não transforma falha em ausência de técnico.
- Clique, anéis, cores por categoria, hardware, filtro de agente e criador de rota continuam com seus comportamentos atuais. Nomes são inseridos com `textContent`, sem HTML. Texto acessível também no marcador/anel.

## Dados, permissões e consumo

Reutiliza `/api/dispatch/map`, que já entrega `routes` com todas as atribuições abertas ao root. `web/dispatch-map.js` entrega essa leitura ao mapa por callback; `web/map-unit-technicians.js` agrupa nomes em memória. Não há endpoint, temporizador ou consulta por hover novos. Admin/visualizador/operador não recebem essa leitura; nenhuma permissão gerencial é concedida ao aplicativo.

`server/dispatch-road-routing.mjs` acrescenta somente `accepted` à projeção existente de atribuições. Um LEFT JOIN pela chave primária de `dispatch_service_activity.user_id`, confirmado pelo ID da atribuição, identifica o aceite D126 sem varrer histórico. `readDispatchMap` permanece com três statements em um lote. Há custo adicional de lookup indexado por atribuição, portanto não se afirma consumo de linhas D1 idêntico; não foi realizada medição de cota em produção para esta alteração local.

Sem migração, alteração de frequência, gravação em visitas/demandas, mudança de APK/EXE/coletor, localização D114, rotas OSRM ou plano gratuito. Mantém as 37 migrações existentes. Para migração física, preservar ID de usuário/atribuição, projeção operacional de aceite e permissões root, evitando substituir atividade operacional por sessão/GPS.

## Aceite e rastreio

Consultar [qualidade D132](../05-qualidade/TECNICOS_TOOLTIP_D132_2026-11-24.md). Testes isolados devem cobrir: dois técnicos, repetição entre demandas, designação sem GPS, aceite com sessão expirada, retirada/troca/conclusão/exclusão/desabilitação, mudança de nome, falhas, texto seguro, atualização do tooltip aberto, mapa ampliado/390 px, root exclusivo e ausência de requisição por hover.
