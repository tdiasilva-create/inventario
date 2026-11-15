# MAPA DE DADOS E AÇÕES — Inventário Tecnológico SEMED

**Data da análise:** 06/11/2026 (noite) · **Fonte:** código real copiado do PC (`C:\Users\SIGAE\Documents\Codex\INVENTARIO`, pastas `web/`, `server/`, `migrations/`, `docs/00-governanca/`) após as decisões D-057 a D-068.
**O que este documento responde:** (1) cada dado que o coletor recolhe → onde ele é gravado no D1 → em que tela do painel ele aparece e em que estado; (2) o que cada botão faz, no coletor, no painel e nas telas do root/admin (chamada ao servidor, efeito no banco, efeito na tela).
**O que ele não faz:** não propõe mudanças. As observações da Parte 8 são pontos para conversa, não decisões.

---

## 0. Como ler · estados dos dados

| Estado | Significado | Onde aparece |
|---|---|---|
| **Digitação local** | Texto digitado no celular ainda não enviado (fila `collector-drafts.js`, só em memória da aba; não há modo offline). | Só na tela do operador. Some se a aba fechar. |
| **Rascunho no servidor** | `section-save` ou `equipment-save` confirmado; `inspection_sections.state='Em andamento'` ou ficha com `draft:true`. | Coletor (retomada) e painel **Coletas em andamento** com selo *PARCIAL*. |
| **Assunto concluído** | `inspection_sections.state='Concluído'` (cartão A/C/D/H via `section-save complete:true`; B/F/G/O via `inventory-section`). | Coletor (cartão verde) e Coletas em andamento (selo "Concluído"). Ainda **não** entra nos números oficiais. |
| **Vistoria concluída = publicado** | `inspections.state='completed'`; `data_json` copiado para `published_json`; `published_*` recalculados. | Panorama, Unidades, Detalhe, Ambientes, Equipamentos, Ocorrências, matriz, galeria oficial. |
| **PARCIAL** (painel) | Visita aberta: alteração ainda não publicada sobre um bem já publicado, ou ficha nova. | Coletas em andamento; selo "PARCIAL" na lista de equipamentos da unidade e na consulta do agente. |

**Perfis:** `root`, `admin`, `operador`, `visualizador`. Escrita de coleta: root/admin/operador. Consulta gerencial (`/api/inventory/*`): root/admin/visualizador (operador recebe 403). Cadastro/exclusão de unidades, atribuições, segurança, agentes e Google Drive: só root. Usuários: root e admin (admin não cria root/admin).

**Escopo de unidades (D-068):** `Escola conveniada` = legado fora do escopo (não aparece em lugar nenhum, só no cadastro do root para inativar/excluir). `Obra em andamento` = aparece no painel/cadastro, **não** aparece no coletor (`collectorHiddenTypes`). Unidades inativas (`active=0`) somem do coletor e das consultas.

---

## 1. Fluxo geral (de onde sai e para onde vai)

```
CELULAR (coletor V3)                      D1 (semed-inventario-auth)                       PAINEL (desktop)
──────────────────────                    ──────────────────────────────                   ─────────────────────────────
lista de unidades ──v3-start──────────▶  inspections (open) + 8 inspection_sections        Coletas em andamento (lista)
fachada ──photo-upload────────────────▶  collection_photos (facade, status ready)          Coletas em andamento › fotos (PARCIAL)
A/C/D/H ──section-save────────────────▶  inspection_sections.data_json (+history)          Coletas em andamento › Respostas salvas
B ambientes ──environment-save────────▶  environments (por unidade, permanente)            Ambientes cadastrados (parcial) / Ambientes (oficial)
F/G/O fichas ──equipment-save─────────▶  equipments | miscellaneous_equipments.data_json   Equipamentos salvos nesta coleta (PARCIAL)
QR agente ──pairings/claim────────────▶  agent_equipment_links + data_json (registration)  "Agente vinculado" / Dados do agente
conferência ──verify──────────────────▶  equipment_verifications / missing_equipment_cases "NÃO LOCALIZADO" / contagem no detalhe
revisar ──review──────────────────────▶  (só leitura: reviewV3)                            —
CONFIRMAR CONCLUSÃO ──finish──────────▶  state=completed · published_json=data_json ·      Panorama · Unidades · Detalhe · Ambientes ·
                                          inspection_environments · published_unit_status · Equipamentos (matriz) · Ocorrências · galeria
                                          published_equipment_counts (gatilhos)             oficial · aba "Com inventário" do coletor
```

Regra central: **nada do que o operador grava entra nos números oficiais antes do botão "Confirmar conclusão"** da revisão. Até lá tudo é PARCIAL e só a página *Coletas em andamento* (e o próprio coletor) mostra.

---

## 2. Dados recolhidos → onde ficam → onde aparecem

Legenda das colunas "Aparece em": **COL** = coletor; **CEA** = painel › Coletas em andamento (parcial, atualização a cada 15 s); **OFI** = painel oficial após publicação (Panorama/Unidades/Detalhe/Ambientes/Equipamentos/Ocorrências).

### 2.1 Início da visita (botão da unidade na lista)

| Dado | Gravado em | Aparece em |
|---|---|---|
| Unidade escolhida, quem iniciou, quando | `inspections(id, unit_id, questionnaire_version='coleta-3.0', created_by, created_at, state='open', revision)` | CEA: "Iniciada por … · data"; coletor: aba *Pendentes* passa a "Em preenchimento". |
| Cópia das respostas da última visita concluída (C, D, H, B, F, G, O) | `inspection_sections` da nova visita, já com `state='Concluído'` quando havia visita anterior; **A (acompanhante) começa vazio** | COL: cartões já "Concluído" numa revisita; CEA: selos. |
| Rascunho antigo (V2) existente | `inspections.state='paused'` + `collection_history 'inspection_preserved_for_v3'` | CEA: evento "Vistoria anterior preservada; nova coleta iniciada"; galeria com escopo *paused*. |

### 2.2 Fachada

| Dado | Obrigatório | Gravado em | Aparece em |
|---|---|---|---|
| Foto da fachada (JPEG/PNG/WebP ≤ 30 MB, redimensionada a 1600 px / ≤ 3 MB; até 5 por alvo por visita) | **Sim** (bloqueia a conclusão: "Envie a fotografia inicial da fachada.") | `collection_photos(id, inspection_id, unit_id, target_kind='facade', target_id=unit_id, status pending→ready, object_key, storage_provider, created_by)` · arquivo em R2 ou Google Drive · `collection_history 'photo_received'` | COL: miniaturas na tela Fachada. CEA: bloco "Fotografias recebidas nesta coleta" (PARCIAL). OFI: Panorama › *Evidência da Última Coleta* (primeira foto), *Galeria da Coleta* (4 primeiras), Detalhe/Ambientes › Galeria, visualizador de fotos (`/api/inventory/photo`). |

### 2.3 A — Acompanhante

| Campo (chave JSON) | Obrigatório | Gravado em | Aparece em |
|---|---|---|---|
| Nome completo do acompanhante (`name`) | Não | `inspection_sections` (section `A`) `.data_json` | CEA e OFI › "Questionário recebido" › bloco **A · Acompanhante** (`answerDetails`). |
| Cargo ou função (`role`: Direção, Coordenação, Secretaria, Professor(a), Funcionário(a), Outro) | Não | idem | idem |

Observação: V3 não coleta telefone (`phone`); a função `hideContact` que esconde telefone do visualizador só tem efeito em visitas V2.

### 2.4 C — Internet

