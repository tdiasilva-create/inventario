# 05 · Melhorias recomendadas

Melhorias que não são defeitos isolados, mas reduzem a lentidão de forma estrutural, diminuem o custo de manutenção ou evitam regressões. Cada item tem motivação, proposta, esforço estimado (P = até 1 dia, M = 2–3 dias, G = mais de 3 dias) e o que **não** fazer.

## Desempenho e infraestrutura

### MEL-01 · Smart Placement nos dois Workers (M, medir antes e depois)
Motivação: D1 primário em WEUR; Worker em GRU; rotas com 8–20 consultas sequenciais (`/api/collector/inspection` = 8, `equipment-save` ≈ 15–20 comandos em `collector.mjs:58-102`). Proposta: `"placement":{"mode":"smart"}` em `wrangler.jsonc` e `wrangler.collector.jsonc`; registrar p50/p95 antes/depois com `Server-Timing` (MEL-07). Não fazer: mover o banco sem homologação (`09_ESTADO_E_PENDENCIAS.md`); os *location hints* do D1 não cobrem América do Sul na documentação consultada.

### MEL-02 · Agrupar leituras independentes em `db.batch` (M)
`equipment-save` lê `inspection`, `existingRecord`, `blocked`, trava, ambientes e depois um `preflight` de 5 comandos — muitas leituras não dependem umas das outras. `inspection` (`collector.mjs:40-43`) faz 5 consultas em série (seções, ambientes, totais de problemas, fotos, totais, unidade). Reunir as independentes em um único `batch` (uma ida ao D1) preserva validações e versões. Mesma técnica em `in-progress-detail` (`in-progress.mjs:32-36`) e `/api/inventory/unit` (`collector.mjs:138`).

### MEL-03 · Sessão em cache curto por isolate (P)
`worker.mjs:13` consulta `sessions JOIN users` a cada requisição, inclusive para cada miniatura. Cache em memória por `token_hash` por 30 s (invalidado em logout/revoke/troca de senha pelo próprio Worker; outras instâncias expiram em 30 s) corta 1 consulta por imagem e por asset autenticado. Não fazer: cache em KV compartilhado sem invalidação explícita.

### MEL-04 · Versionar assets e cachear por um ano (P)
`scripts/build-*.mjs` já calculam SHA-256 por arquivo; gerar nomes `desktop.[hash].js` (ou `?v=hash` nos `import`/`href`) e servir `/vendor/*`, `*.js`, `*.css`, fontes com `public, max-age=31536000, immutable`. HTML continua `no-store`. Complementa FOTO-01. Converter `paisagem-login-v2.png` (2,6 MB) para WebP (ERR-16) e `paisagem-coleta.jpg` (118 KB) para WebP.

### MEL-05 · Entregar `jsQR.js` só quando necessário e com cache (P)
Já é carregado sob demanda (`collector-qr.js:6`), mas passa pela lista autenticada de `worker.mjs:107` e pelo `no-store`. Mover para a lista pública de assets imutáveis; preferir `BarcodeDetector` nativo (já implementado) e manter jsQR como fallback.

### MEL-06 · Painel: renderização por blocos e mapa persistente (M)
Detalhado em FOTO-07. Além do ganho de fotos, elimina o "Carregando cartografia…" repetido e a recomputação de `activeUnits()` dentro de `heatColor()` para cada célula (`desktop.js:63`, O(células × unidades)); calcular os máximos por coluna uma vez por render.

### MEL-07 · Observabilidade mínima (P)
Cabeçalho `Server-Timing: d1;dur=…, drive;dur=…, total;dur=…` nas rotas de API (já há um ponto único em `worker.mjs:121`); contador de comandos D1 por requisição em `env.DEBUG_COLLECTION==='1'`; `console.log` estruturado em erro 5xx com rota e duração. Registrar p50/p95 semanais em `docs/05-qualidade/`. Sem isso, a fase 5 (placement) não tem como ser avaliada — a pendência "Observabilidade operacional" já consta em `09_ESTADO_E_PENDENCIAS.md`.

## Manutenção e qualidade do código

### MEL-08 · Remover protótipo e código morto do pacote (P)
`web/app.js`, `web/domain.js`, `web/coleta.html`, `web/styles.css` (protótipo DEMO; `build-desktop.mjs` até verifica que não entram) e `web/desktop-data.js` (`sampleUnits`, `gallery`, `regionShapes` fictícios ainda importados em `desktop.js:15`) — manter apenas `categories`. Remover handlers órfãos listados em ERR-15 e LNA-04. Mockups fictícios não devem ficar a um `import` de distância do painel oficial (invariante de `AGENTS.md`).

### MEL-09 · Um tema só no painel (M)
`desktop.css` (dark-tech) + `desktop-theme.css` (D-065) + `panel-refinement.css` + `panorama-layout.css` = quatro camadas que se sobrescrevem; `desktop-photos.css` e `desktop-progress-photos.css` injetados por JS. Consolidar em `desktop.css` (base) + `panorama-layout.css` (layout D-067), com `tokens.css` como única fonte de cores/fontes. Reduz 2 requisições e elimina regras conflitantes (ICO-06, ICO-24).

