# 08 · Releitura de 09/11/2026 — o que mudou na `main` e o que ainda falta

**Base da revisão original:** commit `eddba99` (08/11). **Base desta releitura:** `origin/main` em `8e59207` (8 commits novos, todos do trabalho local do Codex de 06–08/11 — D-068, D-069, D-070, D-071 e preparação de auditoria — enviados ao GitHub depois do início da revisão). O branch `revisao-producao-2026-11-08` foi rebaseado sobre essa `main`; a pasta foi renomeada de `docs/08-…` para `docs/09-…` porque a `main` ganhou `docs/08-auditoria/`; as migrações propostas passaram de 0016 para **0019 (índices)** e **0020 (miniaturas)**, já que 0016–0018 existem agora.

Conclusão em uma frase: **os 8 commits novos não tratam a lentidão das fotografias nem o coletor V3** — foram funcionalidades novas do painel (consulta de equipamentos, monitoramento, central de demandas, cadastro ampliado). Dos 20 erros, **1 foi resolvido de passagem (ERR-08)**; das 21 lógicas não aplicadas, **2 resolvidas e 4 parciais**; os itens FOTO-01…10 continuam todos abertos e as medições de D1/Drive por foto são idênticas às de 08/11.

## 1. O que entrou na `main` (resumo)

| Commit | Decisão | O que faz | Toca nos achados da revisão? |
|---|---|---|---|
| `beb71a5` | D-068 | Cadastro ampliado de unidades (7 tipos, 15 campos, conveniadas fora do escopo, obras sem coleta), migração 0016, filtro `unit_type` em várias consultas | Não (muda linhas de `collector.mjs`, `in-progress*.mjs`, `photo-gallery.mjs`) |
| `b71a9e3` + `054439b` | D-069 | **Consulta de equipamentos embutida** (`web/desktop-equipment.js`, `server/inventory-equipment.mjs`): lista paginada por unidade/categoria, busca por ID/hostname/ambiente/patrimônio/série, AnyDesk/RustDesk com "Copiar", fotos por equipamento (`/api/inventory/photos?equipmentId=`), ficha técnica do agente, badges PARCIAL e "Não localizado" | **Sim:** resolve ERR-08 e LNA-17; parcial em LNA-12, LNA-13, LNA-14 |
| `38a2dea` + `c704884` | D-070 | Monitoramento: cron **a cada minuto** (`runAgentMonitoring`), notificações de perda de comunicação e troca de peças, sino com badge e diálogo, polling de 15 s (`desktop-notifications.js`), migração 0017 | **Sim:** ICO-07/LNA-16 (sino deixou de ser tela de espera) |
| `82a7740` | D-071 | Central de demandas e "Computadores por unidade/laboratório" (`operations.html/js`, `service-desk.mjs`), contador de demandas no menu a cada 15 s, migração 0018 | Não |
| `a5b5af6` | — | Menus Computadores/Demandas roteados; `desktop-request.js` com timeout e mensagens de 401/403 nas consultas de Configurações | Parcial em ERR-11 (só no painel, só Configurações) |
| `8e59207` | — | `docs/08-auditoria/` (matriz de lógicas, roteiro, verificação), CI com 9 roteiros de navegador, teste V3 ajustado | Não |

Testes executados localmente sobre a `main` atual (Node 22): `photo-storage`, `photo-gallery`, `in-progress-photos`, `collector-v3`, `equipment-consultation`, `agent-monitoring` → 29/29 aprovados. Medição com o script de `evidencias/` repetida: **mesmos números** (leitura de foto = 4 D1 + sessão + 1 Drive; upload = 13–14 D1 + 2–4 Drive; `inspection` = 8 D1).

## 2. Situação item a item

Legenda: ✅ resolvido · ◐ parcial · ✗ não tratado · ↔ comportamento alterado (reavaliar)

### Erros (01_ERROS_ENCONTRADOS.md)

