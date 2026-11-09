# 01 · Erros encontrados

Cada item traz: onde (arquivo:linha no commit `eddba99`), sintoma para o usuário, causa no código, como reproduzir, correção proposta e critério de aceite. Severidade: Crítico / Alto / Médio / Baixo. Os itens de fotografia têm detalhamento adicional em `03_DESEMPENHO_FOTOS.md`.

---

## ERR-01 · Crítico · `Cache-Control: no-store` forçado em todas as respostas

**Onde:** `server/worker.mjs:121` — `response.headers.set('Cache-Control','no-store')` no `fetch` exportado, depois de qualquer handler.

**Sintoma:** todo acesso ao coletor ou ao painel baixa novamente fontes (8 arquivos woff2 ≈ 170 KB), `leaflet.js` (147 KB), `jsQR.js` (257 KB, ao abrir o leitor), CSS, módulos JS e a imagem da tela de login (`assets/paisagem-login-v2.png`, **2,6 MB**). Toda fotografia é baixada de novo do Google Drive sempre que uma `<img>` é criada — inclusive quando o painel apenas re-renderiza a mesma tela. A análise de 05/11 já tinha visto `CF-Cache-Status: HIT` com `no-store` no navegador; o custo é no celular e no painel, não na borda.

**Causa:** a regra de segurança correta para páginas HTML e respostas de API (dados privados) foi aplicada indiscriminadamente a assets estáticos públicos (o código está no GitHub público) e a binários imutáveis (foto identificada por `sha256`). `photoRoute`, `in-progress-photos.mjs:44` e `photo-gallery.mjs:16` até definem `private, no-store`, mas a linha 121 sobrescreve qualquer valor.

**Reprodução:** abrir DevTools → Network no painel, selecionar uma unidade no mapa duas vezes; as mesmas fotos aparecem duas vezes com status 200 e tamanho integral. Recarregar a página: todos os `.woff2`, `.css`, `.js` voltam com 200 e `cache-control: no-store`.

**Correção:**
1. Em `worker.mjs:121`, só aplicar `no-store` quando o handler **não** definiu `Cache-Control` (`if(!response.headers.has('Cache-Control'))`).
2. Para `env.ASSETS.fetch(...)` de caminhos imutáveis (`/vendor/*`, `/assets/*`, `*.css`, `*.js`): `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` (ou `max-age=31536000, immutable` quando o build passar a versionar nomes — ver MEL-04). HTML (`/index.html`, `collector-v3.html`, `/login`) continua `no-store`.
3. Para fotos: `Cache-Control: private, max-age=86400` + `ETag: "<sha256>"` + resposta `304` em `If-None-Match` **antes** de consultar o Drive (detalhe em FOTO-03).

**Aceite:** segundo carregamento do painel transfere < 100 KB; segunda seleção da mesma unidade não gera nenhuma requisição a `/api/collector/photo`; teste automatizado garantindo `no-store` em `/api/*` e em HTML e `public` em `/vendor/*`.

---

## ERR-02 · Alto · Página Ocorrências refaz todas as imagens a cada 15 segundos

**Onde:** `web/desktop-results.js:11` (função `list()` gera `<img src="/api/collector/photo?id=…">` sem `loading="lazy"`), `:12` (`draw()` faz `innerHTML=list()`), `:16` (`setInterval(…,15000)` chama `refresh()` → `draw()`).

**Sintoma:** com a página Ocorrências aberta, o navegador baixa de novo todas as evidências a cada 15 s (N fotos × 4 vezes por minuto), via Worker → Drive. Em rede lenta a página "pisca" e o consumo de dados cresce sem o usuário fazer nada. Combinado com ERR-01, nada vem do cache.

**Correção:** (a) só reescrever o HTML quando o JSON da página mudar (mesma técnica já usada em `desktop-progress-photos.js:17-18`, comparando `lastMarkup`); (b) `loading="lazy" decoding="async"` e miniatura (FOTO-02) nas evidências; (c) a âncora `href="/api/collector/photo?id=…" target="_blank"` deve abrir o `openPhotoViewer` em vez de expor a rota crua da API em nova aba.

**Aceite:** com a página aberta por 2 minutos sem mudanças no servidor, zero requisições a `/api/collector/photo` depois da primeira carga.

---

## ERR-03 · Alto · Painel reconstrói a tela inteira (e o mapa) a cada interação

