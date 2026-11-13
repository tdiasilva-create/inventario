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
| Monitoramento de agentes | Cron `* * * * *` no painel, adicional ao diário; não duplicar no coletor |

IDs de recursos não são senhas. Os valores secretos não estão neste guia.

Últimas versões conferidas no [registro D-110, 12/11/2026 às 22:43 Fortaleza](../05-qualidade/REVALIDACAO_D1_2026-11-12.md): painel `abcfcb97-c87a-4988-b9a1-c051534c31bf`; coletor preservado `c678978a-9e71-4cab-a2dc-9744ec6d6e1c`, ambos com 100% do tráfego. São identificadores Cloudflare, distintos do commit de código `5cb844b`. Conferir novamente os deployments antes de uma futura intervenção; este documento não consulta o serviço em tempo real.

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
| `USAGE_CACHE` | Binding KV | Painel somente: cache agregado do medidor D1, namespace gratuito `semed-system-usage` |
| `USAGE_ACCOUNT_ID` | Variável | Conta institucional consultada por Analytics; painel somente |
| `CLOUDFLARE_ANALYTICS_TOKEN` | Segredo | Token exclusivo Account Analytics Read, restrito à conta; nunca OAuth amplo do Wrangler |

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

D-109 (12/11/2026): medidor da franquia D1 exclusivo do root, cache KV e Analytics a cada cinco minutos pelo cron de minuto existente. Plano gratuito; sem migração. Procedimento de credencial/binding/rollback e limites em [MEDIDOR_D1_D109](../04-dados-apis/MEDIDOR_D1_D109.md).
