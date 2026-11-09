# 03 · Desempenho das fotografias — diagnóstico e plano técnico

Pedido do responsável: "o sistema apresenta lentidão principalmente no que diz respeito às fotos de equipamento, maneira de mostrar e ícones". Este arquivo cobre a lentidão e a forma de mostrar; ícones estão em `04_ICONES_E_EXIBICAO.md`.

## 1. Caminho atual de uma fotografia

```
CELULAR (coletor V3)                      WORKER (coletor)                         GOOGLE DRIVE / D1
---------------------------------------   --------------------------------------   -----------------------------------
file input → new Image().decode()         photo-upload (collector.mjs:119)
→ canvas 1600px JPEG q.85 (até 3 MB)      ├ sessão (worker.mjs:13) ............... D1
→ POST photo-upload por foto, em série    ├ inspection + validações ............... D1 ×3-4
                                          ├ INSERT collection_photos (pending) .... D1
                                          ├ SELECT units (nome da pasta) .......... D1
                                          ├ store.put: ready()+accessToken ........ D1 ×2
                                          │   findByProperty(semedPhotoId) ........ Drive (lista)   ← sempre
                                          │   unitFolder: D1 ou Drive (lista+cria)  D1 / Drive ×2  ← 1.ª foto da unidade
                                          │   multipartUpload ..................... Drive (upload)
                                          └ UPDATE ready + revision + history ..... D1 ×3
→ GET /api/collector/inspection           (recarrega TUDO, inclui v2Evidence) ..... D1 ×8
→ render(): <img src=/api/collector/photo?id=…>  (ARQUIVO INTEGRAL, sem lazy)

PAINEL                                    WORKER (painel)
---------------------------------------   --------------------------------------
render() recria todas as <img>            GET photo (collector.mjs:117 / in-progress-photos.mjs:37 / photo-gallery.mjs:12)
a cada clique/tecla (desktop.js:135)      ├ sessão ............................... D1
Ocorrências: a cada 15 s                  ├ collection_photos + unit/inspection ... D1 ×1-2
                                          ├ ready() + accessToken (2 leituras) .... D1 ×2
                                          └ GET files/{id}?alt=media .............. Drive (download integral)
                                          worker.mjs:121 → Cache-Control: no-store (sobrescreve tudo)
```

## 2. Números medidos (fixtures do repositório, 08/11/2026)

Script: SQLite em memória + Drive simulado (`tests/helpers/fake-drive.mjs`), instrumentando `db.prepare/batch` e contando chamadas HTTP ao Drive. Não inclui a consulta de sessão do `worker.mjs` (+1 D1 por requisição autenticada).

| Operação | D1 | Drive | Observação |
|---|---:|---:|---|
| Upload da 1.ª foto de uma unidade | 14 | 4 | busca do id + busca da pasta + criação da pasta + upload |
| Upload de foto seguinte (pasta em cache D1) | 13 | 2 | busca do id + upload |
| `GET /api/collector/photo` (coletor) | 4 | 1 | download integral |
| `GET /api/inventory/in-progress-photo` (painel) | 4 | 1 | download integral |
| `GET /api/inventory/photo` (galeria D-064) | 3 | 1 | download integral |
| `GET /api/collector/inspection` (abrir coleta) | 8 | 0 | inclui todo o histórico de fotos da unidade |

Projeção: galeria parcial de 50 fotos = **~250 consultas D1 + 50 downloads integrais** (≈ 15–40 MB). Panorama ao selecionar uma unidade = 5 imagens (4 da galeria + 1 evidência, a primeira duplicada) = 25 D1 + 5 downloads; cada clique seguinte na mesma unidade repete tudo (ERR-03 + ERR-01).

Contexto de rede registrado em `docs/05-qualidade/ANALISE_DESEMPENHO_COLETOR_2026-11-05.txt` §4.1: D1 primário em **WEUR (LIS)**, Worker respondendo em **GRU**. Cada consulta D1 sequencial atravessa o Atlântico; a latência por imagem é dominada por 5 idas ao banco mais o download do Drive (datacenters do Google, geralmente EUA/Europa para a conta institucional).

## 3. Causas, por ordem de impacto