| ID | Situação | Evidência na `main` atual |
|---|---|---|
| ERR-01 `no-store` global | ✗ | `server/worker.mjs:127` continua `response.headers.set('Cache-Control','no-store')` para tudo |
| ERR-02 Ocorrências refaz imagens a cada 15 s | ✗ | `web/desktop-results.js:11,12,16` inalterados |
| ERR-03 painel reconstrói a tela inteira | ✗ (agravado) | `web/desktop.js:140` inalterado; a consulta D-069 chama `refresh:()=>render()` ao abrir/fechar, e `select-unit` (`:175`) agora abre a consulta → mais renders completos e remontagens do mapa por clique |
| ERR-04 coletor usa integral como miniatura | ✗ | `web/collector-v3.js:40` inalterado; `collector-v2.mjs:17` inalterado |
| ERR-05 5 D1 + 1 Drive por foto | ✗ | medido novamente: idêntico |
| ERR-06 `findByProperty` antes de todo upload | ✗ | `server/photo-storage.mjs:94` inalterado |
| ERR-07 fachada nunca aparece | ✗ | `web/desktop.js:36` (`photo()` sem argumentos) |
| ERR-08 célula da matriz ignora categoria | ✅ | `desktop.js:190` passa `data-col`; `inventory-equipment.mjs:102,125` filtra `column_index`; diálogo substituído pela consulta embutida |
| ERR-09 HEIC / preparo pesado | ✗ | `collector-v3.js:71` inalterado |
| ERR-10 bloqueio sem indicador global | ✗ | `collector-v3.js:154,190` inalterados |
| ERR-11 401/403 sem orientação | ◐ | painel: `desktop-request.js` (Configurações) e `desktop-equipment.js:16` tratam 401/403 com mensagem; `desktop.js` (`unitInventory`, `equipmentPage`, `inventorySummary`) e **coletor V3** continuam sem |
| ERR-12 índices em `collection_photos` | ✗ | migrações 0016–0018 não criam índice em `inspection_id`/`unit_id` |
| ERR-13 ícone inexistente vira monitor | ✗ | `desktop-icons.js:33` |
| ERR-14 versão fixa "v1.1 · 28/10" | ✗ | `desktop.js:148`, `:114`, `panel-shell.js` |
| ERR-15 código morto | ✗ | `desktop.js:15` ainda importa `sampleUnits,gallery,regionShapes`; `:136` `sidebarArt`; `:195` galeria DEMO; `:214-215` ramo inalcançável |
| ERR-16 login com PNG de 2,6 MB | ✗ | `web/assets/paisagem-login-v2.png` inalterado |
| ERR-17 recarga total após foto/equipamento | ✗ | `collector-v3.js:66-67` |
| ERR-18 galeria limitada a 50 | ◐ | a rota paginada passou a ser consumida **pela ficha do equipamento** (`desktop-equipment.js:67`); panorama/"Ver todas" seguem no `LIMIT 50` de `/api/inventory/unit` (`collector.mjs:140`) |
| ERR-19 marcadores de exemplo sem botão | ✗ | `desktop-map.js:4,63`, `desktop.js:66` sem botão |
| ERR-20 três rotas para a mesma foto | ✗ (ampliado) | agora quatro consumidores: panorama (`/api/collector/photo`), consulta e viewer (`/api/inventory/photo`), parcial (`in-progress-photo`), ocorrências (`/api/collector/photo`) |

### Lógicas não aplicadas (02_LOGICAS_NAO_APLICADAS.md)

| ID | Situação | Observação |
|---|---|---|
| LNA-01 conferência sem botão no V3 | ✗ | coletor intocado; a consulta D-069 **exibe** "Não localizado na última conferência" (`missing_open`), mas nada no V3 alimenta `missing_equipment_cases` |
| LNA-02 rascunho/duplicidade invisíveis | ✗ | coletor intocado |
| LNA-03 "Corrigir" não leva ao item | ✗ | |
| LNA-04 resquícios do assistente V2 | ✗ | |
| LNA-05 G conclui sem foto da impressora | ✗ | `collector.mjs:111` inalterado |
| LNA-06 revisita marca tudo Concluído | ✗ DECISÃO | |
| LNA-07 `photo-list` sem consumidor | ✗ | |
| LNA-08 `exportCsv()` nunca chamado | ✗ | `desktop.js:158` definida, 0 chamadas |
| LNA-09 Tipo/Ano no diálogo de filtros | ✗ | `desktop.js:186-187` |
| LNA-10 botão de exemplos do mapa | ✗ | |
| LNA-11 cache de detalhe nunca expira | ◐ | a consulta D-069 tem botão "Atualizar" e recarrega ao abrir; `details` do panorama (`desktop.js:18`) continua sem TTL |
| LNA-12 busca global só de unidades | ◐ | busca por ID/hostname/ambiente/patrimônio/série existe **dentro da unidade** (`inventory-equipment.mjs:126`); a busca do cabeçalho segue só unidades |
| LNA-13 `agent_linked` na consulta parcial | ◐ | consulta oficial tem (`inventory-equipment.mjs:111`); `in-progress-equipment` (`in-progress.mjs:39`) continua sem (0 ocorrências) |
| LNA-14 `physical_disks` não exibido | ◐ | consulta oficial lê `physical_disks||disks` (`desktop-equipment.js:29`); `desktop.js` `agentSections` ainda `sto.disks||sto.drives` |
| LNA-15 "Pendentes" sempre "—" | ✗ DECISÃO | `desktop.js:60` |
| LNA-16 telas de espera no menu | ◐ | Notificações: ✅ real (D-070); Planejamento: ganhou blocos de andamento; Relatórios (`desktop.js:111`) e exportações (`:112`) seguem placeholders |
| LNA-17 fotos pela ficha do equipamento | ✅ | `desktop-equipment.js:51,67` + `photo-gallery.mjs` `equipmentId` |
| LNA-18 visão por ambiente | ✗ | |
| LNA-19 ocorrências perdem categoria H | ✗ | `inventory-results.mjs` só ganhou filtro de `unit_type` |
| LNA-20 rota paginada sem uso no painel | ✅ | consumida pela ficha (D-069) |
| LNA-21 prévias só em memória | ✗ | |