**Onde:** `web/desktop.js:133-145` (`render()` → `unmountMap()`; `#content.innerHTML=pageContent()`; `mountMap()`), `:158` (`input` na busca → `render()` a cada tecla), `:159` (filtros → `render()`), `:169` (`select-unit` → `render()`), `:141` (detalhe carregado assíncrono → `render()` de novo).

**Sintoma:** digitar "esc" na busca do painel dispara 3 renderizações completas: o Leaflet é destruído e recriado 3 vezes (tiles recarregados, "Carregando cartografia…" pisca), a matriz é refeita e todas as `<img>` de galeria/evidência são recriadas e, por ERR-01, baixadas de novo. Clicar em um marcador do mapa tem o mesmo efeito. Em máquinas modestas da secretaria isso é percebido como "painel lento" e "fotos demoram".

**Correção:** ver FOTO-07 e MEL-06. Resumo: debounce de 250 ms na busca atualizando só a lista/matriz; manter a instância do mapa quando o nó `#municipal-map` continua na página (atualizar marcadores com `setStyle`/`addLayer`); atualizar blocos por `data-layout-block` em vez de `innerHTML` global; reutilizar nós `<img>` (ou ao menos manter `src` idêntico com cache ativo).

**Aceite:** digitar 10 caracteres na busca gera no máximo 1 montagem do mapa e nenhuma requisição de foto; selecionar uma unidade já carregada não gera download de imagem.

---

## ERR-04 · Alto · Coletor usa a foto integral como miniatura e mostra todo o histórico

**Onde:** `web/collector-v3.js:40` (`photos()` → `<img src="/api/collector/photo?id=…">` sem `loading`, sem `decoding`, sem dimensões); `server/collector-v2.mjs:15-19` (`v2Evidence` devolve todas as fotos `ready` da unidade em vistorias concluídas + atual, sem paginação); `server/collector.mjs:43` (a rota `/api/collector/inspection` sempre inclui esse histórico).

**Sintoma:** ao abrir a ficha de uma impressora que já tem fotos de visitas anteriores, o celular baixa N arquivos integrais (300–800 KB cada) só para mostrar quadradinhos de 4:3. Na tela Ambientes, todas as fotos de todos os ambientes são carregadas de uma vez. Em 3G/4G fraco a tela trava alguns segundos e a barra "Salvando…" compete com os downloads.

**Correção:** miniaturas (FOTO-02), `loading="lazy" decoding="async" width height`, e limitar o histórico exibido por alvo (por exemplo, as 5 mais recentes com "ver anteriores"). Depois do upload, usar a prévia local (`previews`) como miniatura em vez de baixar o que acabou de ser enviado (FOTO-06).

**Aceite:** abrir a ficha de impressora com 5 fotos históricas transfere < 150 KB.

---

## ERR-05 · Alto · Cada leitura de foto custa 5 consultas D1 + 1 chamada ao Drive

**Onde:** `server/worker.mjs:13` (sessão, 1 consulta), `server/collector.mjs:117` (`collection_photos` + `unit()`), `server/photo-storage.mjs:79-80` (`ready()` lê `integration_tokens`), `:31` (`accessToken` lê `integration_tokens` **de novo**, sem usar o cache `cached` da linha 78), `:99` (`alt=media` no Drive).

**Medido** (fixtures do repositório, `node --test` + script de instrumentação): `GET /api/collector/photo` = 4 D1 (+1 de sessão) + 1 Drive; `GET /api/inventory/in-progress-photo` = 4 (+1) + 1; `GET /api/inventory/photo` = 3 (+1) + 1.

**Sintoma:** 48 miniaturas = ~240 consultas D1 sequenciais por lote + 48 downloads do Drive. Com D1 primário em WEUR e Worker em GRU, a latência de cada consulta se soma.

**Correção:** (a) cache do token de acesso em memória do isolate (`let tokenCache`), válido até `access_token_expires_at-60s`, invalidado em `revoked`/`refresh`; (b) `accessToken` recebe a linha já carregada por `ready()`; (c) `ETag`/`304` antes de tocar o Drive (FOTO-03); (d) miniaturas em D1 eliminam o Drive para galerias (FOTO-02). Resultado esperado: miniatura = 2 D1 e 0 Drive; integral com cache = 2 D1 e 0 Drive no 304.

---

## ERR-06 · Médio · Upload faz busca no Drive antes de todo envio, mesmo o primeiro

