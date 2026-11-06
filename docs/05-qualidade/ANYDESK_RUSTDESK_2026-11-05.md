# D-059 — AnyDesk e RustDesk opcionais por computador

Pedido aprovado em 05/11/2026: duas respostas opcionais, somente números, para cada computador. Implementados `anydesk` e `rustdesk`, com rótulos AnyDesk (opcional) e RustDesk (opcional). Campos junto à identificação/localização da ficha; disponíveis para cadastro manual e por QR, desktop/notebook/tipo não informado, incluindo retomada nos formulários anteriores. Não aparecem em impressoras/outros equipamentos.

## Fontes e requisitos

Guia inicial, AGENTS.md, regras de precedência, DECISOES/PENDENCIAS/CONFLITOS e código atual consultados. A leitura integral da Base original e derivados mobile/dados, referências visuais e documentação desktop/aceite da fase V3 foi aproveitada nesta continuação, sem reinterpretar os documentos. Pedido posterior registrado em D-059. Base original permanece intocada.

Preservados: ID do equipamento, autoria/histórico, unidade oficial, acesso por usuário e versões/travas; fotos, QR e estados da coleta não mudam. A consulta parcial e publicada reutiliza o catálogo de campos existente no desktop. Nenhuma alteração no EXE, no protocolo do agente ou nas credenciais/Drive. Não realiza conexão remota nem solicita senha.

## Implementação

- `web/collector-schema.js`: definição compartilhada dos campos e validação de dígitos.
- `web/collector-v2-schema.js`, `collector-v3-schema.js`: inclusão no questionário e validação do rascunho QR.
- `web/collector.js`, `collector-v2.js`, `collector-v3.js`, `visit.js`: inputs opcionais com teclado numérico e padrão somente dígitos.
- `server/collector.mjs`: validação antes da criação de ambiente, persistência nas fichas, preservação quando omitido por cliente anterior e limpeza quando explicitamente vazio.
- `tests/remote-access-fields.test.mjs`, `tests/collector-v3-browser.cjs` e `package.json`: verificações e regressão.

Valores são identificadores de texto, não quantidades: zeros iniciais e números longos não sofrem arredondamento. Vazio é aceito; letras, sinais, separadores internos e notação científica são recusados. Usa o limite geral existente de 4.000 caracteres, sem impor tamanho específico de ID. Sem migração de banco, seed ou alteração de registros oficiais durante os testes.

## Evidências

- **96 testes automatizados aprovados**, incluindo dois cenários de integração novos, com V2/V3, categorias de computador, vazio, edição/limpeza, preservação por cliente anterior, zeros iniciais, consulta, validação e rascunho de QR.
- Edge headless com Worker real e SQLite isolado: leitura de QR → preencher os dois IDs → salvar → reabrir com valores intactos → concluir visita → consultar ficha publicada no painel. Campos ausentes em impressora. Sem erros JavaScript.
- A verificação do desktop foi ajustada para abrir a ficha correta dentro de “Consultar equipamentos recebidos”; tentativas anteriores usavam o seletor da primeira ficha, que podia ser de outro equipamento. Não houve alteração funcional para contornar o teste.
- Capturas reais em `evidencias/anydesk-rustdesk-2026-11-05/02b-anydesk-rustdesk-390.png` (campos no coletor) e `07-painel-v3.png` (ficha publicada). Composição clara do coletor e dark-tech do painel preservadas. Valores e fotos nessas capturas são exclusivamente de teste isolado.
- `resultado.json`: teste de navegador aprovado; `testes.txt`: 96/96. Navegação de retorno local medida em 120 ms, sem promessa de desempenho de rede real.
- Builds: coletor 31 arquivos e painel 46. Dry-run aprovado nos dois. Versões de publicação e sondas HTTP registradas no adendo abaixo.

## Teste simples no ambiente real

Atualizar a página do coletor, selecionar unidade e abrir Computadores → Adicionar computador ou Editar. Conferir AnyDesk e RustDesk. Salvar com os dois vazios deve continuar permitido. Preencher os IDs reais, salvar e reabrir para conferir os valores. Após salvar no servidor, a ficha parcial mostra os dados; após conclusão/publicação, a ficha oficial também os mostra. Computadores antigos permanecem sem essas informações até preenchimento.

Testes físicos de câmera/EXE e offline durável continuam pendências das respectivas fases anteriores; esta entrega não os homologa. Nenhuma pergunta original foi removida.

## Publicação confirmada — 05/11/2026, 15h57 (America/Fortaleza)

- Coletor: 1879b1a4-a1b2-4625-b4bc-cbaf6a793f6a.
- Painel: 60bb52a0-3108-429b-934a-3d3073655564.
- Verificação HTTP dos dois endereços após publicação: login 200, raiz protegida 302, API sem sessão 401. Isso confirma disponibilidade/proteção; o teste funcional autenticado foi realizado com Worker real e banco isolado, conforme evidências acima.
- Nenhuma migração SQL, seed, exclusão ou alteração manual de dados oficiais. Mantidos D1, Drive, contas, segredos e cadastro automático do agente.
