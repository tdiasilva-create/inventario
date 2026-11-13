# Panorama com classificação das coletas — D-112, 13/11/2026

Pedido aprovado pelo responsável: mostrar Sem dados, Coleta parcial e Coleta completa no Panorama, conforme Controle das coletas; substituir indicadores antigos e publicar no ambiente real.

## Apresentação e comportamento

- O Panorama deixa de exibir Coletas concluídas (quantidade de vistorias) e Coletas pendentes (fila técnica antiga), incluindo o atalho do cabeçalho enquanto esta página está aberta.
- Três indicadores com nomes exatos Sem dados, Coleta parcial e Coleta completa. Cada um abre `/controle-coletas?status=none|partial|complete`, respectivamente.
- Escopo explícito: toda a rede, unidades ativas elegíveis, exatamente como a lista sem busca do Controle das coletas D-111. Filtros de mapa/inventário não alteram esses três totais; o escopo consta no título e descrição.
- Completa depende da classificação do root e permanece completa após novas contribuições até ele mudar. Não depende de visita concluída. Sem dados não significa cadastro administrativo ausente.
- Demandas abertas, hardware, equipamentos, ambientes, mapa, categoria de unidade e identidade Mesa de dados preservados. As páginas técnicas antigas de visitas e planejamento continuam disponíveis, sem alteração dos estados de vistoria ou indicadores próprios fora do Panorama.
- Nenhum novo percentual, regra de preenchimento, classificação automática de completa ou alteração no coletor.

## Fonte e desempenho

GET autenticado `/api/collection-control/summary` retorna `{totals: {none,partial,complete}, scope: "network", server_time}`. Reutiliza literalmente a mesma função SQL de totais da listagem D-111, sobre unidades, classificações e índice de presença. Não carrega páginas, respostas JSON, fotos, telemetria ou inspeções.

Uma consulta ao abrir/retornar ao Panorama; atualização explícita por **Atualizar classificações**. Cabeçalho e cartões compartilham a mesma leitura em memória da aba. Re-renderizações, filtros e polling existente de alertas/comunicação não solicitam novamente esses totais. Não há timer novo nem aumento dos intervalos existentes. A tela mostra data de consulta e instrução para atualizar.

Falha inicial apresenta `—`, nunca zero presumido. Falha posterior conserva última leitura com mensagem de desatualização e permite nova tentativa. Autorização é revalidada em cada requisição, sem cache HTTP dos dados. Somente root/admin/visualizador; operador, primeiro acesso pendente e Worker coletor não podem consultar dados.

## Arquivos e aceite

Servidor: `server/collection-control.mjs`; novo módulo de apresentação `web/collection-overview.js`; integração em `web/desktop.js`, `web/panel-pulse.js`, `web/desktop-demand-count.js`, estilos em `web/painel.css`, empacotamento em `scripts/build-desktop.mjs`. `server/worker.mjs` permite o arquivo estático importado pela moldura da conta, sem liberar API para senha provisória.

Aceite: mesmos totais entre lista e Panorama; decisão root refletida ao retornar/atualizar; completa persistente; atalhos filtrados; falhas explícitas; sem polling adicional; demandas/sino inalterados; leitura pelo visualizador; desktop e 390px. [Qualidade e publicação](../05-qualidade/PANORAMA_COLETAS_2026-11-13.md).

Sem migração ou nova escrita de domínio. Coletor/EXE/APK/Drive/GPS preservados. Reversão: republicar versão anterior do painel, mantendo os dados D-111; nenhum DROP ou restauração sobre atividade recente.
