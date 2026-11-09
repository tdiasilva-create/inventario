# 06 · Plano de correção por fases

Ordem pensada para: maior ganho percebido primeiro, menor risco primeiro, dependências respeitadas (miniaturas dependem de cache e migração; painel por blocos depende de nada; placement depende de medição). Cada fase é publicável sozinha. Respeitar `AGENTS.md`: fases pequenas, testes antes de concluir, sem deploy ou migração sem aprovação explícita, documentação em `docs/05-qualidade/` e `RASTREABILIDADE.md`.

| Fase | Objetivo | Itens | Esforço | Risco |
|---|---|---|---|---|
| 1 | Parar o desperdício: cache, token, índices, upload | FOTO-01, FOTO-03, FOTO-04, FOTO-08, FOTO-09, ERR-01, ERR-02, ERR-05, ERR-06, ERR-12, ERR-16 | 1–2 dias | baixo |
| 2 | Miniaturas | FOTO-02, ERR-04, ICO-21, ICO-23 | 2–4 dias | médio (migração + 2 clientes) |
| 3 | Painel sem recriar a tela | FOTO-07, ERR-03, ERR-07, ERR-08, ERR-18, ERR-19, LNA-08, LNA-09, LNA-11, LNA-13, MEL-06 | 2–3 dias | médio |
| 4 | Coletor V3 | FOTO-05, FOTO-06, ERR-09, ERR-10, ERR-11, ERR-17, LNA-01, LNA-02, LNA-03, LNA-04, LNA-05, MEL-16 | 2–3 dias | médio (fluxo de campo; testar em aparelho) |
| 5 | Estrutural e manutenção | FOTO-10/MEL-01, MEL-02, MEL-03, MEL-04, MEL-07, MEL-08, MEL-09, MEL-11, MEL-14, ERR-13, ERR-14, ERR-15, ERR-20 | 3–5 dias | baixo a médio (medir placement) |

Itens marcados **DECISÃO** (LNA-06, LNA-12, LNA-15, LNA-16, ICO-02, ERR-19, MEL-12, MEL-17) devem ser respondidos pelo responsável antes de entrar em fase; o restante não depende de decisão nova.

---

## Fase 1 — cache, token, índices, upload (publicar em coletor e painel)

**Arquivos:** `server/worker.mjs`, `server/photo-storage.mjs`, `server/collector.mjs`, `server/in-progress-photos.mjs`, `server/photo-gallery.mjs`, `migrations/0016_photo_indexes.sql`, `web/desktop-results.js`, `web/login.css`, `web/assets/`, `tests/security.test.mjs`, `tests/photo-storage.test.mjs`.

**Passos:**
1. `worker.mjs:121` → só definir `no-store` quando ausente; função `assetResponse(request,env)` que chama `env.ASSETS.fetch` e aplica `public, max-age=86400, stale-while-revalidate=604800` para `/vendor/`, `/assets/`, `.css`, `.js`, `.svg`, `.woff2`, `.ttf`; HTML e `/api/` continuam `no-store`.
2. Rotas de leitura de foto: `ETag:"<sha256>"`, `Cache-Control: private, max-age=86400`, `304` quando `If-None-Match` coincidir (antes de `store.get`); repassar `Content-Length` do Drive quando presente.
3. `photo-storage.mjs`: memo do token por isolate; `accessToken` recebe a linha de `ready()`; `put({retry})` só chama `findByProperty` quando `retry===true`; `collector.mjs:124-128` passa `retry:!!existing` e lê `units` no mesmo batch.
4. Migração 0016 com os dois índices (`ERR-12`).
5. `desktop-results.js`: `draw()` compara JSON antes de reescrever; `loading="lazy"`; miniatura abre o viewer.
6. Converter `paisagem-login-v2.png` para WebP ≤ 250 KB; atualizar `login.css` e `ORIGEM_DOS_ATIVOS.md`.

**Testes:** `pnpm test` verde; novos testes de cabeçalhos; teste "primeiro envio = 1 chamada ao Drive com pasta existente"; `test:panel:browser`.

**Aceite:** critérios 3, 4 e 6 de `03_DESEMPENHO_FOTOS.md §6`; segundo carregamento do painel < 100 KB.

**Rollback:** reverter o commit; a migração 0016 só adiciona índices (podem ser mantidos).

---

## Fase 2 — miniaturas

**Arquivos:** `migrations/0016` (ou `0017_photo_thumbnails.sql` se a fase 1 já publicou os índices), `server/collector.mjs` (rota `photo-thumb`, parâmetro `size`), `server/in-progress-photos.mjs`, `server/photo-gallery.mjs`, `web/collector-v3.js` (`preparePhotos`, `upload`, `photos`), `web/desktop.js`, `web/desktop-progress-photos.js`, `web/desktop-results.js`, `web/photo-viewer.js`, `web/collector.css`, `web/panorama-layout.css`, `tests/in-progress-photos.test.mjs`, `tests/photo-gallery.test.mjs`, `tests/collector-v3-browser.cjs`.

**Passos:** conforme FOTO-02 (1–6). Ordem segura: migração → rota de leitura com fallback → rota de gravação → cliente coletor → painel → ação root de backfill.

**Testes:** unidade (miniatura ≤ 2 D1, 0 Drive; fallback ao integral quando `thumb_blob` nulo; limite de 64 KB; recusa de miniatura para foto não `ready`); navegador (galeria parcial usa `size=thumb`; viewer usa integral); manual em Android Chrome e iPhone Safari (HEIC, 12 MP, tempo de preparo).

