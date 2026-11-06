# Executar o painel desktop e a coleta

A partir da decisão D-022, a página inicial `/` é o painel desktop. A coleta anterior permanece em `/coleta.html`. Ambos são protótipos DEMO; não existe recebimento real de informações nesta fase.

Requisitos: Node.js (testado com 24.19.0). Não há dependências de produção.

```sh
node scripts/serve.mjs
```

Abrir http://127.0.0.1:4173 para o painel. Para a coleta, abrir http://127.0.0.1:4173/coleta.html e escolher **Explorar demonstração**. O formulário de login não autentica. Nenhuma credencial é enviada ou gravada. Não informar senhas reais.

```sh
node --test tests/domain.test.mjs
node tests/browser.cjs
node tests/desktop.cjs
```

O teste de navegador depende de Playwright acessível como módulo `playwright` (ou caminho de módulo configurado em `PLAYWRIGHT_MODULE`) e Chrome instalado. Ele inicia e encerra seu servidor local. As evidências ficam em `docs/05-qualidade/evidencias/fase-01/`. A tentativa adicional WebKit é informativa e sua ausência não equivale a teste aprovado de Safari.

O teste desktop usa a porta 4174 e salva capturas em `docs/05-qualidade/evidencias/painel-desktop/`. O fallback de módulo reconhece o runtime local do Codex. Execute os testes de navegador sequencialmente.

## Painel desktop

### Atualização do mapa V33

O mapa agora usa Leaflet local com ruas/satélite Esri e o contorno fornecido de Paço do Lumiar. A conexão externa é apenas para carregar bases cartográficas. Os dados operacionais da outra aplicação não foram conectados. `web/data/map-v33.json` preserva somente a geometria e sua procedência. As escolas DEMO não têm latitude/longitude e não aparecem no mapa geográfico.

Teste específico: `node tests/map-browser.cjs` (porta 4176). Testes unitários: `node --test tests/domain.test.mjs tests/map-geography.test.mjs`. Relatório: `docs/05-qualidade/ENTREGA_MAPA_V33.md`. A extração é reproduzível com `node scripts/extract-map-reference.mjs CAMINHO_DO_HTML_V33`; não executa o HTML nem copia seus cadastros.

### Fase visual anterior

`web/desktop.js` contém componentes e interações; `web/desktop.css` preserva a composição da referência; `web/desktop-data.js` isola a amostra transcrita da imagem. Os totais iniciais reproduzem a composição ilustrativa do PNG; os filtros mostram o recorte das dez linhas da amostra, não uma consulta a 90 escolas oficiais. Imagens da galeria são ilustrações recortadas visualmente da referência em SVG; mapa usa textura gerada, com polígonos e marcadores editáveis e sem coordenadas oficiais.

Filtros, seleção da unidade, navegação, zoom, carrossel, ampliação e CSV DEMO são funcionais no navegador. Recebimento de coletas, login, notificações reais, fichas oficiais e gravação continuam sem integração. Menu Planejamento e relatórios institucionais informam seu estado pendente. Nenhum serviço fake devolve sucesso.

## Limites deliberados

- Unidade DEMO isolada em `web/domain.js`; não existe catálogo oficial nesta versão.
- Respostas/fotos só em memória da aba; recarregar ou fechar perde o rascunho. Sem localStorage, IndexedDB, service worker ou alegação de offline operacional.
- Câmera/galeria usam seleção nativa de arquivos. Prévia e remoção disponíveis; câmera física, compressão e Safari iPhone ainda não homologados.
- Sem backend, endpoints fictícios ou respostas simuladas de sucesso. Autenticação, autorização, D1, R2, sincronização e oficialização aguardam integração real via Workers.
- Navegação A–H disponível; somente A tem conclusão de cartão DEMO habilitada. B/F têm fatias iniciais; C/D/E/H não têm formulários completos. G não cria registros próprios.
- Tokens, componentes e sequência do wizard são implementação DERIVADA/PROPOSTA reversível. Não mudam a Base v1.0 nem resolvem pendências P1–P11.