| # | Causa | Onde | Impacto |
|---|---|---|---|
| C1 | Não existe miniatura; toda miniatura é o arquivo integral | `collector-v3.js:40`, `desktop.js:72-76`, `desktop-results.js:11`, `desktop-progress-photos.js:12` | 10–40× mais bytes do que o necessário por miniatura |
| C2 | `no-store` global impede qualquer cache no navegador | `worker.mjs:121` | cada recriação de `<img>` = novo download Drive |
| C3 | Painel recria todas as `<img>` a cada interação; Ocorrências a cada 15 s | `desktop.js:135,158`, `desktop-results.js:12,16` | multiplica C1 × C2 |
| C4 | 5 consultas D1 por imagem, token lido duas vezes, sem ETag/304 | `photo-storage.mjs:31,79-80`, `collector.mjs:117` | latência fixa por imagem mesmo sem download |
| C5 | Upload faz 1 listagem no Drive antes de cada envio | `photo-storage.mjs:94` | +0,3–0,9 s por foto |
| C6 | Coletor recarrega a vistoria inteira após foto e após equipamento | `collector-v3.js:66-67` | 8 D1 + histórico completo por salvamento |
| C7 | Preparo da foto no celular decodifica a imagem inteira em `<img>`+canvas; HEIC recusado | `collector-v3.js:71` | 1–3 s de interface travada; falha no iPhone |
| C8 | Sem índice por `inspection_id`/`unit_id` em `collection_photos` | `migrations/0006_collector.sql:16` | cresce com o volume |
| C9 | Worker longe do D1 (sem `placement`) | `wrangler.jsonc`, `wrangler.collector.jsonc` | multiplica C4 e todas as rotas |

## 4. Plano técnico

### FOTO-01 · Cache seletivo no Worker (resolve C2) — Fase 1
`server/worker.mjs:121`:
```js
if(!response.headers.has('Cache-Control'))response.headers.set('Cache-Control','no-store');
```
e, nos pontos de `env.ASSETS.fetch` para `/vendor/*`, `/assets/*`, `*.css`, `*.js`, `*.svg`, `*.woff2`: `public, max-age=86400, stale-while-revalidate=604800` (passar a `immutable` quando houver versionamento — MEL-04). HTML e `/api/*` mantêm `no-store`. Teste em `tests/security.test.mjs`: `/index.html` e `/api/auth/me` → `no-store`; `/vendor/leaflet/leaflet.js` → `public`.

### FOTO-02 · Miniaturas geradas no cliente e guardadas em D1 (resolve C1) — Fase 2
Por que D1 e não Drive/R2: evita uma segunda chamada externa por miniatura, mantém tudo sob a mesma autenticação e o mesmo backup, e um JPEG de 320 px com qualidade 0,7 pesa 10–30 KB (limite de linha D1 = 1 MB). Cloudflare Image Resizing não se aplica a `workers.dev` sem zona.

1. **Migração aditiva `0016_photo_thumbnails.sql`:**
   ```sql
   ALTER TABLE collection_photos ADD COLUMN thumb_blob BLOB;
   ALTER TABLE collection_photos ADD COLUMN thumb_mime TEXT;
   ALTER TABLE collection_photos ADD COLUMN thumb_width INTEGER;
   ALTER TABLE collection_photos ADD COLUMN thumb_height INTEGER;
   CREATE INDEX collection_photos_inspection ON collection_photos(inspection_id,created_at DESC,id DESC);
   CREATE INDEX collection_photos_unit_status ON collection_photos(unit_id,status,created_at DESC);
   ```
2. **Cliente (`collector-v3.js:71`):** no mesmo `preparePhotos`, gerar dois derivados com `createImageBitmap(file,{resizeWidth,resizeHeight,resizeQuality:'high',imageOrientation:'from-image'})`: `full` (máx. 1600 px, JPEG 0,85, como hoje) e `thumb` (máx. 320 px, JPEG 0,7). Fallback para o caminho atual quando `createImageBitmap` com opções não existir. Aceitar `image/heic|heif` (ERR-09).
3. **Upload:** novo `POST /api/collector/photo-thumb` (mesmos cabeçalhos `X-Photo-Id`/`X-Inspection-Id`, corpo JPEG ≤ 64 KB) chamado **depois** do upload principal confirmar `ready`; grava `thumb_blob` por `UPDATE … WHERE id=? AND status='ready'`. Falha na miniatura não invalida a foto (a rota de leitura cai para o integral). Alternativa com um único request multipart é possível, mas a dupla rota mantém o contrato atual e os testes existentes.
4. **Leitura:** `GET …/photo?id=&size=thumb` → se `thumb_blob` existir, responde D1 direto (2 consultas: sessão + linha), `Content-Type: thumb_mime`, `ETag`, `Cache-Control: private, max-age=86400`; senão, redireciona internamente ao integral (fallback). Aplicar às três rotas (ou à rota unificada de ERR-20).
5. **Galerias** (`collector-v3.js:40`, `desktop.js:73,76`, `desktop-results.js:11`, `desktop-progress-photos.js:12`): `src=…&size=thumb`, `loading="lazy" decoding="async" width="320" height="240"`. O viewer (`photo-viewer.js:18`) continua integral; pode exibir a miniatura como placeholder enquanto o integral carrega (`background-image`).
6. **Fotos já gravadas sem miniatura:** fallback automático ao integral + ação root em Configurações "Gerar miniaturas pendentes" que, no navegador do root, baixa cada integral sem `thumb_blob`, reduz com canvas e envia `photo-thumb` (o Worker não tem decodificador de imagem). Com ~10 fotos hoje, é imediato.