### Fotografias (03_DESEMPENHO_FOTOS.md) — FOTO-01 a FOTO-10: **todos ✗**

A única novidade relevante é positiva como **modelo**: `web/desktop-equipment.js` faz o que FOTO-07 pede — `IntersectionObserver` para carregar imagens só quando visíveis (`:54`), reaproveitamento dos nós `<img>` já carregados entre repinturas (`:58-59`), `AbortController` por requisição, retentativa por imagem com erro. Esse padrão deve ser generalizado para `render()` do panorama, para Ocorrências e para o coletor, em vez de reescrito. Porém as miniaturas da consulta (84×74 e 104×80 px) continuam pedindo o **arquivo integral** via `photoSource` → C1 persiste também no código novo.

### Ícones e exibição (04_ICONES_E_EXIBICAO.md)

| ID | Situação |
|---|---|
| ICO-01…06 | ✗ (ICO-03: `desktop-data.js` só encurtou rótulos; TVs e Computadores seguem com o mesmo glifo; `panel-shell.js` usa `monitor` também para o novo menu "Computadores" — três entradas com o mesmo ícone) |
| ICO-07 sino | ✅ notificações reais |
| ICO-08 Exportar matriz | ✗ |
| ICO-09 célula da matriz | ✅ |
| ICO-10 Filtros avançados | ✗ |
| ICO-11 exemplos do mapa | ✗ |
| ICO-12 "Ver todas" > 50 | ◐ (ver ERR-18) |
| ICO-13 `alert-detail` | ✗ (`desktop.js:208`) |
| ICO-14 Relatórios/Planejamento | ◐ (Planejamento com conteúdo; Relatórios placeholder) |
| ICO-15 Ocorrências abre URL crua | ✗ |
| ICO-16…20 coletor | ✗ |
| ICO-21…27 exibição das fotos | ✗ (ICO-23: a consulta D-069 já mostra legenda com ambiente/posição/hostname — padrão a reutilizar) |

### Melhorias (05_MELHORIAS_RECOMENDADAS.md)

| ID | Situação |
|---|---|
| MEL-01 placement, MEL-02 batch, MEL-04 assets, MEL-05 jsQR, MEL-06 blocos, MEL-08 código morto, MEL-09 tema único, MEL-10 IndexedDB, MEL-11 formatação, MEL-13 rota única, MEL-15 selfTest, MEL-16 uploads paralelos, MEL-17/18 | ✗ |
| MEL-03 sessão em cache | ✗ — **mais urgente agora** (ver N-02) |
| MEL-07 observabilidade | ◐ — D-070 monitora agentes; não há `Server-Timing` nem medição de latência das rotas |
| MEL-12 primeiro relatório real | ◐ — "Computadores por unidade/laboratório" (D-071) cobre parte do que MEL-12 propunha; Relatórios segue vazio |
| MEL-14 testes de proteção | ◐ — CI ganhou 5 roteiros de navegador novos, nenhum sobre cache/fotos/contagem D1 |

## 3. Observações novas introduzidas pelas mudanças