**Onde:** `server/photo-storage.mjs:94` (`findByProperty(token,…,'semedPhotoId',photoId)` incondicional em `put`).

**Medido:** 1.ª foto de uma unidade = **4** chamadas ao Drive (busca do id, busca da pasta da unidade, criação da pasta, upload); fotos seguintes = **2** (busca do id + upload). A busca por `appProperties` é uma listagem de arquivos (~300–900 ms observados em integrações Drive).

**Correção:** só executar a busca de idempotência quando já existe linha `pending` em `collection_photos` para o mesmo id (`existing` em `collector.mjs:124`) — é exatamente o caso de "upload anterior interrompido". Passar `{retry:!!existing}` para `store.put`. Mantém a garantia de não duplicar arquivo.

**Aceite:** teste `photo-storage.test.mjs` "upload idempotente" continua passando; novo teste: primeiro envio faz 1 chamada ao Drive quando a pasta da unidade já existe.

---

## ERR-07 · Médio · Fachada nunca aparece no cabeçalho da unidade

**Onde:** `web/desktop.js:31` (`photo()` ignora argumentos e devolve sempre o placeholder "Sem fotografias de vistorias concluídas"), `:102` (`photo(4)`), `:194` (`photo(state.photo,'',true)`).

**Sintoma:** mesmo com a fachada enviada e a visita concluída, o quadro `school-photo` do detalhe diz que não há fotos. Já estava listado como lacuna 01 no mapeamento de 05/11; permanece.

**Correção:** `photo()` deve procurar em `detail()?.photos` a mais recente com `target_kind==='facade'` e renderizar `<img>` (miniatura) com fallback ao placeholder. A "Evidência da Última Coleta" (`:73`) deve preferir a fachada e, na ausência, a primeira foto.

---

## ERR-08 · Médio · Clique na célula da matriz ignora a categoria

**Onde:** `web/desktop.js:184` (`cell` → `showEquipment(unit, offset)` sem `data-col`), `:85` (`showEquipment` não filtra), `server/collector.mjs:139` (`/api/inventory/equipment` não aceita `category`).

**Sintoma:** clicar em "Impressoras: 3" abre a lista de todos os bens da unidade. Lacuna 07 do mapeamento; permanece.

**Correção:** aceitar `category` (mapeando a coluna com `columnFor` de `desktop-inventory.js:9` — desktop/computer, notebook, printer, other…) na rota e no diálogo; título do diálogo com a categoria; manter botão "Ver todos".

---

## ERR-09 · Médio · Fotos HEIC do iPhone são recusadas e o preparo é pesado no celular

**Onde:** `web/collector-v3.js:71` (`/^image\/(jpeg|png|webp)$/.test(file.type)`; `new Image()` + `decode()` + canvas 2D para redimensionar).

**Sintoma:** no iPhone, "Galeria" pode devolver `image/heic` (fotos antigas ou configuração "Mais compatível" desligada) → erro "Use JPEG, PNG ou WebP de até 30 MB" e a foto não pode ser enviada. Com a câmera (`capture`), o Safari costuma entregar JPEG, então o problema aparece só ao escolher da galeria. Além disso, decodificar uma foto de 12–48 MP inteira em `<img>` e desenhá-la num canvas consome memória e trava a interface por 1–3 s em aparelhos modestos.

**Correção:** aceitar `image/heic|heif` e deixar o navegador decodificar via `createImageBitmap(file,{resizeWidth,resizeHeight,resizeQuality:'high',imageOrientation:'from-image'})` (com fallback ao caminho atual onde não houver suporte). Se o HEIC não decodificar (Chrome Android não decodifica HEIC), mostrar mensagem específica "Use a câmera ou converta a foto". Gerar a miniatura no mesmo passo (FOTO-02).

**Aceite:** teste manual em iPhone (Safari) com foto HEIC da galeria e em Android (Chrome) com JPEG de 12 MP: preparo < 1 s, sem erro.

---

## ERR-10 · Médio · Um salvamento bloqueia todos os botões, mas só o clicado parece desabilitado

**Onde:** `web/collector-v3.js:154` (`if(!t||…||busy||photoBusy)return;busy=true;t.disabled=true`), `:190` (`finally` reabilita só `t`). O V3 não tem o indicador global `#network-status` que `web/collector.js:14-15` cria.

**Sintoma:** mesmo achado P1 da análise de 05/11: durante "Salvando…" de uma foto ou de um equipamento, toques em outros botões são ignorados sem feedback; o operador toca várias vezes e conclui que "o ícone não funciona".