### FOTO-03 · ETag e 304 antes do Drive (resolve parte de C4) — Fase 1
Nas rotas de leitura: `ETag: "<sha256>"`; se `If-None-Match` coincidir → `304` sem `store.get`. Com `Cache-Control: private, max-age=86400`, o navegador nem pergunta por um dia; passado o prazo, revalida com 304 (só D1). O `retry=Date.now()` do viewer (`photo-viewer.js:22`) continua funcionando como *cache-buster* explícito.

### FOTO-04 · Token do Drive em memória e uma única leitura de `integration_tokens` (resolve C4) — Fase 1
`server/photo-storage.mjs`:
- `accessToken(env,db,{row})` aceita a linha já lida por `ready()`; `driveStore` passa `cached`.
- Cache por isolate: `let memo={token:null,expires:0,rowVersion:null}`; reutilizar quando `expires>now+60000`; invalidar em `revoked`, `refresh_failed`, `selfTest` e `disconnect` (zerar `memo`). Isolates do Workers vivem minutos; o risco de token revogado em memória é limitado a esse intervalo e o Drive responde 401 → já tratado como `drive_401`.
- Resultado: leitura de miniatura = 2 D1; integral = 3 D1 + Drive (ou 2 D1 no 304).

### FOTO-05 · Coletor não recarrega a vistoria após foto/equipamento (resolve C6) — Fase 4
- `photo-upload` devolve `{id,status:'ready',target_kind,target_id,created_at,current:true}`; `upload()` faz `collection.photos.push(row)` e `render()`; remove o `api('/api/collector/inspection')` de `collector-v3.js:67`.
- `saveItem()` (`:66`) não chama `load()`; usa a resposta (`version`, `environment`). `load()` fica para troca de assunto, conclusão e reabertura.
- `/api/collector/inspection` deixa de incluir `v2Evidence` completo: devolve só as fotos da visita atual e, por alvo, as 5 mais recentes de visitas concluídas (`photo-list` ganha `limit`). Para a revisão (`reviewV3`, `collector-v3.mjs:36`), o servidor continua consultando o histórico — isso não muda.

### FOTO-06 · Prévia local vira a miniatura logo após o envio (resolve C1 no coletor) — Fase 4
Após `201`, manter `URL.createObjectURL(blob)` do derivado `thumb` em `previews` com `sent:true` e usá-lo como `src` enquanto a aba viver; só pedir ao servidor fotos que não nasceram nesta aba. Economia: 0 downloads para o que o operador acabou de fotografar.

### FOTO-07 · Painel preserva `<img>` e não re-renderiza por tecla (resolve C3) — Fase 3
- `desktop.js:158`: debounce 250 ms e atualizar apenas `unitList()`/`matrixPanel()` por `data-layout-block`, nunca `#content` inteiro.
- `render()`: dividir em `renderShell()` (uma vez por página) e `updateBlocks([...])`; manter o Leaflet quando `#municipal-map` persiste (atualizar marcadores via `featureGroup.clearLayers()` + `addLayer`, sem `map.remove()`).
- `desktop-results.js:12`: só reescrever `#received-findings` quando `JSON.stringify(page)` mudar; `[data-result-summary]` idem.
- Galeria do detalhe: quando a lista de ids não mudou, não tocar nos nós (ou adotar o `updateScreen` de `collector-ui.js` com `data-ui-key="photo:<id>"` no painel).