| Campo | Obrigatório | Gravado em | Aparece em |
|---|---|---|---|
| A unidade possui internet? (`exists`: Sim / Não / Não foi possível verificar) | Sim | `inspection_sections` (`C`) | Questionário recebido › **C · Internet** (CEA e OFI) |
| Quantos links? (`linkCount`: 1 / 2 / 3 ou mais / Não foi possível identificar) | Sim, se existe | idem | idem |
| Por link (`links[]`): provedor (`provider`), tipo (`type`: Fibra/Rádio/Cabo/4G–5G/Satélite/Outro/Desconhecido), velocidade contratada Mbps (`contracted`), quedas frequentes (`drops`), frequência (`frequency`, se quedas), avaliação do coletor (`quality`), satisfação da unidade (`satisfaction`), problemas (`problems`) | provider/type/contracted/drops/quality/satisfaction obrigatórios; frequency se drops=Sim; nº de linhas tem de bater com `linkCount` | idem (cada link tem `id` próprio) | Questionário recebido (lista por link). **Também viram registro em Ocorrências** (tipo *Internet*) quando `problems` está preenchido ou `drops='Sim'` (texto "Quedas: frequência"). Entram na contagem "ocorrências de infraestrutura" do painel *Alertas e Insights*. |

### 2.5 D — Redes Wi-Fi

| Campo | Obrigatório | Gravado em | Aparece em |
|---|---|---|---|
| Por rede (`networks[]`): nome da rede (`ssid`), observações/problemas (`notes`) | ssid obrigatório | `inspection_sections` (`D`) | Questionário recebido › **D · Redes Wi-Fi**. `notes` preenchido vira registro em **Ocorrências** (tipo *Rede/Wi-Fi*, "Wi-Fi · SSID"). |

### 2.6 B — Ambientes

| Campo | Gravado em | Aparece em |
|---|---|---|
| Nome do ambiente (digitado na tela Ambientes **ou** no campo "Qual ambiente?" da ficha) | `environments(id, unit_id, name, name_key, type='', created_by)` — **tabela permanente da unidade** (não depende da visita); reutiliza o mesmo registro quando o nome normalizado já existe; `collection_history 'environment_created'` | COL: lista na tela Ambientes e como texto na ficha. CEA: "Ambientes cadastrados na unidade". OFI: ao publicar, a lista é congelada em `inspection_environments` → Panorama/Detalhe/Ambientes › *Ambientes individualizados* e métrica **Ambientes Mapeados** (`published_unit_status.environment_count`). |
| Foto do ambiente (opcional) | `collection_photos(target_kind='environment', target_id=environment.id)` | CEA › fotos (PARCIAL); OFI › galeria da unidade. |
| Assunto B marcado como concluído | `inspection_sections(B).state` | Cartão / selo. |

### 2.7 F — Computadores (ficha individual; `mode='Individual'`, `quantity=1` sempre)

Tabela: `equipments`. Colunas próprias: `id` (ID permanente, UUID), `unit_id`, `inspection_id` (visita que tocou por último), `environment_id`, `category`, `asset`, `serial`, `data_json` (rascunho/ficha corrente), `published_json` (última publicação), `version`, `position_label`, `position_description`, `location_state`, `location_confirmed_by/at`, `verified_at/by`, `published_verified_at`, `duplicate_flag`, `search_text`, `updated_by/at`.

| Campo (chave em `data_json`) | Obrigatório | Aparece em |
|---|---|---|
| Tipo de computador (`category`: desktop / notebook; vazio = gravado como `computer`) | Não | COL: ícone e título da ficha. OFI: coluna **Computadores** da matriz (desktop e "computer") ou **Notebooks**; tabela de equipamentos: "Computador desktop", "Notebook" ou "Computador (tipo não informado)". |
| Cadastro (`registration`: Agente / Manual) | Sim | COL: "Agente vinculado / Vínculo pendente / Cadastro manual" no cartão. Painel: etiqueta `agent-flag` na tabela de equipamentos ("Agente vinculado", "Vínculo do agente pendente", "Sem agente · motivo"). Bloqueia a conclusão se Agente sem vínculo. |
| Motivo da ausência do agente (`manualReason`: Não liga / Windows não inicia / Instalação falhou / Sem permissão / Sistema incompatível / Outro) | Sim, se Manual | Painel: "Sem agente · motivo" e dentro de "Ver ficha publicada". |
| Qual ambiente? (`environmentName` → resolvido para `environment` = id em `environments`) | Sim | COL: linha do cartão. CEA/OFI: coluna **Ambiente / posição**. |
| Posição no ambiente (`position_label`, ≤ 64) | Sim | COL: cartão ("Secretaria · PC 2"). Painel: coluna Ambiente/posição (sub-linha), consulta do agente, lista de agentes do root. |
| AnyDesk (`anydesk`) e RustDesk (`rustdesk`) — só dígitos | Não | Painel: somente dentro de "Ver ficha publicada" / "Ver ficha parcial" (campo a campo). |
| Situação do patrimônio (`assetStatus`: Possui patrimônio / Sem patrimônio / Etiqueta ilegível / Não identificado) | Sim | Painel: dentro da ficha (campo a campo). **Ver Parte 8 (número do patrimônio).** |
| Origem do equipamento (`computerOrigin`: Adquirido por pedido à SEMED / recursos próprios / Contrato de locação / Outros / Não sabe informar) | Não | Painel: dentro da ficha. |
| Funcionamento observado (`operation`: Funcionando / Funciona parcialmente / Não funciona / Não foi possível testar) | Sim | COL: cartão. OFI: coluna **Conservação / Funcionamento**; Panorama › "Computadores funcionando" (bloco do mapa), "Computadores e impressoras recebidos" (parcialmente / sem funcionar / não testados), Detalhe › "Funcionamento e impressoras da unidade". |
| Descrição dos problemas (`problems`) | Sim se parcial/não funciona | OFI: coluna **Problemas e ação**; vira registro **"Equipamento com problema"** em Ocorrências (também quando operation ∈ {parcial, não funciona}); conta em "fichas de bens com problema" (Alertas). COL: aparece no resumo "Problemas já registrados" do assunto H. |
| Foto do computador (opcional) | Não | `collection_photos(target_kind='equipment', target_id=ficha)`; galeria parcial/oficial. |
| Vínculo com o agente (QR) — `agent_equipment_links(link_id, device_id, equipment_id, inspection_id, linked_at, device_confirmed_at, ended_at, end_reason)` + `data_json.registration='Agente'`, `environment`, `position_label`, `location_state='confirmada_em_visita'` | — | COL: "Computador vinculado · confirmado pelo servidor". Painel: botão **Dados do agente** (consulta `/api/inventory/agent-status`: ficha oficial, PARCIAL se a visita estiver aberta, comunicação, inventário técnico — hostname, fabricante/modelo, série do agente, CPU, memória, discos, vídeo, rede, SO, último boot, domínio — e histórico de localização). Configurações (root) › "Agentes e vínculos". |
| Confirmação de posição sem QR (botão "Confirmar posição") | — | `equipment_location_history` + colunas `location_*` da ficha; `collection_history 'equipment_location_changed'`. Painel: "localização confirmada" na sub-linha. |

Regras do servidor em `equipment-save`: rascunho (`draft:true`) só valida ambiente/posição/AnyDesk/RustDesk e exige escolher Agente ou Manual; ficha completa valida tudo; ficha existente exige trava (`equipment_locks`, token) e versão igual (senão 409 "Outra sessão alterou…"); gravação bloqueada se o assunto F estiver "Concluído" (409 "Reabra este assunto"); patrimônio ou série já existente em outra ficha marca `duplicate_flag=1` (evento `equipment_duplicate_flagged`; o painel mostra "DUPLICIDADE EM ANÁLISE") e **essa ficha não é publicada na conclusão** enquanto a marca existir. Totais por unidade mantidos por gatilho em `unit_collection_totals` (fichas, itens, problemas) e `inspection_collection_totals` (fichas desta visita, novas × de bens já publicados).

### 2.8 G — Impressoras (tabela `equipments`, `category='printer'`)