**Aceite:** critérios 1, 2, 7 e 8 de `03 §6`.

**Rollback:** cliente volta a pedir sem `size`; colunas novas ficam inertes.

---

## Fase 3 — painel por blocos

**Arquivos:** `web/desktop.js`, `web/desktop-map.js`, `web/desktop-inventory.js`, `server/collector.mjs` (`/api/inventory/equipment?category=`), `web/panel-shell.js`, `tests/desktop.cjs`, `tests/desktop-identity-browser.cjs`.

**Passos:**
1. `render()` → `renderShell()` + `updateBlocks(names)`; cada bloco `data-layout-block` tem função própria; busca com debounce 250 ms atualizando `unit-list`/`matrix`/`selected`.
2. `desktop-map.js`: `mountMap` reutiliza `current` se `container===current.container`; `updateMarkers(units,selected)`.
3. `photo()` usa a fachada; evidência prefere fachada; galeria "Ver todas (n)" via `/api/inventory/photos` paginada (viewer com "carregar mais").
4. Célula da matriz → `showEquipment(unit,offset,category)`; rota aceita `category`.
5. Botão "Locais de referência" no mapa (padrão desligado) — após DECISÃO.
6. `details` com TTL 60 s + botão "Atualizar"; `in-progress-equipment` devolve `agent_linked`.
7. "Exportar matriz" → `exportCsv()`; Exportar dados ganha matriz e fichas.
8. Filtros avançados com Tipo; decidir Ano.

**Aceite:** critérios 5 de `03 §6`; digitar 10 caracteres = ≤ 1 montagem do mapa; `test:panel:browser` verde; capturas comparadas ao layout D-067 (`docs/05-qualidade/LAYOUT_PANORAMA_2026-11-06.md`) sem perda de blocos.

---

## Fase 4 — coletor V3

**Arquivos:** `web/collector-v3.js`, `web/collector-ui.js`, `web/collector-v3.css`, `server/collector.mjs` (`photo-upload` devolve a linha; `inventory-section` para G; `photo-list` com `limit`), `server/collector-v3.mjs`, `tests/collector-v3.test.mjs`, `tests/collector-v3-browser.cjs`, `tests/collector-ux-browser.cjs`.

**Passos:**
1. Indicador global de atividade (`aria-busy`, barra no cabeçalho) e aviso ao toque bloqueado.
2. `api()` com renovação de CSRF em 403 e mensagem de sessão em 401 (portar de `collector.js:13`).
3. `upload()` usa a resposta; prévia vira miniatura (`sent:true`); sem `inspection` após foto; `saveItem()` sem `load()`.
4. `preparePhotos` com `createImageBitmap` + HEIC + miniatura.
5. Lista de equipamentos: badges rascunho/duplicidade/conferência; menu "Conferir"; "Corrigir" da revisão abre a ficha certa.
6. `inventory-section` G exige foto da impressora; remover handlers órfãos e `etapa`.
7. Uploads 2 em paralelo com status por foto.

**Testes:** navegador com Worker real e Drive simulado: enviar 2 fotos → sem `GET inspection`; conferir equipamento → `equipment_verifications` gravado; concluir G sem foto → 409 com ids; expirar sessão → mensagem correta; aparelho físico (Android Chrome e iPhone Safari) para câmera/galeria/HEIC e "Fechar teclado".

**Aceite:** critérios 7 e 8 de `03 §6`; revisão de campo com um operador real registrando tempos clique→tela em `docs/05-qualidade/`.

---

## Fase 5 — estrutural e manutenção

1. **Medição** (MEL-07) publicada primeiro; uma semana de p50/p95.
2. **Smart Placement** (MEL-01) nos dois Workers; comparar; manter ou reverter.
3. **Batch de leituras** (MEL-02) em `inspection`, `equipment-save`, `in-progress-detail`, `/api/inventory/unit`.
4. **Sessão em memória** (MEL-03).
5. **Assets versionados** (MEL-04) e `jsQR` público (MEL-05).
6. **Limpeza** (MEL-08, ERR-13/14/15), **tema único** (MEL-09), **formatação** (MEL-11) — cada um em commit próprio.
7. **Rota única de foto** (ERR-20/MEL-13) e **testes de proteção** (MEL-14).

---

## O que não fazer durante as correções

- Não alterar perguntas, obrigatoriedades, perfis ou invariantes de `AGENTS.md`; não "resolver" pendências sem decisão.
- Não tornar o Drive público nem gerar links compartilháveis; a leitura continua pelo Worker autenticado.
- Não remover `v2Evidence` do caminho de **revisão** (`reviewV3`) — só da carga inicial do coletor.
- Não cachear respostas de `/api/*` com dados (listas, detalhes) no navegador; só binários de foto (privado) e assets.
- Não executar `rm`, `DROP` ou reescrita de linhas em migrações; todas as migrações desta revisão são aditivas.
- Não reformatar código junto com mudança funcional (MEL-11 é commit separado).
- Não publicar sem passar `pnpm test`, builds, `check:docs`, `docs:schema` e os três testes de navegador da CI.

## Registro ao concluir cada fase

Criar `docs/05-qualidade/CORRECOES_PRODUCAO_FASE_n_<data>.md` com: itens tratados (IDs daqui), arquivos alterados, testes executados, medições antes/depois (D1/Drive por operação, bytes transferidos, p50/p95 se já houver `Server-Timing`), capturas comparadas às referências aprovadas, versão publicada, e atualizar `docs/00-governanca/RASTREABILIDADE.md` e `docs/07-operacao/09_ESTADO_E_PENDENCIAS.md`.
