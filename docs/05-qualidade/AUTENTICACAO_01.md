# Autenticação e usuários — entrega 01

Data: 27/10/2026. Aprovação: D-031. Conta Cloudflare institucional; Worker `painel-semed-paco`; D1 `semed-inventario-auth` (`acb9a3dc-f667-44cf-a4f3-127641860f3e`). Versão publicada: `754843b8-0e06-45f2-985f-bd72fc98df81`.

## Fontes, escopo e arquivos

Consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, `docs/04-dados-apis/02_FLUXO_DE_INTEGRACAO.md`, `03_CONTRATOS_E_PERMISSOES_PROPOSTOS.md`, `MODELO_CONCEITUAL.md`, `PROPOSTA_ACESSO_INICIAL.md`, Base original §8 (sem substituição da leitura integral registrada nas fases anteriores), `docs/05-qualidade/ACEITE.md`, `02_CASOS_DE_TESTE_PRIORITARIOS.md` (T20), `03_CHECKLIST_DE_ENTREGA.md`, entregas de login/publicação e os próprios códigos/testes existentes. Referências visuais de login preservadas na revisão anterior.

Servidor: `server/worker.mjs`, `server/security.mjs`, migrações `0001_auth.sql`/`0002_credential_version.sql`, `wrangler.jsonc`. Interface: `web/login.html`, `login.js`, `account.html`, `account.js`, `account.css`, identidade autenticada em `desktop.js`, flag de publicação em `runtime-config.js`. Build: `scripts/build-desktop.mjs`; bootstrap e verificação em `scripts/bootstrap-auth.mjs`, `verify-auth.mjs`, `verify-auth-ui.mjs`, `verify-auth-boundaries.mjs`; testes `tests/security.test.mjs`. Segredos, sementes e senhas só em `private-data/` e `.dev.vars`, ignorados pelo Git, com acesso ao diretório privado restrito ao usuário Windows atual.

## Implementado e observado

- Quatro contas ativas: root/admin/operador/visualizador. Responsável aprovou nomes, matriz, uso inicial para testes, sessão de 1 hora e senha provisória de 24 horas.
- Login real com D1; sessão opaca aleatória, só hash da sessão no banco, cookies Secure/HttpOnly/SameSite=Strict; expiração e revogação no servidor.
- Senhas salgadas PBKDF2-HMAC-SHA512, 100.000 iterações, com pepper de produção separado do ambiente de testes e armazenado como segredo Worker. Não há credenciais na distribuição pública.
- Mínimo de 12 caracteres, sem composição artificial. Verificação de senha comprometida pela API Pwned Passwords usando somente prefixo de 5 caracteres do SHA-1; hash SHA-1 não é usado para armazenamento da senha. Falha da verificação recusa a troca e permite tentar novamente.
- Primeiro acesso bloqueia painel e gestão até troca. Troca invalida sessões e credencial anterior; versão da credencial impede uso de sessão concorrente emitida contra a versão antiga.
- Proteção progressiva por IP e IP/usuário, mensagens genéricas, origem e token CSRF nas alterações; bloqueio de enquadramento e respostas sem cache.
- Gestão: criação, ativação/desativação, redefinição administrativa e revogação. Admin não administra root/admin; ninguém pode desativar a própria conta. Root ajusta prazos e consulta 100 últimos eventos, sem senhas em auditoria.
- Todos os arquivos do painel, dados e fotos ilustrativas passam pelo Worker antes de serem servidos. Sem sessão: redirecionamento ao login/API 401; operador não acessa o painel gerencial. Rotas públicas limitadas ao login e seus ativos.

## Testes e evidências

13 testes unitários aprovados, incluindo domínio/geografia/exemplos e segurança. Integração completa validada em Worker/D1 temporários separados da produção, com credenciais de teste: quatro perfis, cookies, primeira troca, autorização por papel, CSRF, logout, revogação, criação, ativação/desativação, reset, configuração root, auditoria e negação de elevação pelo admin. Fronteiras: sessão expirada, senha provisória expirada, mensagem genérica e bloqueio progressivo. Navegador Chrome real: login → troca → novo login → painel → perfil → gestão → logout; desktop 1602×982 e celular 390×844 sem overflow.