| Campo | Obrigatório | Aparece em |
|---|---|---|
| Qual ambiente? (`environmentName`) | Sim | Coluna Ambiente/posição. |
| Marca (`brand`), Modelo (`model`) | Não (texto; "Não identificado") | OFI: Detalhe › "Impressoras por marca e funcionamento" (lista marca · funcionamento · quantidade); Ocorrências ("Marca: …"); dentro da ficha. |
| Funcionamento (`operation`) | Sim | Coluna Conservação/Funcionamento; contagem **Impressoras** nos blocos de resultados. |
| Problemas (`problems`) | Não | Coluna Problemas e ação; Ocorrências "Equipamento com problema". |
| Origem (`origin`), Aquisição (`acquisition`), Suprimentos (`supplies`), Conexão (`connection`: USB/Cabo de rede/Wi-Fi/Não conectada/Não identificado), IP (`ip`, se cabo/Wi-Fi) | Não | Dentro da ficha ("Ver ficha publicada"). |
| **Foto da impressora** | **Sim** (bloqueia a conclusão: "Envie a fotografia inicial da impressora.") | Galeria; `collection_photos(target_kind='equipment')`. |

Matriz: coluna **Impressoras**. Ocorrências/Alertas: idem computadores.

### 2.9 O — Outros equipamentos (tabela `miscellaneous_equipments`, `category='other'`)

| Campo | Obrigatório | Aparece em |
|---|---|---|
| Qual equipamento? (`customCategory`) | Não | COL: título do cartão. Painel: nome na tabela de equipamentos (coluna 1) quando listado. |
| Ambiente | Não pedido | Coluna mostra "—". |
| Foto (opcional) | Não | Galeria. |

Esses registros entram na view `inventory_equipment_all` (lista de equipamentos da unidade, CEA e OFI, Ocorrências se houver `problems`). **Contagem na matriz: ver Parte 8, item 2.**

### 2.10 H — Problemas (adicionais)

| Campo | Obrigatório | Gravado em | Aparece em |
|---|---|---|---|
| Resumo "Problemas já registrados" (só leitura; derivado de C, D e fichas) | — | nada novo | COL. |
| Por ocorrência (`occurrences[]`): categoria (`type`: Internet / Wi-Fi / Computador / Impressora / Energia que afeta TI / Outro), descrição (`description`) | ambos | `inspection_sections` (`H`) | Questionário recebido › **H · Problemas**; **Ocorrências** com tipo mapeado: Energia que afeta TI → *Energia*; Internet → *Internet*; Wi-Fi → *Rede/Wi-Fi*; demais → *Demanda geral*. Contam em "ocorrências de infraestrutura" ou "demandas gerais" (Alertas). |

V3 não coleta ambiente, impacto, prioridade nem origem da ocorrência (campos do V2) → em Ocorrências aparecem "Local não informado" e "Prioridade não informada".

### 2.11 Conferência de bens já publicados (botões Verificado / Não verificado / Não localizado na lista F/G)

| Dado | Gravado em | Aparece em |
|---|---|---|
| Resultado (`result`) + justificativa (obrigatória em Não localizado) | `equipment_verifications(inspection_id, equipment_id, result, reason, user_id)`; *Verificado sem alterações* grava `equipments.verified_at/by`; *Não localizado* abre `missing_equipment_cases(state='open')`; `collection_history 'verification'` | COL: filtro/etiqueta na lista; tela Revisão ("N não conferidos", "N não localizados"). Painel: etiqueta **NÃO LOCALIZADO na última conferência** na tabela de equipamentos; Detalhe › "N equipamento(s) não localizado(s) em conferência, com caso aberto". `published_verified_at` copiado na publicação. |

### 2.12 Dados que o painel mostra mas ninguém digita no coletor

| Dado | Origem | Onde |
|---|---|---|
| Nome do operador em cada evento | `users.display_name/username` via `created_by/updated_by/actor_id` | CEA (lista, detalhe, atividades, fotos, fichas parciais), galeria. |
| Linha do tempo da coleta | `collection_history` (eventos: section_saved, section_completed, section_reopened, environment_created, equipment_created/updated, equipment_duplicate_flagged, verification, photo_received, agent_linked, equipment_location_changed, inspection_completed…) | CEA › "Últimas atividades registradas" (20 últimas). |
| Revisão da visita (`inspections.revision`, +1 a cada gravação) | gatilho `touch` | Usado para detectar mudança e para o `finish` (confirma a revisão vista na revisão). |
| Inventário técnico da máquina (hostname, CPU, RAM, discos, SO…) | agente Windows → tabelas `agent_*` | Painel › "Dados do agente" e Configurações (root). **Nunca** altera a ficha patrimonial. |
| Cadastro mestre (nome, INEP, tipo, polo, bairro, endereço, gestor, telefone, e-mail, lat/long, situação, 11 números, código do prédio, observações, fonte e data dos números) | `units` (root, tela Cadastro ou importação) | Panorama (Unidades por categoria, Rede em números, Unidade selecionada › "Cadastro da unidade"), Unidades (lista com "Gestor: …", alunos/turmas), Detalhe (bloco Cadastro da unidade), mapa, filtros Regional/Tipo/Situação, exportação CSV/XLSX, coletor (nome, INEP, bairro, endereço na busca). |

---

## 3. Onde aparece — índice por tela do painel

### Panorama (`/panorama`) — root/admin/visualizador
| Bloco | Dados | Consulta | Tabelas |
|---|---|---|---|
| Mapa da Rede + "Computadores funcionando" | unidades com coordenadas (filtradas); soma de `items` com operation=Funcionando | `/api/units`; `/api/inventory/results` | `units`; `published_json` de `inventory_equipment_all` |
| Equipamentos por Unidade (matriz, nomes abreviados, ordenação) | quantidade por categoria, só unidades **com visita publicada** | `/api/inventory/summary` | `published_equipment_counts`, `published_unit_status` |
| Unidades por categoria | contagem por `unit_type` conforme filtros | `/api/units` | `units` |
| Indicadores: Equipamentos / Ambientes Mapeados / Coletas Concluídas / Pendentes (—) | soma da matriz; `environment_count`; `visits` | `/api/inventory/summary` | `published_unit_status` |
| Rede em números (cadastro) | soma de alunos, turmas, vagas, servidores (obras excluídas) | `/api/units` | `units` (colunas numéricas) |
| Filtros Regional / Tipo / Situação / Filtros avançados | — | — | — |
| Unidade Selecionada | nome, gestor, data da última vistoria, "Inventário confirmado", Cadastro da unidade | `/api/inventory/unit?unitId=` | `inspections completed`, `units` |
| Evidência da Última Coleta / Galeria da Coleta | fotos `status='ready'` de visitas concluídas (equipamento só se publicado) | `/api/inventory/unit`; imagem `/api/collector/photo?id=` | `collection_photos` |
| Questionário recebido | seções A, C, D, B, F, G, O, H da última visita concluída; N não localizados | `/api/inventory/unit` | `inspection_sections`, `missing_equipment_cases` |
| Computadores e impressoras recebidos / Funcionamento e impressoras da unidade | contagens por funcionamento; impressoras por marca | `/api/inventory/results` | `published_json` |
| Alertas e Insights | registros por prioridade; nº de ocorrências de infraestrutura, fichas com problema, necessidades, demandas gerais | `/api/inventory/results` | `inspection_sections` (C, D, H) + `published_json` |

### Coletas em andamento (`/coletas-em-andamento`) — root/admin/visualizador
Lista de visitas `state='open'` (50 por página, cursor), com selos por assunto, "fichas trabalhadas / itens físicos / novas × de bens já publicados"; detalhe com respostas salvas (mesmo `answerDetails`), ambientes da unidade, 20 últimas atividades, fotos recebidas (PARCIAL, 50 por página) e **Equipamentos salvos nesta coleta** (fichas com `inspection_id` = esta visita; "Ficha nova" × "Atualização de bem já publicado"; "DUPLICIDADE EM ANÁLISE"; "Ver ficha parcial"). Consultas: `/api/inventory/in-progress`, `in-progress-detail`, `in-progress-equipment`, `in-progress-photos`, `in-progress-photo`. Quando a visita é concluída, o detalhe passa a "VISTORIA CONCLUÍDA" com link "Ver unidade".

