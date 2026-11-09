# 02 · Lógicas não aplicadas

Funções que existem no servidor, no esquema ou no código do cliente mas **não chegam ao usuário**: handlers sem botão, rotas sem consumidor, dados devolvidos e não exibidos, telas de espera no menu, código remanescente do protótipo. Para cada uma: evidência (arquivo:linha), efeito prático e o que fazer. Itens marcados **DECISÃO** dependem do responsável, conforme `AGENTS.md` ("não resolver pontos pendentes como se estivessem aprovados").

---

## Coletor V3 (`web/collector-v3.js`)

### LNA-01 · Conferência de equipamentos existe no servidor e no handler, mas não há botão
- **Evidência:** rota `POST /api/collector/verify` (`server/collector.mjs:104`) aceita "Verificado sem alterações / Não verificado / Não localizado" com justificativa; handler `a==='verify'` em `collector-v3.js:184`; a lista `inventory()` (`:45`) **não renderiza** nenhum botão com `data-action="verify"` (confirmado por busca: 0 ocorrências de `data-result`). O coletor original (`web/collector.js:48`) tinha os três botões.
- **Efeito:** a revisão informa "N equipamento(s) não conferido(s)" (`:53`) e o operador não tem como conferir. `missing_equipment_cases` nunca é alimentado pelo V3; o painel exibe "NÃO LOCALIZADO" só para registros antigos.
- **Fazer:** acrescentar em cada cartão da lista um menu "Conferir: sem alterações / não localizado (justificar)"; exibir `verification` da linha (a rota `equipment-list` já devolve `v.result AS verification`). **DECISÃO:** confirmar se a conferência é obrigatória no roteiro V3 (D-057) ou apenas disponível.

### LNA-02 · Rascunho, duplicidade e "não localizado" não aparecem na lista de equipamentos
- **Evidência:** `equipment-list` devolve `duplicate_flag`, `verification`, `data.draft` (`collector.mjs:55`); `inventory()` mostra apenas categoria, ambiente, funcionamento e estado do agente (`collector-v3.js:45`). A revisão (`reviewV3`, `server/collector-v3.mjs:39`) bloqueia a conclusão com "Complete e salve as fichas iniciadas nesta visita" e devolve `details['draft:<id>']`, que o V3 **descarta** (`review()` em `:53` só lê `errors`).
- **Efeito:** o operador recebe "complete as fichas" sem saber qual; uma ficha criada pelo QR ou por foto antes de salvar (`saveDraft`, `:65`) fica invisível como rascunho depois de recarregar a página (o estado `item` vive só na aba).
- **Fazer:** badge "Rascunho — complete a ficha", "Duplicidade em análise", "Não localizado" no cartão; na revisão, listar os itens de `details` com botão "Abrir ficha" que executa a mesma rotina de `edit`.

### LNA-03 · "Corrigir" da revisão não leva ao item
- **Evidência:** `collector-v3.js:186` — chave `photo:<id>` abre sempre o assunto G; `agent:<id>`/`draft:<id>` não têm tratamento (caem no `topics.some` e não abrem nada).
- **Fazer:** mapear `photo:`/`draft:`/`agent:` para abrir a ficha correspondente (`edit` com `data-id`) e rolar até o bloco de fotos.

### LNA-04 · Resquícios do assistente por etapas (V2) no V3
- **Evidência:** handlers `previous`, `next` (`:159`), `item-next` (`:177`), `return-environment` (`:165`), `first` (`:166`) sem nenhum botão correspondente; variável `step` gravada na URL (`etapa`, `:23`) e usada em `showError` (`:70`) para posicionar um passo que o `equipmentForm()` não tem; `environmentReturn` (`:164`) nunca é consumido porque o campo tipo `environment` não existe no catálogo V3 (`collector-v3-schema.js:25` usa texto livre).
- **Efeito:** sem impacto funcional hoje, mas confunde manutenção e mantém o risco descrito em 04 (se um botão `complete-inventory` fosse exibido na tela Ambientes aberta a partir de um equipamento, concluiria o assunto F/G em vez de B).
- **Fazer:** remover handlers, `step`/`etapa` e `environmentReturn`; manter `tela` e `assunto` na URL.

