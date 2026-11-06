# Identidade visual do coletor — 05/11/2026

Pedido: “quero que adote esssa aparecencia para publicacao no ambiente real”. Entrega recebida: `entrega-claude-identidade-2026-11-05.zip`, SHA-256 `44e40d6f8019814523e02d96573364dac36af9ac9f3519950fc4dd55013570af`. Conferidos os 43 hashes do manifesto interno antes da integração. Arquivos originais preservados em `revisoes/identidade-claude-2026-11-05/`.

## Escopo e fontes

Consultados os arquivos de entrada/governança (`00_LEIA_ANTES_DE_TUDO.md`, `AGENTS.md`, `REGRAS_DE_PRECEDENCIA.md`, `DECISOES.md`, `PENDENCIAS.md`, `CONFLITOS_DOCUMENTAIS.md`), especificações mobile e Base original previamente lidas na cadeia desta implementação, decisões atuais D-057 a D-060 e fontes atuais do coletor/servidor/testes.

Da entrega, lidos integralmente `00_LEIA_PRIMEIRO.txt`, `01_ARQUIVOS_E_DESTINOS.txt`, `02_PASSO_A_PASSO_PUBLICACAO.txt`, `03_ROTEIRO_TESTE_VISUAL.txt`, `04_PROPOSTA_DECISAO_D-061.txt`, `05_FASE2_ALTERACOES_JS.txt`, `referencia/design-system/README.md`, CSS/tokens e diffs. A imagem `fase1/web/assets/paisagem-coleta.jpg` foi aberta visualmente. O pacote não inclui capturas finais do aplicativo; `referencia/capturas/LEIA.txt` informa essa ausência.

Aplicadas as duas fases visuais: branco/preto/vermelho/laranja/pêssego, fontes locais, login com paisagem, ícones com cores por assunto, símbolos nos títulos, campos/botões/cartões e leitor QR. Os HTMLs antigos recebem os tokens para manter abertura de rascunhos anteriores. O questionário atual e suas regras não foram substituídos pelo texto descritivo antigo “uma pergunta por tela” do anexo.

Arquivos: `web/collector.css`, `tokens.css`, `collector-v3.css`, `collector-favicon.svg`, `collector-login.html`, `collector-account.html`, `collector.html`, `collector-v2.html`, `collector-v3.html`, `visit.html`, `collector-v3.js`, `collector-v3-schema.js`, imagem/fontes/licenças, `scripts/build-collector.mjs` e listas de assets do coletor em `server/worker.mjs`.

## Ajustes de integração

- Corrigida a precedência CSS das cores de assunto: antes, o seletor dos cartões tornava todos os ícones laranja.
- Reservado espaço para a marca no login; campos de usuário/senha em largura completa; formulário de conta com espaçamento lateral.
- Cartões em duas colunas reservam linha própria para o estado. Nomes longos quebram dentro do cartão. Estado “Em andamento” usa a cor correspondente sem modificar o estado persistido.
- Retorno às categorias mantém área de toque de 44px. AnyDesk/RustDesk usam fonte monoespaçada de 16px, mantendo dígitos e zeros iniciais.
- Câmera/galeria preservam a área clicável; leitor QR em paisagem usa espaço lateral para instruções/erro e galeria.
- Só assets estáticos necessários ao login foram adicionados à lista pública do coletor. JS autenticado e APIs continuam protegidos. Não há dependência de fontes externas.

## Aceite e evidências locais

- Suíte existente: **98/98 testes aprovados**, sem falhas ou pulos.
- `tests/collector-v3-browser.cjs`: aprovado com Worker real e SQLite isolado. Lista de unidades, fachada, acompanhante, navegação, internet, Wi-Fi, ambientes, computador manual e por QR, impressora/outros, problemas, revisão/conclusão e consulta desktop.
- Sete fotografias sintéticas enviadas/confirmadas em armazenamento isolado; fotos manual/QR reabertas. AnyDesk/RustDesk preservados. Retorno às categorias em 145ms neste teste local, mesmo com gravação artificialmente atrasada em 2,4s; não é medição de internet/celular real.
- `tests/collector-identity-browser.cjs`: login em 360/390/812/1280px; cartões em 360/390/640/812px; fontes locais carregadas; marca sem sobreposição; campos na largura correta; cores por assunto; sem rolagem horizontal; troca obrigatória de senha; assets públicos 200, script privado 302 e API 401; leitor em paisagem com ações acessíveis.
- Capturas reais da implementação em `evidencias/identidade-2026-11-05/`. Dados internos das capturas são identificados como TESTE ISOLADO. Capturas de página inteira podem mostrar a barra fixa sobre uma parte do conteúdo; no uso, a página rola mantendo folga inferior.
- Teste de layout do leitor usa rejeição simulada de permissão para conferir aviso e alternativa pela galeria. Não é homologação de câmera física. Leitura/vínculo por imagem QR exercitados no teste funcional.

Nenhum novo requisito do TXT foi implementado nesta entrega visual: preservados navegação livre, estados separados, conclusão manual, vínculo do item, câmera/galeria, limites por registro e confirmação do servidor, conforme decisões posteriores. Permanecem as lacunas funcionais anteriores, incluindo offline durável e testes físicos Android/iPhone/EXE. Não se declara upload autenticado ao Drive de produção testado nesta rodada.

## Publicação

Autorizada diretamente pelo pedido atual; a recomendação de staging do documento externo não bloqueia essa autorização. Publicar somente o coletor com D1/Drive/segredos existentes, sem migração, seed ou criação de dados de teste no ambiente oficial.

Backup de fontes substituídas e hashes em `backups/pre-identidade-2026-11-05/`. Versão anterior do coletor: `5a5e96c0-2680-401c-890b-069e87d96dd5`. Versão anterior/inalterada do painel: `827d6900-aa3a-450c-974d-ac13fd2ecca5`.

URL: https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/

### Publicação confirmada — 05/11/2026, 20h31 (America/Fortaleza)

- Coletor publicado: `a96b3047-19d1-48b8-975b-6ddd0b36505e`.
- Build: 46 arquivos; dry-run aprovado; 28 assets atualizados e 18 reutilizados. Worker com D1 existente, `PHOTO_STORAGE_PROVIDER=google-drive` e cadastro automático de agentes preservados.
- Painel consultado em modo somente leitura: continua na versão `827d6900-aa3a-450c-974d-ac13fd2ecca5`.
- `scripts/verificar-identidade-coletor.mjs`: **14 verificações aprovadas em produção**. Oito arquivos públicos (login, CSS, tokens, favicon, paisagem e três fontes) têm SHA-256 idêntico ao build. Páginas/scripts privados redirecionam para login; APIs/dados/fotos sem sessão retornam 401.
- Login de produção aberto/renderizado em Edge 390×844: identidade nova e fonte local carregadas, sem erro JavaScript/rolagem lateral. Captura `evidencias/identidade-2026-11-05/15-login-producao-390.png` inspecionada visualmente.
- Evidências: `testes.txt`, `resultado.json`, `resultado-visual.json`, `dry-run.txt`, `deploy.txt`, `publicacao.json` e PNGs na pasta de evidências. Nenhum dado de teste gravado em produção.

Para observar, atualizar a aba já aberta do coletor. Teste sugerido no celular: selecionar unidade → Computadores → adicionar/editar; conferir foto opcional, câmera/galeria, AnyDesk/RustDesk, retorno às categorias e leitor QR em retrato/paisagem. Novo teste físico de câmera/Drive permanece necessário; não foi afirmado como executado nesta entrega visual.