### Mapa da Rede (`/mapa`) · Unidades (`/unidades`) · Detalhe da Unidade (`/unidade?id=`) · Ambientes (`/ambientes`)
Cadastro (`/api/units`) + última visita publicada (`/api/inventory/unit`) + resultados (`/api/inventory/results`). O Detalhe tem o botão **Consultar equipamentos recebidos** → `/api/inventory/equipment?unitId=&offset=` (50 por página; mostra `published_json`, etiqueta PARCIAL com ambiente/posição da visita aberta, "Dados do agente").

### Equipamentos (`/equipamentos`)
Matriz expandida (8 colunas + Total) com **Exportar matriz** (CSV local `SEMED_MATRIZ.csv`, gerado no navegador a partir da matriz filtrada). Clicar numa célula abre a janela "Equipamentos · unidade" (mesma consulta do Detalhe).

### Ocorrências (`/ocorrencias`)
`/api/inventory/findings?unitId=&offset=` — registros derivados de C (problemas/quedas), D (observações), H (ocorrências) da **última visita concluída** de cada unidade + bens publicados com `problems` ou funcionamento parcial/não funciona ("Equipamento com problema", com marca/funcionamento/patrimônio). Fotos vinculadas ao alvo (ocorrência/equipamento). Filtro por unidade, 50 por página, atualização a cada 15 s.

### Relatórios · Exportar dados · Planejamento · Configurações
Relatórios: vazio ("Aguardando coletas confirmadas"). Exportar: só **Unidades cadastradas** (CSV/XLSX pelo navegador, `spreadsheet-io.js`); Equipamentos e Ocorrências desabilitados. Planejamento: aviso "ainda não disponível" + banner **Coletas em andamento** (3 primeiras). Configurações: versão; para root, bloco **Armazenamento de fotografias** (Google Drive/R2) e **Agentes Windows**.

---

## 4. Botões do coletor — detalhado

### 4.1 Tela inicial: lista de unidades (`/`, `collector.js`)
| Botão / controle | O que faz na tela | Chamada | Efeito no banco |
|---|---|---|---|
| Aba **Pendentes** / **Com inventário** (`unit-tab`) | Filtra: *Com inventário* = unidade com `inventory_records>0` (fichas publicadas); *Pendentes* = as demais, rotuladas "Não iniciada" ou "Em preenchimento" (visita aberta ou fichas de rascunho) | nenhuma (dados vêm de `GET /api/units`) | nenhum |
| Busca | Filtra por nome, INEP, bairro, endereço | nenhuma | nenhum |
| Cartão da unidade (`select-unit`) | Abre a coleta V3 da unidade | `POST /api/collector/v3-start {unitId}` | Se já há visita V3 aberta: reutiliza. Se há rascunho antigo (V2): pede confirmação e reenvia com `preservePrevious:true` → rascunho vira `paused` + evento. Senão: cria `inspections` + 8 `inspection_sections` (copiando a última publicada, exceto A). |
| Menu da conta › **Minha conta** | Vai para `/conta` (trocar senha, sessões) | `GET /api/auth/me`, `/api/auth/sessions` | — |
| Menu da conta › **Sair** | Confirma "Sair da coleta?" | `POST /api/auth/logout` | apaga `sessions` da sessão; `audit 'logout'` |

### 4.2 Cabeçalho (todas as telas V3)
| Botão | Efeito |
|---|---|
| ← (Voltar às categorias, `cards`) | `leave()` (envia rascunhos pendentes, libera trava da ficha) e volta ao painel de assuntos. |
| Indicador de estado ("Alterações nesta aba", "Rascunho recebido no servidor", "Equipamento recebido no servidor", "Vistoria concluída…") | Só informação. |
| Fechar teclado | Só UI. |

### 4.3 Tela **Coleta da unidade** (cartões)
| Botão | O que faz | Chamada | Banco |
|---|---|---|---|
| **Fachada** (`facade`) | Abre tela da fachada | — | — |
| Cartão de assunto A/C/D/B/F/G/O/H (`open`) | Abre o assunto. Se estava "Concluído": pergunta "Reabrir este assunto?" | Reabertura: `POST /api/collector/inventory-section {reopen:true}` (B/F/G/O) ou `POST /api/collector/section-save {reopen:true}` (A/C/D/H) | `inspection_sections.state='Em andamento'`, `version+1`, evento `section_reopened` |
| **Retomar ficha em preenchimento** (`resume`) | Volta à ficha deixada incompleta; readquire a trava | `POST /api/collector/equipment-lock` (se necessário) | `equipment_locks` |
| **Revisar visita** (`review`) | Abre a revisão | `GET /api/collector/review?id=` | nenhum (só valida) |
| **Trocar unidade** (`units`) | Volta à lista (bloqueia se há prévias de foto não enviadas; confirma se há ficha incompleta) | — | — |

### 4.4 Tela **Fachada**
| Botão | O que faz | Chamada | Banco |
|---|---|---|---|
| Escolher/tirar foto (input) | Gera prévia local (até 5; ≤ 40 MB somados) | — | — |
| **Enviar** (`upload`) | Envia cada prévia | `POST /api/collector/photo-upload` (headers `X-Photo-Id`, `X-Inspection-Id`, `X-Target-Kind=facade`, `X-Target-Id=unit_id`) | `collection_photos` (pending → ready), arquivo no R2/Drive, evento `photo_received`. 503 se o provedor de fotos estiver desligado. |
| × na prévia (`remove-preview`) | Descarta a prévia local | — | — |
| **Remover** em foto já enviada (`remove-photo`) | Só fotos próprias de visita aberta | `POST /api/collector/photo-remove {id}` | apaga `collection_photos` e o arquivo |
| **Continuar · acompanhante** (`companion`) | Abre o assunto A | — | — |

### 4.5 Telas de formulário **A, C, D, H** (`group`)
| Botão | O que faz | Chamada | Banco |
|---|---|---|---|
| Digitar em campo | Marca "Alterações nesta aba"; agenda envio automático (`saveSoon`) | — | — |
| **+ Adicionar** (link / rede / problema) (`add-row`) | Acrescenta linha com `id` novo | envio automático | `inspection_sections.data_json` |
| **Remover** linha (`remove-row`) | Confirma e remove | envio automático | idem (histórico guarda `before/after`) |
| **Salvar rascunho** (`save`) | Envia o rascunho | `POST /api/collector/section-save {section, version, answers}` | `data_json`, `state='Em andamento'`, `version+1`, `mutation_id`, evento `section_saved`; 409 se outra sessão alterou (grava `collection_conflicts`); 400 se os campos obrigatórios falharem |
| **Concluir assunto** (`complete`) | Valida tudo e marca concluído; volta aos cartões | `POST /api/collector/section-save {…, complete:true}` | `state='Concluído'`, evento `section_completed` |
| Anterior / Próximo (`previous`/`next`) | Navega entre passos salvando antes | `section-save` | idem |

### 4.6 Tela **Ambientes** (assunto B)
| Botão | O que faz | Chamada | Banco |
|---|---|---|---|
| **Adicionar ambiente** (submit do formulário) | Cria ou reutiliza o ambiente pelo nome; pede confirmação se há nome parecido | `POST /api/collector/environment-save` | `environments` (permanente na unidade), evento `environment_created` |
| Foto do ambiente › Enviar / Remover | igual à fachada com `X-Target-Kind=environment` | `photo-upload` / `photo-remove` | `collection_photos` |
| **Concluir ambientes** (`complete-inventory`) | Marca B concluído | `POST /api/collector/inventory-section {section:'B', version}` | `state='Concluído'` |

