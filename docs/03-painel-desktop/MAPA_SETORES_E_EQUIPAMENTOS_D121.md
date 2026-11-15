# Mapa de Setores e Equipamentos — D-121

Data: 15/11/2026. Publicado no painel às 09:26 Fortaleza, após autorização expressa do responsável. Worker `03139a13-361a-4a19-8035-a102d5f96520` em 100%; sem migração ou atualização do APK. Conferência autenticada e limites registrados no documento de qualidade abaixo.

## Pedido e decisão

[Especificação original](../06-entregas/mapa-setores-2026-11-15/PEDIDO_ORIGINAL.txt) fornecida pelo responsável. Decisão posterior: **dados atuais, incluindo coletas parciais**, identificadas como PARCIAL. O documento menciona uma imagem de organograma, mas nenhuma imagem dessa nova composição acompanhou o pedido: a implementação segue sua descrição textual. As cinco referências desktop históricas foram abertas; a paleta atual D065/D080 prevalece sobre seu tema escuro.

O item 4.2 pede fotografia imediata, embora o item 8 também a liste como futura: implementada no resumo selecionado conforme o pedido específico. Busca, filtros adicionais e exportação desta estrutura continuam fora da entrega.

## Uso

Em **Unidades → selecionar unidade**, a seção fica logo após a identificação da unidade, antes dos blocos existentes. Conforme ajuste aprovado em 15/11/2026, o organograma cresce da esquerda para a direita: unidade compacta à esquerda, setores em linhas e equipamentos em grade à direita de cada setor, com conectores discretos. Clique no setor para abrir seus equipamentos; clique novamente para recolher. **Lista** mantém sua disposição vertical, sem gravações. A grade aproveita a largura disponível, sem rolagem interna vertical nos setores. Em contêineres até 900 px, a unidade passa ao topo; até 540 px, o título de cada setor também passa acima da grade. Não há necessidade de arrastar horizontalmente para alcançar os equipamentos em telas estreitas.

A seleção destaca um cadastro e abre diretamente sua **ficha em modal**, conforme ajuste posterior de 15/11/2026. Não exige selecionar um resumo nem clicar novamente em Ver dados do equipamento. A janela reutiliza a ficha atual: nome, setor/posição, ID, vínculo, marca PARCIAL quando aplicável, fotografias recebidas, comunicação, conexão e inventário técnico. Root dispõe das ações existentes Editar nome e Apagar cadastro; demais perfis de consulta não recebem nova permissão. Ampliar uma foto abre o visualizador sobre a ficha, preservando seu ambiente/data históricos. Fechar/Escape retorna ao cartão, preservando setores, página, modo e rolagem. O antigo resumo abaixo do organograma foi removido.

**Teste de velocidade**, dentro do modal, aparece ao root para computadores que informaram suporte ao protocolo. Abre `/testes-internet?equipmentId=ID`, selecionando aquele ID e o modo download/upload. **Não agenda nem executa uma medição ao selecionar o equipamento ou abrir o atalho**: permanece necessário clicar em Solicitar teste. A API revalida instalação/vínculo/capacidade ao consultar e solicitar. Sem agente/sem suporte há explicação; impressoras e demais categorias não recebem essa ação. Admin/visualizador não recebem acesso novo aos testes.

## Origem e contagem

- Mesmos `units`, `environments` e `inventory_equipment_all`, sem cadastro paralelo nem migração.
- Unidade deve estar ativa e no escopo vigente. Consulta gerencial apenas root/admin/visualizador no painel; operador continua no coletor.
- Setor atual: `environment_id` da ficha; somente na ausência do FK utiliza o ID em `data_json.environment`. Sempre exige ambiente da mesma unidade. Nome textual não cria vínculo. FK de outra unidade/ID inexistente/nome livre fica em **Setor não informado**.
- Todos os ambientes do cadastro aparecem, inclusive sem equipamento. Grupo não informado aparece quando contém registros.
- Cada ID aparece uma vez. **N cadastros · M itens** separa fichas e quantidade física de lotes, seguindo a semântica da consulta D069. Um lote aparece como uma ficha com sua quantidade, sem gerar dispositivos fictícios. Não decide a pendência geral LOG-08 nem altera os demais contadores.
- PARCIAL acompanha a diferença entre dados atuais salvos e publicados; não transforma coleta em completa nem publica uma visita.
- Blocos de cadastro, números, galeria, ambientes, resultados e consulta publicada permanecem presentes e com seu escopo anterior.

## Contratos de leitura e custo

`GET /api/inventory/unit-equipment-map?unitId=UUID`

Retorna `unit`, `sectors[{id,name,type,records,items,partial_records}]`, totais `records/items`, `source: current`, `server_time`. Sem dados pessoais de autoria, fotos, blobs ou inventários técnicos na consulta de estrutura. Uma consulta de unidade e um batch com catálogo de ambientes/contagens agrupadas (três instruções SQL). Filtra pela unidade e utiliza índices existentes.

`GET /api/inventory/equipment?unitId=UUID&scope=current&sectorId=UUID|unassigned&offset=0`

