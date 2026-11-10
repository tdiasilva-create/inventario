# Painel Mesa de dados e login — D-080

## Escopo e fontes

Integração dos dois ZIPs enviados pelo responsável em 10/11/2026 para implantação no ambiente real. [Índice dos documentos originais, hashes e aplicação](../03-painel-desktop/MESA_DE_DADOS.md). Preservados mapa, identidade D-065, composição D-067, vínculo D-079, dados e permissões. Nenhuma mudança no questionário, EXE/QR, Drive ou migrations.

Arquivos principais: `web/painel.css`, `web/panel-shell.js`, `web/panel-pulse.js`, `web/login.html`, `web/login.css`, `web/login.js`; entradas de consulta/operação/administração, remoção de injeções de CSS antigo, ícones, build e listas de assets do Worker. Guias `PRODUCT.md` e `DESIGN.md` adaptados à governança existente. Artefatos externos foram revisados; não se executou script de implantação dos ZIPs.

## Correções na integração

- Mantidas as etiquetas distintas de agente/manual/pendente/encerrado/desconhecido; o CSS fornecido não preservava sua diferenciação visual.
- Menu expande com teclado e ao passar o mouse; menu fixo reserva largura para o conteúdo. Escape e nomes acessíveis no menu móvel; atalho de busca não captura digitação nem diálogos.
- Resumo superior consulta APIs reais já existentes, valida contagens, cancela requisições antigas e mostra falha explícita. Atualização global de 60 s com a aba visível, independente dos filtros locais; telas operacionais conservam 15 s.
- Formulário independente de conta/primeiro acesso mantém margem e largura legíveis. Controles de toque ampliados sem aumentar os controles de mouse.
- Login usa apenas sua folha e tokens, campos identificados e estados de mensagem. CSS do painel continua privado; favicon e ativos necessários ao login são públicos.
- Página 404 referencia a folha nova. Folhas antigas continuam no repositório, mas fora do build. Não mudou a política de sessão.

## Evidências locais

- Suíte completa: **171 testes aprovados**, sem falhas, usando persistência isolada.
- Verificação de identidade em **17 rotas**, filtros/categorias, contexto de fotos, formulários e permissões aprovada.
- `panel-mesa-browser.cjs`: contagens iguais às APIs, falha HTTP e conteúdo inválido sem zero fictício, recuperação, reinício do resumo, menu por teclado, fixação após recarga, recuo de conteúdo, busca por atalho, navegação móvel, etiquetas e login 1440 × 900 / 390 × 844 aprovados.
- Regressões de navegação, Computadores/Central de demandas, consulta de equipamentos, cadastro/importação, notificações, autenticação, fotos/miniaturas, edição de ambientes, nomes e exclusão de equipamentos aprovadas. Exclusões e senhas testadas exclusivamente em SQLite isolado.
- Teste de blocos do Panorama atualizado para a etiqueta D-079 (`Agente vinculado`); o seletor antigo `.agent-flag.linked` já não existia no código anterior a esta entrega. Demais verificações mantidas: cache/foco, paginação de 57 fotos, CSV/XLSX completos, contexto parcial e dados do agente.
- Build desktop: **75 arquivos**, sem interface do coletor. Inspeção visual das capturas conferiu composição e paleta frente às quatro comparações recebidas. Capturas de login feitas após finalizar animações, para não confundir quadro intermediário com página carregada.
- Evidências: `docs/05-qualidade/evidencias/mesa-dados-2026-11-10/`, incluindo `login-1440.png`, `login-390.png`, `panorama-1440.png`, `computadores-1440.png`, `menu-fixo.png`, `painel-390.png`, identidade e blocos. Dados dessas capturas são sintéticos e não foram gravados em produção.

## Publicação

Preparação de publicação do painel. Versões verificadas antes da implantação:

- Painel: `ee9c6630-03cd-4d2d-af27-1c8f160f920c`.
- Coletor: `274ecd9b-002e-4f79-a4b9-325fc26fece1` (deve permanecer igual).

Registro final de versão e verificações externas será acrescentado após confirmar a publicação. Sem mudanças de SQL, credenciais, D1, Drive, configurações ou crons. Logs técnicos locais em `private-data/release-mesa-2026-11-10/`, fora do Git.

## Limites e retorno

Testes de navegador são execução real do Worker com SQLite isolado, não uma sessão autenticada de produção nem homologação física de celular. A faixa global do topo tem periodicidade diferente das telas operacionais e não demonstra uso humano do computador. Etapas 4/5 e decisões pendentes não foram retomadas.

Rollback, se necessário, é somente do Worker para a versão anterior. Não restaurar banco nem alterar registros para reverter apresentação.

Endereço: https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev/login