### 4.7 Telas de lista **F, G, O** (`inventory`)
| Botão | O que faz | Chamada | Banco |
|---|---|---|---|
| Buscar / lupa (`search`/`first`), × (`clear-search`) | Filtra a lista da unidade (texto em `search_text`), 50 por página | `GET /api/collector/equipment-list?unitId&inspectionId&q&category&cursor` | nenhum |
| **Mais equipamentos** (`next-page`) | Próxima página (cursor) | idem | nenhum |
| **+ Adicionar** (`new`) | Abre ficha nova com `id` gerado no celular (ID permanente), categoria conforme o assunto, `registration:'Agente'` para computadores | — | nada até salvar |
| **Editar** na ficha (`edit`) | Trava a ficha e abre o formulário com os dados correntes | `POST /api/collector/equipment-lock {inspectionId,id}` | `equipment_locks` / `miscellaneous_locks` (token, validade); 409 se outra pessoa está editando |
| Botões de conferência **Verificado sem alterações / Não verificado / Não localizado** (`verify`) | Registra o resultado; *Não localizado* exige justificativa | `POST /api/collector/verify {inspectionId,id,result,reason}` | `equipment_verifications`; `verified_at`; `missing_equipment_cases`; evento `verification`; 409 se a ficha está travada |
| **Concluir assunto** (`complete-inventory`) | Marca F/G/O concluído. Para F/G o servidor recusa (409) se há ficha em rascunho, computador "Agente" sem vínculo ou impressora sem foto | `POST /api/collector/inventory-section` | `state='Concluído'`, evento `section_completed` |

### 4.8 Tela da **ficha** (computador / impressora / outro)
| Botão | O que faz | Chamada | Banco |
|---|---|---|---|
| **Ler QR Code** (`qr-scan`) | Abre a câmera, lê o QR do agente e mostra "Computador identificado" (nome, modelo, CPU, memória, SO) | `POST /api/agent/v1/pairings/preview` | nenhum |
| **Cadastrar sem agente** (`manual`) | `registration='Manual'`; exige motivo | — | só ao salvar |
| **Vincular este computador** (`qr-confirm`) | 1) salva rascunho mínimo da ficha (ambiente + posição), 2) envia o comando congelado de vínculo; se a resposta se perder, o botão vira "Verificar envio anterior" e consulta o recibo | `POST /api/collector/equipment-save {draft:true}` → `POST /api/agent/v1/pairings/claim` (+ `claim-status`) | `equipments` (rascunho), `agent_equipment_links`, `agent_devices.state='linked'`, `data_json.registration='Agente'`, `environment_id`, `position_label`, `location_state`, `equipment_location_history`, evento `agent_linked` |
| **Cancelar leitura** (`qr-cancel`) | Descarta a leitura (avisa se o envio ficou sem resposta) | — | — |
| **Confirmar posição** (`position-confirm`) | Confirma ambiente/posição na ficha sem agente (comando com recibo) | `POST /api/inventory/equipment-location` (+ `-status`) | `equipments.location_*`, `data_json`, `equipment_location_history`, evento `equipment_location_changed` |
| Foto do computador (opcional) / **Foto da impressora** (obrigatória) / Fotografia (outro) › Enviar, ×, Remover | prévia → envio após salvar a ficha | `photo-upload` (`X-Target-Kind=equipment`) / `photo-remove` | `collection_photos`; 409 "Salve o equipamento … antes de enviar a foto" se a ficha não existe |
| **Voltar à lista** (`item-previous`) | Libera a trava e volta | `POST /api/collector/equipment-unlock` | remove a trava |
| **Salvar equipamento** (`save-item`) | Valida (servidor), grava a ficha, envia as fotos pendentes, libera a trava, volta à lista | `POST /api/collector/equipment-save {id,version,lockToken,data}` → `photo-upload` → `equipment-unlock` | `equipments`/`miscellaneous_equipments.data_json`, `version+1`, `inspection_id=esta visita`, `environment_id`, `category`, `asset`/`serial`, `search_text`; eventos `equipment_created`/`equipment_updated`; gatilhos de totais; 409 se o assunto já está "Concluído" ("Reabra este assunto") ou se a versão mudou; `duplicate_flag` se patrimônio/série repetido |

### 4.9 Tela **Revisão da visita**
| Botão | O que faz | Chamada | Banco |
|---|---|---|---|
| (lista de pendências) | Erros vindos de `reviewV3`: assunto não concluído, campos obrigatórios, fachada sem foto, ficha incompleta, computador Agente sem vínculo, impressora sem foto | `GET /api/collector/review?id=` | nenhum |
| **Corrigir** (`fix`) | Abre o assunto correspondente (foto de impressora → G; fachada → Fachada) | — | — |
| **Confirmar conclusão** (`finish`, habilitado só sem erros) | Confirma "Confirmar a conclusão desta visita com os dados recebidos pelo servidor?" e **publica** | `POST /api/collector/finish {inspectionId, confirm:true, revision}` | Ver Parte 7. 409 se a revisão mudou desde a tela de revisão. |
| **Voltar à lista de unidades** (após concluída) | Volta a `/` | — | — |

### 4.10 Minha conta do coletor (`/conta`)
Alterar senha (`POST /api/auth/password` → apaga todas as sessões, `audit 'password_changed'`, volta ao login), Sessões › Encerrar (`POST /api/auth/revoke`), Sair (`POST /api/auth/logout`).

---

## 5. Botões do painel — detalhado (root/admin/visualizador)

### 5.1 Cabeçalho e barra lateral (`panel-shell.js`)
| Controle | Efeito |
|---|---|
| ☰ (`menu`) | Abre/fecha a barra lateral no celular. |
| Busca "Buscar unidade ou equipamento" | Filtra o cadastro por nome, INEP ou gestor em tempo real (`state.q`); nas páginas de administração, Enter leva a `/unidades?q=`. **Não** busca equipamentos. |
| 🔔 (`notifications`) | Janela "Nenhuma notificação… serviço não integrado". |
| Avatar › **Minha conta** / **Sair** | `/conta` / `POST /api/auth/logout`. |
| Consulta: Panorama, Coletas em andamento, Mapa da Rede, Unidades, Ambientes, Equipamentos, Ocorrências, Relatórios | Navegação (pushState, sem recarregar). Operador vê só "Minhas unidades" (`/conta`). |
| Gestão: Planejamento, Exportar dados | Navegação (não aparece para operador). |
| Administração (root): Cadastro, Usuários, Operadores × unidades, Segurança e auditoria, Configurações · (admin): Usuários, Configurações | Páginas da Parte 6. |

### 5.2 Panorama
| Botão | Efeito na tela | Chamada |
|---|---|---|
| Filtros **Regional / Tipo de Unidade / Situação** (selects) | Refiltram cadastro, matriz, contagens, Rede em números, mapa | nenhuma (cache do `/api/units`) |
| **Filtros avançados** → janela com Regional, Situação, **Limpar filtros** | idem; Limpar zera busca e filtros | nenhuma |
| Mapa: **+ / − / ⌖ (enquadrar)**, **Satélite / Ruas**, **Limite do município**, **⤢ (ampliar → Mapa da Rede)**, **i** (sobre o mapa) | Zoom, base cartográfica, camada do limite (`/data/map-v33.json`), navegação, janela informativa | cartografia externa |
| Clicar num marcador | Seleciona a unidade → carrega detalhe (`unitInventory`) e atualiza os blocos da direita | `GET /api/inventory/unit?unitId=` |
| Matriz: select **Total de equipamentos / Maior quantidade / Unidade A–Z** | Reordena as linhas | nenhuma |
| Matriz: nome da unidade (`select-unit`) | Seleciona a unidade (toast "Unidade selecionada") | `GET /api/inventory/unit` |
| Matriz: célula numérica (`cell`) | Janela **Equipamentos · unidade** (50 por página, "Anterior/Próximos 50", "Ver ficha publicada", "Dados do agente") | `GET /api/inventory/equipment?unitId&offset` |
| Unidade Selecionada › **Cadastro da unidade** (details) | Mostra números do cadastro | nenhuma |
| Unidade Selecionada › **Ver detalhes da unidade** (`unit-detail`) | Vai para Detalhe da Unidade | — |
| Evidência › miniatura / **Ver todas** (`received-photo`/`photos`) | Abre o visualizador de fotos (anterior/próxima/fechar/tentar de novo) | imagem `/api/collector/photo?id=` |
| Ambientes › **Ver todos** (`environments`) | Vai para Ambientes | — |
| Alertas › **Ver todos** (`alerts`) / **Consultar registros recebidos** | Vai para Ocorrências | — |
| "Dados do agente" (`agent-status`, dentro da janela de equipamentos) | Janela com ficha oficial, PARCIAL, comunicação, inventário técnico e histórico | `GET /api/inventory/agent-status?equipmentId=` |