### LNA-05 · Assunto G pode ser concluído sem a foto obrigatória da impressora
- **Evidência:** `reviewV3` gera `errors['photo:<id>']` (`server/collector-v3.mjs:41`), mas `inventory-section` só verifica `result.errors[data.section]` (`server/collector.mjs:109`); a chave `photo:…` não é `G`.
- **Efeito:** "Concluir assunto" em Impressoras passa; o erro só aparece na revisão final, longe do contexto.
- **Fazer:** em `inventory-section`, para `section==='G'`, também bloquear quando existir qualquer `errors['photo:…']` cujo equipamento seja impressora; devolver a lista de ids para o cliente destacar.

### LNA-06 · Revisita marca todos os assuntos como "Concluído" antes de qualquer conferência
- **Evidência:** `startV3` (`server/collector-v3.mjs:13`) copia as respostas da última visita concluída e grava `state='Concluído'` em todos os assuntos exceto A; `equipment-save` recusa alterações enquanto F/G/O estiverem concluídos (`collector.mjs:65-66`, "Reabra este assunto").
- **Efeito:** na segunda visita a uma escola, o operador precisa "reabrir" cada assunto (confirm) antes de editar; qualquer toque em "+ Adicionar" dá erro 409 se ele não reabriu.
- **Fazer (DECISÃO):** iniciar revisita com estado "Em andamento · respostas da visita anterior" (conteúdo copiado, conclusão manual exigida de novo), ou manter e abrir automaticamente o diálogo de reabertura ao tocar em "+ Adicionar".

### LNA-07 · Rota `photo-list` não tem consumidor no V3
- **Evidência:** `GET /api/collector/photo-list` (`collector.mjs:118`) devolve fotos por alvo; o V3 usa o histórico completo de `inspection` (`:43`). Só há 1 referência no cliente, no coletor antigo.
- **Fazer:** usar `photo-list` (com miniaturas e `LIMIT`) ao abrir a ficha, e tirar `v2Evidence` da carga inicial (FOTO-05).

---

## Painel (`web/desktop.js` e módulos)

### LNA-08 · Exportação da matriz existe e nunca é chamada
- **Evidência:** `exportCsv()` (`desktop.js:152-157`) gera o CSV da matriz com `;` e BOM; nenhuma chamada (busca: só a definição). O botão "Exportar matriz" (`:99`) executa `navigate('Exportar dados')` (`:206`), cuja página oferece apenas "Unidades cadastradas"; "Equipamentos" e "Ocorrências" estão `disabled` (`:107`).
- **Fazer:** botão "Exportar matriz" → `exportCsv()`; na página Exportar, habilitar "Equipamentos (matriz por unidade)" com `exportCsv()` e "Equipamentos (fichas publicadas)" paginando `/api/inventory/equipment`; "Ocorrências" paginando `/api/inventory/findings`. Reutilizar `spreadsheet-io.js` para XLSX.

### LNA-09 · Filtros "Tipo de unidade" e "Ano" não chegam ao diálogo; `year` é inerte
- **Evidência:** `state.year` existe (`:22`), é zerado em `clear-filters` (`:183`) e entra em `hasFilters()` (`:40`), mas nenhum `select('…','year',…)` é renderizado e `filteredCatalogue()` (`:30`) não o usa; o diálogo "Filtros avançados" (`:181`) só tem Regional e Situação, embora a barra tenha Tipo.
- **Fazer:** incluir Tipo no diálogo; implementar Ano (ano da última visita concluída, via `inventory.visits[].latest`) ou remover `year`.

### LNA-10 · Botão de locais de referência do mapa nunca é renderizado
- **Evidência:** ver ERR-19 (`desktop-map.js:104` vs `desktop.js:61`).

### LNA-11 · Cache de detalhe da unidade nunca expira
- **Evidência:** `details` (`desktop.js:18`) só é limpo em `onCompleted` de uma coleta acompanhada na mesma aba (`:6`). Publicações feitas por outro operador não aparecem até recarregar a página. Lacuna 12 do mapeamento.
- **Fazer:** TTL de 60 s + botão "Atualizar" no detalhe; invalidar quando `inventorySummary()` mudar (`published_unit_status.latest`).

### LNA-12 · Busca global anuncia "unidade ou equipamento" e só busca unidade
- **Evidência:** placeholder em `panel-shell.js` ("Buscar unidade ou equipamento"); `filteredCatalogue()` (`desktop.js:30`) compara nome, código e gestor. Lacuna 13.
- **Fazer (DECISÃO):** rota `/api/inventory/search?q=` (ID permanente, AnyDesk/RustDesk, série, hostname do agente) ou ajustar o texto para "Buscar unidade".

