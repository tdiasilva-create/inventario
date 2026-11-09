# Publicação real — Fase 1 de desempenho, 09/11/2026

Pedido explícito do responsável: **“publique no ambiente real”**. Publicados os dois Workers e aplicada a migração aditiva 0019 no D1 compartilhado. Esta entrega publica somente a Fase 1 já implementada; não encerra as demais fases da auditoria.

## Escopo e versões

Código publicado: commit `b96f428`, incluindo as alterações dos commits `81d0770` e `7d5acda`. Detalhes de implementação, medições locais, requisitos preservados e limites no [relatório da Fase 1](CORRECOES_PRODUCAO_FASE_1_2026-11-09.md).

| Ambiente | Nova versão, ativa em 100% | Publicação (America/Fortaleza) |
|---|---|---|
| Painel | `e7261a18-7138-4877-b5cb-fbd5a41fbc5f` | 09/11/2026, 06:15:31 |
| Coletor | `9de19a35-cf5d-4172-a894-450995f218ad` | 09/11/2026, 06:15:49 |

- Painel: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/panorama
- Coletor: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/
- D1 compartilhado: `semed-inventario-auth`, `acb9a3dc-f667-44cf-a4f3-127641860f3e`.
- Conta institucional: `ce059c2b3e50037922a441a66814090d`.

## Preparação e banco

Consultado o [procedimento de publicação e rollback](../07-operacao/05_PUBLICACAO_E_ROLLBACK.md). Builds/dry runs dos dois Workers aprovados; arquivos do painel conferidos contra o manifesto. Segredos conferidos apenas por nome (`AUTH_PEPPER`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_TOKEN_KEY`), sem ler ou alterar valores. Provedor `google-drive`, configuração de cadastro automático dos agentes e distinção painel/coletor preservados.

Backup privado anterior à migração: `private-data/release-fase1-2026-11-09/d1-before.sql`, 994.293 bytes, SHA-256 `af67daa3234d1aa3809e0e64e052acb008290372a2562d70c61332c48e36c52c`. Importação de conferência em SQLite em memória: integridade OK, zero erros de chave estrangeira. Isso valida o arquivo SQL, não constitui restauração completa de produção e fotos. Dump e logs privados não integram o repositório público.

Apenas `0019_photo_indexes.sql` estava pendente; aplicação concluída. Índices `collection_photos_inspection` e `collection_photos_unit_status` encontrados no banco remoto. Nenhuma linha de cadastro foi alterada pela migração. Contagens antes/depois: 8 usuários, 76 unidades, 7 vistorias e 3 registros de fotos; migrações de 18 para 19. Nenhum exemplo foi inserido, nenhum cadastro excluído, nenhuma vistoria concluída durante a publicação.

## Verificação

- Validação local prévia: 134 testes de domínio/API, dez roteiros de navegador, builds desktop/coletor e verificações documentais aprovados. Não foram repetidos indiscriminadamente após o deploy; código de aplicação permaneceu igual ao validado.
- Verificação HTTP pública do painel: **46 verificações aprovadas** pelo `verify-panel-release.mjs`. O script foi ajustado para esperar o WebP legado, em vez do PNG removido da distribuição; é ferramenta de desenvolvimento, sem nova alteração do Worker.
- Conferência adicional nos dois endereços: **18 respostas aprovadas**, incluindo oito recursos estáticos que também responderam **304 sem corpo** com ETag correspondente. HTML de login manteve `no-store`; recursos estáticos `public, no-cache`.
- Oito consultas anônimas de APIs privadas (inclusive fotos com cabeçalho condicional) responderam **401 e `no-store`**, sem entregar imagem ou 304. As revalidações autenticadas de fotos foram testadas localmente; esta rodada pública não as substitui.
- D1 confirma integração Google Drive conectada e pasta configurada. Isso verifica configuração persistida, não é um novo upload real.
- Crons do painel preservados; coletor sem agendamento duplicado. Saúde do monitor atualizada às **06:18:43 de 09/11/2026**, depois da publicação (consulta somente leitura).
- Capturas reais dos logins desktop (1440×1000) e coletor (390×844) inspecionadas, sem cortes nos formulários ou erros visíveis. Evidências locais em `docs/05-qualidade/evidencias/publicacao-fase1-2026-11-09/`; não distribuídas no Git.

A sessão aberta do painel expirou e redirecionou para login. Portanto, **não foi realizado novo teste autenticado de envio/leitura de foto no Drive após esta publicação**. Não se presume autenticação válida nem sucesso de câmera física. Não houve alteração de senha, pedido de credenciais, gravação de foto de teste ou acesso a computador via RustDesk.

## Limites e retorno

Miniaturas, demais fases da auditoria, medição p50/p95 na rede móvel, homologação física e concorrência distribuída no upload continuam pendentes. Não há promessa de tempo absoluto nem de offline. Perguntas, regras de QR, perfis e identidade visual foram preservados.

Versões anteriores para retorno dos Workers: painel `e4ac8db6-ea92-42e0-8977-2ea21b9514ba`; coletor `859d0016-755f-4104-94ed-94e4780e2f8e`. A migração contém somente índices compatíveis com o código anterior; podem permanecer em um retorno de código. Não restaurar o dump sobre dados novos nem remover índices automaticamente. Seguir o procedimento operacional e registrar qualquer retorno.

Logs HTTP, inventários de deployments, verificações D1 e backup estão em `private-data/release-fase1-2026-11-09/`. A documentação deste deploy é posterior ao commit publicado; commit Git e versão Cloudflare são identificadores diferentes.