O servidor local expõe apenas `web/`, não os documentos do repositório. Não é servidor de produção. A arquitetura futura continua D1 + R2 + Workers; nada foi implantado ou enviado ao GitHub nesta entrega.

## Publicação do painel — 27/10/2026

Painel público DEMO: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev

Cloudflare Workers Static Assets, conta institucional. Configuração em `wrangler.jsonc`. Construir com `node scripts/build-desktop.mjs`; validar com `node node_modules/wrangler/bin/wrangler.js deploy --dry-run`. Publicar somente com autorização explícita: `node node_modules/wrangler/bin/wrangler.js deploy`. O pacote em `dist/painel` exclui o coletor e documentos internos; manifesto de hashes em `dist/painel-manifest.json`, fora da raiz pública. Para testar a distribuição: `node scripts/verify-panel-release.mjs URL`.

A observação anterior de que nada foi implantado descreve a entrega local anterior; agora somente o desktop DEMO foi publicado. O coletor `inventario-semed-lumiar` permanece futuro. Não há login, persistência, D1/R2 ou recebimento operacional. Credenciais da CLI ficam fora do repositório.

## Integração de autenticação publicada — 27/10/2026

A publicação agora tem Worker e D1 reais. Entrada externa `/login`; primeiro acesso obrigatório em `/conta`; painel protegido por sessão. Configuração `wrangler.jsonc` usa `run_worker_first=true` e `html_handling=none`, com resolução explícita das rotas; não remover essas opções sem testar autorização e redirecionamentos. Guarde o segredo de produção; alterá-lo invalida verificação dos hashes existentes.

`node scripts/verify-panel-release.mjs URL` agora verifica proteção sem autenticação, e não a distribuição estática pública anterior. `node scripts/verify-login.mjs URL` verifica somente layout/visibilidade de senha/ajuda, sem enviar formulário. `verify-auth.mjs` é teste inicial de credenciais reais; seu modo completo altera dados de teste e não deve ser apontado ao banco oficial. O Worker e D1 temporários de validação foram removidos ao concluir; recrie uma configuração isolada e atualize os IDs antes de repetir aqueles testes.

Relatório: `docs/05-qualidade/AUTENTICACAO_01.md`. Guia de operação e recuperação: `docs/01-projeto/GUIA_DE_ACESSO_PUBLICADO.md`. Senhas iniciais em `private-data/ACESSOS_INICIAIS_SEMED.txt`, ACL restrita ao usuário local, não incluídas no Git, site ou screenshots. Contas sob responsabilidade do solicitante para testes; sem dados oficiais recebidos nesta entrega. Backups e restauração continuam sem homologação. Não houve push ao GitHub nesta fase.

## D-032 — inventário limpo

Em 28/10/2026 os exemplos desktop foram removidos da publicação. Catálogo, métricas, alertas e galerias ficam sem dados até integração oficial. Não existe restauração DEMO. Mapa e quatro locais reais de referência preservados. Testar com `scripts/verify-clean-inventory.mjs`; o antigo teste desktop baseado em escolas DEMO descreve uma fase histórica e deve ser substituído por este cenário de estado vazio para esta entrega. Relatório: `docs/05-qualidade/INVENTARIO_LIMPO_01.md`.

## Administração root — D-035

Novo ambiente `/administracao` com unidades, contas individuais, perfis e autorização de visitas. Migração aditiva `0003_units_assignments.sql`. Produção sem unidades de exemplo. Teste isolado de escrita: `scripts/verify-root-administration.mjs`, exige recriar recursos de validação e semente de teste; nunca apontar para produção. Relatório: `docs/05-qualidade/ADMINISTRACAO_ROOT_01.md`. Para unitários de unidades: `node --test tests/units.test.mjs`.