Na produção: as quatro senhas provisórias foram usadas somente para validar login, papel e bloqueio de primeiro acesso; nenhuma senha foi trocada. Captura real do primeiro acesso root. Todas as sessões de teste foram encerradas. Consulta D1 confirmou exatamente 4 usuários ativos, todos com `must_change=1`, prazos 3600/86400 e zero sessões ativas.

Evidências: `evidencias/auth/staging-result.json`, `boundaries.json`, `browser.json`, `public-result.json`, `first-access.png`, `authenticated-dashboard.png`, `account-desktop.png`, `account-mobile.png`, `public-first-access.png`. O antigo `local-result.json` descreve a execução de API no ambiente temporário; não usar seu nome como alegação de que os testes novos passaram no runtime local. Cópia corrigida e identificada em `staging-result.json`.

Dois incidentes resolvidos antes do deploy: pouca memória local provocou reinício do workerd (validação transferida para Cloudflare isolada); tratamento automático de HTML causava ciclo login/.html (HTML handling desativado e rotas explícitas testadas). Worker de validação `painel-semed-paco-validacao` e D1 `semed-auth-validacao` foram removidos após evidências. Configuração histórica exige recriar IDs para repetir testes; nunca apontar scripts destrutivos de teste ao D1 oficial.

## Cobertura TXT e limites

§8.3: criação/ativação/desativação pelo papel administrativo; §8.4: usuário/senha; §8.5: provisória e troca; §8.6: reset administrativo, revogação e auditoria; §8.7/8.11/8.12: sessões independentes, expiração, listagem e revogação; §8.9: mínimo/hash/sal/TLS/verificação de vazamentos; §8.10: proteção progressiva. A matriz de quatro perfis substitui §8.1 somente por aprovação posterior D-031. A configuração de senha nesta entrega mantém mínimo fixo de 12; editor de política mais amplo permanece futuro. As novas permissões de inventário ainda não contam como implementadas porque seus endpoints não existem.

Não cobertos nesta entrega: §8.2 autorizações reais por escola, §8.13–8.17 proteção/offline, A–H §4, fotos R2 §5, oficialização/sincronização §7, histórico/concorrência do inventário §9, backups/restauração homologados §10. Não foi habilitado segundo fator. Não houve mudança na Base original, mapa ou métricas DEMO. Nenhuma gravação de exemplos em D1 de inventário: D1 atual contém somente acesso e segurança.

Não houve auditoria externa de segurança, teste em Safari iPhone/Chrome Android físico, teste de carga ou homologação de backup. O esquema e os limites de implementação estão documentados como escolhas técnicas reversíveis. O acesso autenticado é operacional; não declarar o sistema de inventário completo ou homologado.

## Reproduzir

Unitários: `node --test --test-concurrency=1 tests/security.test.mjs tests/domain.test.mjs tests/map-geography.test.mjs tests/map-examples.test.mjs`.

Desenvolvimento autenticado: aplicar migrações localmente, `node scripts/bootstrap-auth.mjs --local` e importar exclusivamente a semente local no D1 local; `node scripts/build-desktop.mjs`; `node node_modules/wrangler/bin/wrangler.js dev --local --local-protocol https --port 4182`; `node scripts/verify-auth.mjs`. O bootstrap local limpa somente o banco de teste ao importar sua semente. As suítes completas alteram senhas e criam contas de teste: nunca usar o modo completo em produção. O teste público usa credenciais iniciais e deixa de ser adequado depois que o responsável trocar senhas; não reutilizar a semente de produção.

Wrangler Static Assets: https://developers.cloudflare.com/workers/static-assets/routing/worker-script/ ; HTML handling: https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/ ; D1: https://developers.cloudflare.com/d1/wrangler-commands/ ; Pwned Passwords: https://haveibeenpwned.com/API/v3#PwnedPasswords .

Verificação pública adicional de distribuição: 23 verificações de rotas públicas/protegidas, incluindo arquivos privados, credenciais locais, rota codificada e APIs: PASS (evidencias/auth/release.json). T20 (troca obrigatória de senha provisória) coberto por API e navegador; o checklist geral de homologação permanece parcial.



Validação visual final do login em produção: PASS, sem enviar credenciais, com capturas desktop e celular em `evidencias/auth/login-visual/`. Registro detalhado em `resultado.json`.