### 5.3 Coletas em andamento
| Botão | Efeito | Chamada |
|---|---|---|
| **Atualizar agora** (`refresh`) | Recarrega lista/detalhe/fotos (também automático a cada 15 s e ao voltar à aba) | `/api/inventory/in-progress*` |
| **Ver dados parciais** (`open`) | Abre o detalhe da visita (URL `?vistoria=`) | `in-progress-detail`, `in-progress-equipment`, `in-progress-photos` |
| **Voltar à lista** (`list`) | Volta | — |
| **Anterior / Próximas 50** (lista), **Anterior / Próximos 50** (equipamentos), **Anteriores / Próximas 50** (fotos) | Paginação por cursor | idem |
| Miniatura de foto (`open`) | Visualizador | `in-progress-photo?id&photoId` |
| **Ver ficha parcial** (details) | Mostra os campos da ficha e dados técnicos | — |
| **Ver unidade** (quando concluída) | `/unidade?id=` | — |

### 5.4 Mapa da Rede · Unidades · Detalhe · Ambientes
| Botão | Efeito | Chamada |
|---|---|---|
| Lista "Unidades cadastradas" › cartão (`open-unit`) | Abre o Detalhe da unidade | `GET /api/inventory/unit` |
| Detalhe › **Voltar ao panorama** (`panorama`), **Ver no mapa** (`map-unit`; avisa se sem coordenadas) | Navegação | — |
| Detalhe › **Consultar equipamentos recebidos** (`inventory-page`) | Janela de equipamentos (igual à célula da matriz) | `GET /api/inventory/equipment` |
| Ambientes › campo **Unidade** (datalist nome/INEP) | Seleciona a unidade | `GET /api/inventory/unit` |
| Galeria › miniaturas / **Ver todas** | Visualizador | `/api/collector/photo` |

### 5.5 Equipamentos
| Botão | Efeito | Chamada |
|---|---|---|
| **Exportar matriz** (`export`) → página Exportar; na matriz expandida o CSV é gerado por `exportCsv()` (`SEMED_MATRIZ.csv`, separador `;`, colunas Unidade, Regional, 8 categorias) | Download no navegador | nenhuma (usa a matriz já carregada) |
| Ordenação, nome, célula | iguais ao Panorama | — |

### 5.6 Ocorrências
| Botão | Efeito | Chamada |
|---|---|---|
| **Atualizar** (`refresh`), select **Unidade**, **Anterior / Próximos 50** | Recarrega/filtra/pagina | `GET /api/inventory/findings?unitId&offset` |
| Miniatura da foto (link) | Abre a imagem em nova aba | `/api/collector/photo?id=` |
| **Ver unidade** | `/unidade?id=` | — |

### 5.7 Exportar dados · Relatórios · Planejamento
| Botão | Efeito |
|---|---|
| Exportar › select **Dados** (só "Unidades cadastradas" ativo), **Formato** CSV/XLSX, **Exportar** (`export-units`) | Gera no navegador o arquivo com as 27 colunas do cadastro das unidades filtradas (`spreadsheet-io.js`). Não inclui equipamentos nem coletas. |
| Relatórios › **Consultar unidades** | Vai para Unidades. |
| Planejamento › **Autorizar unidades por operador** (root) / **Consultar unidades** · banner **Acompanhar coletas** e os 3 atalhos | Navegação para `/operadores-unidades`, `/unidades`, `/coletas-em-andamento?vistoria=`. |

---

## 6. Botões do root / admin

### 6.1 Cadastro de unidades (`/cadastro-unidades`, root; `admin-units.js`)
| Botão / controle | Efeito na tela | Chamada | Banco |
|---|---|---|---|
| Formulário (nome*, INEP, tipo*, polo, bairro, endereço, gestor, telefone, e-mail, latitude, longitude, situação, 11 números opcionais, código do prédio, observações, fonte, data de referência) | Validação local (`validateUnitFields`): INEP 8 dígitos obrigatório para escola/militar/creche; coordenadas dentro de Paço do Lumiar e sempre em par; números inteiros 0–99.999; avisos (soma por etapa > total, vagas > capacidade, professores > servidores) não bloqueiam; tipo "Escola conveniada" só pode ser inativado | — | — |
| Clicar no mini-mapa | Preenche latitude/longitude | cartografia Esri | — |
| **Limpar** (`unit-cancel`) | Zera o formulário | — | — |
| **Salvar** (submit) | Cria ou edita (usa `id` + `version` ocultos) | `POST /api/root/unit-save` | `units` (insert ou update com `version+1`; 409 se a versão mudou ou nome/INEP duplicado), `unit_changes` (`before/after`), `audit 'unit_created/unit_updated:id'` |
| Lista: busca (nome/gestor/INEP), filtros **tipo**, **polo**, ordem **Nome A–Z / INEP**, **Anterior / Próxima** (15 por página) | Filtra/pagina localmente | `GET /api/root/units` (inclui inativas, legado "Fora do escopo" e `open_inspection`) | — |
| **Editar** | Carrega a unidade no formulário | — | — |
| **Inativar / Ativar** | Confirma e alterna `active` | `POST /api/root/unit-save {…, active}` | `units.active`, `unit_changes`, `audit` |
| **Excluir** | Abre a prévia de impacto (vistorias, ambientes, fichas, fotos, agentes vinculados); exige digitar o nome exato e motivo (≥ 5 caracteres) | `GET /api/root/unit-delete-preview?id=` → `POST /api/root/unit-delete {id, snapshot, confirmName, reason}` | Transação: revoga agentes vinculados (`agent_devices/keys/installations`, `agent_equipment_links.end_reason='unit_deleted'`, `agent_audit_log`), apaga travas, conferências, casos, fotos (arquivos vão para `photo_deletion_queue`), equipamentos, outros equipamentos, ambientes, seções, visitas, atribuições, totais, publicados e a unidade; grava `root_deletions`, `unit_changes 'unit_deleted'`, `audit`. 409 se os dados mudaram após a prévia. |
| **Editar inventário** (link) | Abre o coletor na unidade (com `?vistoria=&tela=cards` se há visita aberta) | — | — |
| Importar › **Baixar modelo CSV / XLSX** | Gera o modelo de 27 colunas no navegador | — | — |
| Importar › escolher arquivo › **Validar e visualizar** | Lê CSV/XLSX no navegador (≤ 200 linhas) e mostra a prévia linha a linha (erros bloqueiam; avisos não) | `POST /api/root/import-preview {rows}` | `import_batches` (prévia válida por 30 min) |
| **Confirmar importação** | Confirma a gravação | `POST /api/root/import-confirm {batchId}` | `units` (insert em lote), `unit_changes 'units_imported'`, `audit`; idempotente (segunda confirmação devolve `alreadyImported`); 409 se o cadastro mudou ou a prévia expirou |

