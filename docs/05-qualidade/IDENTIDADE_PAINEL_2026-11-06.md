# Identidade visual de todo o painel — D-065

## Escopo aprovado

O responsável esclareceu que a identidade do coletor deve valer para TODO o painel desktop e autorizou a publicação imediata no ambiente real. Não deseja uma aba de fotografias. D-065 supera o escopo restrito de D-064 e a antiga paleta azul dark-tech; a composição das referências desktop continua como orientação.

Documentos consultados: `00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `docs/00-governanca/REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`, documentos de `docs/03-painel-desktop/`, manifesto visual, cinco PNGs desktop, `docs/05-qualidade/ACEITE.md` e manual de operação. Tokens atuais em `web/tokens.css`, aprovados por D-061/D-062, são a fonte da identidade. A Base original e o coletor não foram modificados.

## Implementação

- `web/desktop-theme.css`: conteúdo branco/cinza claro, menu preto, seleção vermelha, detalhes laranja/pêssego, fontes Chakra Petch/Barlow/JetBrains Mono e controles compactos. Aplica-se a tabelas, filtros, formulários, estados, diálogos, coletas parciais, cadastros, configurações e login.
- `web/index.html`, `account.html`, `login.html`: carregamento dos tokens compartilhados e tema desktop. Login com paisagem já utilizada pelo coletor, marca original e formulário claro.
- `web/panel-shell.js` e `desktop.js`: retirada da aba/página Fotografias. Ampliação permanece nos contextos existentes. `web/desktop-photos.js` removido. Fotos, APIs protegidas e armazenamento preservados; a futura distribuição das fotografias nas telas não é definida nesta entrega.
- `server/worker.mjs`: assets visuais do login públicos; acesso autenticado ao antigo `/fotografias` redireciona a `/panorama`. Rotas de dados e permissões preservadas.
- `scripts/build-desktop.mjs`: inclui tema, tokens, fontes e paisagem. Build do coletor não alterado.
- Panorama: agrupamento visual compacto dos resumos já existentes, preservando indicadores, mapa, matriz e áreas de detalhe. O mapa mantém geografia, coordenadas, camada de ruas e comportamento; somente controles/contraste visual recebem o tema.

Sem migração SQL, seed, alteração de perguntas, credenciais, cálculos, registros ou vínculos QR. Nenhuma exclusão ou envio de fotografias.

## Verificações locais executadas

- `pnpm test`: **100/100 aprovados**.
- `pnpm build:desktop`: **63 arquivos**, build aprovado.
- `pnpm test:panel:browser`: **17 rotas aprovadas**, com Worker real e SQLite isolado: Panorama, mapa, unidades, ambientes, equipamentos, ocorrências, relatórios, planejamento, exportação, coletas em andamento, cadastro de unidades, usuários, operadores/unidades, segurança, conta, configurações e detalhe de unidade.
- Login e fontes públicas, mostrar/ocultar senha, navegação, menu de perfil, edição local sem salvar, filtros/Escape, ausência da aba de fotos e redirecionamento do endereço antigo, foto contextual/ampliação/Escape/foco.
- Largura de 390 px nas telas de login, Panorama, usuários e cadastro; nenhuma rolagem horizontal indevida nas rotas verificadas. Zero erros JavaScript registrados. Contraste de textos legados verificado.
- Capturas revisadas em `docs/05-qualidade/evidencias/identidade-painel-2026-11-06/`: `panorama.png`, `mapa.png`, `equipamentos.png`, `coletas-em-andamento.png`, `cadastro-unidades.png`, `usuarios.png`, `configuracoes.png`, `filtros.png`, `01-login-desktop.png`, `login-390.png` e amostras móveis. Dados sintéticos TESTE ISOLADO somente na memória do teste; evidências não publicadas no Git.

O teste de navegador anterior da página de fotos foi substituído pelo teste de identidade geral em `tests/desktop-identity-browser.cjs` e na CI. Os testes da leitura protegida de fotos permanecem.

## Publicação e limites

Publicado em **06/11/2026**, com conferência encerrada às **05:36 (Fortaleza)**. Painel `fb776adf-4b7b-4cac-8aa9-6923bd636144`, **100% do tráfego**. Coletor permanece na versão `5cf137cd-9c34-4e41-806b-d19cf0887bb6`, também conferida. Configuração do D1, Drive, segredos e cron preservada. Snapshot privado anterior registra painel `9b25ccf1-fa98-4ae7-a2dd-7af35e59c991` para eventual reversão. Uma publicação intermediária `8e54ac5d-ea2c-41c2-9c93-1cfad203e53b` foi substituída para incluir a mesma identidade na página de endereço não encontrado.

Após a publicação final: **46 sondas públicas de acesso aprovadas**; **13 arquivos públicos com SHA-256 idêntico ao build**, incluindo login, tema, tokens, paisagem e fontes; API de fotografias retorna 401 sem sessão e endereço antigo continua exigindo autenticação. Login real aberto no navegador, sem erros JavaScript, com paisagem/identidade confirmadas visualmente em `producao-login.png`; resultados em `producao.json` no diretório de evidências. Nenhum dado de teste foi enviado à produção.

Capturas autenticadas desta rodada são locais; não são evidência de navegação autenticada em produção ou de câmera/teclado físicos. A disponibilização futura das fotografias por tela continua pendente de definição com o responsável.