### MEL-10 · Rascunhos e prévias em IndexedDB da própria aba (M, não é offline durável)
`createDraftQueue` e `previews` vivem em memória; `beforeunload` é a única proteção. Guardar rascunhos por `vistoria:assunto` e os blobs das prévias em IndexedDB, com reconciliação de versão ao reabrir (a fila já reconcilia por `version+1`, `collector-drafts.js:13`). Comunicar como "recuperação da aba", não como offline — respeita a pendência registrada e evita perder fotos quando o Android mata a aba em segundo plano (caso comum ao abrir a câmera).

### MEL-11 · Formatação legível do código-fonte (P, decisão de equipe)
Os módulos têm linhas de 300–2.000 caracteres (`desktop.js`: 43 KB em 222 linhas; `collector.mjs:88` tem 2.300 caracteres). Revisão, *diff* e `git blame` ficam impraticáveis; esta própria revisão precisou citar "linha 88" para um trecho com cinco responsabilidades. Aplicar Prettier (sem mudar semântica) em um único commit "chore: formata", e manter `pnpm format:check` na CI. Não fazer: reformatar junto com correções funcionais.

### MEL-12 · Um relatório real antes de novos indicadores (G, DECISÃO)
Com os dados que já chegam (16 campos de respostas + 22 de equipamentos, mapeamento de 05/11), um primeiro relatório útil é "Situação dos computadores por unidade" (funcionando/parcial/sem funcionar/não testado, por ambiente, com fotos) exportável em XLSX via `spreadsheet-io.js`. Entregar isso substitui a tela de espera de Relatórios e dá uso às ocorrências derivadas.

### MEL-13 · Unificar rotas de leitura de foto e regras de acesso (M)
Ver ERR-20: `canReadPhoto(user,row,{store})` em um módulo `server/photo-access.mjs`, usado por coletor e painel; uma rota `/api/photos/:id?size=`; as atuais viram alias com teste de equivalência.

### MEL-14 · Testes que protegem o que esta revisão corrige (M)
- Cabeçalhos de cache por classe de rota (`tests/security.test.mjs`).
- Contador de D1/Drive por operação de foto (transformar o script de medição em teste com limites: miniatura ≤ 2 D1 e 0 Drive; integral ≤ 3 D1 e ≤ 1 Drive; upload subsequente = 1 Drive).
- Teste de navegador do painel: selecionar unidade duas vezes → 0 novas requisições de imagem; digitar na busca → 1 montagem do mapa.
- Teste de navegador do coletor: enviar 2 fotos → sem `GET /api/collector/inspection` após o upload; lista de equipamentos mostra rascunho/duplicidade.
- Teste de nomes de ícones (ERR-13).
- Teste de HEIC: `preparePhotos` com `File` de tipo `image/heic` não lança por tipo (a decodificação depende do navegador — cobrir só a aceitação).

### MEL-15 · Limpar a fila de exclusão e o `selfTest` do Drive com log explícito (P)
`photo_deletion_queue` é processada em `unit-deletion.mjs`; `selfTest` grava e apaga um PNG a cada clique em "Testar envio". Registrar em `integration_events` a duração e o tamanho; expor em Configurações "último teste: 850 ms" já ajuda a distinguir Drive lento de D1 lento. Baixo custo, alto valor para suporte.

### MEL-16 · Uploads paralelos limitados e retomada por foto (P)
`upload()` envia em série e, em erro, interrompe o lote. Enviar 2 em paralelo (`Promise.allSettled` com fila), marcar cada prévia como "enviada/falhou" individualmente e permitir reenviar só as que falharam (hoje o botão "Tentar envio novamente" reenvia todas as pendentes — correto, mas a mensagem de erro é do lote).

## Segurança (sem bloqueio, mas observar)

### MEL-17 · Cache privado de fotos em computadores compartilhados
Com FOTO-01/03, miniaturas e integrais ficarão no cache do navegador (`private`, 24 h). Em estações compartilhadas da secretaria isso deixa imagens no disco após o logout. Mitigação: `max-age` menor para integrais (1 h) e manter `no-store` quando `user.role==='visualizador'` for considerado perfil público; ou `Clear-Site-Data: "cache"` na resposta de logout (`worker.mjs:46`). **DECISÃO** do responsável; documentar em `08_SEGURANCA_E_INTEGRACOES.md`.

### MEL-18 · Expor rota de API como link em nova aba
`desktop-results.js:11` abre `/api/collector/photo?id=` em nova aba; a URL fica no histórico do navegador e pode ser colada em outro lugar (só funciona com sessão, mas a prática contraria "não é link público" do mapeamento). Resolver com ICO-15.