### 6.2 Operadores × unidades (`/operadores-unidades`, root)
| Botão | Efeito | Chamada | Banco |
|---|---|---|---|
| select **Operador** | Carrega as caixas de seleção das unidades ativas | `GET /api/root/assignments`, `GET /api/root/units` | — |
| **Salvar atribuições** | Substitui a lista de unidades do operador (até 200) | `POST /api/root/assignments {userId, unitIds}` | `unit_assignments` (delete + insert), `unit_changes`, `audit 'assignments_changed'`. **Efeito prático hoje (D-046):** nenhum filtro — `operatorUnitAccess()` devolve `1=1`, então todo operador vê e pode abrir qualquer unidade ativa dentro do escopo de coleta. As atribuições são só referência organizacional (é o que o texto da tela diz). |

### 6.3 Usuários (`/usuarios`, root e admin; `account.js`)
| Botão | Efeito | Chamada | Banco |
|---|---|---|---|
| **Criar com senha provisória** (só root; perfis operador/visualizador; root também admin/root) | Mostra a senha provisória **uma vez** na tela | `POST /api/admin/create` | `users` (`must_change=1`, `temporary_expires`), `audit 'user_created:id'` |
| ⋯ › select de perfil + **Salvar perfil** (root) | Troca o perfil e encerra as sessões do usuário | `POST /api/root/user-role` | `users.role`, `credential_version+1`, apaga `sessions`; apaga `unit_assignments` se deixar de ser operador; `audit 'role_changed'` |
| ⋯ › **Redefinir senha** | Nova senha provisória exibida uma vez | `POST /api/admin/reset` | `users` (hash, `must_change=1`), apaga `sessions`, `audit 'reset:id'` |
| ⋯ › **Revogar sessões** | Encerra todas as sessões do usuário | `POST /api/admin/revoke` | apaga `sessions`, `audit 'admin_revoke:id'` |
| ⋯ › **Desativar / Ativar** | Bloqueia/libera o acesso | `POST /api/admin/status` | `users.active`, apaga `sessions`, `audit 'activated/deactivated:id'` |

### 6.4 Segurança e auditoria (`/seguranca`, root)
| Botão | Efeito | Chamada | Banco |
|---|---|---|---|
| **Salvar prazos** (sessão 15 min–24 h; senha provisória 1–48 h) | Vale para novas emissões | `POST /api/admin/settings` | `settings`, `audit 'security_settings_changed'` |
| Tabela "Últimas 100 ações" | Mostra `audit` (acesso autorizado/recusado, saída, senha alterada/redefinida, sessão encerrada, usuário criado, perfil alterado, conta ativada/desativada, prazos, unidade cadastrada/editada/excluída, importação, autorizações) | `GET /api/admin/audit` | — |

### 6.5 Minha conta (`/conta`, todos)
Alterar senha (`POST /api/auth/password`), Sessões › **Encerrar** (`POST /api/auth/revoke`), operador vê "Minhas unidades autorizadas" (`GET /api/units`).

### 6.6 Configurações (root): Armazenamento de fotografias
| Botão | Efeito | Chamada |
|---|---|---|
| **Conectar Google Drive / Reautorizar** | Redireciona para a autorização do Google (escopo `drive.file`) | `GET /api/root/google/start` |
| **Testar envio** | Envia e remove um arquivo de teste; mostra a duração | `POST /api/root/google/test` |
| **Desconectar** → **Confirmar desconexão** | Revoga o token; fotos já gravadas permanecem; recebimento de fotos fica desabilitado | `POST /api/root/google/disconnect` |
| **Atualizar** | Reconsulta estado e eventos | `GET /api/root/google/status` |

### 6.7 Configurações (root): Agentes Windows (`desktop-agents.js`)
Modo atual (D-058): cadastro automático, `require_install_grant=false` — o bloco de "Gerar código de autorização / Copiar / Ocultar / Revogar autorização" só aparece se a política exigir autorização.
| Botão | Efeito | Chamada | Banco |
|---|---|---|---|
| Filtros **Unidade / Situação / Buscar** + **Filtrar**, **Atualizar**, **Anterior / Próximos 50** | Lista agentes (computador, unidade/ambiente/posição, ficha, situação, última comunicação) | `GET /api/root/agent-devices?unit_id&q&state&cursor` | — |
| **Dados** | Mesma janela "Agente do computador" do painel | `GET /api/inventory/agent-status` | — |
| **Revogar agente** → motivo → **Confirmar revogação** | O agente deixa de ser aceito; vínculo encerrado; ficha, fotos e histórico permanecem; novo vínculo exige nova instalação + novo QR | `POST /api/root/agent-revoke {device_id, reason}` | `agent_devices.state='revoked'`, `agent_keys`, `agent_equipment_links.ended_at`, `agent_audit_log` |
| **Executar manutenção agora** | Expira cadastros nunca vinculados (30 dias), limpa nonces/recibos/rate/desafios, retém snapshots | `POST /api/root/agent-maintenance` | tabelas `agent_*` |

---

## 7. O que acontece exatamente ao **Confirmar conclusão** (`/api/collector/finish`)

1. Servidor reexecuta `reviewV3`; se houver erro ou se `revision` for diferente da vista na tela de revisão → 409, nada muda.
2. Em **uma transação** (`completion_token`, protegida pela `revision`):
   - `inspections.state='completed'`, `completed_at`, `updated_at`;
   - `equipments` **desta visita** (`inspection_id` = esta) **e sem `duplicate_flag`**: `published_json = data_json`, `published_updated_at` (gatilho recalcula `published_equipment_counts`); `miscellaneous_equipments` desta visita: idem + `published_verified_at`;
   - `published_verified_at = verified_at` nas fichas conferidas nesta visita ("Verificado sem alterações");
   - `inspection_environments` = cópia dos `environments` da unidade (lista congelada da visita);
   - `published_unit_status` (visits+1, `latest`, `environment_count`);
   - `collection_history 'inspection_completed'` (com totais de não conferidos e não localizados).
3. Efeitos visíveis: a unidade sai de *Coletas em andamento*; entra/atualiza na matriz, nos indicadores, em Unidades/Detalhe/Ambientes, Ocorrências e galeria oficial; no coletor passa para a aba **Com inventário** ("Inventário recebido"); as fotos desta visita passam a ser "oficiais" (equipamento só se a ficha foi publicada).
4. Fichas de **outras** visitas não são tocadas; bens antigos continuam com o `published_json` anterior. Uma ficha editada numa visita aberta posterior volta a mostrar PARCIAL até a próxima conclusão.

Bloqueios da conclusão (mensagens da revisão): "Marque este assunto como concluído." (cada um dos 8 assuntos) · campos obrigatórios de A/C/D/H · "Envie a fotografia inicial da fachada." · "Complete e salve as fichas iniciadas nesta visita." · "Vincule os computadores em modo Agente ou escolha cadastro manual." · "Envie a fotografia inicial da impressora."

---

## 8. Pontos de atenção encontrados (para a conversa; nada aqui foi alterado)

