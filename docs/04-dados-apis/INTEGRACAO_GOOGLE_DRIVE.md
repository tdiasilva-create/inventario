# Integração de fotografias via Google Drive — camada de armazenamento (proposta D-047)

> Atualização operacional — 04/11/2026, 08:18: foto enviada pelo usuário confirmada em `ready`, lida do Drive e exibida/ampliada no painel. A galeria de coletas em andamento foi implementada e publicada como correção de D-045. Ver `docs/05-qualidade/FOTOS_PARCIAIS_2026-11-04.md`. As situações de ausência de autorização/fotos abaixo são históricas. Homologação de celulares e dos demais fluxos permanece pendente.

> Estado mais recente — 04/11/2026, 07:34 (Fortaleza): **conta institucional conectada, pasta privada vinculada e autoteste real de upload/remoção aprovado**. O bloqueio de autorização ausente descrito na revisão anterior foi resolvido. Evidência e limites em `docs/05-qualidade/DRIVE_CONECTADO_2026-11-04.md`. Foto vinculada à ficha, leitura no painel, renovação e celulares ainda requerem homologação.

> Atualização de estado em 04/11/2026: os passos de configuração, migração e publicação abaixo são históricos e foram concluídos por D-048. Consulta atual confirmou os segredos por nome, provedor Google Drive nos dois Workers e migração 0013 aplicada. Não existe autorização OAuth persistida nem foto recebida no D1 oficial; conexão da conta e teste real continuam pendentes. Ver `docs/05-qualidade/REVISAO_PRONTIDAO_IMPLANTACAO_2026-11-04.md`. As afirmações “não publicado” do texto original descrevem 28/10 e não o estado atual.

Data: 28/10/2026. Situação: **implementado localmente e testado com simulação; NÃO publicado, NÃO autorizado no Google, NÃO testado em celulares**. Nada neste documento altera a Base de Coleta v1.0, a política de fotos (0–5 por equipamento, obrigatória só em falhas visíveis) nem as permissões aprovadas em D-031/D-046.

## 1. Resumo

O código de fotografias (rotas `/api/collector/photo*`, tabela `collection_photos`, compressão no aparelho, limite de 3 MB, assinatura de formato, SHA-256, idempotência por `X-Photo-Id`, até 5 por alvo) foi preservado. O que mudou: as chamadas diretas a `env.PHOTOS` (R2) passaram por uma **camada de armazenamento** (`server/photo-storage.mjs`) com dois provedores:

| Provedor | Quando é ativo | Onde grava |
|---|---|---|
| `r2` | `PHOTO_STORAGE_PROVIDER` ausente/`r2` **e** binding `PHOTOS` declarado | bucket R2 (comportamento original) |
| `google-drive` | `PHOTO_STORAGE_PROVIDER=google-drive` **e** segredos configurados **e** autorização concluída pelo root | pasta privada "Inventário Tecnológico SEMED" criada pela aplicação no Meu Drive da conta institucional, com uma subpasta por unidade |

Sem nenhuma das condições, o coletor continua informando "armazenamento de fotografias ainda não habilitado" exatamente como hoje (`photosEnabled:false`). **A presença de segredos não habilita nada**: é necessária a autorização OAuth e a criação bem-sucedida da pasta.

Escolha registrada com o responsável em 28/10/2026: **pasta privada no Meu Drive** com escopo `drive.file` (opção de Drive compartilhado descartada nesta etapa porque exigiria o escopo amplo `drive`).

## 2. Arquivos

| Arquivo | Papel |
|---|---|
| `server/photo-storage.mjs` | Seleção do provedor; interface `enabled/put/get/delete/status`; AES-GCM dos tokens; renovação do access token; upload multipart; busca por `appProperties`; pastas por unidade; autoteste. |
| `server/google-auth.mjs` | Rotas root `/api/root/google/{status,start,test,disconnect}` e callback OAuth `/api/root/google/callback`. |
| `server/collector.mjs` | `capabilities`, `photo`, `photo-upload`, `photo-remove` usam a camada; erros de armazenamento viram respostas 5xx/4xx claras. |
| `server/visit-routes.mjs` | `photosEnabled` do roteiro de visita vem da camada. |
| `server/unit-deletion.mjs`, `server/units.mjs`, `server/worker.mjs` | Fila de exclusão guarda provedor e referência; rotas registradas; callback tratado antes da sessão. |
| `migrations/0013_photo_storage.sql` | Aditiva: colunas `storage_provider`/`storage_ref` em `collection_photos` e `photo_deletion_queue`; tabelas `integration_tokens`, `integration_oauth_states`, `integration_folders`, `integration_events`. |
| `web/desktop.js` | Bloco "Armazenamento de fotografias" em Configurações (somente root). |
| `web/visit.js` | Aviso genérico de armazenamento (não cita mais R2). |
| `tests/photo-storage.test.mjs`, `tests/google-worker.test.mjs`, `tests/helpers/fake-drive.mjs` | Testes isolados com Google simulado. |