## D-036 — organização atual dos cadastros

Cadastro root simplificado em `/cadastro-unidades`: nome, gestor, latitude e longitude. Usuários em `/usuarios`. Seções de atribuições e Segurança removidas da interface; autenticação e autorizações existentes continuam verificadas pelo servidor. Gestor persistido na coluna `manager_name`; nenhum campo antigo é apagado ao editar pelo formulário simplificado. Relatório: `docs/05-qualidade/CADASTRO_SIMPLIFICADO_01.md`. Coletor e política futura de acesso a unidades sem a tela de atribuição não foram implementados por esta revisão.

## Proposta D-047 — fotografias via Google Drive (28/10/2026, não publicada)

Camada `server/photo-storage.mjs` escolhe o provedor: `PHOTO_STORAGE_PROVIDER=google-drive` (pasta privada no Meu Drive institucional, autorização OAuth `drive.file` pelo root em Configurações) ou R2 (`env.PHOTOS`, comportamento original). Sem provedor habilitado o coletor continua com `photosEnabled:false`. Segredos (nunca em `vars`, repositório ou `.dev.vars` versionado): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_TOKEN_KEY` (32 bytes base64), nos dois Workers. Migração aditiva `0013_photo_storage.sql`. Rotas root: `/api/root/google/{status,start,callback,test,disconnect}`; o callback não depende do cookie de sessão (Strict) e usa estado + cookie Lax.

Testes isolados: `node --test tests/photo-storage.test.mjs tests/google-worker.test.mjs` (Google simulado em `tests/helpers/fake-drive.mjs`; já incluídos em `npm test`). Passo a passo do Google Cloud, limites e o que não foi feito: `docs/04-dados-apis/INTEGRACAO_GOOGLE_DRIVE.md`. Roteiro de testes reais: `docs/05-qualidade/TESTE_FOTOS_GOOGLE_DRIVE.txt`. Publicar somente com autorização explícita; aplicar a migração primeiro em `semed-auth-validacao`.


## Proposta D-053 — coletor V2 + vínculo por QR Code com o agente Windows (04/11/2026, não publicada)

Módulo `server/agentes/` (núcleo do pacote 0.1.6 em `nucleo/`, adaptador de catálogo real em `catalogo.mjs`, montagem em `index.mjs`) e `server/agent-crypto.mjs`. Rotas de máquina `/api/agent/v1/*` são autenticadas por assinatura ECDSA P-256 por pedido (sem cookie/Origin/CSRF) e despachadas por lista explícita em `server/worker.mjs`; rotas humanas (`pairings/preview|claim|catalog`, `/api/root/agent-*`, `/api/inventory/agent-status|agent-history|equipment-location`) usam a sessão e o CSRF do Worker. Migração aditiva `migrations/0014_agentes.sql` (tabelas `agent_*`, colunas `position_label/position_description/location_state/location_confirmed_by/at` em `equipments`). Variáveis opcionais, todas com padrão no código: `AGENTES_INTERVALO_HEARTBEAT` (300 s), `AGENTES_EXIGIR_VISTORIA` (sim), `AGENTES_LOTE_MAX_MAQUINAS` (1000), `AGENTES_LOTE_MAX_HORAS` (168), `AGENTES_GUARDAR_HEARTBEATS` (20), `AGENTES_SNAPSHOTS_POR_MAQUINA` (60). Nenhum segredo novo.

Coletor V2: `web/collector-qr.js` (leitor local; `web/vendor/jsqr/` Apache-2.0) e fluxo na ficha de computador em `web/collector-v2.js`. Painel: estado do agente por ficha e janela "Dados do agente" (`web/desktop.js`, `web/desktop-inventory.js`); `scripts/build-desktop.mjs` passou a copiar `collector-v2-schema.js`.

Testes: `npm test` (inclui `tests/agentes.test.mjs` e `tests/v2-fase2.test.mjs`); browser isolados fora do `npm test`: `node tests/collector-v2-qr-browser.cjs` (gera QR fictício com a devDependency `qrcode` e decodifica com o leitor real) e `node tests/desktop-v2-agent-browser.cjs`. Contrato: `docs/04-dados-apis/CONTRATO_QR_E_AGENTE.md`. Publicação só após aprovação da proposta, seguindo `docs/06-entregas/claude-v2-qr-2026-11-04/MIGRACOES_E_PUBLICACAO.txt`.

Revisão de 04/11 (tarde): claim e `/api/inventory/equipment-location` exigem `lock_token` da trava do coletor e `inspection_id` (política verificada dentro do batch); `equipment-save` aceita `draft:true` para o rascunho mínimo do vínculo por QR; exclusão de unidade revoga agentes; `scheduled()` em `server/worker.mjs` com cron em `wrangler.jsonc`; tela do root em `web/desktop-agents.js` (rotas `GET /api/root/agent-devices`, `POST /api/root/agent-maintenance`); `wrangler.validation.painel.jsonc` para o painel de validação. Testes: `tests/revisao-independente.test.mjs` (no `npm test`), `node tests/desktop-root-agents-browser.cjs`. Dependências reproduzíveis: `pnpm-lock.yaml` atualizado com `qrcode` (`pnpm install --frozen-lockfile`).

Revisão 2 de 04/11 (noite): o coletor congela o comando de confirmação e consulta `GET /api/agent/v1/pairings/claim-status` / `GET /api/inventory/equipment-location-status` (recibo por `request_id`) antes de reenviar; claim/localização exigem assunto Computadores não concluído (`SECTION_COMPLETED`); a localização gravada pelo módulo entra na visita aberta (`inspection_id`) e no `data_json`, publicada só no `finish`; `/api/inventory/equipment` expõe `partial`. Teste de navegador com resposta perdida real: `node tests/collector-v2-qr-lost-response-browser.cjs`.

Preparação da homologação (04/11, noite; plano revisado): `node scripts/verificar-ambiente-validacao.mjs <URL…>` verifica proteção HTTP com 6 GETs por endereço, sem credenciais; **401 não prova existência de rota nem migração**, pois o bloqueio é anterior ao roteamento humano. `--probe-agent` acrescenta um POST que espera 401 INVALID_GRANT e grava contador de tentativas; não comprova a migração inteira. Confirmar esquema/migrações e exercitar sessão, QR, fotos e publicação no roteiro integrado. Teste local: `node --test tests/validation-probe.test.mjs` (3/3). Bootstrap com DELETE só é elegível em D1 de validação comprovadamente vazio; preservar contas/pepper existentes. Sem fotos, o teste é parcial: a fachada obrigatória bloqueia conclusão/revisita. Plano completo em `docs/06-entregas/claude-v2-qr-2026-11-04/PLANO_HOMOLOGACAO_V2_QR.txt`.

## V3 publicada — D-057, 05/11/2026
Entrada padrão inicia coleta-3.0 em /coleta-v3. V2/legado continuam pelas respectivas URLs/versionamentos. Leia DECISOES.md D-057 antes de alterar validações: decisões explícitas superam o DOCX nos oito pontos discutidos. Migração 0015 precisa anteceder código que consulta inventory_equipment_all. Não recriar dados, resetar contas ou refazer OAuth. Build via node scripts/build-collector.mjs e build-desktop.mjs. Testes V3 incluídos em scripts.test; browser: node tests/collector-v3-browser.cjs (Edge instalado). Fila de respostas é RAM por visita/assunto, não offline durável. Publicação, IDs e limites em docs/05-qualidade/PUBLICACAO_V3_2026-11-05.md. Uma próxima mudança estrutural deve preservar IDs/fotos/histórico de miscellaneous_equipments e antigos equipments.