1. **Número do patrimônio dos computadores no V3.** A ficha pede só a *situação* (`assetStatus`: Possui patrimônio / Sem patrimônio / …) e não há campo para digitar o número (`asset`) nem o número de série (`serial`) — esses existiam no V2. Consequência: na tabela de equipamentos do painel a coluna **Patrimônio / Série** fica vazia para computadores V3, a busca por patrimônio no coletor/agentes não encontra, e a verificação de duplicidade por patrimônio não atua. Nas impressoras V3 também não há campo de patrimônio.
2. **"Outros equipamentos" na matriz.** A contagem oficial (`published_equipment_counts`) é mantida por gatilhos da tabela `equipments` (migração 0009). Os registros do assunto O ficam em `miscellaneous_equipments`. Nas migrações copiadas para esta análise (até 0013) não há gatilho equivalente para essa tabela; as migrações 0014–0016 não vieram na cópia. **Confirmar** no PC se "Outros" entra na coluna *Outros* da matriz e na aba *Com inventário* (`inventory_records`). Se não entrar, uma unidade só com "outros equipamentos" continuaria "Pendente" no coletor mesmo após publicar.
3. **Conservação e situação de uso** (`condition`, `use`) não são coletadas no V3; a coluna "Conservação / Funcionamento" mostra "—" + funcionamento, e a coluna "Problemas e ação" nunca terá ação/prioridade (também não coletadas).
4. **Prioridades em Alertas e Ocorrências.** O V3 não coleta prioridade (nem nas fichas nem em H). O bloco *Alertas e Insights* só mostra as linhas de contagem; "registros com prioridade X" não aparece para dados V3. As ocorrências aparecem com "Prioridade não informada" e "Local não informado" (ambiente da ocorrência também não é coletado em H).
5. **Nome do acompanhante** (dado pessoal) aparece em "Questionário recebido" para root, admin e visualizador (CEA e OFI). O telefone não é coletado no V3, então a regra `hideContact` do visualizador não tem o que esconder.
6. **Indicador "Pendentes" do Panorama** é fixo em "—" ("Critério pendente"); **Relatórios** está vazio; **Exportar** só exporta o cadastro; **Notificações** não existe; a busca do cabeçalho não procura equipamentos apesar do texto do campo.
7. **Computador sem tipo** é gravado como `category='computer'` e somado na coluna *Computadores* junto com desktops; aparece como "Computador (tipo não informado)".
8. **Links de internet:** V3 não coleta "funcionava durante a visita", teste de velocidade (download/upload/data/origem) nem "o teste foi feito no Wi-Fi" — todos existiam no V2. Redes Wi-Fi: não coleta "possui senha" nem "qualidade".
9. **Ambientes são permanentes por unidade** (`environments`), não por visita: um nome digitado errado numa ficha cria um ambiente novo que fica para sempre na lista da unidade (o painel mostra os que foram congelados na publicação). Não há botão para renomear ou remover ambiente no coletor nem no painel.
10. **Revisita:** C, D, H, B, F, G, O já começam "Concluído" com as respostas copiadas da última publicação; só A começa vazio. Para alterar é preciso "Reabrir" cada assunto. A conclusão continua exigindo fachada nova (foto da visita atual) e foto de cada impressora cadastrada/alterada nesta visita.
11. **Exportação da matriz** vem só do que está na tela (unidades filtradas e com visita publicada); não existe exportação de fichas, ocorrências, ambientes ou fotos.
12. **Atribuições operador × unidade não restringem nada** (D-046): qualquer operador vê todas as unidades ativas do escopo de coleta e pode abrir visita em qualquer uma; a tela "Minhas unidades autorizadas" do operador lista, na prática, todas as unidades ativas. Se a intenção for limitar operadores a polos/unidades, isso hoje não existe no servidor.
13. **Fichas com duplicidade sinalizada** (`duplicate_flag=1`, "DUPLICIDADE EM ANÁLISE") **não são publicadas** na conclusão da visita e não há tela no painel nem no coletor para resolver a marca — a ficha fica indefinidamente fora dos números oficiais.

---

## Anexo A — Rotas da API por módulo e perfil

| Rota | Método | Quem | Módulo |
|---|---|---|---|
| `/api/auth/login`, `logout`, `me`, `password`, `sessions`, `revoke` | POST/GET | todos autenticados (login: anônimo) | `server/worker.mjs` |
| `/api/admin/users`, `create`, `reset`, `revoke`, `status`, `settings`, `audit` | GET/POST | root/admin (create, settings, audit: root) | `worker.mjs` |
| `/api/units` | GET | todos (operador: só atribuídas; sem conveniadas; coletor sem obras) | `units.mjs` |
| `/api/root/units`, `unit-save`, `assignments`, `user-role` | GET/POST | root | `units.mjs` |
| `/api/root/import-preview`, `import-confirm` | POST | root | `import-units.mjs` |
| `/api/root/unit-delete-preview`, `unit-delete`, `photo-cleanup` | GET/POST | root | `unit-deletion.mjs` |
| `/api/root/google/status`, `start`, `test`, `disconnect` | GET/POST | root | integração Drive |
| `/api/collector/capabilities`, `v3-start`, `inspection`, `section-save`, `inventory-section`, `environment-save`, `equipment-list`, `equipment-lock`, `equipment-unlock`, `equipment-save`, `verify`, `review`, `finish`, `photo-upload`, `photo-list`, `photo-remove`, `photo` | GET/POST | root/admin/operador (foto GET também visualizador, só publicadas) | `collector.mjs` (+ `collector-v3.mjs`) |
| `/api/inventory/summary`, `unit`, `equipment` | GET | root/admin/visualizador | `collector.mjs` |
| `/api/inventory/in-progress`, `in-progress-detail`, `in-progress-equipment`, `in-progress-photos`, `in-progress-photo` | GET | root/admin/visualizador | `in-progress.mjs`, `in-progress-photos.mjs` |
| `/api/inventory/results`, `findings` | GET | root/admin/visualizador | `inventory-results.mjs` |
| `/api/inventory/photos`, `photo` | GET | root/admin/visualizador | `photo-gallery.mjs` |
| `/api/inventory/agent-status`, `agent-history`, `equipment-location`, `equipment-location-status` | GET/POST | humanos autenticados (location: editores) | `agentes/index.mjs` |
| `/api/root/agent-devices`, `agent-install-grants`, `agent-install-grants/revoke`, `agent-revoke`, `agent-maintenance` | GET/POST | root | `agentes/index.mjs` |
| `/api/agent/v1/*` (pairings/preview, claim, claim-status, enroll, heartbeat, inventory…) | POST | agente Windows (assinatura) / coletor autenticado (pairings) | `agentes/nucleo/worker.mjs` |

## Anexo B — Tabelas D1 e o que guardam

`units` (cadastro, 27 colunas + `version`), `unit_assignments`, `unit_changes` (histórico do cadastro), `import_batches`, `root_deletions`, `users`, `sessions`, `settings`, `audit`, `attempts` · `inspections` (visitas), `inspection_sections` (respostas por assunto), `inspection_environments` (ambientes congelados na publicação), `inspection_collection_totals`, `visit_answers` (modelo alternativo, não usado no V3) · `environments` · `equipments`, `miscellaneous_equipments`, view `inventory_equipment_all`, `equipment_locks`, `miscellaneous_locks`, `equipment_verifications`, `missing_equipment_cases`, `equipment_location_history` · `collection_photos`, `photo_deletion_queue`, `integration_*` (Google Drive) · `collection_history`, `collection_conflicts` · `unit_collection_totals`, `published_equipment_counts`, `published_unit_status` · `agent_devices`, `agent_installations`, `agent_keys`, `agent_equipment_links`, `agent_claim_requests`, `agent_location_requests`, `agent_audit_log` e demais `agent_*`.

## Anexo C — Arquivos lidos para este mapa

`web/collector.js`, `collector-unit-list.js`, `collector-v3.js`, `collector-v3-schema.js`, `collector-v2-schema.js`, `collector-schema.js`, `collector-drafts.js`, `collector-account.*` · `web/desktop.js`, `desktop-inventory.js`, `desktop-progress.js`, `desktop-progress-photos.js`, `desktop-results.js`, `desktop-agents.js`, `desktop-map.js`, `panel-shell.js`, `unit-figures.js`, `unit-schema.js`, `admin-units.js`, `account.js`, `account.html`, `account-shell.js`, `photo-viewer.js`, `spreadsheet-io.js` · `server/worker.mjs`, `collector.mjs`, `collector-v3.mjs`, `units.mjs`, `unit-scope.mjs`, `import-units.mjs`, `unit-deletion.mjs`, `in-progress.mjs`, `in-progress-photos.mjs`, `inventory-results.mjs`, `photo-gallery.mjs`, `agentes/index.mjs`, `agentes/catalogo.mjs` · `migrations/0001–0013` · `docs/00-governanca/DECISOES.md` (D-057–D-068).