## 3. Configuração do servidor (nomes; valores nunca entram no repositório, no navegador ou em logs)

Variável (em `vars` dos dois Workers, painel e coletor):

- `PHOTO_STORAGE_PROVIDER` = `google-drive` (ou `r2`; ausente = R2 se houver binding).
- `GOOGLE_LOGIN_HINT` (opcional) = e-mail institucional sugerido na tela do Google.

Segredos (`wrangler secret put`, nos dois Workers; o coletor precisa deles para renovar o token e gravar):

- `GOOGLE_CLIENT_ID` — ID do cliente OAuth (aplicativo Web).
- `GOOGLE_CLIENT_SECRET` — segredo do cliente.
- `GOOGLE_TOKEN_KEY` — 32 bytes aleatórios em base64 (chave AES-GCM dos tokens no D1). Gerar com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Perder esta chave exige nova autorização; trocá-la invalida os tokens guardados.

Não existe conta de serviço. Não existe token em `vars`. `.dev.vars` e `private-data/` continuam fora do versionamento.

## 4. Fluxo de autorização (OAuth 2.0, servidor web, acesso offline)

1. Root abre Painel → Configurações → **Conectar Google Drive** (`GET /api/root/google/start`). O servidor grava um `state` aleatório (10 min, vinculado ao root e ao hash de um cookie `__Host-semed-oauth`, `SameSite=Lax`) e redireciona para `accounts.google.com` com `scope=drive.file`, `access_type=offline`, `prompt=consent`.
2. O responsável entra com a conta institucional **na tela do Google** e concede a permissão. Nenhuma senha, código ou cookie passa pelo sistema ou por mensagens.
3. O Google devolve para `https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/api/root/google/callback?code=…&state=…`. Como é uma navegação vinda de outro site, o cookie de sessão (`SameSite=Strict`) não acompanha; por isso o callback valida **state + cookie Lax**, não a sessão, e responde uma página HTML com link de volta. Estado reutilizado, expirado ou sem cookie é recusado sem gravar nada.
4. O servidor troca o `code` por tokens, confirma que `drive.file` foi concedido, lê `about` (e-mail/nome da conta), cria (ou reencontra) a pasta raiz e grava refresh/access token **cifrados** em `integration_tokens`. Eventos em `integration_events` e `audit` (`google_drive_connected`).
5. **Testar envio** (`POST /api/root/google/test`) grava um PNG de 1 pixel chamado `TESTE_CONEXAO_SEMED_<data>.png` na pasta raiz e o apaga em seguida; registra `last_test_at/last_test_result`.
6. **Desconectar** (`POST /api/root/google/disconnect`) revoga o refresh token no Google (melhor esforço), apaga os tokens do D1 e mantém `folder_id` para reconexão. Fotos já gravadas permanecem na pasta; o sistema deixa de ler/gravar até nova autorização.

Renovação: o access token (≈1 h) é renovado automaticamente com o refresh token e guardado cifrado; `invalid_grant` marca `revoked_at`, desabilita o recebimento (`photosEnabled:false`) e registra `authorization_revoked`.

## 5. Gravação, leitura e exclusão

- **Nome e pasta**: `<tipo>_<photoId>.<ext>` dentro de `Inventário Tecnológico SEMED / <INEP NOME DA UNIDADE [8 primeiros caracteres do id]>`. A subpasta é criada na primeira foto da unidade e memorizada em `integration_folders`.
- **Metadados no Drive** (`appProperties`): `semedPhotoId`, `semedUnitId`, `semedInspectionId`, `semedTargetKind`, `semedTargetId`, `semedSha256`, `semedKey`. São visíveis apenas ao aplicativo.
- **Idempotência/retomada**: o D1 cria a linha `pending` antes do envio. Antes de gravar, a camada procura no Drive um arquivo com o mesmo `semedPhotoId`; se existir (upload interrompido antes da confirmação), reaproveita o `id` em vez de criar outro arquivo. Repetir o mesmo `X-Photo-Id` com o mesmo SHA-256 devolve `repeated:true`; com conteúdo diferente devolve 409.
- **Leitura**: `GET /api/collector/photo?id=…` continua sendo um proxy autenticado (`Cache-Control: private, no-store`). O Worker baixa `files/{id}?alt=media` com o token do servidor e repassa os bytes. **Nenhum link público, nenhuma permissão `anyone` e nenhum `webContentLink`** são criados. Regras de perfil preservadas: visualizador só vê fotos de vistorias concluídas e de equipamentos publicados; operador só nas unidades a que tem acesso.
- **Remoção individual**: inalterada — foto própria, vistoria aberta, inclusive para root/admin. A lacuna "root remove qualquer foto" permanece documentada em PENDENCIAS; não foi anunciada nem implementada.
- **Exclusão de unidade (D-046)**: `photo_deletion_queue` passa a guardar `storage_provider` e `storage_ref`; `POST /api/root/photo-cleanup` apaga no provedor ativo (até 50 por chamada) e informa pendências. Arquivos de outro provedor ficam na fila (nunca se afirma exclusão não realizada).
- **Falta de espaço**: `storageQuotaExceeded` responde "Sem espaço disponível no Google Drive institucional. Nenhuma foto foi gravada." e a linha permanece `pending`.
- **Limites**: o armazenamento usa a cota da conta institucional (observado ≈832 GB usados; a cota efetiva não foi verificada). Com fotos ≤3 MB, 1.000 fotos ≈ 3 GB.

