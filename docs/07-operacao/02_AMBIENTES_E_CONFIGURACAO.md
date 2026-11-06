# Ambientes e configuração

## Inventário da produção

| Item | Identificação atual |
|---|---|
| Conta Cloudflare | Secretaria Municipal de Educação de Paço do Lumiar |
| Account ID | `ce059c2b3e50037922a441a66814090d` |
| Painel | `painel-semed-paco`; `wrangler.jsonc` |
| Coletor | `inventario-semed-lumiar`; `wrangler.collector.jsonc` |
| Banco comum | `semed-inventario-auth` |
| D1 ID | `acb9a3dc-f667-44cf-a4f3-127641860f3e` |
| Binding do banco | `DB` nos dois Workers |
| Runtime | Workers, compatibility_date `2026-10-27` |
| Entrada | `server/worker.mjs` |
| Assets | `dist/painel` e `dist/coletor`, binding `ASSETS` |
| Fotografias | `PHOTO_STORAGE_PROVIDER=google-drive` |
| Manutenção | Cron `23 3 * * *` no painel, UTC; não duplicar no coletor |

IDs de recursos não são senhas. Os valores secretos não estão neste guia.

Últimas versões registradas e conferidas na organização: painel `827d6900-aa3a-450c-974d-ac13fd2ecca5`; coletor `5cf137cd-9c34-4e41-806b-d19cf0887bb6`. O [registro de UX](../05-qualidade/UX_COLETOR_PUBLICACAO_2026-11-05.md) documenta a publicação do coletor. Conferir novamente os deployments antes de uma futura intervenção; este documento não consulta o serviço em tempo real.

Os endereços completos estão no [README da raiz](../../README.md). `workers.dev` pertence à conta Cloudflare: não presumir que o mesmo endereço possa ser transferido para outro provedor.

## Configuração que precisa permanecer coerente

| Nome | Tipo | Requisito |
|---|---|---|
| `AUTH_PEPPER` | Segredo | Mesmo valor usado para os hashes de senha do D1; ambos os Workers |
| `GOOGLE_CLIENT_ID` | Configuração OAuth gerida como segredo | Mesmo cliente autorizado para a pasta/imagens |
| `GOOGLE_CLIENT_SECRET` | Segredo | Credencial desse cliente OAuth |
| `GOOGLE_TOKEN_KEY` | Segredo | Chave AES-GCM, base64 de 32 bytes; descriptografa tokens do D1 |
| `PHOTO_STORAGE_PROVIDER` | Variável | `google-drive` atualmente |
| `GOOGLE_LOGIN_HINT` | Variável | Dica de conta institucional; não autentica nem concede permissão |
| `APP_KIND` | Variável | `collector` somente no coletor |
| `AGENTES_EXIGIR_AUTORIZACAO` | Variável | `nao` em produção, conforme D-058 |
| `DB`, `ASSETS` | Bindings | Banco e assets corretos para cada publicação |
| `PHOTOS` | Binding opcional | Usado pelo adaptador R2; ausente na configuração atual de produção |

A ausência da variável de autorização de agentes volta ao padrão restritivo do código. Não perdê-la na migração e depois distribuir autorizações por máquina como contorno.

Parâmetros opcionais em `server/agentes/index.mjs`: `AGENTES_INTERVALO_HEARTBEAT` (padrão 300 s, faixa 60–3600), `AGENTES_EXIGIR_VISTORIA` (padrão verdadeiro), `AGENTES_GUARDAR_HEARTBEATS` (20), `AGENTES_SNAPSHOTS_POR_MAQUINA` (60). Variáveis legadas de lote: `AGENTES_LOTE_MAX_MAQUINAS`, `AGENTES_LOTE_MAX_HORAS`. Não alterar políticas de retenção como parte implícita de mudança de hospedagem.

## Segredos e acesso institucional

Guardar valores num cofre sob responsabilidade institucional, com acesso de recuperação por pessoas designadas. Registrar nome, serviço, finalidade e data de rotação; não registrar valores em issues, logs, screenshots ou Git. O export do D1 contém tokens criptografados e hashes: continua sendo material privado.

Ter acesso à conta Google no navegador não substitui cliente OAuth, chave de tokens e autorização persistida. Ter login Cloudflare nesta estação não torna o clone Git autorizado a publicar.

## Desenvolvimento e validação

`config/wrangler.*.example.jsonc` têm identificador fictício local, sem cron, sem Drive e sem conta Cloudflare. Usar apenas com `--local`. As configurações `wrangler.validation*.jsonc` preservam referências históricas; a existência e autorização dos recursos devem ser reconferidas antes de usá-las. Não compartilhar D1/Drive reais com uma homologação destrutiva.

## URLs embutidas

Revisar `scripts/build-desktop.mjs` (gera `runtime-config.js` com URL do coletor), configurações Wrangler, redirecionamentos OAuth, contratos do instalador e scripts de operação. Textos históricos também contêm URLs; mudar um link no README não muda o endpoint nas máquinas instaladas.

Preservar `assets.run_worker_first=true`, `html_handling=none` e o comportamento de rotas/404 de cada interface. Servir arquivos protegidos diretamente pelo servidor estático pode contornar a autorização.