**N-01 · Carga de polling multiplicada no painel (Médio).** Com uma aba do painel aberta e visível há agora **quatro ciclos de 15 s**: resultados (`desktop-results.js:16`), coletas em andamento (`desktop-progress.js`), notificações (`desktop-notifications.js:179`) e contador de demandas (`desktop-demand-count.js:200`) — 16 requisições/min, cada uma com a consulta de sessão (`worker.mjs:16`) mais as próprias. Uma aba aberta o dia todo ≈ 23 mil requisições; o cron `* * * * *` (`wrangler.jsonc`) soma 1.440/dia. No plano gratuito do Workers (100 mil req/dia) quatro abas abertas já esgotam a cota. Proposta: um único `GET /api/panel/pulse` que devolve `{results_summary, progress_total, monitoring, demands_pending}` numa requisição a cada 15 s (ou SSE), e MEL-03 para a sessão. Os quatro módulos já pausam com `document.hidden` — manter.

**N-02 · `select-unit` mudou de significado (DECISÃO).** Clicar numa unidade na matriz/lista agora abre a consulta de equipamentos e rola a tela (`desktop.js:175`, `desktop-equipment.js:88`), em vez de só selecionar e atualizar "Unidade Selecionada"/galeria como no layout D-067. O `toast` de seleção foi removido. Confirmar com o responsável se o panorama deve abrir a consulta em todo clique ou só na célula/"Ver equipamentos".

**N-03 · Cada abertura/fechamento da consulta re-renderiza o painel inteiro.** `createEquipmentConsultation({refresh:()=>render()})` → `render()` → `unmountMap()`/`mountMap()` (`desktop.js:140-147`). Ou seja, ERR-03 passou a disparar também por essa via. A correção de FOTO-07/MEL-06 (render por blocos, mapa persistente) resolve as duas.

**N-04 · Consulta `equipmentRead` é pesada por linha (observar).** `inventory-equipment.mjs:106-123`: CTE com 5 `LEFT JOIN`, 3 subconsultas correlacionadas por equipamento (nome do ambiente, `photo_count`, `photo_id`) e um `EXISTS`, executada **duas vezes** por página (contagem + itens, `:130-133`). Usa o índice `collection_photos_target`, então hoje é aceitável; medir quando uma unidade passar de ~300 fichas. Alternativa: materializar `photo_count`/`photo_id` por equipamento numa tabela derivada atualizada no `photo-upload`.

**N-05 · Padrões bons para generalizar (positivo).** `desktop-request.js` (timeout + mensagens 401/403/rede) e `desktop-equipment.js` (imagens preguiçosas, nós preservados, abort, retentativa) são exatamente o que ERR-11, FOTO-07 e ICO-21 pedem. A recomendação muda de "implementar" para "reutilizar": `readPanelJson` em todos os `fetch` de `desktop.js` e em `collector-v3.js:21`; `observeImages`/`paint` como utilitário compartilhado para panorama, Ocorrências, parcial e coletor.

**N-06 · Mesmo ícone em três menus.** `panel-shell.js` usa `monitor` para "Computadores" (novo), "Equipamentos" e a coluna Computadores da matriz. Soma-se a ICO-03/ICO-04: acrescentar `tv`, `menu` e um glifo próprio para "Computadores" (ex.: `cpu`).

**N-07 · O mapeamento de 05/11 foi declarado histórico, mas parte das lacunas persiste.** `09_ESTADO_E_PENDENCIAS.md` passou a dizer que a lista antiga "não deve ser reutilizada como diagnóstico atual sem reproduzir". Esta releitura reproduziu: das 15 lacunas de 05/11, **4 foram fechadas por D-069** (02 fotos por equipamento, 04 `agent_linked` na consulta oficial, 05 `physical_disks` na consulta, 07 categoria da célula) e **11 continuam** (01 fachada, 03 limite de 50 no panorama, 06 Ocorrências sem viewer, 08 colunas antigas em `equipmentTable`, 09/10 categoria H, 11 ambientes, 12 cache, 13 busca global, 14 telas de espera, 15 matriz).

**N-08 · Numeração.** `docs/08-auditoria/` e a pasta desta revisão colidiam em "08"; a revisão passou para `docs/09-…`. As migrações propostas são agora `0019_photo_indexes.sql` e `0020_photo_thumbnails.sql`.

## 4. Referências de linha — tabela de conversão para a `main` atual (`8e59207`)

Os arquivos 01–06 citam linhas do commit `eddba99`. Para os arquivos que mudaram:

| Arquivo | Conversão |
|---|---|
| `web/desktop.js` | +5 até a antiga linha 131; +6 da antiga 142 em diante. Ex.: `photo()` 31→36; `Pendentes` 55→60; `heatColor` 63→68; `photoUrl` 72→77; `showEquipment` 85→90 (reescrita, agora 1 linha); Relatórios 106→111; Exportar 107→112; Configurações 109→114; `render()` 133-145→138-150 (`innerHTML` 135→140); `#mode-note` 142→148; `exportCsv` 152→158; `input` 158→164; `select-unit` 169→175 (comportamento novo); `map-examples` 176→182; `filters` 180→186; `cell` 184→190; galeria DEMO 189-194→195-200; `alert-detail` 202→208; `notifications` 207→213 (agora aciona o sino real); `profile` 208-209→214-215 |
| `server/worker.mjs` | `current()` 13→16; `export default`/`no-store` 121→**127**; lista de assets do coletor 107→~113 |
| `server/collector.mjs` | +2 a partir da antiga linha 39: `inspection` 40-43→40-45; `equipment-list` 55→57; `equipment-save` 58-102→60-104; `verify` 104→106; `inventory-section` 109→111; `photo` GET 117→119; `photo-list` 118→120; upload 119-129→121-131; `/api/inventory/unit` 138→140; `/api/inventory/equipment` 139→141 (agora delega a `inventory-equipment.mjs`) |
| `server/in-progress.mjs` | `in-progress-equipment` 42→39 |
| `server/photo-gallery.mjs`, `server/in-progress-photos.mjs`, `server/collector-v2.mjs`, `server/collector-v3.mjs`, `server/photo-storage.mjs`, `web/collector-v3.js`, `web/collector-ui.js`, `web/collector-v3.css`, `web/desktop-results.js`, `web/desktop-progress-photos.js`, `web/photo-viewer.js` (exceto `photoDate`), `web/desktop-map.js`, `web/desktop-icons.js`, `migrations/0006` | sem alteração de linhas citadas |

## 5. O que ainda falta — plano ajustado

As cinco fases de `06_PLANO_DE_CORRECAO.md` continuam válidas; ajustes:

- **Fase 1 (inalterada, continua a prioridade):** FOTO-01/03/04/08/09, ERR-01/02/05/06/12/16. Migração agora `0019_photo_indexes.sql`. Acrescentar **MEL-03 (sessão em cache)** à fase 1 por causa de N-01.
- **Fase 2 (miniaturas):** migração `0020_photo_thumbnails.sql`; incluir a consulta D-069 (`desktop-equipment.js:42,51` → `size=thumb`) e as notificações, que também listam equipamentos.
- **Fase 3 (painel):** retirar ERR-08 (feito); manter ERR-03/07/18/19, LNA-08/09/11, MEL-06; **acrescentar N-01 (endpoint único de polling), N-03 (consulta sem `render()` completo) e N-05 (reutilizar `readPanelJson`/`observeImages`)**; LNA-13 agora é só `in-progress.mjs:39`; LNA-14 só `desktop.js` `agentSections`. N-02 depende de DECISÃO.
- **Fase 4 (coletor V3):** inalterada — nenhum item foi tocado. ERR-11 pode copiar `desktop-request.js` em vez de `collector.js:13`.
- **Fase 5:** acrescentar N-04 (medir `equipmentRead` com volume) e N-06 (ícones `tv`/`menu`/`cpu`).

Decisões ainda em aberto (ver `07_INSTRUCAO_CODEX.txt`): LNA-06, LNA-12 (busca global — parcialmente respondida pela busca por unidade), LNA-15, LNA-16 (agora só Relatórios/exportações), ICO-02, ERR-19, MEL-12 (parcialmente coberto por D-071), MEL-17, **mais N-02** (clique na unidade abre a consulta?).

## 6. Método desta releitura

`git fetch` + `git diff --stat eddba99 origin/main`; leitura integral dos módulos novos (`desktop-equipment.js`, `inventory-equipment.mjs`, `desktop-notifications.js`, `desktop-demand-count.js`, `desktop-request.js`, `agent-monitoring.mjs` parcial) e dos diffs de `desktop.js`, `worker.mjs`, `collector.mjs`, `photo-gallery.mjs`, `in-progress*.mjs`, `panel-shell.js`, `wrangler.jsonc`, `ci.yml`; leitura de `docs/08-auditoria/README.md`, `VERIFICACAO_2026-11-08.md` e do diff de `09_ESTADO_E_PENDENCIAS.md`; reexecução dos testes de fotos/V3/consulta/monitoramento e do script `evidencias/medir-fotos.mjs` sobre a `main` atual; conferência por `grep` de cada item da revisão no código atual. Nenhum arquivo de código foi alterado; nada foi publicado.