## 6. Modelo de dados (migração 0013)

```
collection_photos      + storage_provider TEXT NOT NULL DEFAULT 'r2', + storage_ref TEXT (id do arquivo no Drive)
photo_deletion_queue   + storage_provider, + storage_ref
integration_tokens     provider PK, account_email, account_name, scope, refresh_token_enc, access_token_enc,
                       access_token_expires_at, folder_id, folder_name, connected_by, connected_at,
                       last_refresh_at, last_test_at, last_test_result, last_error, revoked_at
integration_oauth_states state PK, provider, user_id, created_at, expires_at, nonce_hash
integration_folders    (provider, scope_key) PK, folder_id, created_at      -- scope_key = 'unit:<unit_id>'
integration_events     id, provider, event, actor_id, detail, created_at
```

Eventos registrados: `authorization_started`, `authorization_connected`, `authorization_denied`, `authorization_rejected`, `authorization_failed`, `authorization_revoked`, `authorization_disconnected`, `self_test_ok`, `self_test_failed`.

## 7. Rotas

| Rota | Método | Perfil | Observação |
|---|---|---|---|
| `/api/root/google/status` | GET | root | Estado, conta, pasta, contadores, últimos 10 eventos. Nunca devolve tokens. |
| `/api/root/google/start` | GET | root | 302 para o Google; define cookie `__Host-semed-oauth`. |
| `/api/root/google/callback` | GET | sem sessão (state+cookie) | Página HTML com resultado e link para `/configuracoes`. |
| `/api/root/google/test` | POST (CSRF) | root | Autoteste de upload/remoção. |
| `/api/root/google/disconnect` | POST (CSRF) | root | Revoga e apaga tokens. |
| `/api/collector/capabilities` | GET | coleta | `{photosEnabled, photoProvider, offlineEnabled:false}`. |

As rotas `google/*` não existem no Worker do coletor (`APP_KIND=collector`).

## 8. Passo a passo no Google Cloud (a executar pelo responsável, conectado como `admin@pacodolumiar.edu.ma.gov.br`)

Nada abaixo foi executado. Nenhuma cobrança é necessária (Drive API e OAuth são gratuitos; não ativar faturamento).

1. **Projeto**: https://console.cloud.google.com/projectcreate → nome `Inventário Tecnológico SEMED`; organização `pacodolumiar.edu.ma.gov.br` se oferecida. Anotar o ID do projeto.
2. **API**: APIs e serviços → Biblioteca → "Google Drive API" → Ativar.
3. **Tela de consentimento** (Google Auth Platform → Branding/Público): tipo **Interno** (disponível porque a conta é Workspace; evita verificação e evita a expiração de 7 dias dos tokens do modo "Teste"). Nome do app `Inventário Tecnológico SEMED`, e-mail de suporte e contato do desenvolvedor institucionais. Em "Acesso a dados/Escopos", adicionar `https://www.googleapis.com/auth/drive.file`.
4. **Credenciais** → Criar credenciais → **ID do cliente OAuth** → tipo **Aplicativo da Web** → nome `Painel SEMED` → em **URIs de redirecionamento autorizados** colar exatamente:
   `https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/api/root/google/callback`
   (sem barra final; origens JavaScript não são necessárias). Criar e **copiar o ID e o segredo do cliente** para um local protegido. O segredo não deve ser colado em chat, e-mail ou documentos.