**Correção:** indicador global (barra fina no topo ou badge no cabeçalho) ligado a `busy||photoBusy||drafts.hasPending()`; `aria-busy` no `#collector`; botões com estado visual "aguardando" via CSS `#collector[aria-busy=true] [data-action]{opacity:.6}`; nunca descartar o toque silenciosamente — ao menos um aviso "Aguarde o envio".

---

## ERR-11 · Médio · Sessão expirada ou CSRF renovado derrubam a coleta sem orientação

**Onde:** `web/collector-v3.js:21` (`api()` lança `v.error` genérico em 401/403). `web/collector.js:13` (`rawApi`) já renova o CSRF em 403 consultando `/api/auth/me` e dá mensagem específica em 401; o V3 regrediu.

**Sintoma:** após troca de senha em outra aba ou expiração da sessão (15 min–24 h configuráveis), o operador vê "Autenticação necessária." e, se fechar a aba, perde prévias de fotos e rascunhos locais.

**Correção:** portar a lógica de `rawApi` para `collector-v3.js` (renovar CSRF em 403; em 401 exibir "Sessão expirada — entre em outra aba e volte aqui para reenviar; não feche esta aba"). Complementar com MEL-10 (rascunho persistente).

---

## ERR-12 · Médio · Falta índice em `collection_photos` para as consultas usadas

**Onde:** `migrations/0006_collector.sql:16` cria só `(target_kind,target_id,created_at)`. Consultas por `inspection_id`: `server/collector.mjs:41`, `:118`; `in-progress-photos.mjs:28,31`. Consultas por `unit_id`: `collector-v2.mjs:17`, `collector.mjs:138`, `photo-gallery.mjs:14,23,28`.

**Sintoma:** hoje a tabela é pequena (≈10 fotos em 05/11); com dezenas de unidades × dezenas de fotos cada consulta vira varredura completa e cresce linearmente a cada abertura de vistoria/galeria.

**Correção (migração aditiva `0019_photo_indexes.sql` — 0016 a 0018 já estão ocupadas na `main` por D-068/D-070/D-071):**
```sql
CREATE INDEX collection_photos_inspection ON collection_photos(inspection_id,created_at DESC,id DESC);
CREATE INDEX collection_photos_unit_status ON collection_photos(unit_id,status,created_at DESC);
```

---

## ERR-13 · Baixo · Ícone inexistente vira "monitor" sem aviso

**Onde:** `web/desktop-icons.js:33` (`paths[name]||paths.monitor`). `web/app.js:25,27,43` usam `icon('arrow')` e `icon('save')`, que não existem (app.js é o protótipo antigo e não entra nos builds, mas prova o risco).

**Correção:** fallback neutro (círculo/ponto) e `console.warn` em desenvolvimento; teste unitário que percorre `web/*.js` publicados e confere que todo `icon('x')` existe em `paths`.

---

## ERR-14 · Baixo · Versão e data fixas no rodapé e em Configurações

**Onde:** `web/panel-shell.js` (rodapé "v1.1 · atualizado em 28/10/2026"), `web/desktop.js:142` (reescreve o mesmo texto) e `:109` ("Versão 1.1 · Atualizado em 28/10/2026"). Houve ≥ 5 publicações desde então.

**Correção:** `scripts/build-desktop.mjs` grava `runtime-config.js` com `buildVersion` (hash curto do commit + data) e o painel exibe esse valor; remover as três cópias fixas.

---

## ERR-15 · Baixo · Código morto e trechos inalcançáveis no painel

**Onde:** `web/desktop.js:15` (`sampleUnits`, `gallery`, `regionShapes` de dados DEMO importados), `:68` (`alerts` nunca usado), `:131` (`sidebarArt()` nunca chamado), `:152` (`exportCsv()` nunca chamado — ver LNA-08), `:189-194` (ações `photo-next/prev/index` e `open-photo` sobre a galeria DEMO), `:208-209` (`if(a==='profile')return;` torna o bloco seguinte inalcançável), `:168` (`toggle-demo`). `web/desktop-results.js:11` (`'Próximos50'` sem espaço).

**Correção:** remover; ver MEL-08.

---

## ERR-16 · Médio · Imagem de fundo do login com 2,6 MB

