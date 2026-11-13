# 03 · Adaptação do código para sair do runtime Workers

**A IMPLEMENTAR.** O repositório contém o backend funcional Workers. Não contém um serviço HTTP Node de produção nem um adaptador SQLite de produção. Testes em memória servem de especificação auxiliar, não de instalador pronto.

## Matriz de trabalho

| Origem atual | Adaptação necessária | Aceite |
|---|---|---|
| `server/worker.mjs`: `fetch`, `scheduled` | Servidor Node convertendo HTTP para Request/Response; ponto de entrada de tarefas separado | Mesmo status/cabeçalhos/corpo por rota, sem alterar assinatura |
| `env.DB` | Implementar contrato prepare/bind/first/all/run/batch/exec usado no código | Mesmas consultas, shapes de retorno, atomicidade e erros |
| `env.ASSETS.fetch` | Servir somente build da aplicação correta, atrás das regras atuais | Login público; APIs/HTML/ativos protegidos continuam sujeitos à política atual |
| `env.PHOTOS` | Não usado na produção Drive; adaptação R2 apenas se for escolhida | Não cair silenciosamente em disco público |
| `env.USAGE_CACHE` | Manter KV via integração ou substituir somente cache do medidor | Não usar como fonte autoritativa de sessão/dados |
| `ctx.waitUntil` / cron | Executor que aguarda conclusão, registra falha e impede concorrência indevida | Sem tarefas perdidas no encerramento do processo |
| `request.cf`, `CF-Connecting-IP` | Canal de borda confiável ou enriquecimento ASN próprio | IP real sem confiar em cabeçalho forjável; provedor nunca inventado |
| `collectorOrigin`, `runtime-config.js` | Configuração por ambiente e allowlist explícita | Atalhos, login, redirects e callbacks para o host correto |
| `request-timing.mjs` / D1 meta | Métricas do adaptador coerentes; distinguir SQL de quota D1 | Não reportar contadores estimados como métricas Cloudflare |
| Cache D-110 por binding | Objeto estável do DB por instância e revisões transacionais | Edits invalidam; sessão/presença/posição sempre atuais |

## Entrada HTTP e corpo bruto

Preservar método, pathname, query, bytes do corpo e cabeçalhos usados pela assinatura. A conversão Node → Fetch deve aceitar streaming/buffer dentro dos limites reais e tratar cancelamento, abort/timeout e backpressure. Não fazer `JSON.parse` + `JSON.stringify` no proxy antes da validação do agente. Não redirecionar POST de heartbeat/inventário para outro domínio com 301/302 como estratégia de migração.

Aplicar os limites de corpo existentes nas rotas humanas, binárias e de agente. Uma configuração global permissiva para upload não deve liberar corpos enormes em login/QR. Proxy e aplicação devem concordar sobre esses limites. Rejeitar requisição maior com resposta explícita, sem deixar upload como confirmado.

Restituir todos os cabeçalhos de segurança e `Set-Cookie`, inclusive atributos Secure/HttpOnly/SameSite/Path. Não transformar respostas 401/403/409/410/422/429/503 em HTTP 200. Não registrar corpo, senha, QR, tokens ou localização em logs públicos de acesso.

## Persistência: compatibilidade D1 é comportamento, não só nome de método

Antes de escolher biblioteca, levantar todos os métodos usados (índice estático + busca no código). O adaptador deve cobrir:

- `prepare(sql).bind(...args)` com NULL, texto, número e BLOB; binding posicional sem interpolação.
- `first()`/`first(coluna)` distinguindo ausência de linha; `all()` com `results` e metadados esperados; `run()` com `changes` real, não sucesso fictício.
- `batch(statements)` em transação, resultado ordenado e **rollback integral** se qualquer instrução falhar. Os CHECKs/guardas de agente, optimistic locking, recibos e projeções dependem disso.
- SQLite JSON, CTEs, `RETURNING`, `ON CONFLICT`, constraints, índices parciais, triggers e views usados pelas 31 migrações.
- Conversão BLOB consistente para miniaturas; não transformar bytes em texto/base64 implicitamente no banco.
- Contagem de alterações compatível com as condições do código; erros de constraint devem manter o código de negócio esperado sem vazar SQL.
- Foreign keys habilitadas em cada conexão, transações e timeout de locks. Política de retry limitada, com idempotência. Repetir operações não idempotentes após erro ambíguo pode duplicar dados.

`node:sqlite` é candidato porque já é usado nos testes, mas sua API síncrona pode bloquear o event loop. Para produção, comparar executor dedicado/worker thread e filas de escrita; não bloquear GPS e heartbeat durante relatório/exportação longa. [Documentação Node 24 DatabaseSync](https://nodejs.org/download/release/v24.22.1/docs/api/sqlite.html). Fixar versão Node/SQLite e testar atualizações de segurança no destino, sem presumir que todo Node 24 tenha o mesmo SQLite.

## PostgreSQL, se escolhido

Não aplicar SQL SQLite diretamente. Converter JSON functions/operadores, booleanos, datas/épocas, BLOB→bytea, `changes()`, `last_insert_rowid`, `rowid` quando houver, PRAGMAs e regras de conflito/retorno. Recriar 68 triggers e duas views semanticamente, além dos índices/constraints. Não eliminar as guardas de transação por incompatibilidade sintática.

Preparar testes de equivalência por consulta e migração de dados tipada. Contagem de linhas igual é insuficiente: comparar NULL/zero, decimais, textos Unicode, JSON, ordenação/collation, snapshots e vínculos. Essa opção tem uma trilha própria de implementação e maior superfície de regressão.

## Assets, contexto de aplicação e sessões

Hoje `assets.run_worker_first=true` garante que o Worker avalie a política antes da entrega correspondente. No servidor físico, um `location /` estático genérico pode contornar isso. Preservar a lista pública efetiva de login/técnico/identidade e manter as APIs de dados autenticadas; não aplicar bloqueio genérico que impeça o login técnico público.

Painel e coletor devem chegar com `APP_KIND` correto definido por configuração confiável de host/processo. Um parâmetro enviado pelo cliente não pode trocar a aplicação ou abrir APIs root. Cache privado de bundles versionados pode continuar; respostas de dados permanecem revalidadas/autorizadas conforme cada rota. Não cachear cookies, sessão, API de GPS ou metadados de fotos globalmente.

## Caminhos de código que merecem revisão dirigida

`server/agentes/nucleo/d1-store.mjs` (transações/guardas); `server/collector*.mjs` (publicação/locks); `server/photo-storage.mjs` (binários/crypto); `server/google-auth.mjs` (callback e URL); `server/technical-dispatch.mjs` (session/GPS); `server/dispatch-road-routing.mjs` (limite global); `server/panel-read-cache.mjs` e migração 0031 (invalidação); `server/d1-usage.mjs` (métricas de plataforma).

Criar testes dos adaptadores antes de alterar os módulos de negócio. Idealmente reutilizar o módulo fetch e isolar diferenças de infraestrutura. Nenhum caminho `server/node-*.mjs` mencionado numa futura tarefa deve ser tratado como existente até ser implementado e revisado.