5. **Workspace (se a autorização for bloqueada)**: Admin Console → Segurança → Controle de acesso e dados → Controles de API → o app interno pode precisar ser marcado como **Confiável** ou liberado para `drive.file`. Só mexer se o Google recusar na etapa de consentimento.
6. **Segredos nos Workers** (no PC, dentro da pasta do projeto; cada comando pede o valor em modo oculto):
   ```sh
   npx wrangler secret put GOOGLE_CLIENT_ID     --config wrangler.jsonc
   npx wrangler secret put GOOGLE_CLIENT_SECRET --config wrangler.jsonc
   npx wrangler secret put GOOGLE_TOKEN_KEY     --config wrangler.jsonc
   npx wrangler secret put GOOGLE_CLIENT_ID     --config wrangler.collector.jsonc
   npx wrangler secret put GOOGLE_CLIENT_SECRET --config wrangler.collector.jsonc
   npx wrangler secret put GOOGLE_TOKEN_KEY     --config wrangler.collector.jsonc
   ```
   O **mesmo** `GOOGLE_TOKEN_KEY` nos dois Workers (compartilham o D1).
7. **Variável**: adicionar `"vars":{"PHOTO_STORAGE_PROVIDER":"google-drive"}` em `wrangler.jsonc` e `"PHOTO_STORAGE_PROVIDER":"google-drive"` dentro de `vars` em `wrangler.collector.jsonc` (há comentários indicando o local).
8. **Migração** (aditiva) — recomenda-se primeiro na validação:
   ```sh
   npx wrangler d1 migrations apply semed-auth-validacao   --remote --config wrangler.validation.jsonc
   npx wrangler d1 migrations apply semed-inventario-auth  --remote --config wrangler.jsonc
   ```
9. **Build e publicação** (somente com aprovação explícita): `npm run build:desktop && npx wrangler deploy --config wrangler.jsonc`; `npm run build:collector && npx wrangler deploy --config wrangler.collector.jsonc`.
10. **Autorizar**: Painel → Configurações → Conectar Google Drive → conta institucional → Permitir → "Google Drive conectado" → Voltar → **Testar envio**. Conferir a pasta em drive.google.com.

## 9. O que NÃO está feito / limites declarados

- Não publicado; migração 0013 não aplicada em nenhum D1; segredos não criados; projeto Google não criado.
- Não testado em Chrome Android nem Safari iPhone; nenhum celular identificado. O roteiro está em `docs/05-qualidade/TESTE_FOTOS_GOOGLE_DRIVE.txt`.
- Offline continua `offlineEnabled:false`; prévias ficam só na aba até o envio confirmado.
- Remoção individual irrestrita pelo root e política de retenção/recuperação não existem (PENDENCIAS).
- A consulta oficial por unidade segue devolvendo até 50 fotos; paginação é melhoria futura.
- `drive.file` dá acesso aos arquivos criados pelo app, não a uma pasta fixa; a "privacidade" decorre de o app não compartilhar nada e de a pasta ser do Meu Drive da conta institucional. Quem administra a conta Google continua podendo ver/mover/apagar os arquivos pelo Drive; mover ou apagar fora do sistema gera "Foto não encontrada" na leitura.
- Backup consistente D1 + Drive (P9) continua pendente.

## Atualização operacional — 03/11/2026: configuração Google Cloud e segredos

Responsável conduziu o login e confirmou os aceites e a criação do cliente OAuth. Projeto confirmado na interface: inventario-tecnologico-semed, número 1006874460380; Google Drive API ativada; identidade OAuth interna criada. A permissão de criar projetos foi salva somente para o grupo Inventário SEMED - Acesso Google Cloud, após autorização expressa em chat. A tela de status do serviço já estava Ativado para todos por ação externa; esse alcance não foi alterado pelo agente.

Arquivo de cliente OAuth fornecido pelo responsável foi validado sem imprimir segredo. Cópias locais protegidas por ACL em private-data/google-oauth-client.json e private-data/google-worker-secrets.json; ambos ignorados pelo Git. GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_TOKEN_KEY configurados nos Workers painel-semed-paco e inventario-semed-lumiar, preservando AUTH_PEPPER. Não registrar valores de segredos neste documento.

Suíte local pnpm test: 48/48 aprovados em 03/11/2026, incluindo Drive/OAuth simulados. Isso não comprova armazenamento real. Nenhuma migração, publicação do novo código, autorização de acesso ao Drive ou fotografia real executada nesta etapa. Ainda é necessário revisar o pacote local, validar separadamente, publicar a integração e concluir consentimento OAuth/autoteste no painel. Credencial possui somente o callback de produção cadastrado; homologação em outro domínio exige callback próprio e banco/segredos isolados.

Correção documental: não presumir que Drive compartilhado exige sempre escopo amplo drive. O fluxo atualmente implementado usa pasta privada no Meu Drive com drive.file. Faturamento não foi ativado.