**Onde:** `web/login.css` (`url('/assets/paisagem-login-v2.png')`), arquivo `web/assets/paisagem-login-v2.png` = 2.638.818 bytes, servido com `no-store` (ERR-01).

**Sintoma:** cada abertura da tela de login do painel baixa 2,6 MB; em rede móvel são vários segundos antes de o formulário ficar estável.

**Correção:** converter para WebP (qualidade 80, ≤ 1920 px de largura, esperado 150–250 KB) com fallback JPEG; `background-size: cover` já existe. Registrar a origem em `web/assets/ORIGEM_DOS_ATIVOS.md`.

---

## ERR-17 · Médio · Salvar equipamento e enviar foto recarregam a vistoria inteira

**Onde:** `web/collector-v3.js:66` (`saveItem()` → `await load()`), `:67` (`upload()` → `api('/api/collector/inspection…')` só para atualizar `collection.photos`), `:179` (`save-item` → `saveItem` → `upload` → `leave` → `loadItems`). `load()` custa 8 consultas D1 no servidor (medido) e devolve seções, ambientes, totais e **todo** o histórico de fotos.

**Sintoma:** "Salvar equipamento" = 3 a 4 idas ao servidor em sequência (save, inspection, unlock, equipment-list) — em RTT de 300 ms são ≥ 1,2 s de espera além do próprio salvamento.

**Correção:** `equipment-save` já devolve `version` e `environment`; `photo-upload` deve devolver a linha da foto (`{id,target_kind,target_id,status,current:true}`) e o cliente insere em `collection.photos` sem recarregar. `load()` só quando mudar de assunto ou após conclusão. Combinar `equipment-unlock` com `equipment-list` em um único request quando sair da ficha (ou disparar o unlock sem aguardar).

---

## ERR-18 · Médio · Galeria oficial limitada a 50 fotos sem paginação

**Onde:** `server/collector.mjs:138` (`ORDER BY p.created_at DESC LIMIT 50` em `/api/inventory/unit`), `web/desktop.js:76,190` ("Ver todas" abre o viewer só com o que veio).

**Sintoma:** unidade com mais de 50 fotos publicadas (uma escola com 20 ambientes × 3 fotos já passa) perde as mais antigas em "Ver todas". Lacuna 03 do mapeamento; permanece. A rota paginada `/api/inventory/photos` (`photo-gallery.mjs`) já existe e não é usada pelo panorama/detalhe.

**Correção:** o viewer e "Ver todas" devem consumir `/api/inventory/photos?unitId=&scope=published` com cursor; o detalhe exibe 4 + contador total.

---

## ERR-19 · Baixo · Marcadores de exemplo do mapa sempre ligados e sem botão para ocultar

**Onde:** `web/desktop-map.js:4` (`examples:true`), `:63-75` (marcadores "Exemplo da planilha fornecida · sem vínculo com o inventário"), `:104` (`toggleMapExamples` existe), `web/desktop.js:61` (o botão `map-examples` **não** é renderizado), `:176` (handler existe).

**Sintoma:** o mapa oficial mostra marcadores de referência da planilha misturados às unidades; o gestor não consegue desligá-los. `map-examples.json` é baixado em toda carga do painel.

**Correção (DECISÃO):** renderizar o botão "Locais de referência" com `aria-pressed`, padrão desligado em produção; ou remover a camada se a decisão D-0xx sobre exemplos institucionais não a exigir.

---

## ERR-20 · Médio · Duas rotas diferentes servem a mesma foto com regras diferentes

**Onde:** `web/desktop.js:72` (miniaturas do panorama/detalhe → `/api/collector/photo`), `web/photo-viewer.js:6` (ampliação → `/api/inventory/photo`), `web/desktop-results.js:11` (`/api/collector/photo`), `web/desktop-progress-photos.js:9` (`/api/inventory/in-progress-photo`). Elegibilidade: `collector.mjs:117` (unidade autorizada + regras de visualizador) vs `photo-gallery.mjs:6` (`eligible`: visita open/paused/completed + equipamento publicado).

**Sintoma:** a miniatura pode carregar e a ampliação falhar (ou o inverso) para o mesmo arquivo, conforme perfil e estado da visita; três caches distintos para o mesmo binário; três lugares para corrigir qualquer bug de cabeçalho.

**Correção:** uma única rota de leitura de binário (`/api/photos/:id?size=thumb|full`) com uma função `canReadPhoto(user,row)` compartilhada, usada por coletor e painel; as rotas antigas viram alias por uma versão.
