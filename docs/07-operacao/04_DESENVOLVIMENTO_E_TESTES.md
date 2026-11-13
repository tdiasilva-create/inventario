# Desenvolvimento e testes numa estação nova

## Pré-requisitos

Git, Node **24**, pnpm **11.25.0** e navegador para testes. Dependências de execução/build fixadas no lockfile: Wrangler 4.153.0, Playwright 1.62.1, qrcode 1.5.4 e exceljs 4.4.0. Código usa `node:sqlite` nos testes. Instalação de dependências não requer segredos Cloudflare/Google.

```powershell
git clone https://github.com/tdiasilva-create/inventario.git
cd inventario
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm test
pnpm build:desktop
pnpm build:collector
pnpm docs:schema
```

O lockfile deve permanecer coerente com package.json. Não atualizar dependências durante uma restauração sem necessidade e teste.

## Verificações mantidas

| Comando | O que verifica |
|---|---|
| `pnpm test` | Regras, autorização, visitas, inventário, Drive simulado, QR/assinaturas, publicação, parciais |
| `pnpm test:photos` | Subconjunto de fotos e integração isolada |
| `pnpm test:v3:browser` | Fluxo atual completo, equipamento manual/QR e fotografias simuladas |
| `pnpm test:ux:browser` | Busca, foco/cursor, digitação, navegação, upload e validação visível |
| `pnpm test:identity:browser` | Layout, larguras, login e estados da interface |
| `pnpm test:panel:browser` | 17 rotas desktop, matriz, filtros, fotografias e identidade |
| `pnpm test:catalogue:browser` | Cadastro ampliado, tipos e matriz de unidades |
| `pnpm test:equipment:browser` | Consulta embutida, filtros, cópia e fotos por equipamento |
| `pnpm test:monitoring:browser` | Sino, presença, atualização e preservação de foco/filtros |
| `pnpm test:operations:browser` | Computadores, laboratórios, demandas e histórico |
| `pnpm test:panel-navigation:browser` | Navegação pelo menu/voltar/avançar e erros de consultas |
| `pnpm docs:schema` | Migrações em SQLite vazio; catálogo físico |
| `pnpm check:repository` | Caminhos privados e padrões conhecidos de segredos no índice Git |

Os testes padrão usam SQLite em memória/fixtures sintéticas. Fotos/Drive usados nesses testes são simulados; resultados não comprovam acesso real ao Google nem câmera física. A CI não recebe credenciais.

Os roteiros mantidos na CI estão enumerados em `.github/workflows/ci.yml`; a quantidade aumentou desde a organização inicial. O auxiliar `tests/helpers/playwright.cjs` mantém Edge como padrão local. Para Chromium instalado pelo Playwright:

```powershell
pnpm exec playwright install chromium
$env:SEMED_TEST_BROWSER='chromium'
pnpm test:v3:browser
pnpm test:ux:browser
pnpm test:identity:browser
```

No Linux/CI: `pnpm exec playwright install --with-deps chromium` e variável `SEMED_TEST_BROWSER=chromium`. Evidências geradas ficam ignoradas pelo Git. Redução de viewport não equivale a teste de teclado/câmera no celular real.

## Aplicação local completa

`pnpm start` é prévia estática; não reproduz autenticação/D1. Para serviço completo, usar Wrangler **local**, dois processos e o mesmo diretório de persistência. Os exemplos abaixo são para um banco vazio isolado:

```powershell
pnpm build:desktop
pnpm build:collector
pnpm exec wrangler d1 migrations apply semed-inventario-local --local --config config/wrangler.painel.example.jsonc --persist-to .wrangler/local-shared
node scripts/bootstrap-auth.mjs --local
Copy-Item -LiteralPath .dev.vars -Destination config/.dev.vars
pnpm exec wrangler d1 execute semed-inventario-local --local --config config/wrangler.painel.example.jsonc --persist-to .wrangler/local-shared --file private-data/local-seed.sql
pnpm exec wrangler dev --local --config config/wrangler.painel.example.jsonc --persist-to .wrangler/local-shared --port 8787
```

Segundo terminal, a partir da mesma raiz:

```powershell
pnpm exec wrangler dev --local --config config/wrangler.coletor.example.jsonc --persist-to .wrangler/local-shared --port 8788
```

Abrir http://localhost:8787/login e http://localhost:8788/login . As senhas de teste ficam somente em `private-data/local-credentials.json`; não publicá-las. O usuário pode precisar trocar senha temporária. Desde D-096 essa validação não consulta serviços externos; a regra é 6–256 caracteres.

**O bootstrap local contém DELETE de contas/sessões/configurações.** Usar somente em base nova local. Nunca executar seed em banco remoto, restaurado ou compartilhado com dados que devam sobreviver. O exemplo não tem Drive e não envia fotos reais; para testar fluxo de fotos sem infraestrutura usar os testes isolados.

O build desktop ainda aponta seu atalho de coletor para produção; no ensaio abrir manualmente o endereço localhost:8788. Não utilizar esse atalho para inserir dados de teste. Uma futura parametrização de URL deve ser alteração explícita e testada.

## Scripts históricos

`scripts/recover-root.mjs`, `register-requested-semed.mjs`, `bootstrap-auth.mjs` e vários `verify-*.mjs` foram escritos para operações pontuais. Podem usar caminhos locais, credenciais privadas ou preparar SQL. Não são rotina automática de instalação ou manutenção. Ler integralmente antes de executar e conferir ambiente-alvo.

`test:desktop`, `test:map`, `test:mobile` e outros testes antigos podem refletir fases DEMO, requisitos superados ou caminhos do computador original. Não compõem a CI mantida nesta organização; preservar como histórico até revisão, sem apresentá-los como testes atuais aprovados.

## Trabalho futuro

Registrar decisão antes de mudar regra; criar migração aditiva se necessário; executar testes pertinentes; atualizar o manual e rastreabilidade. O coletor foi congelado pelo responsável para esta etapa documental. Não refatorar formulários ou publicar Workers para organizar o repositório.

## Painel por blocos — D-073 / Fase 3

`pnpm test:blocks:browser` é o 12º roteiro de navegador da CI: conserva mapa/DOM na busca, verifica expiração/Atualizar, galeria >50 e exportações completas CSV/XLSX. Testes de API em `tests/panel-blocks.test.mjs`, sem base remota. A mudança afeta somente a publicação do painel; não há nova migração. Demais testes antigos continuam históricos, sem obrigação de restaurar comportamento DEMO.