Reaproveita lista existente, páginas de 50 fichas, totais e fotos prontas. Filtro por setor é aceito somente no escopo atual. `equipmentId=UUID` permite selecionar exatamente a ficha, sem depender de coincidência textual. Escopo publicado e filtro antigo `environmentId` permanecem compatíveis.

`GET /api/root/network-tests/computers?equipmentId=UUID`

Acrescenta filtro exato à consulta existente, mantendo todas as validações de acesso e vínculo. Não escreve pedido de teste.

Sem timer adicional: estrutura ao entrar/atualizar; equipamentos ao abrir setor ou mudar página; ficha exata, fotos e agente ao clicar em um equipamento. Miniaturas por visibilidade no modal; original somente ao ampliar. Alternar Organograma/Lista reaproveita memória desta página, sem requisição. A atualização geral de 60 s preserva esse componente e suas seleções. A ficha completa reutiliza sua atualização existente, sem duplicar a consulta publicada simultaneamente; sua consulta periódica fica suspensa enquanto uma janela de edição/foto está sobre ela. Fechar aborta as leituras da ficha. Cancelamento/identificação de requisições evita renderizar resposta da unidade/setor anterior. Falha é explicitada, nunca convertida em zero. Renomear atualiza o cartão por ACK; apagar recarrega somente a página do setor afetado, com totais vindos do servidor.

## Arquivos e preservação

- Servidor: `server/unit-equipment-map.mjs`, `inventory-equipment.mjs`, rota em `collector.mjs`, filtro exato em `agent-network-tests.mjs`.
- Interface: `web/unit-equipment-map.js`, integração em `desktop.js`, estilos restritos em `painel.css`, ilha preservada em `desktop-blocks.js`; identificação independente da consulta em `desktop-equipment.js`; atalho em `network-tests.js`.
- Build: `scripts/build-desktop.mjs` inclui o novo módulo no bundle autenticado. Nenhum arquivo Android, instalador, protocolo de agente, localização ou coletor foi alterado para D121.
- Testes: `tests/unit-equipment-map.test.mjs`, fixture em `tests/helpers/unit-equipment-map.mjs`, prévia somente localhost em `scripts/preview-unit-equipment-map.mjs`.

[Validação e limites](../05-qualidade/MAPA_SETORES_D121_2026-11-15.md).

## Complemento visual — indicadores de comunicação, 15/11/2026

Responsável pediu uma bola verde/vermelha à direita do computador no organograma, conforme captura fornecida. Computadores e notebooks recebem sinal de 16 px nas duas visualizações; impressoras e outros equipamentos não recebem status de agente fictício.

- Verde: `communicating` e `communicating_with_failure` (falha de inventário não equivale a falta de comunicação).
- Vermelho: `no_recent_communication`, `reported_suspend` ou `reported_shutdown`, com motivo explicitado no tooltip/resumo. Offline significa estado de comunicação, não prova de energia desligada. Prazo de presença de 17 minutos e log de incidentes de mais de 48 horas permanecem inalterados.
- Cinza: sem vínculo, aguardando primeiro contato, revogado, desconhecido ou consulta indisponível. Erro nunca cria offline fictício; próximo retorno válido restaura a cor.

Tooltip informa motivo e último contato em Fortaleza; legenda e nome acessível evitam depender apenas da cor. Resumo selecionado também mostra o estado. Monitoramento reutiliza `panel-status` a cada 15 s em aba visível, sem outro timer/requisição periódica. Até 50 IDs distintos por rodada, alternando lotes quando necessário para não deixar setores sem atualização. Setores recolhidos não entram na solicitação. Pode haver mais linhas consultadas quando há computadores abertos, dentro do limite existente; não se afirma consumo zero.

O evento atualiza apenas os elementos de status, preservando foto, rolagem, foco, seleção e ficha aberta. Respostas mais antigas que a lista recebida são ignoradas. Sem mudanças de servidor, banco, aplicativo, coletor, GPS ou alertas. Arquivos: `web/equipment-signal.js`, `unit-equipment-map.js`, `panel-status.js`, `painel.css`, build e teste de estado/lotes.

## Complemento — organograma horizontal, 15/11/2026

Pedido explícito de implementação, testes e publicação após captura da unidade Bandeira Tribuzzi. Supera somente a composição inicial com unidade central no topo e colunas estreitas de 250 px. A grade mantém ordem, paginação de 50 fichas, seleção, fotos, ficha, bolinhas de comunicação e modo Lista. Não abre setores automaticamente nem acrescenta consultas. Alterações em `web/painel.css` e na descrição acessível/singular de ambiente em `web/unit-equipment-map.js`. [Validação e publicação](../05-qualidade/MAPA_SETORES_HORIZONTAL_2026-11-15.md).

Complemento posterior: [ficha direta em modal, testes e publicação](../05-qualidade/MAPA_SETORES_MODAL_2026-11-15.md). Reaproveita `createEquipmentConsultation` com apresentação modal; consultas embutidas das demais telas conservam seu modo anterior.