### FOTO-08 · Upload sem listagem prévia e sem reler a unidade (resolve C5) — Fase 1
- `photo-storage.mjs:94`: `if(retry)` apenas (ver ERR-06).
- `collector.mjs:127`: ler `units.name,code` no mesmo `batch` da inserção ou aceitar o nome em memória da sessão de coleta; são 1 consulta a menos por foto.
- Uploads do mesmo lote podem ir em paralelo de 2 em 2 (`Promise.all` com limite) — a ordem não importa, o servidor é idempotente por `X-Photo-Id`.

### FOTO-09 · Índices (resolve C8) — Fase 1
Ver migração em FOTO-02 (podem ir em 0016 isoladamente antes das miniaturas).

### FOTO-10 · Placement do Worker (resolve C9) — Fase 5, medir antes
`wrangler.jsonc` e `wrangler.collector.jsonc`: `"placement":{"mode":"smart"}`. Hipótese: trocar 5–20 travessias Worker↔D1 por 1 travessia usuário↔Worker. Protocolo: medir p50/p95 de `GET /api/collector/inspection` e `POST equipment-save` em produção (cabeçalho `Server-Timing` com tempo D1 — MEL-07) antes e 48 h depois; manter se melhorar; os *location hints* do D1 não incluem América do Sul na documentação consultada em 05/11, portanto mover o banco não é alternativa imediata. Ver também `docs/05-qualidade/ANALISE_DESEMPENHO_COLETOR_2026-11-05.txt` §9.

## 5. Forma de mostrar as fotos — ajustes de interface

| Onde | Hoje | Proposta |
|---|---|---|
| Coletor, bloco de fotos (`collector-v3.js:40`) | quadros 4:3 com integral, sem indicação de carregamento, "Histórico preservado" para todas as antigas | miniatura + esqueleto cinza enquanto carrega; agrupar "Nesta visita (n)" e "Visitas anteriores (n) · ver"; legenda com data |
| Coletor, durante envio | `status` no cabeçalho muda; thumbs de prévia sem progresso | barra de progresso por foto (`XMLHttpRequest.upload.onprogress` ou `fetch` com `ReadableStream`), "2 de 5 enviadas" |
| Panorama, Evidência da Última Coleta (`desktop.js:73`) | primeira foto da lista, até 640 px | fachada mais recente; legenda com data e autor; clique abre viewer |
| Panorama/Detalhe, Galeria (`desktop.js:76`) | 4 miniaturas integrais, "Ver todas" limitado a 50 | 4 miniaturas + "Ver todas (n)" paginado por `/api/inventory/photos` |
| Ocorrências (`desktop-results.js:11`) | `<img style="max-width:120px">` integral, link cru para a API | miniatura com `openPhotoViewer`, sem link externo |
| Coletas em andamento (`desktop-progress-photos.js:12`) | já usa `loading="lazy"` e preserva o DOM; integral | miniatura; manter o resto |
| Viewer (`photo-viewer.js`) | integral, sem placeholder | miniatura como fundo + integral por cima; mostrar tamanho/dimensões |
| Ficha do equipamento no painel | sem fotos | "Fotos (n)" (LNA-17) |

## 6. Critérios de aceite do conjunto

1. Galeria parcial com 50 fotos: ≤ 2 s até todas as miniaturas em 4G (throttling "Fast 3G" do DevTools ≤ 6 s); transferência ≤ 1,5 MB.
2. Leitura de miniatura: ≤ 2 consultas D1, 0 chamadas ao Drive (teste automatizado com o contador do script de medição).
3. Leitura integral repetida (mesmo navegador, < 24 h): 0 chamadas ao Drive (304 ou cache local).
4. Upload de foto subsequente em unidade conhecida: 1 chamada ao Drive.
5. Selecionar a mesma unidade duas vezes no panorama: 0 requisições de imagem na segunda.
6. Ocorrências aberta por 2 min sem mudanças: 0 requisições de imagem após a primeira carga.
7. Coletor: "Salvar equipamento" com 2 fotos = 1 `equipment-save` + 2 `photo-upload` + 2 `photo-thumb`, sem `inspection`.
8. iPhone/Safari: foto HEIC da galeria enviada com sucesso; Android/Chrome: JPEG 12 MP preparado em < 1 s.
9. Regressões: `pnpm test` (inclui `photo-storage`, `photo-gallery`, `in-progress-photos`), `test:v3:browser`, `test:panel:browser` verdes; novo teste de cabeçalhos de cache.