### LNA-13 · Estado do agente ausente na consulta parcial
- **Evidência:** `in-progress-equipment` (`server/in-progress.mjs:42`) não devolve `agent_linked` (0 ocorrências no arquivo); `equipmentTable()` (`desktop-inventory.js:8`) interpreta `registration==='Agente'` sem `agent_linked` como "Vínculo do agente pendente". Lacuna 04; reproduzido na auditoria de 05/11.
- **Fazer:** acrescentar `EXISTS(SELECT 1 FROM agent_equipment_links l WHERE l.equipment_id=e.id AND l.ended_at IS NULL) AS agent_linked` à consulta e habilitar "Dados do agente" na tabela parcial.

### LNA-14 · `physical_disks` aceito pelo contrato e não exibido
- **Evidência:** `desktop.js:78` lê `sto.disks||sto.drives`; o validador do agente aceita `storage.physical_disks` (`server/agentes/nucleo/validate.mjs`). Lacuna 05.
- **Fazer:** `sto.disks||sto.drives||sto.physical_disks`, normalizando `size_bytes`/`media_type`.

### LNA-15 · Indicador "Pendentes" sempre "—"
- **Evidência:** `desktop.js:55` (`['Pendentes','file','red',null,'Critério pendente']`).
- **Fazer (DECISÃO):** definir o critério (unidades ativas sem visita concluída? ocorrências sem tratamento?) ou retirar o cartão até a definição, para não exibir um indicador vazio ao gestor.

### LNA-16 · Relatórios, Planejamento, Notificações e exportações são telas de espera com entrada no menu
- **Evidência:** `desktop.js:106` (Relatórios: "Aguardando dados oficiais"), `:108` (Planejamento: "ainda não está disponível" + bloco de andamento), `:207` (sino: "serviço de notificações ainda não está integrado"), `:107` (opções `disabled`). Lacuna 14.
- **Fazer (DECISÃO):** ocultar entradas sem função (ou marcá-las "em breve" no menu) e priorizar um relatório real por vez (ver MEL-12).

### LNA-17 · Fotos acessíveis pela ficha do equipamento
- **Evidência:** metadados têm `target_kind='equipment'` + `target_id`; `equipmentTable()` não oferece "Fotos deste equipamento"; a galeria é geral. Lacuna 02.
- **Fazer:** coluna/botão "Fotos (n)" que abre `openPhotoViewer` filtrado por `target_id`, usando `/api/inventory/photos?kind=equipment` + filtro local ou nova query param `targetId`.

### LNA-18 · Ambientes sem visão de sala (equipamentos + fotos filtrados)
- **Evidência:** página Ambientes (`desktop.js:104`) = lista + galeria geral. Lacuna 11.
- **Fazer:** ao clicar num `environment-tile`, abrir diálogo com equipamentos (`environment_id`) e fotos (`target_kind='environment'` ∪ fotos dos equipamentos daquela sala).

### LNA-19 · Ocorrências perdem a categoria original do assunto H
- **Evidência:** `server/inventory-results.mjs` reduz Computador/Impressora/Outro a "Demanda geral" (lacuna 10 do mapeamento, reproduzida em 05/11).
- **Fazer:** preservar `type` original no registro derivado e exibi-lo como subtítulo; manter o agrupamento atual como filtro.

---

## Servidor

### LNA-20 · Rota paginada de fotos (`/api/inventory/photos`, D-064) pronta e não usada pelo painel
- **Evidência:** `server/photo-gallery.mjs` (paginação por cursor, filtros `unitId/kind/scope`, testes em `tests/photo-gallery.test.mjs`); nenhum módulo do painel a consome desde a retirada da página `/fotografias` (D-065). O panorama usa o `LIMIT 50` de `/api/inventory/unit`.
- **Fazer:** ver ERR-18 — "Ver todas" e o viewer passam a paginar por essa rota.

### LNA-21 · `offlineEnabled:false` e prévias só em memória
- **Evidência:** `collector.mjs:36`; `previews` (`collector-v3.js:14`) e `createDraftQueue` são `Map` em memória; `beforeunload` (`:191`) é a única proteção.
- **Fazer (pendência já registrada em `09_ESTADO_E_PENDENCIAS.md`):** ver MEL-10 (rascunho e prévias em IndexedDB da própria aba, sem prometer offline durável).
